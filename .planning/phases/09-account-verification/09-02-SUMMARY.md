---
phase: 09-account-verification
plan: 02
subsystem: test-infrastructure
tags: [game-tests, assertions, cleanup]
dependency_graph:
  requires: [phase-09-plan-01-verified-account]
  provides: [iframe-only-game-assertions]
  affects: [all-game-tests]
tech_stack:
  added: []
  patterns: [direct-assertions]
key_files:
  created: []
  modified:
    - tests/game/slot-launch.spec.ts
    - tests/game/table-launch.spec.ts
    - tests/game/live-dealer-launch.spec.ts
  deleted:
    - tests/helpers/dismiss-details-modal.ts
decisions:
  - remove-modal-fallback-from-game-tests
  - delete-unused-helper-function
metrics:
  duration_seconds: 102
  completed: 2026-02-16T07:59:48Z
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 3
  files_deleted: 1
  commits: 2
---

# Phase 09 Plan 02: Game Launch Tests Iframe Assertions Summary

**One-liner:** Game launch tests now assert actual game iframe presence (not modal fallback), validating real game loading for verified accounts after "Set your details" modal removed.

## What Was Built

Updated all three game launch test specs to assert iframe-only presence, removing the `.or(playModeButton)` fallback pattern that previously accepted the "Set your details" modal as a valid state. With verification now complete in auth setup (Plan 01), game tests validate actual game loading.

### Key Changes

1. **Slot Launch Test** (`tests/game/slot-launch.spec.ts`)
   - Removed `playModeButton` variable (Fun Play/Real Play/Set your details buttons)
   - Removed `.or(playModeButton).first()` fallback from assertion
   - Now asserts `gameIframe` visibility directly with 30s timeout
   - Updated comment from "either the game iframe or Fun Play/Real Play buttons" to "Game iframe should load for verified accounts"

2. **Table Launch Test** (`tests/game/table-launch.spec.ts`)
   - Same pattern as slot launch — removed modal fallback
   - Direct iframe assertion only
   - Updated comment to reflect verified account state

3. **Live Dealer Launch Test** (`tests/game/live-dealer-launch.spec.ts`)
   - Same pattern as slot/table — removed modal fallback
   - Direct iframe assertion only
   - Updated comment to reflect verified account state

4. **Cleanup: Removed Unused Helper** (`tests/helpers/dismiss-details-modal.ts`)
   - Deleted entire file (16 lines removed)
   - Helper was created to click "Fun Play" to bypass "Set your details" modal
   - No longer needed after verification flow added to auth setup
   - No imports found in codebase (was unused)

### Implementation Notes

- **Iframe selector unchanged:** Still excludes Intercom chat iframe with `:not([title="Intercom"]):not([aria-hidden="true"])`
- **Timeout preserved:** 30s timeout maintained for game iframe loading (third-party provider delays)
- **Test count:** Unchanged at 18 tests (no new tests, existing tests updated)
- **Breaking change:** Tests will now FAIL if "Set your details" modal appears (expected behavior — indicates verification failed)

## Verification Results

- ✓ `npx tsc --noEmit` passes
- ✓ No references to "fun play", "real play", "set your details" in game spec files
- ✓ No `.or(playModeButton)` pattern in game spec files
- ✓ `tests/helpers/dismiss-details-modal.ts` does not exist
- ✓ No references to `dismiss-details-modal` or `dismissDetailsModal` in codebase
- ✓ `npx playwright test --list` shows 18 tests (unchanged)

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remove modal fallback from assertions | Verification now complete — "Set your details" modal should never appear | Tests validate real game loading, failures indicate verification problem |
| Delete dismiss-details-modal helper | Helper unused (game tests used inline selectors) and no longer needed | Cleanup reduces codebase complexity |
| Preserve 30s timeout | Game iframes loaded by third-party providers can be slow | Prevents false negatives on CI |
| Update comments | "either iframe or modal" language no longer accurate | Comments reflect verified account state |

## Technical Context

### Before This Plan
- Game tests accepted two valid states: game iframe OR "Set your details" modal buttons
- Tests passed even if games didn't load (modal fallback masked failures)
- Helper function existed but was never imported/used
- Decision from phase 8: accept modal as valid state (workaround for unverified accounts)

### After This Plan
- Game tests assert ONLY game iframe visibility
- Tests fail if games don't load OR if modal appears (both indicate real problems)
- Helper function removed (cleanup)
- Tests now validate actual game launch success for verified accounts

### Live Site Behavior
- **Verified accounts:** Game iframe loads directly (no modal)
- **Unverified accounts:** "Set your details" modal blocks game access
- **Auth setup:** Now creates verified accounts (Plan 01)
- **Expected test behavior:** All game tests pass with iframe assertions

## Files Changed

### Modified
- `tests/game/slot-launch.spec.ts` (-3 lines) — Removed modal fallback, direct iframe assertion
- `tests/game/table-launch.spec.ts` (-3 lines) — Removed modal fallback, direct iframe assertion
- `tests/game/live-dealer-launch.spec.ts` (-3 lines) — Removed modal fallback, direct iframe assertion

### Deleted
- `tests/helpers/dismiss-details-modal.ts` (-16 lines) — Unused helper for modal bypass

**Total:** 3 files modified, 1 file deleted, 25 lines removed

## Test Impact

**Test count:** Unchanged (18 tests)
**Test coverage:** Same game launch scenarios, stricter assertions
**Expected behavior change:** Tests now FAIL if "Set your details" modal appears (catches verification regressions)
**Risk mitigation:** If verification breaks in Plan 01, game tests will immediately fail (fast feedback)

## Commits

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| 3188cb9 | refactor | Remove modal fallback from game launch tests | 3 spec files |
| b60944d | chore | Remove unused dismiss-details-modal helper | 1 helper file |

## Next Steps

**Immediate:**
- Run full test suite against live site to confirm all game tests pass
- Monitor for any "Set your details" modal appearances (indicates verification regression)

**Follow-up:**
- If modal reappears, investigate auth setup verification flow (Plan 01)
- If game iframes fail to load, investigate third-party game provider issues
- Consider adding explicit "no modal present" assertion for extra confidence

**Future Phases:**
- Phase 10: Lighthouse audits and performance monitoring
- Phase 11: Screenshot diffing for visual regressions

## Self-Check: PASSED

### Files Exist
- ✓ FOUND: tests/game/slot-launch.spec.ts (modified)
- ✓ FOUND: tests/game/table-launch.spec.ts (modified)
- ✓ FOUND: tests/game/live-dealer-launch.spec.ts (modified)

### Files Deleted
- ✓ CONFIRMED: tests/helpers/dismiss-details-modal.ts no longer exists

### Commits Exist
- ✓ FOUND: 3188cb9 (refactor(09-02): remove modal fallback from game launch tests)
- ✓ FOUND: b60944d (chore(09-02): remove unused dismiss-details-modal helper)

All claims verified.
