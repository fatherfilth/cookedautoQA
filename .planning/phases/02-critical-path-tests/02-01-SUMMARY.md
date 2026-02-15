---
phase: 02-critical-path-tests
plan: 01
subsystem: smoke-tests
tags: [smoke, critical-path, navigation, search]
dependency_graph:
  requires:
    - 01-01-PLAN (Playwright configuration)
    - 01-02-PLAN (Test helpers and page objects)
  provides:
    - SMOKE-01 through SMOKE-04 smoke tests
    - Homepage hero element validation
    - Navigation flow validation
    - Lobby page validation
    - Search flow validation
  affects:
    - tests/smoke/ directory structure
    - Smoke test suite filtering with @smoke tag
tech_stack:
  added:
    - tests/smoke/homepage.spec.ts
    - tests/smoke/navigation.spec.ts
    - tests/smoke/lobby.spec.ts
    - tests/smoke/search.spec.ts
  patterns:
    - Role-based selectors with .or() fallbacks
    - Content validation (heading visible) not just URL changes
    - ESM .js imports for page objects
key_files:
  created:
    - tests/smoke/homepage.spec.ts
    - tests/smoke/navigation.spec.ts
    - tests/smoke/lobby.spec.ts
    - tests/smoke/search.spec.ts
  modified: []
decisions:
  - "Used main element as fallback for hero selector (data-testid unknown before live inspection)"
  - "Navigation test validates 2 different section types (games + promotions/about) for coverage"
  - "Search test uses broad term 'slots' likely to return results on any casino site"
  - "Game detail URL pattern assumption: **/games/** (to be verified during live testing)"
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_created: 4
  completed_date: 2026-02-15
---

# Phase 02 Plan 01: Smoke Tests Summary

**One-liner:** Created 4 smoke tests (SMOKE-01 to SMOKE-04) validating homepage hero, navigation to 2+ sections, lobby categories/grid, and search with result navigation.

## What Was Built

### Smoke Tests (tests/smoke/)

**SMOKE-01 - Homepage Hero Element (homepage.spec.ts):**
- Navigates to `/` and verifies page title is non-empty
- Locates hero element using `[data-testid="hero"]` or fallback to `main` first element
- Asserts hero is visible and has content (not empty)
- Tagged `@critical @smoke`

**SMOKE-02 - Top Navigation (navigation.spec.ts):**
- Locates navigation element using role or `nav` element
- Navigates to first destination matching `/lobby|games|casino|slots/i`
- Validates content loaded by asserting heading is visible (not just URL change)
- Returns to homepage
- Navigates to second destination matching `/promotions|rewards|vip|about/i`
- Validates content loaded again
- Tagged `@smoke`

**SMOKE-03 - Lobby Categories and Grid (lobby.spec.ts):**
- Imports `LobbyPage` from page objects
- Opens lobby page using `lobbyPage.open()`
- Asserts game categories are visible
- Asserts game grid is visible
- Validates at least 1 game tile exists in grid
- Tagged `@smoke`

**SMOKE-04 - Search Flow (search.spec.ts):**
- Imports `LobbyPage` from page objects
- Opens lobby page
- Searches for "slots" (broad term likely to return results)
- Presses Enter to submit search
- Validates results count > 0
- Clicks first game result
- Asserts navigation to `**/games/**` URL pattern
- Validates game detail page content loaded (heading visible)
- Tagged `@smoke`

## Key Technical Details

**Selector Strategy:**
- Role-based selectors with `.or()` fallback chains (RELY-02 pattern)
- No CSS class selectors (avoided brittleness)
- Data-testid fallbacks for dynamic content

**Anti-Patterns Avoided:**
- No `networkidle` usage (per RELY-05)
- No `waitForTimeout` (per RELY-05)
- Navigation validates content loaded, not just URL changes (research pitfall 7)
- Search validates results exist, not just search action (research pitfall 6)

**Import Pattern:**
- ESM `.js` extension for page object imports (established in 01-02)
- Direct `@playwright/test` imports for test framework

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**Test Listing:**
```
Total: 5 tests in 5 files
- health-check.spec.ts (existing)
- homepage.spec.ts (new)
- navigation.spec.ts (new)
- lobby.spec.ts (new)
- search.spec.ts (new)
```

**TypeScript Compilation:** Passed

**Tag Filtering:** All 5 tests appear with `--grep @smoke`

**Forbidden Patterns:** None found (no networkidle, no waitForTimeout)

**Import Verification:**
- lobby.spec.ts imports LobbyPage ✓
- search.spec.ts imports LobbyPage ✓

## Commits

| Task | Commit  | Description                                       |
| ---- | ------- | ------------------------------------------------- |
| 1    | 70f579d | Homepage and navigation smoke tests (SMOKE-01, 02) |
| 2    | a0ea566 | Lobby and search smoke tests (SMOKE-03, 04)        |

## Self-Check

Verifying all claimed files exist:

```bash
# Check created files
tests/smoke/homepage.spec.ts - EXISTS
tests/smoke/navigation.spec.ts - EXISTS
tests/smoke/lobby.spec.ts - EXISTS
tests/smoke/search.spec.ts - EXISTS

# Check commits
70f579d - EXISTS (Task 1)
a0ea566 - EXISTS (Task 2)
```

## Self-Check: PASSED

All claimed files and commits verified.

## Next Steps

**For Plan 02-02 (Game Launch Tests):**
- Test SMOKE-03 and SMOKE-04 against live site to verify selectors work
- Document actual game provider iframe patterns from production
- Update game-config.ts with real game IDs from cooked.com

**Live Testing Checklist (before Plan 02-02):**
- [ ] Verify hero element selector (data-testid or main)
- [ ] Verify navigation link patterns (lobby/games/promotions)
- [ ] Verify lobby game categories structure (tablist or other)
- [ ] Verify game grid container (data-testid or role=list)
- [ ] Verify search input (searchbox role or data-testid)
- [ ] Verify game detail URL pattern (**/games/** assumption)
- [ ] Document actual game provider iframe src patterns
- [ ] Document game-ready indicators per provider (Evolution, Pragmatic, etc.)
