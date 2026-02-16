# cooked-synthetic-monitor

## What This Is

A synthetic monitoring system that runs automated Playwright tests against cooked.com (a full-suite online casino) on a 30-minute schedule via GitHub Actions. Validates critical user journeys — lobby browsing, game launching, registration, login, chat, tipping, and the Swapped.com crypto buy flow — and alerts the team via Slack when something breaks, with severity-based logic and consecutive failure thresholds to reduce noise.

## Core Value

Detect breakages in key user flows on cooked.com before real users hit them, with fast alerts and actionable failure artifacts.

## Requirements

### Validated

- ✓ Synthetic tests cover critical casino user journeys (lobby, games, auth, chat, tipping, crypto) — v1.0
- ✓ Tests run on schedule (every 30 min), on push to main, and on-demand via workflow_dispatch — v1.0
- ✓ Slack alerting on failure with failing test names and GitHub Actions run link — v1.0
- ✓ Failed runs store screenshots, video, and Playwright traces as GitHub Actions artifacts — v1.0
- ✓ JSON summary report per run (timestamp, SHA, test name, pass/fail, duration, error) — v1.0
- ✓ Tests are reliable: explicit waits, stable selectors, retries for flaky steps — v1.0
- ✓ No real purchases or destructive actions — all conversion flows stop before confirmation — v1.0
- ✓ Headless by default, headed mode available locally — v1.0
- ✓ All secrets/config via environment variables — v1.0
- ✓ Clear docs: README (setup, usage, adding tests) + RUNBOOK (alert triage) — v1.0

### Active

- [ ] Email alerting via SMTP env vars
- [ ] Alert deduplication — suppress repeated alerts for same failing test within time window
- [ ] Game provider health matrix — aggregate launch success rates by provider
- [ ] Response time metrics collection and trending
- [ ] Tighten selectors after live site inspection (currently using broad fallback chains)

### Out of Scope

- Exhaustive test coverage — this is smoke/regression level, not a full QA suite
- Real money transactions — all flows stop before payment confirmation
- Mobile app testing — web only
- Performance/load testing — functional correctness only
- Test user provisioning — assumes test credentials exist
- AI self-healing tests — masks real issues, creates false confidence
- Custom dashboard UI — use GitHub Actions UI + existing observability tools
- Sub-minute monitoring — alert fatigue, unnecessary load on production
- Multi-location monitoring — single region sufficient for initial release
- Sportsbook monitoring — not a fragile area currently

## Context

Shipped v1.0 with 1,284 LOC TypeScript across 86 files.
Tech stack: Playwright, TypeScript (ESM), GitHub Actions, Node.js.
Page Object Model with BasePage providing retry-enabled navigation and explicit waits.
Severity-based alerting: CRITICAL (game launch, login, registration, crypto) vs WARNING (navigation, lobby, search, promotions).
Consecutive failure threshold (2+) reduces noise from transient issues.

**Known items requiring live site inspection:**
- Game provider iframe selectors use broad fallbacks (need provider-specific patterns)
- Chat page path, WebSocket URL patterns, and message selectors need tightening
- Tipping modal structure assumed from common patterns
- Promotional content location needs verification
- Wallet automation strategy for crypto flow needs validation (MetaMask vs WalletConnect)

## Constraints

- **Tech stack**: Playwright with TypeScript — non-negotiable
- **CI/CD**: GitHub Actions — scheduling, artifacts, caching
- **Safety**: No real purchases, no destructive actions, no real money movement
- **Secrets**: All credentials and config via environment variables
- **Reliability**: Must avoid flakiness — explicit waits, retries, stable selectors

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Playwright over Cypress | Better cross-browser support, native async, built-in trace viewer | ✓ Good — iframe handling and WebSocket testing worked well |
| GitHub Actions for scheduling | Already using GitHub, native cron support, free tier sufficient | ✓ Good — 30-min schedule with caching keeps CI fast |
| JSON summary reports | Machine-readable, easy to aggregate for trend analysis | ✓ Good — enables future dashboarding |
| Stop-before-payment pattern | Safety — no real transactions in monitoring | ✓ Good — consistently applied across auth, tipping, crypto |
| ESM modules over CommonJS | Modern standard, better tree-shaking | ✓ Good — clean import/export throughout |
| Chromium-only browser testing | Monitoring doesn't need cross-browser matrix | ✓ Good — faster CI, sufficient for production monitoring |
| Artifacts on failure only | Reduces storage, aligns with monitoring use case | ✓ Good — clean artifact store |
| Retry 1 locally, 2 in CI | Balance flake resilience vs feedback speed | ✓ Good |
| Role-based selectors with data-testid fallback | Resilient to refactoring while maintaining accessibility | ⚠️ Revisit — many selectors still use broad fallbacks pending live site inspection |
| Single alerting script | Keeps CI simple — parsing, tracking, alerting in one file | ✓ Good — easy to maintain |
| ALERT_THRESHOLD = 2 consecutive failures | Reduces noise while alerting quickly | ✓ Good — prevents single-flake alerts |
| Full test suite on all CI triggers | Maximum coverage (not just @critical) | ⚠️ Revisit — may need tag-based selective execution if CI minutes exceed free tier |

---
*Last updated: 2026-02-16 after v1.0 milestone*
