# Phase 5: CI/CD & Alerting - Research

**Researched:** 2026-02-16
**Domain:** GitHub Actions CI/CD, Slack alerting, Playwright reporting, consecutive failure tracking
**Confidence:** HIGH

## Summary

Phase 5 implements automated test execution on GitHub Actions with smart Slack alerting for failures. The research confirms GitHub Actions remains the standard choice for CI/CD in 2026, with mature cron scheduling, concurrency controls, and artifact management. Key findings show that consecutive failure tracking requires custom state management (GitHub Actions artifacts can't persist state across runs), Slack Block Kit provides rich formatting for alert messages with links to artifacts, and Playwright's JSON reporter combined with custom reporters enables severity-based alerting logic.

The 2026 ecosystem emphasizes efficient CI practices: setup-node v6+ auto-enables npm caching when package.json includes packageManager field, actions/upload-artifact v4+ provides significantly faster uploads (90% improvement), and concurrency controls prevent overlapping scheduled runs. For Slack integration, Block Kit sections with markdown links are the standard (legacy attachments are deprecated), and incoming webhooks support up to 50 blocks per message.

Critical finding: GitHub Actions free tier provides 2000 minutes/month. With 30-minute scheduling (48 runs/day), a 3-minute test suite would consume ~4320 minutes/month, exceeding the free tier. Mitigation strategies include running only @critical tests on schedule, or reducing frequency to hourly (1440 minutes/month with 3-min runs).

**Primary recommendation:** Use native GitHub Actions features (cron scheduling, concurrency, caching, artifact upload) with custom Node.js script for consecutive failure tracking and Slack notification logic. Implement severity-based alerting through Playwright tags and custom JSON report parsing.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GitHub Actions | N/A (platform) | CI/CD orchestration | Native GitHub integration, free tier, cron scheduling, artifact storage |
| actions/checkout | v6 | Repository checkout | Official action, required for CI workflows |
| actions/setup-node | v6.2+ | Node.js installation with caching | Official action, auto-caches npm when packageManager field in package.json set |
| actions/upload-artifact | v4+ | Artifact upload (reports, traces, screenshots) | Official action, 90% faster than v3, immediate artifact availability |
| @playwright/test | 1.58+ | Test execution and reporting | Already in project, mature JSON/HTML reporters |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js fs module | Built-in | Read/write JSON state files | Consecutive failure tracking persistence |
| @actions/github | Latest | GitHub API client (optional) | Advanced API operations beyond github-script |
| Slack Block Kit | API | Rich message formatting | Formatting alert messages with sections, fields, links |
| Slack Incoming Webhooks | API | Send Slack notifications | Posting alerts to Slack channels |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GitHub Actions | CircleCI, Jenkins | GitHub Actions has native repo integration, free tier, simpler config; alternatives have more features but higher complexity |
| Incoming Webhooks | Slack GitHub Action (slackapi/slack-github-action) | Incoming webhooks are simpler (just HTTP POST), GitHub Action provides more features but adds dependency |
| Custom state tracking | External database (Redis, PostgreSQL) | External DB enables more complex queries but adds infrastructure; file-based state is simpler for consecutive failure counts |
| Playwright JSON reporter | CTRF JSON reporter | Built-in JSON reporter is sufficient; CTRF provides standardized schema useful for multi-framework setups |

**Installation:**
```bash
# No additional npm packages required
# All dependencies are either built-in (fs) or already in package.json (@playwright/test)
```

**GitHub Actions Actions:**
```yaml
# Use these official actions in workflow
- uses: actions/checkout@v6
- uses: actions/setup-node@v6
  with:
    node-version: 20
    cache: 'npm'  # Auto-enabled if package.json has packageManager field
- uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Architecture Patterns

### Recommended Project Structure
```
project-root/
├── .github/
│   └── workflows/
│       └── playwright.yml         # Main workflow: schedule, push, workflow_dispatch
├── scripts/
│   ├── alert-slack.js             # Slack notification logic with Block Kit
│   ├── parse-results.js           # Parse Playwright JSON, extract failures
│   └── track-failures.js          # Consecutive failure tracking (read/write state)
├── tests/                         # Existing test directory
├── playwright.config.ts           # Add JSON reporter alongside HTML
├── .state/                        # State files for consecutive failure tracking (gitignored)
│   └── failure-state.json         # { testName: { count: 2, lastFailure: timestamp } }
└── .env.example                   # Add SLACK_WEBHOOK_URL
```

### Pattern 1: Cron Scheduling with Concurrency Control
**What:** Schedule workflow to run every 30 minutes with concurrency group to prevent overlapping runs
**When to use:** Always for scheduled monitoring workflows
**Example:**
```yaml
# Source: https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions
name: Playwright Tests

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  push:
    branches: [main]
  workflow_dispatch:        # Manual trigger

concurrency:
  group: playwright-monitoring
  cancel-in-progress: true  # Cancel previous run if new one starts

jobs:
  test:
    timeout-minutes: 15     # Reasonable timeout for monitoring suite
    runs-on: ubuntu-latest
    # ... steps
```

**Key considerations:**
- Cron syntax uses UTC timezone
- Shortest interval is 5 minutes
- Scheduled workflows can be delayed during high-load periods (start of hour)
- Use concurrency to prevent overlapping runs consuming excessive CI minutes

### Pattern 2: Playwright JSON Reporter Configuration
**What:** Configure multiple reporters (HTML + JSON) for human and machine consumption
**When to use:** When implementing custom alerting or reporting logic
**Example:**
```typescript
// Source: https://playwright.dev/docs/test-reporters
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  // ... other config
});
```

**JSON report structure (key fields):**
```json
{
  "config": { /* ... */ },
  "suites": [
    {
      "title": "test file name",
      "specs": [
        {
          "title": "test name",
          "tags": ["@critical", "@game"],
          "tests": [
            {
              "status": "expected" | "unexpected" | "flaky" | "skipped",
              "duration": 1234,
              "errors": [{ "message": "error text" }]
            }
          ]
        }
      ]
    }
  ],
  "stats": {
    "startTime": "2026-02-16T...",
    "duration": 45000,
    "expected": 10,
    "unexpected": 2,
    "flaky": 0,
    "skipped": 0
  }
}
```

### Pattern 3: Slack Block Kit Message with Artifact Links
**What:** Send rich Slack notifications with sections, fields, and links to GitHub Actions run and artifacts
**When to use:** For all failure alerts
**Example:**
```javascript
// Source: https://docs.slack.dev/block-kit/ and https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/
const payload = {
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚨 CRITICAL Test Failures',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Severity:*\nCRITICAL`,
        },
        {
          type: 'mrkdwn',
          text: `*Failed Tests:*\n2`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Failed Tests:*\n• slot game launches successfully\n• login flow completes',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Links:*\n• <https://github.com/owner/repo/actions/runs/123456|GitHub Actions Run>\n• <https://github.com/owner/repo/actions/runs/123456/artifacts|Playwright Report & Traces>`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Commit: \`abc1234\` | Branch: main | ${new Date().toISOString()}`,
        },
      ],
    },
  ],
};

