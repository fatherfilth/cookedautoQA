---
phase: 08-test-enablement
plan: 02
subsystem: test-suite
tags: [refactor, auth-integration, test-reliability]
dependency_graph:
  requires:
    - "07-01-SUMMARY.md: storageState auth setup"
  provides:
    - "Game launch tests assert iframe visibility (no skip fallback)"
    - "Crypto tests assert Swapped.com iframe loads (no skip fallback)"
    - "Tipping test asserts tip button clickable (no skip fallback)"
  affects:
    - "tests/game/slot-launch.spec.ts"
    - "tests/game/table-launch.spec.ts"
    - "tests/game/live-dealer-launch.spec.ts"
    - "tests/crypto/swapped-buy-flow.spec.ts"
    - "tests/social/tipping-flow.spec.ts"
tech_stack:
  added: []
  patterns:
    - "Direct assertion pattern: expect(element).toBeVisible() instead of conditional skip"
    - "Auth-dependent tests now fail on missing elements (correct regression detection)"
key_files:
  created: []
  modified:
    - path: "tests/game/slot-launch.spec.ts"
      lines_changed: 17
      purpose: "Removed conditional skips, added direct iframe visibility assertion"
    - path: "tests/game/table-launch.spec.ts"
      lines_changed: 17
      purpose: "Removed conditional skips, added direct iframe visibility assertion"
    - path: "tests/game/live-dealer-launch.spec.ts"
      lines_changed: 17
      purpose: "Removed conditional skips, added direct iframe visibility assertion"
    - path: "tests/crypto/swapped-buy-flow.spec.ts"
      lines_changed: 19
      purpose: "Removed try/catch skip wrappers and iframe visibility skip blocks"
    - path: "tests/social/tipping-flow.spec.ts"
      lines_changed: 5
      purpose: "Removed tip button visibility skip, direct click now fails if not authenticated"
decisions: []
metrics:
  duration: "155s"
  tasks_completed: 2
  files_modified: 5
  lines_removed: 85
  lines_added: 10
  net_change: -75
  tests_affected: 6
  completed_at: "2026-02-16T05:23:57Z"
---

# Phase 8 Plan 02: Remove Conditional Test Skips Summary

**One-liner:** Converted 6 auth-dependent tests (3 game, 2 crypto, 1 tipping) from graceful skip fallbacks to direct assertions that expect authenticated sessions and fail on missing elements.

## Objective Achieved

Removed conditional `test.skip()` directives from game launch, crypto, and tipping tests so they assert authenticated behavior rather than gracefully degrading to skip. With Phase 7's storageState providing authenticated sessions, auth-dependent UI elements SHOULD always be visible. The conditional skips masked real failures — if the iframe or tip button doesn't appear under an authenticated session, that's a genuine breakage we want to catch, not silently skip.

**Result:** Six test specs that assert auth-dependent elements are visible without skip fallbacks, ready to catch real regressions.

## Tasks Completed

### Task 1: Remove conditional skips from game launch tests

**Files modified:** `tests/game/slot-launch.spec.ts`, `tests/game/table-launch.spec.ts`, `tests/game/live-dealer-launch.spec.ts`

**Changes applied (per file):**
1. **Removed Promise.race wait block** (lines 18-21) that raced iframe visibility against raw timeout
2. **Removed iframe visibility skip block** (lines 23-27):
   - Old: Check `isVisible()`, skip if false
   - New: `await expect(gameIframe).toBeVisible({ timeout: 30_000 })`
3. **Removed iframe src skip block** (lines 30-35):
   - Old: Check `getAttribute('src')`, skip if empty
   - New: Direct assertion `expect(iframeSrc).toBeTruthy()` (failure if no src)
4. **Kept intact:** Game URL navigation, URL verification, iframe content assertion (canvas/game-container/body inside frameLocator), `@critical @game` tags
5. **Live dealer specific:** Kept dynamic slug discovery logic (lines 9-25) that finds a live game from `/games/live-casino`

**Net effect per file:** Removed ~17 lines (Promise.race + two skip blocks), replaced with 1 direct `toBeVisible` assertion.

**Commit:** `7755c49` - refactor(08-test-enablement): remove conditional skips from game launch tests

**Verification passed:**
- `npx tsc --noEmit` - all 3 files compile cleanly
- `npx playwright test --list` - all 3 tests listed
- `grep test.skip` - 0 matches in tests/game/

### Task 2: Remove conditional skips from crypto and tipping tests

**Files modified:** `tests/crypto/swapped-buy-flow.spec.ts`, `tests/social/tipping-flow.spec.ts`

**Changes for `tests/crypto/swapped-buy-flow.spec.ts`:**

**CRYPTO-01 test (iframe loads):**
1. Removed try/catch skip wrapper around `cryptoPage.open()` (lines 36-44):
   - Old: Wrap in try/catch, skip on error
   - New: Direct call `await cryptoPage.open()` - failures throw proper errors
2. Removed iframe visibility skip block (lines 48-52):
   - Old: Check `isVisible()`, skip if false
   - New: Assertion in `cryptoPage.open()` via `waitForReady()` (15s timeout)
3. Kept intact: src assertion and iframe content check

**CRYPTO-02 test (buy flow progression):**
1. Removed try/catch skip wrapper around `cryptoPage.open()` (lines 91-98)
2. Removed iframe visibility skip block (lines 101-105)
3. Kept intact: amount entry, payment method selection, buy button verification, stop-before-purchase pattern

**Changes for `tests/social/tipping-flow.spec.ts`:**
1. Removed tip button visibility skip (lines 23-27):
   - Old: Check `isVisible()`, skip if false
   - New: Direct call `await chatPage.clickTipButton()` - Playwright throws timeout if button not visible
