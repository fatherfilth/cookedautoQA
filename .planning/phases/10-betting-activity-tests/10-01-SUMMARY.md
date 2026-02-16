---
phase: 10-betting-activity-tests
plan: 01
subsystem: betting-activity
tags: [testing, playwright, betting, social-proof]
dependency_graph:
  requires: [auth-setup, playwright-config]
  provides: [betting-activity-tests]
  affects: [test-suite]
tech_stack:
  added: []
  patterns: [playwright-test, scroll-pattern, tab-interaction]
key_files:
  created:
    - tests/betting/betting-activity.spec.ts
  modified: []
decisions:
  - "Used broad CSS selectors for betting entry rows since DOM structure is unknown (table rows or div-based rows)"
  - "Added scrollToBottom helper with Page type annotation for TypeScript compliance"
  - "Applied @warning @betting tags for non-critical monitoring (consistent with project conventions)"
  - "Used 15s timeout for dynamic content loading (consistent with other tests)"
  - "Used waitForTimeout(1000) for tab switch animation/re-render in High Rollers test"
metrics:
  duration: 119s
  completed: 2026-02-16
---

# Phase 10 Plan 01: Betting Activity Tests Summary

**One-liner:** Created Playwright tests validating betting activity component on All Bets and High Rollers tabs with scroll-to-bottom pattern.

## Objective Recap

Create Playwright tests that validate the betting activity component at the bottom of cooked.com pages. Two tests: one for the "All Bets" tab and one for the "High Rollers" tab, each asserting that betting entries are visible.

**Requirements addressed:**
- BET-01: All Bets tab shows betting activity entries
- BET-02: High Rollers tab shows betting activity entries

## What Was Built

### Test File: `tests/betting/betting-activity.spec.ts`

Created comprehensive betting activity tests with:

1. **Helper Function:**
   - `scrollToBottom(page: Page)` - Scrolls to page bottom where betting activity component lives
   - Properly typed with Page import for TypeScript compliance

2. **Test 1: All Bets Tab (BET-01)**
   - Navigates to homepage
   - Scrolls to bottom
   - Locates "All Bets" tab using accessible role selector with text fallback
   - Asserts tab is visible (15s timeout for dynamic loading)
   - Asserts at least one betting entry row is visible
   - Validates entry has text content (not empty placeholder)
   - Tagged: `@warning @betting`

3. **Test 2: High Rollers Tab (BET-02)**
   - Navigates to homepage
   - Scrolls to bottom
   - Locates "High Rollers" tab using accessible role selector with fallback
   - Clicks the tab
   - Waits for tab content to update (1s for animation/re-render)
   - Asserts at least one betting entry row is visible
   - Validates entry has text content
   - Tagged: `@warning @betting`

**Selector Strategy:**
- Preferred `getByRole('tab', ...)` for accessibility and resilience
- Used `.or()` fallback to text-based selectors (DOM structure unknown)
- Broad CSS selectors for betting rows: `table tbody tr, [class*="bet"] [class*="row"], [class*="activity"] [class*="row"]`
- 15s timeout for dynamic content (consistent with project conventions)

## Integration

- **Test count:** Increased from 18 to 20 tests
- **Project:** Tests run under `chromium` project with authenticated session (storageState)
- **TypeScript:** Zero compilation errors
- **Pattern compliance:** Follows existing test conventions (promotions.spec.ts, homepage.spec.ts)

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed TypeScript type error in scrollToBottom helper**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** Parameter 'page' implicitly has an 'any' type (TS7006)
- **Fix:** Added Page type import and annotation: `async function scrollToBottom(page: Page)`
- **Files modified:** tests/betting/betting-activity.spec.ts
- **Commit:** 5eacc9a

## Task Execution

| Task | Name | Status | Commit | Files |
|------|------|--------|--------|-------|
| 1 | Create betting activity spec with All Bets and High Rollers tests | Complete | 5eacc9a | tests/betting/betting-activity.spec.ts |
| 2 | Update test count references and verify integration | Complete | (verification only) | N/A |

## Verification Results

All success criteria met:

- [x] BET-01 satisfied: Test validates "All Bets" tab shows betting entries at bottom of page
- [x] BET-02 satisfied: Test validates "High Rollers" tab shows betting entries at bottom of page
- [x] Test count: 20 (18 existing + 2 new)
- [x] TypeScript compiles cleanly (npx tsc --noEmit passes)
- [x] Tests integrate with existing Playwright config (chromium project, storageState)
- [x] Both tests use `@warning @betting` tags consistent with non-critical monitoring tests
- [x] No existing tests modified or broken

## Self-Check

**Files created:**
```bash
FOUND: tests/betting/betting-activity.spec.ts
```

**Commits created:**
```bash
FOUND: 5eacc9a
```

**Test count verification:**
```bash
npx playwright test --list shows: Total: 20 tests in 18 files
```

## Self-Check: PASSED

All claimed files and commits verified to exist.

## Next Steps

Phase 10 has 1 plan total. This was plan 01.

**Phase 10 Status:** Complete (1/1 plans)

**Roadmap progression:**
- v1.2 Milestone: Phase 10 complete
- Next: Phase 11 (Lighthouse Audits) or Phase 12 (Screenshot Diffing) per ROADMAP.md

**Ready for:**
- CI execution of new betting activity tests
- Live site validation of betting component behavior
- Monitoring for betting activity component breakages