await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**Block Kit limits:**
- Maximum 50 blocks per message
- Use `mrkdwn` type for text with markdown formatting
- Links use `<url|display text>` syntax
- Divider blocks create visual separation

### Pattern 4: Consecutive Failure Tracking with File-Based State
**What:** Track failure counts across workflow runs using JSON state files committed as artifacts or stored externally
**When to use:** To implement "2+ consecutive failures before alerting" requirement
**Example:**
```javascript
// Source: https://heynode.com/tutorial/readwrite-json-files-nodejs/ (Node.js file operations)
import fs from 'fs/promises';
import path from 'path';

const STATE_FILE = '.state/failure-state.json';

async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return {}; // File doesn't exist, return empty state
    throw err;
  }
}

async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function trackFailures(testResults) {
  const state = await loadState();
  const now = Date.now();
  const alertTests = [];

  for (const test of testResults.failed) {
    const testKey = `${test.file}::${test.title}`;

    if (!state[testKey]) {
      // First failure - initialize counter
      state[testKey] = { count: 1, lastFailure: now };
    } else {
      // Increment counter
      state[testKey].count += 1;
      state[testKey].lastFailure = now;

      // Alert if 2+ consecutive failures
      if (state[testKey].count >= 2) {
        alertTests.push(test);
      }
    }
  }

  // Reset counters for passed tests
  for (const test of testResults.passed) {
    const testKey = `${test.file}::${test.title}`;
    if (state[testKey]) {
      delete state[testKey];
    }
  }

  await saveState(state);
  return alertTests;
}
```