2. Kept intact: mobile viewport setting, chat drawer opening, tip modal interaction, confirmation dialog, stop-before-payment pattern

**Additional:** Updated crypto test header comment to reflect auth requirement (not conditional skip).

**Commit:** `6620092` - refactor(08-test-enablement): remove conditional skips from crypto and tipping tests

**Verification passed:**
- `npx tsc --noEmit` - both files compile cleanly
- `npx playwright test --list` - all 3 tests listed (2 crypto + 1 tipping)
- `grep test.skip` - 0 matches in tests/crypto/ and tests/social/tipping-flow.spec.ts

## Overall Verification

1. **TypeScript compilation:** `npx tsc --noEmit` - all 5 files compile cleanly ✓
2. **Test listing:** `npx playwright test --list` - all 6 tests listed (3 game + 2 crypto + 1 tipping) ✓
3. **No conditional skips:** `grep test.skip` in game/, crypto/, social/tipping-flow.spec.ts - 0 matches ✓
4. **Game tests assert iframe:** All 3 game tests use `await expect(gameIframe).toBeVisible({ timeout: 30_000 })` ✓
5. **Crypto tests assert open:** Both crypto tests call `await cryptoPage.open()` without try/catch wrapper ✓
6. **Tipping test asserts click:** Tipping test calls `await chatPage.clickTipButton()` directly ✓

## Success Criteria Met

- [x] All 3 game launch tests assert iframe visible and has src (no skip fallback)
- [x] Both crypto tests assert Swapped.com iframe loads (no skip fallback)
- [x] Tipping test asserts tip button is clickable (no skip fallback)
- [x] All 5 files compile with TypeScript
- [x] All 6 tests appear in `playwright test --list` under chromium project

## Deviations from Plan

None - plan executed exactly as written.

## Impact Analysis

**Before (v1.0):** Tests gracefully skipped when auth-dependent elements weren't visible. Missing iframes/buttons indicated "probably needs auth" → skip. This masked real bugs.

**After (v1.1):** Tests expect authenticated session from Phase 7's storageState. Missing iframes/buttons → test failure. This is correct behavior - if game iframe doesn't load with valid auth, that's a regression.

**Behavior change:**
- **Unauthenticated runs:** Tests now FAIL instead of skip (intentional - we want failures if storageState missing)
- **Authenticated runs:** Tests now properly detect regressions (iframe loading issues, button visibility bugs)
- **Net effect:** +75 lines removed, cleaner test code, better failure detection

**Risk:** If storageState isn't set up (e.g., `.auth/user.json` missing), all 6 tests will fail. This is intentional - Phase 7 setup must run first (configured in playwright.config.ts chromium project).

## Key Files Modified

| File | Lines Changed | Key Change |
|------|---------------|------------|
| tests/game/slot-launch.spec.ts | -17 | Direct iframe assertion, removed Promise.race + 2 skip blocks |
| tests/game/table-launch.spec.ts | -17 | Direct iframe assertion, removed Promise.race + 2 skip blocks |
| tests/game/live-dealer-launch.spec.ts | -17 | Direct iframe assertion, removed Promise.race + 2 skip blocks |
| tests/crypto/swapped-buy-flow.spec.ts | -19 | Removed try/catch wrappers + 2 iframe skip blocks from both tests |
| tests/social/tipping-flow.spec.ts | -5 | Removed tip button visibility skip |

**Total:** 5 files modified, 85 lines removed, 10 lines added, net -75 lines.

## Self-Check

Verifying all claims in this summary:

**Created files:**
```bash
# None - only modified existing test files
```
RESULT: N/A (no files created)

**Modified files exist:**
```bash
[ -f "C:/Users/Karl/cookedqa/tests/game/slot-launch.spec.ts" ] && echo "FOUND: tests/game/slot-launch.spec.ts" || echo "MISSING: tests/game/slot-launch.spec.ts"
[ -f "C:/Users/Karl/cookedqa/tests/game/table-launch.spec.ts" ] && echo "FOUND: tests/game/table-launch.spec.ts" || echo "MISSING: tests/game/table-launch.spec.ts"
[ -f "C:/Users/Karl/cookedqa/tests/game/live-dealer-launch.spec.ts" ] && echo "FOUND: tests/game/live-dealer-launch.spec.ts" || echo "MISSING: tests/game/live-dealer-launch.spec.ts"
[ -f "C:/Users/Karl/cookedqa/tests/crypto/swapped-buy-flow.spec.ts" ] && echo "FOUND: tests/crypto/swapped-buy-flow.spec.ts" || echo "MISSING: tests/crypto/swapped-buy-flow.spec.ts"
[ -f "C:/Users/Karl/cookedqa/tests/social/tipping-flow.spec.ts" ] && echo "FOUND: tests/social/tipping-flow.spec.ts" || echo "MISSING: tests/social/tipping-flow.spec.ts"
```

**Commits exist:**
```bash
git log --oneline --all | grep -q "7755c49" && echo "FOUND: 7755c49" || echo "MISSING: 7755c49"
git log --oneline --all | grep -q "6620092" && echo "FOUND: 6620092" || echo "MISSING: 6620092"
```

**Self-check results:**
- FOUND: tests/game/slot-launch.spec.ts
- FOUND: tests/game/table-launch.spec.ts
- FOUND: tests/game/live-dealer-launch.spec.ts
- FOUND: tests/crypto/swapped-buy-flow.spec.ts
- FOUND: tests/social/tipping-flow.spec.ts
- FOUND: 7755c49
- FOUND: 6620092

## Self-Check: PASSED

All modified files exist and all commits are in git history.
