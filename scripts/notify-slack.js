// scripts/notify-slack.js
// Parses Playwright JSON results, tracks consecutive failures,
// sends severity-based Slack alerts via Block Kit, and writes JSON summary.

import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// Section 1: Constants and configuration
// ============================================================================

const RESULTS_FILE = 'test-results/results.json';
const STATE_FILE = '.state/failure-state.json';
const SUMMARY_FILE = 'test-results/summary.json';
const ALERT_THRESHOLD = 2; // Consecutive failures before alerting (ALERT-04)

// ============================================================================
// Section 2: Parse Playwright JSON results
// ============================================================================

/**
 * Recursively extract test specs from nested suite structure
 * @param {Array} suites - Playwright suite array (can be nested)
 * @param {string} parentFile - File path from parent suite
 * @returns {Array} - Array of test results
 */
function extractSpecs(suites, parentFile = '') {
  const results = [];
  for (const suite of suites) {
    const file = suite.file || parentFile;

    // Process specs in this suite
    for (const spec of (suite.specs || [])) {
      const test = spec.tests?.[0];
      if (!test) continue;

      results.push({
        title: spec.title,
        file,
        tags: spec.tags || [],
        status: test.status,  // "expected", "unexpected", "flaky", "skipped"
        duration: test.results?.[0]?.duration || 0,
        error: test.results?.[0]?.errors?.[0]?.message || '',
      });
    }

    // Recurse into child suites
    if (suite.suites?.length) {
      results.push(...extractSpecs(suite.suites, file));
    }
  }
  return results;
}

/**
 * Parse Playwright JSON results file
 * @returns {Object} - Categorized results with stats
 */
async function parseResults() {
  try {
    const data = await fs.readFile(RESULTS_FILE, 'utf-8');
    const report = JSON.parse(data);

    // Extract all specs from nested suites
    const allSpecs = extractSpecs(report.suites || []);

    // Categorize by status
    const passed = allSpecs.filter(s => s.status === 'expected');
    const failed = allSpecs.filter(s => s.status === 'unexpected');
    const flaky = allSpecs.filter(s => s.status === 'flaky');
    const skipped = allSpecs.filter(s => s.status === 'skipped');

    return {
      passed,
      failed,
      flaky,
      skipped,
      stats: report.stats || {},
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`ERROR: Test results file not found at ${RESULTS_FILE}`);
      console.error('Ensure Playwright JSON reporter is configured and tests have run.');
      process.exit(1);
    }
    throw err;
  }
}

// ============================================================================
// Section 3: Consecutive failure tracking
// ============================================================================

/**
 * Load failure state from disk
 * @returns {Object} - State object mapping test titles to failure info
 */
async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {}; // No state file yet — first run
    }
    console.warn('Failed to load failure state:', err.message);
    return {};
  }
}

/**
 * Save failure state to disk
 * @param {Object} state - State object to persist
 */
async function saveState(state) {
  try {
    // Ensure .state directory exists
    await fs.mkdir('.state', { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn('Failed to save failure state:', err.message);
  }
}

/**
 * Track consecutive failures across runs
 * @param {Object} results - Parsed test results
 * @returns {Array} - Tests that have reached alert threshold
 */
async function trackFailures(results) {
  const state = await loadState();
  const alertable = [];

  // Update state for failed tests
  for (const test of results.failed) {
    const key = test.title;
    if (!state[key]) {
      state[key] = { count: 1, lastFailure: new Date().toISOString() };
    } else {
      state[key].count += 1;
      state[key].lastFailure = new Date().toISOString();
    }

    // Check if threshold reached
    if (state[key].count >= ALERT_THRESHOLD) {
      alertable.push({
        ...test,
        consecutiveFailures: state[key].count,
      });
    }
  }

  // Reset state for passed tests (recovery)
  for (const test of results.passed) {
    delete state[test.title];
  }

  await saveState(state);
  return alertable;
}

// ============================================================================
// Section 4: Severity categorization
// ============================================================================

/**
 * Categorize failures by severity based on tags
 * @param {Array} tests - Test results to categorize
 * @returns {Object} - { critical: [], warning: [] }
 */
function categorizeFailures(tests) {
  const critical = [];
  const warning = [];

  for (const test of tests) {
    if (test.tags.includes('@critical')) {
      critical.push(test);
    } else {
      // Default untagged or @warning tests to WARNING
      warning.push(test);
    }
  }

  return { critical, warning };
}

// ============================================================================
// Section 5: Slack Block Kit message builder
// ============================================================================

/**
 * Build Slack Block Kit payload
 * @param {Object} params - Message parameters
 * @returns {Object} - Slack Block Kit payload
 */
function buildSlackPayload({ severity, failures, runUrl, commit, branch }) {
  const emoji = severity === 'CRITICAL' ? '\u{1F6A8}' : '\u{26A0}\u{FE0F}';
  const timestamp = new Date().toISOString();

  // Build artifacts URL (reports and traces on same artifacts page)
  const artifactsUrl = runUrl ? `${runUrl}#artifacts` : null;

  // Truncate failure list if too long
  const displayedFailures = failures.slice(0, 10);
  const remainingCount = failures.length - displayedFailures.length;

  // Build failure list with consecutive counts
  const failureList = displayedFailures.map(f =>
    `• ${f.title} (${f.consecutiveFailures}x consecutive)`
  ).join('\n');

  const failureListBlock = remainingCount > 0
    ? `${failureList}\n...and ${remainingCount} more`
    : failureList;

  // Build error snippets (first 100 chars each)
  const errorSnippets = displayedFailures
    .filter(f => f.error)
    .map(f => {
      const truncated = f.error.substring(0, 100);
      return `• ${f.title}: ${truncated}${f.error.length > 100 ? '...' : ''}`;
    })
    .join('\n');

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${severity} Test Failures — cooked.com`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Severity:*\n${severity}`,
        },
        {
          type: 'mrkdwn',
          text: `*Failed Tests:*\n${failures.length}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Test Failures:*\n${failureListBlock}`,
      },
    },
  ];

  // Add error snippets if present
  if (errorSnippets) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Error Snippets:*\n${errorSnippets}`,
      },
    });
  }

  // Add links section
  if (runUrl) {
    const linksText = artifactsUrl
      ? `<${runUrl}|View GitHub Actions Run> | <${artifactsUrl}|View Reports & Traces>`
      : `<${runUrl}|View GitHub Actions Run>`;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: linksText,
      },
    });
  }

  blocks.push({ type: 'divider' });

  // Add context footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Commit: \`${commit}\` | Branch: \`${branch}\` | ${timestamp}`,
      },
    ],
  });

  return { blocks };
}