**State persistence strategies:**
1. **Commit state file to repo** (not recommended - pollutes git history)
2. **Upload as artifact and download in next run** (complex - artifacts can't span runs without workflow_run event)
3. **External storage (GitHub Gists, S3, Redis)** (recommended for production)
4. **GitHub repository dispatch with state in event payload** (viable alternative)

**For this phase:** Start with simple file-based state, plan migration to external storage in future

### Pattern 5: Severity-Based Alerting Logic
**What:** Categorize test failures by severity (@critical vs @warning tags) and customize alert urgency
**When to use:** When different failure types require different response urgency
**Example:**
```javascript
function categorizeFailures(testResults) {
  const critical = [];
  const warning = [];

  for (const test of testResults.failed) {
    // Extract tags from test (Playwright JSON includes tags in spec.tags)
    const tags = test.tags || [];

    if (tags.includes('@critical')) {
      critical.push(test);
    } else if (tags.includes('@warning')) {
      warning.push(test);
    } else {
      // Default to warning for untagged tests
      warning.push(test);
    }
  }

  return { critical, warning };
}

async function sendAlerts(failures) {
  const { critical, warning } = categorizeFailures(failures);

  if (critical.length > 0) {
    // CRITICAL failures - always alert immediately
    await sendSlackMessage({
      severity: 'CRITICAL',
      emoji: '🚨',
      tests: critical,
      message: 'Critical user flows are failing - immediate attention required',
    });
  }

  if (warning.length > 0) {
    // WARNING failures - alert only after consecutive failures (handled by trackFailures)
    await sendSlackMessage({
      severity: 'WARNING',
      emoji: '⚠️',
      tests: warning,
      message: 'Non-critical features experiencing issues',
    });
  }
}
```

### Pattern 6: GitHub Actions Artifact URL Construction
**What:** Build artifact URLs for inclusion in Slack messages
**When to use:** When linking to reports and traces in alerts
**Example:**
```javascript
// Source: https://github.com/orgs/community/discussions/26965 (GitHub context)
// Within GitHub Actions, use context to build URLs
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const runId = process.env.GITHUB_RUN_ID;

const urls = {
  run: `https://github.com/${owner}/${repo}/actions/runs/${runId}`,
  artifacts: `https://github.com/${owner}/${repo}/actions/runs/${runId}/artifacts`,
};

// Pass to Slack notification
```

**GitHub Actions environment variables:**
- `GITHUB_REPOSITORY` - "owner/repo"
- `GITHUB_RUN_ID` - unique run identifier
- `GITHUB_SHA` - commit SHA
- `GITHUB_REF_NAME` - branch or tag name

### Pattern 7: Caching Node Modules and Playwright Browsers
**What:** Cache dependencies to reduce CI run time and minutes consumption
**When to use:** Always in CI workflows
**Example:**
```yaml
# Source: https://github.com/actions/setup-node
- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: 20
    cache: 'npm'  # Auto-caches node_modules based on package-lock.json

- name: Install dependencies
  run: npm ci

- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
```

**Caching benefits:**
- setup-node v6+ auto-caches when `packageManager` field in package.json is set to npm
- Playwright browser cache reduces install time from ~45s to near-instant on cache hit
- Cache backend service rewritten in 2025 for improved performance and reliability
- Caches expire after 7 days of no access

### Anti-Patterns to Avoid
- **Running all tests on every schedule** - Wastes CI minutes; use @critical tag filtering on schedule, full suite on push
- **Using legacy Slack attachments** - Deprecated; use Block Kit sections instead
- **Hard-coding Slack webhook URL** - Always use GitHub Secrets (`${{ secrets.SLACK_WEBHOOK_URL }}`)
- **Alerting on first failure** - Creates noise; implement consecutive failure threshold
- **Ignoring workflow timeouts** - Set reasonable `timeout-minutes` to prevent runaway jobs
- **Using `actions/upload-artifact@v3`** - Use v4+ for 90% performance improvement and immediate artifact availability
- **Relying on artifact persistence across runs** - Artifacts are scoped to workflow run; use external storage for state

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slack message formatting | Custom markdown-to-Slack converter | Block Kit Builder + official Slack webhook API | Block Kit handles layout, validation, mobile responsiveness; custom solutions break on Slack API changes |
| GitHub Actions artifact download across runs | Custom artifact fetching script | External state storage (Gist, S3) or GitHub REST API with actions/github-script | Artifacts can't be retrieved across runs without workflow_run event; official API handles auth and pagination |
| Cron scheduling | Custom job scheduler on server | GitHub Actions schedule trigger | Native cron support with free tier, no infrastructure to maintain |
| Test result parsing | Custom Playwright log parser | Playwright JSON reporter | Built-in reporter provides structured data with all test metadata, errors, durations |
| HTTP requests to Slack | Custom HTTP client | Node.js fetch (built-in) or node-fetch | Built-in fetch in Node.js 18+ handles retries, timeouts; no dependency needed |

**Key insight:** GitHub Actions and Slack provide robust APIs that handle edge cases (retries, rate limiting, auth) that custom solutions miss. Playwright's reporters are designed for CI/CD integration and provide richer data than parsing console output.

## Common Pitfalls

### Pitfall 1: Exceeding GitHub Actions Free Tier Minutes
**What goes wrong:** Running tests every 30 minutes (48x/day) with 3-minute test suite consumes 4320 minutes/month, exceeding 2000-minute free tier by 116%
**Why it happens:** Not accounting for per-run overhead (checkout, setup, install) and full test suite execution
**How to avoid:**
- Run only @critical tests on schedule: `playwright test --grep @critical`
- Reduce frequency to hourly (1440 min/month with 3-min runs)
- Use sharding to split tests across parallel jobs (reduces per-job time but increases total minutes)
**Warning signs:** GitHub Actions usage alerts, unexpected billing, workflow queue delays

### Pitfall 2: State Loss Between Workflow Runs
**What goes wrong:** Consecutive failure tracking resets on every run because state isn't persisted
**Why it happens:** GitHub Actions jobs run in fresh environments; artifacts are scoped to workflow run
**How to avoid:**
- Use external storage (GitHub Gists, AWS S3, Redis) for state persistence
- Use GitHub repository dispatch with state in event payload
- Download previous run's state artifact using `actions/download-artifact` with workflow_run event (complex)
**Warning signs:** Alerts fire on every failure instead of consecutive failures, duplicate notifications

### Pitfall 3: Slack Webhook Rate Limiting
**What goes wrong:** Slack returns 429 Too Many Requests when sending multiple alerts rapidly
**Why it happens:** Incoming webhooks have rate limits (typically 1 request per second)
**How to avoid:**
- Batch multiple test failures into single Slack message
- Implement exponential backoff retry logic
- Use async/await with delay between requests if sending multiple messages
**Warning signs:** Slack API 429 errors in logs, missing alert notifications

### Pitfall 4: Artifact Links Expire or Require Authentication
**What goes wrong:** Artifact URLs in Slack messages return 404 or require GitHub login
**Why it happens:** GitHub artifact downloads require authentication; direct artifact URLs aren't publicly accessible
**How to avoid:**
- Link to GitHub Actions run page (always accessible if repo is public)
- Link to artifact listing page: `https://github.com/owner/repo/actions/runs/{runId}/artifacts`
- For direct artifact access, use GitHub API with token or upload reports to public storage (S3, Vercel)
**Warning signs:** Team members report broken links in Slack, can't access reports

