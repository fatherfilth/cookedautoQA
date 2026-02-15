# Phase 6: Documentation & Polish - Research

**Researched:** 2026-02-16
**Domain:** Test automation documentation, runbook design, developer onboarding
**Confidence:** HIGH

## Summary

Documentation for test automation projects serves two critical audiences: developers onboarding to the codebase who need to run tests locally and add new ones, and operations teams responding to test failures who need to triage alerts quickly. Research shows developers with structured onboarding documentation reach full productivity 40% faster than those without, while well-designed runbooks reduce MTTR by 30-50% through reduced context switching.

The COOKEDQA project already has technical infrastructure in place (Playwright framework, CI/CD, alerting), so Phase 6 focuses on knowledge transfer artifacts. The selector strategy is already documented (`docs/SELECTOR-STRATEGY.md`), but the README is missing and no operational runbook exists for alert triage.

**Primary recommendation:** Create two focused documents: a developer-oriented README covering local setup and test authoring patterns, and an operations-oriented runbook (docs/RUNBOOK.md) with alert triage checklists and escalation paths. Both should prioritize scannability with copy-pasteable commands and checklists over prose.

## Standard Stack

### Core

No additional libraries required. This phase uses:

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Markdown | N/A | Documentation format | Universal, git-friendly, renders everywhere (GitHub, VS Code, IDEs) |
| GitHub Flavored Markdown (GFM) | N/A | Extended markdown syntax | Supports checklists, tables, code blocks with syntax highlighting |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `.env.example` | N/A | Environment variable template | Already exists; reference from README |
| `docs/` directory | N/A | Structured documentation folder | Already exists; add RUNBOOK.md here |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Markdown README | Wiki pages (GitHub/Confluence) | Wikis live outside repo, harder to keep in sync with code |
| Static markdown runbook | Executable runbook (Runbook.md) | Executable runbooks embed bash scripts but add complexity for simple alert triage |
| Plain text documentation | Notion/Docusaurus | Richer formatting but requires external platform; markdown stays version-controlled |

**Installation:**
```bash
# No installation required - use existing text editor or VS Code
```

## Architecture Patterns

### Recommended Documentation Structure

```
COOKEDQA/
├── README.md                          # Primary entry point for developers
├── .env.example                       # Already exists; reference from README
├── docs/
│   ├── SELECTOR-STRATEGY.md          # Already exists
│   └── RUNBOOK.md                    # NEW: Operations/alert triage guide
├── playwright.config.ts               # Reference from README (configuration)
└── tests/                             # Reference structure in README
```

### Pattern 1: README for Developer Onboarding

**What:** Developer-facing documentation covering setup, running tests, and extending the test suite

**When to use:** Always create a README as the primary onboarding document

**Structure:**
```markdown
# Project Title

## Overview
[2-3 sentences: what this project does, why it exists]

## Prerequisites
[Required tools with versions: Node.js 20+, etc.]

## Installation
[Step-by-step setup with copy-pasteable commands]

## Configuration
[Environment variables with .env.example reference]

## Running Tests
[Common test commands: npm test, npm run test:critical, etc.]

## Adding New Tests
[How to create tests following project patterns]

## Troubleshooting
[Common issues and solutions, flaky test debugging]

## CI/CD
[How tests run in GitHub Actions, where to find artifacts]
```

**Why this structure:**
- **Overview first:** Developers need context before diving into commands
- **Prerequisites before installation:** Prevents setup failures
- **Commands are copy-pasteable:** Reduces friction, speeds onboarding
- **Troubleshooting at the end:** Reference material, not critical path

### Pattern 2: Runbook for Alert Triage

**What:** Operations-facing documentation for responding to test failures from CI/CD alerts

**When to use:** When automated monitoring sends alerts (Slack notifications, email, etc.)

