---
phase: 04-crypto-integration
plan: 01
subsystem: crypto-monitoring
tags: [crypto, swapped-integration, iframe-testing, monitoring]
dependency_graph:
  requires: [phase-03-social-live-features]
  provides: [CRYPTO-01, CRYPTO-02, SwappedIntegrationPage, cryptoConfig]
  affects: [test-suite-coverage, ci-readiness]
tech_stack:
  added: [Swapped.com-iframe-integration]
  patterns: [frameLocator-compound-selector, stop-before-purchase, environment-based-config]
key_files:
  created:
    - tests/helpers/crypto-config.ts
    - tests/pages/SwappedIntegrationPage.ts
    - tests/crypto/swapped-buy-flow.spec.ts
  modified:
    - .env.example
decisions:
  - summary: "Use FrameLocator with compound CSS selector for iframe content interaction (not .or() method)"
    rationale: "Playwright FrameLocator API limitation workaround per Phase 2 decision"
  - summary: "Stop-before-purchase enforcement in CRYPTO-02 (buy button verified but never clicked)"
    rationale: "Prevents real crypto transactions in monitoring tests per PROJECT.md safety requirements"
  - summary: "Broad fallback selectors for all iframe content elements until live site inspection"
    rationale: "Swapped.com widget structure unknown — placeholders allow test creation before production access"
  - summary: "Rely on Playwright's default per-test BrowserContext for wallet state isolation"
    rationale: "No custom isolation logic needed — Playwright default prevents state pollution between tests"
metrics:
  duration_minutes: 2.2
  tasks_completed: 2
  files_created: 3
  files_modified: 1
  commits: 2
  tests_added: 2
  completed_date: 2026-02-15
---

# Phase 04 Plan 01: Swapped.com Crypto Buy Flow Tests Summary

**One-liner:** Swapped.com crypto buy iframe integration tests (CRYPTO-01 and CRYPTO-02) with stop-before-purchase enforcement and environment-based configuration.

## Objective Achieved

Created SwappedIntegrationPage page object and crypto buy flow tests that validate the Swapped.com iframe loads on cooked.com and the purchase flow progresses through steps (amount entry, payment method selection, buy button ready), stopping before any real transaction.

This completes the final test coverage requirements (CRYPTO-01 and CRYPTO-02) identified in Phase 4 research before CI/CD automation (Phase 5). The Swapped.com crypto buy flow is a known fragile area per PROJECT.md — these monitoring tests will detect breakages in the crypto on-ramp integration.

## What Was Built

### Test Coverage

**CRYPTO-01: Swapped.com crypto buy iframe loads on cooked.com**
- Validates crypto buy page is accessible
- Confirms Swapped.com iframe element exists in DOM with valid src (not empty, not about:blank)
- Verifies iframe content loaded with interactive elements (input, button, or form visible)
- Tagged: `@critical @crypto`

**CRYPTO-02: Crypto buy flow progresses through steps and stops before purchase**
- Validates flow progression: navigate → enter amount → select payment method → buy button ready
- Enforces stop-before-purchase pattern: buy button verified visible and enabled but NEVER clicked
- Uses `test.step()` for multi-stage flow reporting (4 steps)
- Tagged: `@critical @crypto`

### Page Objects

**SwappedIntegrationPage** (`tests/pages/SwappedIntegrationPage.ts`)
- Extends `BasePage` following established POM patterns
- Iframe-aware locators:
  - `swappedIframe`: Locator for iframe element (visibility check only)
  - `swappedFrame`: FrameLocator for iframe content interaction (compound CSS selector)
  - `amountInput`: Amount entry field within iframe
  - `paymentMethodButton`: Payment method selection within iframe
  - `buyButton`: Buy/Continue button within iframe (DO NOT CLICK)
- Methods:
  - `enterAmount(amount: string)`: Fill amount input
  - `selectPaymentMethod()`: Click first available payment option
- Overrides `waitForReady()`: Ensures iframe element visible + iframe body content loaded (30s timeout for external widget)

### Configuration

**crypto-config.ts** (`tests/helpers/crypto-config.ts`)
- Environment-based configuration following game-config.ts pattern
- `buyPath`: Crypto buy page path (default `/crypto/buy` — TODO placeholder)
- `iframeSrcPattern`: Swapped.com iframe src detection pattern (default `connect.swapped.com` per Swapped.com docs)
- Uses `as const` for type safety

### Environment Variables

Updated `.env.example` with crypto section:
```env
# Crypto integration (Phase 4)
# Path to crypto buy page on cooked.com — inspect live site to confirm
CRYPTO_BUY_PATH=/crypto/buy
# Swapped.com iframe src pattern for detection
CRYPTO_IFRAME_SRC=connect.swapped.com
```

## Deviations from Plan

None — plan executed exactly as written.

All tasks completed as specified:
- Task 1: Created crypto-config.ts, SwappedIntegrationPage.ts, updated .env.example
- Task 2: Created swapped-buy-flow.spec.ts with CRYPTO-01 and CRYPTO-02 tests

## Implementation Details

### Pattern Consistency

**ESM Module Compliance:**
- All imports use `.js` extensions (per Phase 1 decision)

**Selector Strategy:**
- `.or()` fallback chains for page-level elements (swappedIframe)
- Compound CSS selector for FrameLocator (API limitation workaround per Phase 2 decision)
- Broad selectors with TODO comments for refinement after live site inspection