### Pitfall 5: Workflow Runs Overlap with Concurrency
**What goes wrong:** Scheduled run starts while previous run is still executing, consuming double CI minutes
**Why it happens:** Long-running tests exceed 30-minute interval; no concurrency control configured
**How to avoid:**
```yaml
concurrency:
  group: playwright-monitoring
  cancel-in-progress: true  # Cancel previous run if new one starts
```
**Warning signs:** Multiple workflow runs with same commit SHA, excessive CI minute consumption

### Pitfall 6: Missing Severity Tags in Existing Tests
**What goes wrong:** Severity-based alerting fails because tests don't have @critical or @warning tags
**Why it happens:** Tests were written before severity tagging was implemented
**How to avoid:**
- Audit all tests and add appropriate tags
- Default untagged tests to @warning severity
- Verify tags are included in Playwright JSON output (`spec.tags` field)
**Warning signs:** All failures categorized as WARNING, CRITICAL alerts never fire

### Pitfall 7: JSON Report Not Generated in CI
**What goes wrong:** alert-slack.js can't find test-results/results.json, script fails
**Why it happens:** JSON reporter not configured in playwright.config.ts, or wrong output path
**How to avoid:**
- Add `['json', { outputFile: 'test-results/results.json' }]` to reporters array
- Use consistent output path across config and scripts
- Add step to verify JSON file exists before running alert script
**Warning signs:** "ENOENT: no such file" errors in CI logs

### Pitfall 8: Scheduled Workflows Don't Trigger
**What goes wrong:** Cron schedule defined but workflow never runs
**Why it happens:** Workflow file not on default branch (main/master), cron syntax error, or repository inactive
**How to avoid:**
- Verify workflow file is committed to default branch
- Test cron syntax with online validators (crontab.guru)
- GitHub disables schedules for repositories with no activity for 60 days
**Warning signs:** No workflow runs in Actions tab at expected times, no cron runs in workflow history

## Code Examples

Verified patterns from official sources:

### Example 1: Complete GitHub Actions Workflow
```yaml
# Source: https://playwright.dev/docs/ci-intro and https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions
name: Playwright Monitoring

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes (UTC)
  push:
    branches: [main]
  workflow_dispatch:         # Manual trigger

concurrency:
  group: playwright-monitoring
  cancel-in-progress: true

jobs:
  test:
    timeout-minutes: 15
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: npx playwright test --grep @critical
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          retention-days: 30

      - name: Parse results and send alerts
        if: failure()
        run: node scripts/alert-slack.js
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          GITHUB_RUN_ID: ${{ github.run_id }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          GITHUB_SHA: ${{ github.sha }}
```

### Example 2: Playwright Config with Multiple Reporters
```typescript
// Source: https://playwright.dev/docs/test-reporters
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://cooked.com',
    headless: process.env.HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  timeout: 60_000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Example 3: Parse Playwright JSON and Send Slack Alert
```javascript
// scripts/alert-slack.js
// Sources:
// - https://playwright.dev/docs/test-reporters (JSON structure)
// - https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/ (Slack API)
// - https://heynode.com/tutorial/readwrite-json-files-nodejs/ (File operations)

import fs from 'fs/promises';

