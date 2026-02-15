# Requirements: cooked-synthetic-monitor

**Defined:** 2026-02-15
**Core Value:** Detect breakages in key user flows on cooked.com before real users hit them, with fast alerts and actionable failure artifacts.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [ ] **INFRA-01**: Project scaffolded with package.json, tsconfig.json, and Playwright config
- [ ] **INFRA-02**: Folder structure follows convention (tests/smoke/, tests/helpers/, scripts/, docs/)
- [ ] **INFRA-03**: Central test helper provides consistent navigation, configurable timeouts, and auto-retry for flaky steps
- [ ] **INFRA-04**: Screenshot, video, and trace capture on test failure only (not on success)
- [ ] **INFRA-05**: Page Object Model implemented for key pages (lobby, login, registration, game detail, account)
- [ ] **INFRA-06**: All secrets and config managed via environment variables (BASE_URL, SLACK_WEBHOOK_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD)
- [ ] **INFRA-07**: Headless by default, headed mode available via env var for local debugging

### Smoke Tests

- [ ] **SMOKE-01**: Homepage loads and key hero element is present
- [ ] **SMOKE-02**: Top navigation works — user can reach at least 2 major destinations
- [ ] **SMOKE-03**: Lobby page loads with game categories visible
- [ ] **SMOKE-04**: Search flow works — search term returns results, user can open a result

### Game Monitoring

- [ ] **GAME-01**: Slot game launches successfully (iframe loads and game initializes)
- [ ] **GAME-02**: Table game launches successfully (iframe loads and game initializes)
- [ ] **GAME-03**: Live dealer game launches successfully (iframe loads and game initializes)
- [ ] **GAME-04**: Game launch test uses representative game from each category with configurable game IDs

### Auth Tests

- [ ] **AUTH-01**: User can log in with email/password and reach account page
- [ ] **AUTH-02**: Login session persists across page navigation
- [ ] **AUTH-03**: Registration flow completes step-by-step (stop before real account creation or use test mode)

### Social & Live Features

- [ ] **SOCIAL-01**: Chat WebSocket connection establishes successfully
- [ ] **SOCIAL-02**: Chat messages are visible in the chat interface
- [ ] **SOCIAL-03**: Tipping flow works end-to-end (initiate tip → confirm → success state)
- [ ] **SOCIAL-04**: "Latest and Greatest" messages/promotions display on the appropriate page

### Crypto Integration

- [ ] **CRYPTO-01**: Swapped.com buy crypto flow is reachable and loads correctly
- [ ] **CRYPTO-02**: Crypto buy flow progresses through steps (stop before real purchase)

### Reliability

- [ ] **RELY-01**: Retry logic retries failed steps 2-3 times before marking as failure
- [ ] **RELY-02**: Stable selector strategy documented — data-testid preferred, fallback selectors for pages without them
- [ ] **RELY-03**: All waits are explicit (waitForSelector, waitForResponse) — no networkidle or arbitrary sleep
- [ ] **RELY-04**: Tests categorized by criticality (CRITICAL, WARNING) for severity-based alerting

### Alerting

- [ ] **ALERT-01**: Slack notification sent on test failure with failing test names and GitHub Actions run link
- [ ] **ALERT-02**: Slack message includes links to failure artifacts (screenshots, traces)
- [ ] **ALERT-03**: Alerts are severity-based — CRITICAL flows (game launch, login, registration) vs WARNING flows (tipping, Latest & Greatest)
- [ ] **ALERT-04**: Consecutive failure threshold — require 2+ failures before alerting to reduce noise

### Reporting

- [ ] **REPORT-01**: JSON summary generated per run (timestamp, commit SHA, test name, pass/fail, duration, error summary)
- [ ] **REPORT-02**: Playwright HTML report generated and uploaded as artifact

### CI/CD

