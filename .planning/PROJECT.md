# cooked-synthetic-monitor

## What This Is

A synthetic monitoring system that runs automated Playwright tests against cooked.com (a full-suite online casino) on a 30-minute schedule via GitHub Actions. Validates critical user journeys — lobby browsing, game launching, registration, login, chat, tipping, crypto buy flow, and betting activity — with full account verification, Slack alerting, and git-tracked test result history.

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
- ✓ Per-run registration with disposable accounts for authenticated sessions — v1.1
- ✓ Playwright setup project saves storageState for reuse across all tests — v1.1
- ✓ All 8 auth-gated tests unlocked (game, crypto, tipping, login, session) — v1.1
- ✓ 17/17 tests passing with 0 skipped in CI — v1.1
- ✓ Auth setup completes details verification form (name, DOB, address) after registration — v1.2
- ✓ Game launch tests assert actual game iframe (not modal fallback) for verified accounts — v1.2
- ✓ Betting activity tests for All Bets and High Rollers tabs — v1.2
- ✓ Test result summaries committed to git after each CI run for permanent history — v1.2
- ✓ 20/20 tests passing with 0 skipped in CI — v1.2

### Active

(No active milestone — planning next)

### Future

- [ ] Email alerting via SMTP env vars
- [ ] Alert deduplication — suppress repeated alerts for same failing test within time window
- [ ] Game provider health matrix — aggregate launch success rates by provider
- [ ] Response time metrics collection and trending

### Out of Scope

- Exhaustive test coverage — this is smoke/regression level, not a full QA suite
- Real money transactions — all flows stop before payment confirmation
- Mobile app testing — web only
- Performance/load testing — functional correctness only
- Test user provisioning — v1.1 added per-run disposable registration (no manual provisioning needed)
- AI self-healing tests — masks real issues, creates false confidence
- Custom dashboard UI — use GitHub Actions UI + existing observability tools
- Sub-minute monitoring — alert fatigue, unnecessary load on production
- Multi-location monitoring — single region sufficient for initial release
- Sportsbook monitoring — not a fragile area currently

## Context

Shipped v1.2 with TypeScript across 90+ files.
Tech stack: Playwright, TypeScript (ESM), GitHub Actions, Node.js.
Page Object Model with BasePage providing retry-enabled navigation and explicit waits.
Severity-based alerting: CRITICAL (game launch, login, registration, crypto) vs WARNING (navigation, lobby, search, promotions, betting).
Consecutive failure threshold (2+) reduces noise from transient issues.
Per-run registration with disposable `smoketest+{timestamp}@totempowered.com` accounts — storageState shared across all tests.
Auth setup completes registration + details verification form before saving storageState.
20/20 tests passing, 0 skipped — full auth + verification coverage achieved.
Game launch tests assert real iframe presence (modal fallback removed after verification).
Wallet button (`getByRole('button', { name: /wallet/i })`) is the reliable auth indicator.
Test result summaries committed to `results-history/` after every CI run for git-tracked history.

**Live site patterns (2026-02-16):**
- Auth dialog opened via nav button click (not URL params)
- Game URLs use `/games/all/{slug}` pattern
- Chat uses mobile viewport with `BottomNavigationChat` component
- Terms checkbox: custom `button[role=checkbox]#tos-checkbox` (not native input)
- Verification form at `/account/settings?account_tab=verification&verification_modal=details` (name, DOB, address)
- Betting activity table at bottom of pages with "All Bets" and "High Rollers" tabs

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

| Per-run registration with disposable emails | Avoids manual credential management, each run is self-contained | ✓ Good — eliminates credential provisioning |
| storageState for session reuse | Playwright convention, single registration shared across all tests | ✓ Good — efficient, no redundant logins |
| ID selectors for custom components | Strict mode safe, precise targeting | ✓ Good — fixed checkbox strict mode violation |
| Direct assertions over conditional skips | Auth-dependent elements should always be visible when authenticated | ✓ Good — catches real regressions instead of masking failures |

| Fake data for verification form | Test accounts are disposable — real identity not needed | ✓ Good — verification completes reliably with hardcoded data |
| Accept game modal as valid state | New accounts hit "Set your details" — both modal and iframe prove page works | ✓ Good (superseded: modal fallback removed in v1.2 after verification added) |
| Remove modal fallback from game tests | Verification now complete — assert iframe-only for stronger regression detection | ✓ Good — catches verification regressions immediately |
| Broad CSS selectors for betting rows | DOM structure unknown — flexible pattern needed | ✓ Good — tests pass against live site |
| ISO timestamps with hyphens for filenames | Filesystem safety (Windows/Unix compatible), human-readable, sortable | ✓ Good — clean results-history/ directory |
| Run notify-slack on always() | Ensures summary.json generated on both pass and fail for complete history | ✓ Good — enables result commits on every run |
| Graceful exit 0 on commit-results failures | Prevents result commits from breaking CI pipeline on edge cases | ✓ Good — CI resilience maintained |

---
*Last updated: 2026-02-16 after v1.2 milestone*