**Structure:**
```markdown
# Alert Triage Runbook

## When to Use This Runbook
[Trigger: Slack alert received from playwright-monitoring workflow]

## Severity Levels
[Define @critical vs @warning tags]

## Triage Checklist
- [ ] Step 1: Check GitHub Actions run status
- [ ] Step 2: Review Playwright HTML report artifact
- [ ] Step 3: Examine screenshots/traces for failed tests
- [ ] Step 4: Determine if failure is site issue vs test issue

## Common False Positives
[Known flaky patterns, how to recognize them]

## Escalation Paths
[When to notify devs, when to page on-call, when to ignore]

## Quick Actions
[Copy-pasteable commands for common fixes]
```

**Why this structure:**
- **Checklists over paragraphs:** Operations teams need actionable steps, not reading
- **Common false positives section:** Prevents alert fatigue, reduces noise
- **Escalation paths:** Clear decision tree for when to wake someone up
- **Quick actions:** Copy-pasteable commands for fast resolution

### Pattern 3: Reference Existing Documentation

**What:** Link to detailed docs (SELECTOR-STRATEGY.md) rather than duplicating content

**Example:**
```markdown
## Selector Strategy

Tests use role-based selectors with data-testid fallbacks. See [docs/SELECTOR-STRATEGY.md](docs/SELECTOR-STRATEGY.md) for full guidelines.

**Quick reference:**
1. Prefer `getByRole()` for buttons, links, form fields
2. Use `getByLabel()` for labeled inputs
3. Use `getByTestId()` for dynamic content
4. Avoid CSS class selectors (brittle)
```

**Why:** Avoids duplication, maintains single source of truth, provides quick reference with link to deep dive

### Anti-Patterns to Avoid

- **Long prose paragraphs:** Operations teams won't read them during incidents; use bullet lists and checklists
- **Outdated examples:** Code snippets in docs diverge from actual codebase; minimize code examples or auto-generate from tests
- **Missing prerequisite versions:** "Install Node.js" without specifying version leads to support issues
- **Vague troubleshooting:** "If tests fail, check logs" vs. "Tests failing on line 23? Check BASE_URL env var is set"
- **No table of contents:** Long READMEs need navigation; GitHub auto-generates TOC from headers
- **Assuming context:** "Set up secrets" without explaining where or how (GitHub Secrets UI path)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code snippet examples | Copy-paste from codebase manually | Link to actual test files in repo | Code evolves, docs don't; links stay fresh |
| Environment variable list | Manually maintain in README | Reference `.env.example` file | Single source of truth; `.env.example` is validated by code |
| CI/CD workflow documentation | Describe YAML manually | Link to `.github/workflows/playwright.yml` with inline comments | Workflow file is the truth; docs are commentary |
| Screenshot/image hosting | Upload to external image host | Use GitHub issue attachments or relative paths in repo | External hosts break; repo-relative paths stay stable |

**Key insight:** Documentation maintenance is a tax. Minimize what you manually maintain by referencing living code artifacts (config files, test examples) wherever possible. When you must write prose, optimize for scannability (checklists, tables, code blocks) over readability (paragraphs).

## Common Pitfalls

### Pitfall 1: Documentation Drift

**What goes wrong:** Documentation becomes outdated as code evolves. Developers follow README, hit errors, lose trust in docs.

**Why it happens:** Docs are separate from code and not tested. No forcing function to update docs when code changes.

**How to avoid:**
- Link to actual code files instead of duplicating snippets
- Reference configuration files (`.env.example`, `playwright.config.ts`) as source of truth
- Add "Last updated" dates to documentation
- Review docs during PR reviews when changing configuration or setup

**Warning signs:**
- "The README says to do X but that doesn't work"
- Multiple Slack threads answering the same setup question
- Test commands in README fail when run verbatim

### Pitfall 2: Alert Fatigue from Unclear Runbooks

**What goes wrong:** Operations team receives alerts but runbook doesn't explain how to distinguish real issues from false positives. Team starts ignoring alerts.

**Why it happens:** Runbook written before system is stable, doesn't account for known flaky patterns.