- [ ] **CICD-01**: GitHub Actions workflow runs on schedule (cron every 30 minutes)
- [ ] **CICD-02**: GitHub Actions workflow runs on push to main
- [ ] **CICD-03**: GitHub Actions workflow runs on workflow_dispatch (manual trigger)
- [ ] **CICD-04**: Playwright report, traces, videos, and screenshots uploaded as GitHub Actions artifacts
- [ ] **CICD-05**: Node modules cached for faster runs
- [ ] **CICD-06**: Concurrency control prevents overlapping scheduled runs
- [ ] **CICD-07**: Reasonable timeouts set at workflow and test level

### Documentation

- [ ] **DOCS-01**: README covers: how to run locally, how to set env vars, how to add new tests, troubleshooting flakiness
- [ ] **DOCS-02**: docs/RUNBOOK.md provides alert triage checklist (what to check, escalation paths, common false positives)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Alerting

- **ALERT-05**: Email alerting via SMTP env vars (ALERT_EMAIL_TO, ALERT_EMAIL_FROM, SMTP settings)
- **ALERT-06**: Alert deduplication — suppress repeated alerts for same failing test within time window

### Extended Monitoring

- **GAME-05**: Game provider health matrix — aggregate launch success rates by provider
- **GAME-06**: Sportsbook line availability — verify betting odds load and update
- **SOCIAL-05**: Live dealer video stream validation
- **MONITOR-01**: HTTP/API endpoint health checks independent of browser tests
- **MONITOR-02**: SSL/TLS certificate expiration monitoring
- **MONITOR-03**: Response time metrics collection and trending
- **MONITOR-04**: Uptime percentage tracking and SLA reporting

### Infrastructure

- **INFRA-08**: Multi-location monitoring (run from multiple geographic regions)
- **INFRA-09**: Lobby performance benchmarking (Core Web Vitals via Lighthouse)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real money transactions | Safety — all flows stop before payment confirmation |
| Exhaustive game testing | Monitoring = smoke level; test representative games, not all 1000+ |
| AI self-healing tests | Masks real issues, creates false confidence |
| Test recording / no-code editor | Brittle, unmaintainable; code-first approach preferred |
| Custom dashboard UI | Use GitHub Actions UI + existing observability tools |
| Sub-minute monitoring | Alert fatigue, unnecessary load on production |
| Mobile app testing | Web-only scope |
| Performance/load testing | Functional correctness only |
| Monitoring dev/staging | Production only; dev/staging are unstable by design |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Pending |
| INFRA-07 | Phase 1 | Pending |
| RELY-01 | Phase 1 | Pending |
| RELY-02 | Phase 1 | Pending |
| RELY-03 | Phase 1 | Pending |
| RELY-04 | Phase 1 | Pending |
| SMOKE-01 | Phase 2 | Pending |
| SMOKE-02 | Phase 2 | Pending |
| SMOKE-03 | Phase 2 | Pending |
| SMOKE-04 | Phase 2 | Pending |
| GAME-01 | Phase 2 | Pending |
| GAME-02 | Phase 2 | Pending |
| GAME-03 | Phase 2 | Pending |
| GAME-04 | Phase 2 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| SOCIAL-01 | Phase 3 | Pending |
| SOCIAL-02 | Phase 3 | Pending |
| SOCIAL-03 | Phase 3 | Pending |
| SOCIAL-04 | Phase 3 | Pending |
| CRYPTO-01 | Phase 4 | Pending |
| CRYPTO-02 | Phase 4 | Pending |
| ALERT-01 | Phase 5 | Pending |
| ALERT-02 | Phase 5 | Pending |
| ALERT-03 | Phase 5 | Pending |
| ALERT-04 | Phase 5 | Pending |
| REPORT-01 | Phase 5 | Pending |
| REPORT-02 | Phase 5 | Pending |
| CICD-01 | Phase 5 | Pending |
| CICD-02 | Phase 5 | Pending |
| CICD-03 | Phase 5 | Pending |
| CICD-04 | Phase 5 | Pending |
| CICD-05 | Phase 5 | Pending |
| CICD-06 | Phase 5 | Pending |
| CICD-07 | Phase 5 | Pending |
| DOCS-01 | Phase 6 | Pending |
| DOCS-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43/43 ✓
- Unmapped: 0

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after roadmap creation*
