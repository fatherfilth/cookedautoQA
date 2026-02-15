---
phase: 05-ci-cd-alerting
plan: 02
subsystem: alerting
tags: [slack, notifications, monitoring, reporting]

dependency_graph:
  requires:
    - playwright.config.ts JSON reporter (Phase 1)
    - .gitignore .state/ entry (Phase 1)
    - test tags @critical/@warning (Phase 1)
  provides:
    - scripts/notify-slack.js: Slack alerting script
    - .state/failure-state.json: Consecutive failure tracking
    - test-results/summary.json: JSON run summaries
  affects:
    - .github/workflows/playwright.yml (Plan 3 will integrate this script)

tech_stack:
  added:
    - Slack Incoming Webhooks API
    - Slack Block Kit message format
  patterns:
    - Consecutive failure tracking with persistent state
    - Severity-based alert categorization
    - Graceful degradation (missing webhook = warning, not error)

key_files:
  created:
    - scripts/notify-slack.js (452 lines)
  modified:
    - .env.example (+3 lines)

decisions:
  - title: "Single script for parsing, tracking, alerting, and reporting"
    rationale: "Keeps CI workflow simple (single node invocation). All logic in one place for easier maintenance."
    alternatives: "Separate scripts — would require multiple workflow steps and state passing"

  - title: "ALERT_THRESHOLD = 2 consecutive failures"
    rationale: "Reduces noise from intermittent flakes while still alerting quickly on persistent issues. First failure is silent, second consecutive triggers alert."
    alternatives: "Threshold of 1 (too noisy), threshold of 3 (too slow to alert)"

  - title: "Default untagged tests to WARNING severity"
    rationale: "Conservative approach: only @critical tagged tests are CRITICAL. Prevents accidentally flooding critical alerts channel."
    alternatives: "Default to CRITICAL — would require tagging everything as @warning"

  - title: "Graceful handling of missing SLACK_WEBHOOK_URL"
    rationale: "Allows local testing and CI runs without Slack setup. Script logs warning and continues, still writing JSON summary."
    alternatives: "Error on missing webhook — would break CI until Slack is configured"

metrics:
  duration_seconds: 123
  tasks_completed: 2
  files_modified: 2
  commits: 2
  completed_date: "2026-02-15"
---

# Phase 5 Plan 2: Slack Alerting and Reporting Script Summary

**One-liner:** Intelligent Slack alerting with consecutive failure tracking (threshold=2), severity categorization (@critical vs @warning), and JSON summaries for historical analysis.

## What Was Built

Created `scripts/notify-slack.js`, a comprehensive ESM script that:

1. **Parses Playwright JSON results** — Recursively walks nested suite structure to extract test results
2. **Tracks consecutive failures** — Persists state in `.state/failure-state.json`, only alerts after 2+ consecutive failures
3. **Categorizes by severity** — Splits failures into CRITICAL (@critical tag) and WARNING (@warning/untagged) with separate Slack messages
4. **Sends Slack Block Kit notifications** — Rich messages with test names, consecutive counts, error snippets, GitHub Actions links, and artifacts links
5. **Writes JSON summaries** — Structured reports in `test-results/summary.json` with timestamp, commit, branch, pass/fail counts, and error details

Also updated `.env.example` with detailed Slack webhook setup instructions and graceful-skip behavior documentation.

## Success Criteria Verification

**ALERT-01: Slack notification with failing test names and GitHub Actions run link** ✓
- buildSlackPayload includes failures list and runUrl
- Message displays test titles with consecutive counts
- GitHub Actions run link included in links section

**ALERT-02: Links to artifact pages (reports, traces)** ✓
- Artifacts URL built as `${runUrl}#artifacts`
- Both "View GitHub Actions Run" and "View Reports & Traces" links in message

**ALERT-03: Severity categorization (CRITICAL vs WARNING)** ✓
- categorizeFailures splits by @critical tag
- Untagged tests default to WARNING
- Separate messages sent for each severity level
- Different emojis: 🚨 for CRITICAL, ⚠️ for WARNING

**ALERT-04: Consecutive failure tracking with threshold of 2** ✓
- ALERT_THRESHOLD = 2
- trackFailures increments count in state, checks threshold
- First failure = no alert, second consecutive = alert
- State resets on test recovery (pass)

**REPORT-01: JSON summary with required fields** ✓
- timestamp, commit (first 7 chars), branch, runId, runUrl
- duration, total, passed, failed, flaky, skipped counts
- failures array with title, file, tags, duration, error (truncated to 200 chars)

## Implementation Highlights

**Recursive suite walking:** Playwright's JSON structure has nested suites (from test.describe blocks). The extractSpecs function recursively traverses suites → child suites → specs to handle arbitrary nesting depth.

**Consecutive failure logic:** State file maps test titles to { count, lastFailure }. On failure, increment count. On pass, delete entry (recovery resets counter). Only tests with count >= threshold are alertable.

**Block Kit message structure:**
1. Header with emoji and severity
2. Fields section (severity + count)
3. Failure list (truncated to 10 tests)
4. Error snippets (first 100 chars each)
5. Links section (run + artifacts)
6. Divider
7. Context footer (commit, branch, timestamp)

**Error handling:**
- Missing results.json → exit 1 (CI step fails)
- Missing SLACK_WEBHOOK_URL → log warning, continue (graceful skip)
- Slack API error → log error, continue (don't fail CI)
- State file errors → log warning, continue without tracking

## Deviations from Plan

None - plan executed exactly as written.

## Integration Notes

**For Plan 3 (GitHub Actions workflow):**
- Add workflow step: `node scripts/notify-slack.js`
- Set SLACK_WEBHOOK_URL in repository secrets
- Ensure JSON reporter is enabled (already configured in playwright.config.ts)
- Run this step on workflow failure or always (even on success, to write summary)

**State persistence:**
- `.state/failure-state.json` is gitignored (created in Plan 1)
- State persists across workflow runs via GitHub Actions cache or artifacts
- Without persistence, threshold resets each run (acceptable degradation)

## Files Created

### scripts/notify-slack.js (452 lines)
Combined alerting script with 8 sections:
1. Constants (paths, threshold)
2. Parse Playwright JSON results (recursive suite extraction)
3. Consecutive failure tracking (load/save state)
4. Severity categorization (@critical vs @warning)
5. Slack Block Kit message builder
6. Send Slack notification (via webhook)
7. Write JSON summary report
8. Main function (orchestrates all steps)

ESM format (import, not require). No external dependencies beyond Node.js built-ins (fs/promises).

## Self-Check: PASSED

**Files exist:**
```
FOUND: scripts/notify-slack.js (452 lines)
FOUND: .env.example (contains SLACK_WEBHOOK_URL with setup docs)
```

**Commits exist:**
```
FOUND: 845b49f (feat: create Slack notification script)
FOUND: 35adc58 (chore: update .env.example)
```

**Verification checks:**
- ✓ Syntax check passed (node --check)
- ✓ Uses ESM imports
- ✓ Correct file paths (results, state, summary)
- ✓ ALERT_THRESHOLD = 2
- ✓ Severity categorization present
- ✓ Block Kit format used
- ✓ Graceful webhook handling
- ✓ .env.example documented

All claims verified. Ready for integration in Plan 3.
