# cooked-synthetic-monitor

## What This Is

A synthetic monitoring tool that runs automated Playwright tests against cooked.com (a full-suite online casino) on a recurring schedule. It validates critical user journeys — lobby browsing, game launching, registration, login, deposits, chat, tipping, and the Swapped.com crypto buy flow — and alerts the team via Slack/email when something breaks. Built as a standalone GitHub repo with GitHub Actions for scheduling.

## Core Value

Detect breakages in key user flows on cooked.com before real users hit them, with fast alerts and actionable failure artifacts.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Synthetic tests cover critical casino user journeys (lobby, games, auth, deposits, chat, tipping, crypto)
- [ ] Tests run on schedule (every 30 min), on push to main, and on-demand via workflow_dispatch
- [ ] Slack alerting on failure with failing test names and GitHub Actions run link
- [ ] Optional email alerting via SMTP env vars
- [ ] Failed runs store screenshots, video, and Playwright traces as GitHub Actions artifacts
- [ ] JSON summary report per run (timestamp, SHA, test name, pass/fail, duration, error)
- [ ] Pass/fail history is trackable over time via artifacts and summaries
- [ ] Tests are reliable: explicit waits, stable selectors, retries for flaky steps
- [ ] No real purchases or destructive actions — all conversion flows stop before confirmation
- [ ] Headless by default, headed mode available locally
- [ ] All secrets/config via environment variables
- [ ] Clear docs: README (setup, usage, adding tests) + RUNBOOK (alert triage)

### Out of Scope

- Exhaustive test coverage — this is smoke/regression level, not a full QA suite
- Real money transactions — all flows stop before payment confirmation
- Mobile app testing — web only
- Performance/load testing — functional correctness only
- Test user provisioning — assumes test credentials exist

## Context

**Site:** cooked.com — online casino offering slots, table games, live dealer, and sportsbook. Has user accounts with email/password login. Integrates with Swapped.com for crypto purchases. Has social features including chat (WebSocket-based) and tipping.

**Known fragile areas (frequent breakpoints):**
- Game launches — games fail to load, iframe issues
- Lobby/navigation — categories, filters, search break
- Chat WebSocket — connection reliability
- "Latest and Greatest" messages — promotional/news feed display
- Registration flow
- Swapped.com buy crypto flow — crypto purchase integration
- Tipping functionality

**Selector strategy:** Prefer `data-testid` attributes. If site doesn't have them yet, use resilient fallbacks (role-based, text-based) and document a plan to add `data-testid` to critical elements.

**Site structure:** Tests will be written with TODO selectors where live site inspection is needed, with clear notes on how to update them.

## Constraints

- **Tech stack**: Playwright with TypeScript — non-negotiable
- **CI/CD**: GitHub Actions — scheduling, artifacts, caching
- **Safety**: No real purchases, no destructive actions, no real money movement
- **Secrets**: All credentials and config via environment variables (BASE_URL, SLACK_WEBHOOK_URL, ALERT_EMAIL_TO, ALERT_EMAIL_FROM, SMTP settings, TEST_USER_EMAIL, TEST_USER_PASSWORD)
- **Reliability**: Must avoid flakiness — explicit waits, retries, stable selectors

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Playwright over Cypress | Better cross-browser support, native async, built-in trace viewer | — Pending |
| GitHub Actions for scheduling | Already using GitHub, native cron support, free tier sufficient | — Pending |
| JSON summary reports | Machine-readable, easy to aggregate for trend analysis | — Pending |
| Stop-before-payment pattern | Safety — no real transactions in monitoring | — Pending |

---
*Last updated: 2026-02-15 after initialization*
