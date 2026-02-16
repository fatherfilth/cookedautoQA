// scripts/commit-results.js
// Commits test result summaries to the repository after each CI run,
// creating a browsable history of test results over time.

import fs from 'fs/promises';
import { execSync } from 'child_process';

// ============================================================================
// Section 1: Constants
// ============================================================================

const SUMMARY_FILE = 'test-results/summary.json';
const RESULTS_DIR = 'results-history';

// ============================================================================
// Section 2: Git configuration
// ============================================================================

/**
 * Configure git for automated commits
 */
function configureGit() {
  console.log('Configuring git...');
  execSync('git config user.name "github-actions[bot]"', { stdio: 'inherit' });
  execSync('git config user.email "github-actions[bot]@users.noreply.github.com"', { stdio: 'inherit' });
}

// ============================================================================
// Section 3: Create timestamped result file
// ============================================================================

/**
 * Format timestamp for filename (safe for all filesystems)
 * Example: 2026-02-16T14-30-00Z
 * @param {Date} date - Date to format
 * @returns {string} - Filename-safe timestamp
 */
function formatTimestamp(date) {
  return date.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Copy summary.json to results-history with timestamp
 * @returns {Object|null} - Summary data or null if file doesn't exist
 */
async function copySummaryToHistory() {
  try {
    // Read summary file
    const summaryData = await fs.readFile(SUMMARY_FILE, 'utf-8');
    const summary = JSON.parse(summaryData);

    // Create timestamped filename
    const timestamp = formatTimestamp(new Date());
    const targetPath = `${RESULTS_DIR}/${timestamp}.json`;

    // Ensure results-history directory exists
    await fs.mkdir(RESULTS_DIR, { recursive: true });

    // Write timestamped copy
    await fs.writeFile(targetPath, summaryData);
    console.log(`Created ${targetPath}`);

    return summary;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`WARNING: ${SUMMARY_FILE} not found. Test summary may not have been generated.`);
      console.log('Exiting gracefully.');
      return null;
    }
    throw err;
  }
}

// ============================================================================
// Section 4: Commit and push results
// ============================================================================

/**
 * Check if there are staged changes
 * @returns {boolean} - True if changes are staged
 */
function hasStagedChanges() {
  try {
    execSync('git diff --cached --quiet', { stdio: 'pipe' });
    return false; // No changes (quiet succeeded)
  } catch {
    return true; // Changes exist (quiet failed)
  }
}

/**
 * Commit and push result file
 * @param {Object} summary - Summary data for commit message
 */
function commitAndPush(summary) {
  console.log('Staging results-history...');
  execSync(`git add ${RESULTS_DIR}/`, { stdio: 'inherit' });

  // Check if there are actually changes to commit
  if (!hasStagedChanges()) {
    console.log('No new results to commit (file may already exist). Exiting.');
    return;
  }

  // Build commit message
  const passed = summary.passed || 0;
  const total = summary.total || 0;
  const timestamp = formatTimestamp(new Date(summary.timestamp));
  const commitMessage = `results: ${passed}/${total} passed (${timestamp})`;

  console.log(`Committing: ${commitMessage}`);
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  // Push with error handling
  try {
    console.log('Pushing to remote...');
    execSync('git push', { stdio: 'inherit' });
    console.log('Successfully pushed test results to repository.');
  } catch (err) {
    console.warn('WARNING: Failed to push results to remote.');
    console.warn('This can happen due to concurrent pushes or network issues.');
    console.warn('Error:', err.message);
    console.log('Exiting gracefully (not failing CI).');
  }
}

// ============================================================================
// Section 5: Main function
// ============================================================================

async function main() {
  console.log('Starting commit-results script...');

  // 1. Configure git
  configureGit();

  // 2. Copy summary to history
  const summary = await copySummaryToHistory();

  // 3. Exit gracefully if no summary found
  if (!summary) {
    process.exit(0);
  }

  // 4. Commit and push
  commitAndPush(summary);

  console.log('commit-results script completed successfully.');
}

main().catch(err => {
  console.error('commit-results script failed:', err);
  process.exit(1);
});