// ============================================================================
// Section 6: Send Slack notification
// ============================================================================

/**
 * Send Slack alert via webhook
 * @param {Object} payload - Slack Block Kit payload
 */
async function sendSlackAlert(payload) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping Slack notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Slack webhook failed: ${response.status} ${response.statusText}`);
      console.error('Response body:', body);
    } else {
      console.log('Slack notification sent successfully');
    }
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message);
    // Don't throw — alerting failure shouldn't fail CI step
  }
}

// ============================================================================
// Section 7: Write JSON summary report
// ============================================================================

/**
 * Write JSON summary report
 * @param {Object} results - Parsed test results
 */
async function writeSummary(results) {
  const commit = (process.env.GITHUB_SHA || 'local').substring(0, 7);
  const branch = process.env.GITHUB_REF_NAME || 'local';
  const runId = process.env.GITHUB_RUN_ID || null;
  const runUrl = runId && process.env.GITHUB_REPOSITORY
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId}`
    : null;

  const summary = {
    timestamp: new Date().toISOString(),
    commit,
    branch,
    runId,
    runUrl,
    duration: results.stats.duration || 0,
    total: results.passed.length + results.failed.length + results.flaky.length + results.skipped.length,
    passed: results.passed.length,
    failed: results.failed.length,
    flaky: results.flaky.length,
    skipped: results.skipped.length,
    failures: results.failed.map(f => ({
      title: f.title,
      file: f.file,
      tags: f.tags,
      duration: f.duration,
      error: f.error.substring(0, 200), // Truncate to first 200 chars
    })),
  };

  try {
    await fs.writeFile(SUMMARY_FILE, JSON.stringify(summary, null, 2));
    console.log(`Summary written to ${SUMMARY_FILE}`);
  } catch (err) {
    console.error('Failed to write summary:', err.message);
  }
}

// ============================================================================
// Section 8: Main function
// ============================================================================

async function main() {
  console.log('Starting notification script...');

  // 1. Parse results
  const results = await parseResults();

  // 2. Write JSON summary (always, even if no failures)
  await writeSummary(results);

  // 3. If no failures, log success and exit
  if (results.failed.length === 0) {
    console.log(`All ${results.passed.length} tests passed.`);
    return;
  }

  console.log(`${results.failed.length} test(s) failed.`);

  // 4. Track consecutive failures
  const alertableTests = await trackFailures(results);

  // 5. If no tests have reached threshold, log and exit
  if (alertableTests.length === 0) {
    console.log('Failures detected but below consecutive threshold. No alert sent.');
    return;
  }

  console.log(`${alertableTests.length} test(s) reached alert threshold.`);

  // 6. Categorize by severity
  const { critical, warning } = categorizeFailures(alertableTests);

  // 7. Build URLs
  const runUrl = process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
  const commit = (process.env.GITHUB_SHA || 'local').substring(0, 7);
  const branch = process.env.GITHUB_REF_NAME || 'local';

  // 8. Send alerts (separate messages for CRITICAL and WARNING)
  if (critical.length > 0) {
    console.log(`Sending CRITICAL alert for ${critical.length} test(s)...`);
    const payload = buildSlackPayload({
      severity: 'CRITICAL',
      failures: critical,
      runUrl,
      commit,
      branch,
    });
    await sendSlackAlert(payload);
  }

  if (warning.length > 0) {
    console.log(`Sending WARNING alert for ${warning.length} test(s)...`);
    const payload = buildSlackPayload({
      severity: 'WARNING',
      failures: warning,
      runUrl,
      commit,
      branch,
    });
    await sendSlackAlert(payload);
  }
}

main().catch(err => {
  console.error('Notification script failed:', err);
  process.exit(1);
});