async function main() {
  // Read JSON report
  const reportData = await fs.readFile('test-results/results.json', 'utf-8');
  const report = JSON.parse(reportData);

  // Extract failures
  const failures = [];
  for (const suite of report.suites) {
    for (const spec of suite.specs) {
      const tags = spec.tags || [];
      const test = spec.tests[0]; // First test in spec

      if (test.status === 'unexpected') {
        failures.push({
          title: spec.title,
          file: suite.file,
          tags,
          error: test.errors?.[0]?.message || 'No error message',
          duration: test.duration,
        });
      }
    }
  }

  if (failures.length === 0) {
    console.log('No failures detected');
    return;
  }

  // Categorize by severity
  const critical = failures.filter(f => f.tags.includes('@critical'));
  const warning = failures.filter(f => !f.tags.includes('@critical'));

  // Build artifact URLs
  const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
  const runId = process.env.GITHUB_RUN_ID;
  const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;

  // Send alert for critical failures
  if (critical.length > 0) {
    await sendSlackAlert({
      severity: 'CRITICAL',
      emoji: '🚨',
      failures: critical,
      runUrl,
      commit: process.env.GITHUB_SHA.substring(0, 7),
    });
  }

  // Send alert for warning failures (could add consecutive check here)
  if (warning.length > 0) {
    await sendSlackAlert({
      severity: 'WARNING',
      emoji: '⚠️',
      failures: warning,
      runUrl,
      commit: process.env.GITHUB_SHA.substring(0, 7),
    });
  }
}

async function sendSlackAlert({ severity, emoji, failures, runUrl, commit }) {
  const failedTests = failures.map(f => `• ${f.title}`).join('\n');

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${severity} Test Failures`,
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
          text: `*Failed Tests:*\n${failedTests}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Links:*\n• <${runUrl}|GitHub Actions Run>\n• <${runUrl}/artifacts|Reports & Traces>`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Commit: \`${commit}\` | ${new Date().toISOString()}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} ${await response.text()}`);
  }

  console.log(`Slack alert sent: ${severity} - ${failures.length} failures`);
}

main().catch(err => {
  console.error('Alert script failed:', err);
  process.exit(1);
});
```

### Example 4: Consecutive Failure Tracking
```javascript
// scripts/track-failures.js
// Source: https://heynode.com/tutorial/readwrite-json-files-nodejs/

import fs from 'fs/promises';
import path from 'path';

const STATE_FILE = '.state/failure-state.json';
const ALERT_THRESHOLD = 2; // Alert after 2 consecutive failures

async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

export async function shouldAlert(testResults) {
  const state = await loadState();
  const now = Date.now();
  const alertTests = [];

  // Process failures - increment counters
  for (const test of testResults.failed) {
    const testKey = `${test.file}::${test.title}`;

    if (!state[testKey]) {
      state[testKey] = { count: 1, lastFailure: now };
    } else {
      state[testKey].count += 1;
      state[testKey].lastFailure = now;
    }

    // Alert if reached threshold
    if (state[testKey].count >= ALERT_THRESHOLD) {
      alertTests.push({
        ...test,
        consecutiveFailures: state[testKey].count,
      });
    }
  }

  // Reset counters for passed tests
  for (const test of testResults.passed) {
    const testKey = `${test.file}::${test.title}`;
    delete state[testKey];
  }

  await saveState(state);
  return alertTests;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| actions/upload-artifact@v3 | actions/upload-artifact@v4 | 2024 (v4 released) | 90% faster uploads, immediate artifact availability, artifact ID returned for REST API use |
| Manual npm caching with actions/cache | setup-node@v6 auto-caching | 2026 (v6 released Jan 15) | Auto-caches when package.json includes packageManager field, no manual cache configuration needed |
| Slack legacy attachments | Slack Block Kit sections | 2020+ (ongoing deprecation) | Attachments wrapped/truncated on mobile; Block Kit provides guaranteed layout and interactivity |
| GitHub Actions cache v1 backend | Cache v2 backend | Feb 1, 2025 | Improved performance and reliability; legacy service sunset same date |
| Playwright networkidle waits | Locator API auto-waiting | Ongoing (best practice) | networkidle unreliable for modern SPAs; Locator API waits for actionability instead |
| CTRF standardized JSON | Playwright built-in JSON reporter | N/A (both current) | CTRF useful for multi-framework setups; Playwright JSON sufficient for single-framework |

**Deprecated/outdated:**
- **Slack attachments API**: Still works but discouraged; Block Kit provides richer formatting
- **actions/upload-artifact@v3**: Works but much slower than v4; v3 scheduled for deprecation Nov 30, 2024
- **Manual playwright browser caching**: Still needed in 2026; no official Playwright action with built-in caching yet

## Open Questions

1. **State persistence for consecutive failures**
   - What we know: GitHub Actions artifacts can't persist state across runs without complex workflow_run event handling
   - What's unclear: Best lightweight external storage for failure state (Gist vs S3 vs Redis vs repository dispatch)
   - Recommendation: Start with in-repo state file committed by bot account, migrate to Gist/S3 when scaling needs dictate

2. **Optimal scheduling frequency**
   - What we know: 30-minute schedule may exceed free tier (4320 min/month vs 2000 limit)
   - What's unclear: Actual test suite duration after optimization (currently unknown)
   - Recommendation: Measure actual CI run time, calculate monthly minutes, adjust frequency or use @critical filtering

3. **Slack rate limiting thresholds**
   - What we know: Incoming webhooks have rate limits (~1 req/sec)
   - What's unclear: Exact limits for Incoming Webhooks (Slack docs don't specify precise numbers)
   - Recommendation: Batch all failures into single message, implement exponential backoff if multiple messages needed