**Wait Strategy:**
- No `networkidle` or `waitForTimeout` usage (per Phase 1 decision)
- Explicit element visibility checks with appropriate timeouts
- 15s timeout for iframe element visibility
- 30s timeout for iframe content load (external widget)

**Stop-Before-Purchase Enforcement:**
- Buy button locator exists but clicking is explicitly prevented
- Test verifies button is visible and enabled, then stops
- Inline comment: "STOP HERE: Do NOT click buy button" in CRYPTO-02

**Test Structure:**
- `test.describe()` grouping for crypto tests
- `test.step()` for multi-stage flow reporting in CRYPTO-02 (4 steps)
- Tags: `@critical @crypto` for selective execution
- JSDoc file-level comment explaining test purpose and patterns

### Context Isolation

**Wallet State Pollution Prevention:**
- Playwright creates a new BrowserContext per test by default
- No custom isolation logic needed
- Each test runs with fresh browser state (no shared cookies, localStorage, or wallet connections)

### TODO Items for Live Site Inspection

All selectors are broad fallback chains until production inspection:
1. Crypto buy page path (currently `/crypto/buy` placeholder)
2. Swapped.com iframe src pattern (currently `connect.swapped.com` from docs)
3. Amount input selector (broad: number/text input with "amount" placeholder)
4. Payment method button selector (broad: Credit/Card text or testid)
5. Buy button selector (broad: Buy/Continue text or submit type)
6. Payment method selection validation (broad: aria-current/selected/active indicators)

## Success Criteria Validation

✅ CRYPTO-01: Test exists that navigates to crypto buy page, asserts Swapped.com iframe is visible with valid src, and confirms iframe content loaded with interactive elements

✅ CRYPTO-02: Test exists that enters amount, selects payment method, and verifies buy button is ready WITHOUT clicking it

✅ SwappedIntegrationPage page object extends BasePage with iframe-aware locators and methods

✅ Crypto config helper reads from environment variables with fallback defaults

✅ Browser context isolation confirmed by Playwright's default per-test context (no shared state)

✅ All patterns consistent with Phases 1-3 (POM, .or() chains, frameLocator, test.step(), stop-before-payment, ESM, no networkidle)

## Verification Results

**TypeScript Compilation:**
```bash
npx tsc --noEmit
# Exit code 0 — no errors
```

**Test Discovery:**
```bash
npx playwright test --grep @crypto --list
# Total: 2 tests in 1 file
# ✅ CRYPTO-01: Swapped.com crypto buy iframe loads on cooked.com
# ✅ CRYPTO-02: crypto buy flow progresses through steps and stops before purchase
```

**Pattern Compliance:**
- ✅ No `networkidle` or `waitForTimeout` usage in new files
- ✅ No `buyButton.click()` calls in spec file (stop-before-purchase enforced)
- ✅ SwappedIntegrationPage extends BasePage
- ✅ All imports use `.js` extensions
- ✅ .env.example has CRYPTO_BUY_PATH and CRYPTO_IFRAME_SRC documented
- ✅ All new locators use `.or()` chains or compound CSS selectors

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 2dec6eb | feat(04-01): create crypto config and SwappedIntegrationPage |
| 2 | f813e17 | test(04-01): add Swapped.com crypto buy flow tests |

## Next Steps

**Immediate (same phase):**
- No additional plans in Phase 4 — phase complete

**Phase 5 (CI/CD Automation):**
- Set up GitHub Actions workflow with 30-minute schedule
- Configure Slack alerting for test failures
- Implement tag-based selective execution (@critical, @crypto, @game, @social)
- Set up artifact retention strategy (screenshots/traces on failure only)
- Monitor GitHub Actions minutes usage (2000 min/month free tier)

**Production Readiness:**
- Inspect live cooked.com site to confirm crypto buy page path
- Refine all TODO selectors with actual Swapped.com iframe structure
- Update CRYPTO_BUY_PATH in .env after path confirmation
- Validate iframe src pattern matches production (connect.swapped.com)

## Self-Check

Verifying all claims in this summary:

**Created files exist:**
```bash
[ -f "tests/helpers/crypto-config.ts" ] && echo "FOUND: tests/helpers/crypto-config.ts"
[ -f "tests/pages/SwappedIntegrationPage.ts" ] && echo "FOUND: tests/pages/SwappedIntegrationPage.ts"
[ -f "tests/crypto/swapped-buy-flow.spec.ts" ] && echo "FOUND: tests/crypto/swapped-buy-flow.spec.ts"
```

**Commits exist:**
```bash
git log --oneline --all | grep -q "2dec6eb" && echo "FOUND: 2dec6eb"
git log --oneline --all | grep -q "f813e17" && echo "FOUND: f813e17"
```

**Key exports/imports:**
```bash
grep -q "export const cryptoConfig" tests/helpers/crypto-config.ts && echo "FOUND: cryptoConfig export"
grep -q "extends BasePage" tests/pages/SwappedIntegrationPage.ts && echo "FOUND: extends BasePage"
grep -q "import.*SwappedIntegrationPage" tests/crypto/swapped-buy-flow.spec.ts && echo "FOUND: SwappedIntegrationPage import"
```

## Self-Check: PASSED

All files created, commits exist, and key patterns verified.
