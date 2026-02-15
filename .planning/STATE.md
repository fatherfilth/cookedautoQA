# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** Detect breakages in key user flows on cooked.com before real users hit them, with fast alerts and actionable failure artifacts.
**Current focus:** Phase 3 - Social & Live Features

## Current Position

Phase: 3 of 6 (Social & Live Features)
Plan: 1 of 2 (completed)
Status: In Progress
Last activity: 2026-02-15 — Completed 03-01-PLAN.md (Chat WebSocket and Message Tests)

Progress: [█████░░░░░] 55%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 2.3 minutes
- Total execution time: 0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 - Foundation & Test Infrastructure | 2 | 5 min | 2.5 min |
| 02 - Critical Path Tests | 3 | 7.4 min | 2.5 min |
| 03 - Social & Live Features | 1 | 2.0 min | 2.0 min |

**Recent Trend:**
- Last 5 plans: 01-02 (2 min), 02-01 (2 min), 02-02 (3 min), 02-03 (2.4 min), 03-01 (2.0 min)
- Trend: Consistent velocity

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Playwright chosen over Cypress for better cross-browser support and iframe handling
- Phase 1: GitHub Actions for scheduling (already using GitHub, native cron support, free tier sufficient)
- Phase 1: Stop-before-payment pattern for safety (no real transactions in monitoring)
- 01-01: ESM modules instead of CommonJS (modern standard, better tree-shaking)
- 01-01: Chromium-only browser testing (monitoring doesn't need cross-browser matrix)
- 01-01: Artifacts on failure only (reduces storage, aligns with monitoring use case)
- 01-01: Retry strategy 1 locally, 2 in CI (balance flake resilience vs feedback speed)
- 01-01: TypeScript strict mode (catch errors at compile time)
- [Phase 01]: Role-based selectors with data-testid fallback using .or() chains for stable test automation
- [Phase 01]: BasePage with retry-enabled navigation (3 attempts) and explicit wait helpers (no networkidle)
- [Phase 02]: Navigation tests validate content loaded (heading visible), not just URL changes
- [Phase 02]: Search tests validate results count > 0 and navigation to detail page works
- [Phase 02-critical-path-tests]: Use storageState API for session validation (more reliable than manual cookie inspection)
- [Phase 02-critical-path-tests]: Enforce stop-before-payment pattern in registration test (prevents account creation)
- [Phase 02-02]: Environment-based game configuration with placeholder defaults (actual game IDs set after live site inspection)
- [Phase 02-02]: Broad iframe content selector until provider-specific patterns documented (canvas, [data-game-state], .game-container, body)
- [Phase 02-02]: FrameLocator with compound CSS selector instead of .or() method (API limitation workaround)
- [Phase 03]: WebSocket listener must be set up BEFORE page navigation (connections establish during load)
- [Phase 03]: Use DOM-based assertions (toBeVisible, textContent) not WebSocket frame payload inspection for chat tests
- [Phase 03]: Tipping flow locators follow stop-before-payment pattern (DO NOT CLICK submitTipButton)

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 4 (Crypto Integration):**
- Wallet automation strategy unclear — need to validate if cooked.com uses MetaMask, WalletConnect, or other provider before choosing testing approach (Synpress vs mocking)

**Phase 5 (CI/CD):**
- GitHub Actions minutes usage may exceed free tier (2000 min/month) with 30-minute schedule if test suite runs >3 minutes — may need to reduce frequency or use tag-based selective execution

**Phase 2 (Critical Path):**
- Actual game provider iframe URLs and selectors unknown — need to inspect production site to document iframe src patterns and "game ready" indicators per provider

**Phase 3 (Social & Live Features):**
- Chat page path unknown (/chat or /live-chat) - requires live site inspection
- WebSocket URL pattern needs refinement after inspecting DevTools Network tab
- Chat container and message selectors are broad fallback chains - need tightening after live site inspection
- Tipping modal structure assumed based on common patterns - needs validation against production

## Session Continuity

Last session: 2026-02-15 (plan execution)
Stopped at: Completed 03-01-PLAN.md - Chat WebSocket and Message Tests
Resume file: None

---
*State initialized: 2026-02-15*
*Last updated: 2026-02-15*