**How to avoid:**
- Write runbook AFTER Phase 5 is deployed and first alerts arrive
- Document common false positives as they're discovered (iterative)
- Include screenshots or examples of real vs. false positive failures
- Set consecutive failure threshold (already done: ALERT_THRESHOLD = 2)

**Warning signs:**
- Operations team asks "Is this alert real?" for every notification
- Alerts acknowledged/closed without investigation
- Same flaky test repeatedly triggers alerts

### Pitfall 3: Missing Troubleshooting for Flaky Tests

**What goes wrong:** Developer adds test, it passes locally, fails in CI intermittently. No guidance on debugging.

**Why it happens:** Playwright has powerful debugging tools (traces, UI mode) but they're not obvious to new users.

**How to avoid:**
- Document how to enable traces locally (`npx playwright test --trace on`)
- Explain how to download and view trace artifacts from GitHub Actions
- Link to Playwright debugging guide: https://playwright.dev/docs/running-tests
- Add troubleshooting section with common flaky patterns (race conditions, timing issues)

**Warning signs:**
- Developers adding `waitForTimeout()` arbitrary sleeps to "fix" flakiness
- Tests passing locally but failing in CI without clear reason
- Tests retrying 2-3 times before passing

### Pitfall 4: Unclear Environment Variable Requirements

**What goes wrong:** Developer sets up project but forgets `TEST_USER_EMAIL` env var. Tests fail with cryptic errors.

**Why it happens:** `.env.example` exists but README doesn't explain it or mark variables as required vs optional.

**How to avoid:**
- README Installation section explicitly says "Copy `.env.example` to `.env` and fill in values"
- Annotate which variables are REQUIRED vs optional in `.env.example`
- Provide example values where possible (`BASE_URL=https://cooked.com`)
- Explain where to get credentials (`TEST_USER_EMAIL`: ask @team-lead)

**Warning signs:**
- "I followed the README but tests fail with 'undefined' errors"
- Support requests for "How do I get test credentials?"
- Multiple commits fixing missing env var defaults

### Pitfall 5: No Escalation Path in Runbook

**What goes wrong:** Operations team sees critical failure but doesn't know who to notify or how urgent it is.

**Why it happens:** Runbook focuses on triage steps but not decision-making or escalation.