4. **Artifact retention vs storage costs**
   - What we know: Default retention is 90 days, configurable to 1-90 days
   - What's unclear: GitHub Actions artifact storage limits on free tier (500MB total?)
   - Recommendation: Use 30-day retention for reports, 7 days for traces/videos (reduce storage)

5. **Test sharding for parallel execution**
   - What we know: Matrix strategy can shard tests across parallel jobs
   - What's unclear: Whether monitoring suite benefits from sharding (may increase total minutes while reducing per-job time)
   - Recommendation: Defer sharding until test suite exceeds 5 minutes; not cost-effective for small suites

## Sources

### Primary (HIGH confidence)
- [GitHub Actions workflow syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions) - Schedule, concurrency, timeout configuration
- [Playwright test reporters](https://playwright.dev/docs/test-reporters) - JSON reporter, HTML reporter, multiple reporters
- [Playwright CI intro](https://playwright.dev/docs/ci-intro) - CI setup recommendations, timeouts, artifact management
- [Slack Block Kit](https://docs.slack.dev/block-kit/) - Message structure, sections, fields, markdown links
- [Slack incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/) - Webhook API, payload format
- [actions/upload-artifact@v4](https://github.com/actions/upload-artifact) - Parameters, performance improvements, limitations
- [actions/setup-node@v6](https://github.com/actions/setup-node) - Caching, package manager auto-detection

### Secondary (MEDIUM confidence)
- [GitHub Actions concurrency control](https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs) - Cancel-in-progress, concurrency groups
- [GitHub Actions contexts](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts) - Environment variables, context objects
- [Node.js read/write JSON files](https://heynode.com/tutorial/readwrite-json-files-nodejs/) - File operations for state management
- [Playwright annotations](https://playwright.dev/docs/test-annotations) - Tags, metadata, test.info()
- [GitHub Actions matrix builds](https://codefresh.io/learn/github-actions/github-actions-matrix/) - Parallel execution, sharding patterns

### Tertiary (LOW confidence - requires validation)
- [OneUpTime blog: GitHub Actions artifacts (2026-01-25)](https://oneuptime.com/blog/post/2026-01-25-github-actions-artifacts/view) - Artifact management patterns
- [OneUptime blog: Synthetic alerting](https://oneuptime.com/blog/post/2026-01-30-alert-coverage-analysis/view) - Consecutive failure patterns
- [Playwright trace artifacts discussion](https://github.com/microsoft/playwright/issues/24319) - Artifact upload patterns for traces

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official GitHub Actions and Playwright documentation confirms all core tools
- Architecture: HIGH - Patterns verified through official docs (GitHub Actions, Playwright, Slack)
- Pitfalls: MEDIUM-HIGH - Common issues documented in GitHub community discussions and official best practices
- State persistence: MEDIUM - Consecutive failure tracking requires custom implementation, no standard pattern

**Research date:** 2026-02-16
**Valid until:** 2026-03-18 (30 days for stable infrastructure - GitHub Actions and Slack APIs change slowly)