**How to avoid:**
- Define severity levels clearly (`@critical` = page on-call, `@warning` = investigate next business day)
- Provide escalation matrix (notify #dev-team Slack, page via PagerDuty, etc.)
- Include contact info or on-call rotation link
- Explain when to escalate vs. when to self-resolve

**Warning signs:**
- Incidents discovered hours later because alert was ignored
- Operations team over-escalates minor issues
- Developers paged for known false positives

## Code Examples

Verified patterns from official sources and industry best practices:

### README Template (Developer Onboarding)

```markdown
# COOKEDQA - Synthetic Monitoring for cooked.com

Automated end-to-end tests monitoring critical user flows (auth, games, chat, crypto) running on GitHub Actions every 30 minutes with Slack alerts on failure.

## Prerequisites

- Node.js 20+ and npm 10+
- Git

## Installation

```bash
# Clone repository
git clone https://github.com/your-org/COOKEDQA.git
cd COOKEDQA

# Install dependencies
npm install

# Install Playwright browsers (Chromium only)
npx playwright install chromium
```

## Configuration

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in required values in `.env`:
   - `BASE_URL` (default: https://cooked.com)
   - `TEST_USER_EMAIL` (required - get from team lead)
   - `TEST_USER_PASSWORD` (required - get from team lead)
   - `SLACK_WEBHOOK_URL` (optional - for local alert testing)

See [.env.example](.env.example) for all available options.

## Running Tests

```bash
# Run all tests
npm test

# Run only critical tests (@critical tag)
npm run test:critical

# Run only warning-level tests (@warning tag)
npm run test:warning

# Run in headed mode (see browser)
npm run test:headed

# Debug specific test
npm run test:debug tests/auth/login.spec.ts
```

## Project Structure

```
tests/
├── auth/           # Login, registration, session tests
├── game/           # Game launch tests (slots, table, live dealer)
├── crypto/         # Swapped.com integration tests
├── pages/          # Page Object Model classes
└── helpers/        # Retry logic, config, waits
```

## Adding New Tests

1. Create test file in appropriate category: `tests/<category>/<name>.spec.ts`
2. Import page objects and helpers
3. Follow selector strategy: see [docs/SELECTOR-STRATEGY.md](docs/SELECTOR-STRATEGY.md)
4. Add severity tag: `@critical` or `@warning`

Example:
```typescript
import { test, expect } from '@playwright/test';
import { LobbyPage } from '../pages/LobbyPage.js';

test('lobby displays game categories @critical', async ({ page }) => {
  const lobbyPage = new LobbyPage(page);
  await lobbyPage.open();
  await expect(lobbyPage.slotGamesCategory).toBeVisible();
});
```

## Troubleshooting Flaky Tests

### Tests pass locally but fail in CI

1. **Check trace artifacts:** Download trace from GitHub Actions artifacts, open with `npx playwright show-trace trace.zip`
2. **Run with retries:** CI uses 2 retries (`playwright.config.ts` line 10)
3. **Check timing:** CI is slower; avoid `waitForTimeout()`, use `waitFor({ state: 'visible' })` instead

### Element not found errors

1. **Verify selector:** Use Playwright Inspector (`npm run test:debug`)
2. **Check auto-waiting:** Locator actions auto-wait; explicit `waitFor()` rarely needed
3. **Review selector strategy:** Prefer `getByRole()` over CSS selectors (see [docs/SELECTOR-STRATEGY.md](docs/SELECTOR-STRATEGY.md))

### WebSocket/network failures

1. **Increase timeout:** Edit `playwright.config.ts` actionTimeout or navigationTimeout
2. **Check baseURL:** Verify `BASE_URL` env var matches target environment
3. **Retry helper:** Use `retryAction()` from `tests/helpers/retry.ts` for flaky operations

## CI/CD

Tests run automatically:
- **Schedule:** Every 30 minutes (UTC)
- **Triggers:** Push to main, manual workflow dispatch
- **Alerts:** Slack notifications on failure (consecutive failures only)

View results:
- GitHub Actions: Workflow runs at https://github.com/your-org/COOKEDQA/actions
- Playwright HTML report: Artifacts > playwright-report
- Test results (screenshots, traces): Artifacts > test-results

For alert triage, see [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Selector Strategy

Tests prioritize resilient selectors:
1. `getByRole()` - buttons, links, form fields
2. `getByLabel()` - labeled inputs
3. `getByTestId()` - dynamic content
4. Avoid CSS class selectors (brittle)

Full guidelines: [docs/SELECTOR-STRATEGY.md](docs/SELECTOR-STRATEGY.md)
```

**Source:** Synthesized from [Playwright documentation](https://playwright.dev/docs/best-practices), [BrowserStack best practices](https://www.browserstack.com/guide/playwright-best-practices), and onboarding research showing 40% faster productivity with structured docs.

### RUNBOOK Template (Alert Triage)

```markdown
# Alert Triage Runbook

## When to Use This Runbook

**Trigger:** You received a Slack alert from the `playwright-monitoring` GitHub Actions workflow.

**Alert appears in:** `#dev-alerts` Slack channel (or configured webhook channel)

## Alert Anatomy

Slack alerts include:
- **Failed tests:** List of test names that failed
- **Severity:** Mix of @critical and @warning tags
- **GitHub Actions run:** Link to full workflow execution
- **Artifacts:** Links to HTML report, screenshots, traces

## Severity Levels

| Tag | Meaning | Response Time | Escalation |
|-----|---------|---------------|------------|
| `@critical` | Revenue-impacting flow broken (auth, game launch, crypto) | Investigate immediately | Page on-call if site-wide issue |
| `@warning` | Non-critical feature degraded (chat, social features) | Investigate within 4 hours | Notify team in Slack, no page |

**Consecutive failure threshold:** Alerts only fire after 2+ consecutive failures (reduces noise).

## Triage Checklist

### Step 1: Check GitHub Actions Run

- [ ] Click the GitHub Actions run link from Slack alert
- [ ] Check if workflow is still running or completed
- [ ] Note timestamp: is this a one-time failure or recurring?

### Step 2: Review Test Summary

- [ ] Download `test-results/summary.json` artifact (or check Slack message for summary)
- [ ] Identify which specific tests failed
- [ ] Check error messages in summary

### Step 3: Examine Artifacts

- [ ] Download `playwright-report` artifact
- [ ] Open `index.html` locally: `npx playwright show-report <extracted-folder>`
- [ ] For each failed test:
  - [ ] View screenshot (shows page state at failure)
  - [ ] Open trace (full timeline of test actions)

### Step 4: Determine Root Cause

**Is this a SITE issue or TEST issue?**

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| Multiple unrelated tests fail | Site down or slow | Check cooked.com manually, escalate to on-call |
| Single test fails consistently | Test is flaky or site feature changed | Log issue, investigate during business hours |
| Login/auth tests fail | Credentials expired or auth system down | Verify test user account, check auth service |
| Game launch fails | Provider issue (iframe timeout) | Check specific game manually, may be provider outage |
| WebSocket tests fail | Chat service degraded | Check chat feature manually, likely non-critical |

### Step 5: Escalate or Resolve

- [ ] **If site-wide issue (@critical failures):** Page on-call via PagerDuty, post in #incidents
- [ ] **If single test flaky:** Create GitHub issue, label `flaky-test`, assign to test maintainer
- [ ] **If known false positive:** Acknowledge alert, document in "Common False Positives" below
- [ ] **If unclear:** Post in #dev-team Slack with trace link, ask for help

## Common False Positives

### 1. WebSocket Connection Timeout (SOCIAL-01)

**Symptom:** `tests/chat/connection.spec.ts` fails with "WebSocket did not connect within 10s"

**Why it's false positive:** Chat service occasionally slow during off-peak hours; resolves on retry

**How to recognize:**
- Only chat tests fail, not auth or game tests
- Happens during low-traffic hours (2-6 AM UTC)
- Next scheduled run passes

**Action:** Acknowledge alert, no escalation needed. If persists 3+ runs, escalate.

### 2. Game Iframe Load Timeout (GAME-01, GAME-02, GAME-03)

**Symptom:** Game launch test fails with "iframe did not load within 30s"

**Why it's false positive:** Third-party game providers occasionally slow; not cooked.com issue

**How to recognize:**
- Single game provider fails (e.g., only slots, not table games)
- Playwright trace shows network request to provider domain hung
- Other tests (auth, lobby) pass

**Action:** Verify game loads manually on cooked.com. If manual test works, likely provider blip. Acknowledge alert.

### 3. Session Persistence Flake (AUTH-03)

**Symptom:** `tests/auth/session-persistence.spec.ts` fails intermittently

**Why it's false positive:** Test relies on cookie timing; occasionally hits race condition

**How to recognize:**
- Fails <10% of runs
- Trace shows cookies set correctly but assertion timed out
- Retry passes

**Action:** Known flaky test, logged as issue #42. Acknowledge alert. (Fix planned: add explicit cookie wait)

## Quick Actions

### Re-run Failed Tests Locally

```bash
# Set up environment
export BASE_URL=https://cooked.com
export TEST_USER_EMAIL=your-test-user@example.com
export TEST_USER_PASSWORD=your-password

# Run specific failed test with trace
npx playwright test tests/auth/login.spec.ts --trace on

# View trace
npx playwright show-trace test-results/.../trace.zip
```

### Download and View CI Artifacts

```bash
# Download artifacts from GitHub Actions UI (top right of workflow run)
# Extract playwright-report.zip
npx playwright show-report playwright-report/

# Extract test-results.zip
# Traces are in test-results/<test-name>/trace.zip
npx playwright show-trace test-results/<test-name>/trace.zip
```

### Check Consecutive Failure State

```bash
# SSH to CI runner or check repo
cat .state/failure-state.json
# Shows failure count per test; threshold is 2
```

## Escalation Paths

| Scenario | Notify | Channel | Urgency |
|----------|--------|---------|---------|
| Multiple @critical tests fail | On-call engineer | PagerDuty + #incidents | Immediate (page) |
| Single @critical test fails 3+ times | Dev team lead | #dev-team | 1 hour |
| @warning tests fail | QA team | #qa-alerts | 4 hours |
| All tests pass after 1 retry | No one (expected behavior) | N/A | No action |
| Unknown/new failure pattern | Test automation lead | #test-automation | Next business day |

**On-call rotation:** [Link to PagerDuty schedule or Google Doc]

**Test automation lead:** @test-lead-username (Slack)

## Contacts

- **Dev Team Lead:** @dev-lead (Slack) / dev-lead@example.com
- **QA Lead:** @qa-lead (Slack) / qa-lead@example.com
- **On-Call:** PagerDuty escalation policy "Production Alerts"

## Runbook Maintenance

**Last updated:** 2026-02-16 (Phase 5 deployment)

**Review schedule:** After every major incident or quarterly (whichever comes first)

**Owner:** Test Automation Team
```

**Source:** Synthesized from [incident.io runbook guide](https://incident.io/blog/automated-runbook-guide), [Rootly runbook templates](https://rootly.com/incident-response/runbooks), and operational best practices showing 30-50% MTTR reduction with structured runbooks.

### Environment Variable Documentation Pattern

**In `.env.example`:**
```bash
# REQUIRED: Base URL for cooked.com
BASE_URL=https://cooked.com

# REQUIRED: Test user credentials (get from team lead)
TEST_USER_EMAIL=
TEST_USER_PASSWORD=

# OPTIONAL: Slack webhook for failure notifications
# Create at: https://api.slack.com/messaging/webhooks
# Leave empty to skip Slack notifications (script will log warning and continue)
SLACK_WEBHOOK_URL=

# OPTIONAL: Display mode (set to "false" for headed mode)
HEADLESS=true
```

**In README:**
```markdown
## Configuration

1. Copy `.env.example` to `.env`
2. Fill in REQUIRED values (marked in `.env.example`)
3. Optional values have defaults or can be left empty

**Where to get credentials:**
- `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`: Ask @team-lead in Slack
- `SLACK_WEBHOOK_URL`: Create at https://api.slack.com/messaging/webhooks (optional for local dev)
```

**Why:** Keeps single source of truth in `.env.example`, README provides context and access instructions.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Long prose documentation | Scannable checklists and tables | ~2022 (DevOps runbook shift) | Operations teams can triage 50% faster |
| Separate wiki for docs | Docs in repo (docs/ folder) | ~2020 (docs-as-code movement) | Docs versioned with code, stay in sync |
| Manual code snippets in docs | Link to actual code files | ~2021 (reduce maintenance) | Docs don't drift from reality |
| Generic troubleshooting | Specific error → specific solution | ~2023 (observability era) | Reduced mean time to resolution (MTTR) |
| All alerts are urgent | Severity levels + consecutive failures | ~2024 (alert fatigue solutions) | Reduced alert noise, better signal/noise ratio |

**Deprecated/outdated:**
- **Wiki-based documentation:** GitHub wikis separate from code, hard to version control
- **Word docs / Google Docs for runbooks:** Not version controlled, don't track changes, can't review in PRs
- **No severity levels on alerts:** Leads to alert fatigue; modern systems use severity + thresholds
- **"Read the code" as documentation:** Doesn't scale; onboarding takes days instead of hours

## Open Questions

1. **Runbook review cadence**
   - What we know: Runbooks should be reviewed after major incidents and quarterly
   - What's unclear: Who owns the review process? How to enforce quarterly reviews?
   - Recommendation: Add calendar reminder for QA lead to review runbook quarterly; update after each major incident

2. **Test user credential rotation**
   - What we know: Tests use `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` from env vars
   - What's unclear: How often do credentials rotate? Who manages them?
   - Recommendation: Document credential rotation policy in README; use GitHub Secrets for CI

3. **On-call rotation**
   - What we know: Runbook references on-call engineer for critical failures
   - What's unclear: Does an on-call rotation exist? Is PagerDuty configured?
   - Recommendation: If no on-call exists, replace escalation with "notify #dev-team immediately"

4. **Slack channel for alerts**
   - What we know: Alerts sent to `SLACK_WEBHOOK_URL`
   - What's unclear: Which channel receives alerts? Who monitors it?
   - Recommendation: Document in runbook and README where alerts appear, ensure channel is monitored

## Sources

### Primary (HIGH confidence)

- Playwright Official Docs - Best Practices: https://playwright.dev/docs/best-practices
- Playwright Official Docs - Locators: https://playwright.dev/docs/locators
- Playwright Official Docs - Running Tests: https://playwright.dev/docs/running-tests
- GitHub - Playwright Repository README: https://github.com/microsoft/playwright/blob/main/README.md
- GitHub - SkeltonThatcher Run Book Template: https://github.com/SkeltonThatcher/run-book-template

### Secondary (MEDIUM confidence)

- BrowserStack - 15 Best Practices for Playwright Testing in 2026: https://www.browserstack.com/guide/playwright-best-practices
- BrowserStack - Playwright Selector Best Practices in 2026: https://www.browserstack.com/guide/playwright-selectors-best-practices
- BrowserStack - How to Detect and Avoid Playwright Flaky Tests in 2026: https://www.browserstack.com/guide/playwright-flaky-tests
- incident.io - Automated Runbook Guide: https://incident.io/blog/automated-runbook-guide
- Rootly - Incident Response Runbooks Guide: https://rootly.com/incident-response/runbooks
- Better Stack - Avoiding Flaky Tests in Playwright: https://betterstack.com/community/guides/testing/avoid-flaky-playwright-tests/
- Better Stack - 9 Playwright Best Practices and Pitfalls: https://betterstack.com/community/guides/testing/playwright-best-practices/
- Oxylabs - 9 Playwright Best Practices: https://oxylabs.io/blog/playwright-best-practices
- Medium - Playwright Test Framework Structure Best Practices: https://medium.com/@divyakandpal93/playwright-test-framework-structure-best-practices-for-scalability-eddf6232593d
- TestDino - The Complete Guide to Mastering Playwright Testing [2026]: https://testdino.com/blog/playwright-skill/
- TestDino - Playwright Debugging Guide: https://testdino.com/blog/playwright-debugging-guide/
- AIMultiple - Test Automation Documentation with Best Practices in 2026: https://research.aimultiple.com/test-automation-documentation/
- River - Developer Onboarding Guide Template (2026): https://rivereditor.com/blogs/write-developer-onboarding-guide-30-days
- Port.io - Ultimate Developer Onboarding Checklist for 2024: https://www.port.io/blog/developer-onboarding-checklist

### Tertiary (LOW confidence)

- PixelQA - Playwright Guide 2026: https://www.pixelqa.com/blog/post/playwright-guide-installation-framework-structure-best-practices-ci-cd-setup
- Prometheus Operator Runbooks: https://github.com/prometheus-operator/runbooks

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Markdown is universal, no libraries needed
- Architecture: HIGH - README and runbook patterns well-established in industry
- Pitfalls: HIGH - Documentation drift, alert fatigue, missing troubleshooting are proven issues with known solutions

**Research date:** 2026-02-16
**Valid until:** 60 days (2026-04-16) - Documentation best practices are stable; review if Playwright releases major version

**Research sources:** 3 official Playwright docs, 2 GitHub repositories (Microsoft, SkeltonThatcher), 15+ industry best practice guides from BrowserStack, incident.io, Better Stack, and developer onboarding research. All sources verified current as of 2026.
