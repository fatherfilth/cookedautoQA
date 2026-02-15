---
phase: 01-foundation-test-infrastructure
plan: 02
subsystem: test-infrastructure
tags: [page-object-model, test-helpers, retry-logic, selector-strategy]
dependency_graph:
  requires:
    - 01-01 (Playwright test framework, TypeScript config)
  provides:
    - BasePage class with goto() retry and waitForReady()
    - Test helper utilities (config, retry, waits)
    - Page object shells (Lobby, Login, Registration, GameDetail, Account)
    - Selector strategy documentation (role-based priority)
    - Retry mechanism (3 attempts with 1s delay)
    - Explicit wait patterns (no networkidle, no arbitrary sleeps)
  affects: [all-future-test-plans]
tech_stack:
  added: []
  patterns:
    - Page Object Model with BasePage inheritance
    - Role-based selectors with data-testid fallback (.or() chains)
    - Explicit wait helpers (waitForSpinnerGone, waitForApiResponse)
    - Retry logic wrapper for navigation (retryAction)
    - Centralized test configuration constants
key_files:
  created:
    - tests/helpers/test-config.ts (timeouts, retry settings, tag constants)
    - tests/helpers/retry.ts (retryAction utility)
    - tests/helpers/waits.ts (waitForSpinnerGone, waitForApiResponse)
    - tests/pages/BasePage.ts (base class with navigation, wait, selector helpers)
    - tests/pages/LobbyPage.ts (lobby page object shell)
    - tests/pages/LoginPage.ts (login page object shell with loginWithEnvCredentials)
    - tests/pages/RegistrationPage.ts (registration page object shell)
    - tests/pages/GameDetailPage.ts (game detail page object shell)
    - tests/pages/AccountPage.ts (account page object shell)
    - docs/SELECTOR-STRATEGY.md (selector priority and rules documentation)
  modified: []
  deleted:
    - tests/pages/.gitkeep (replaced by real page objects)
    - tests/helpers/.gitkeep (replaced by real helpers)
    - docs/.gitkeep (replaced by documentation)
decisions:
  - decision: Use role-based selectors as primary with data-testid fallback
    rationale: Role-based selectors (getByRole, getByLabel) mirror accessibility tree and are more stable than CSS classes, with data-testid as safety net using .or() chains
  - decision: No networkidle or waitForTimeout in any test code
    rationale: networkidle hangs in SPAs, arbitrary sleeps are flaky - explicit waits (waitFor, waitForResponse) are more reliable
  - decision: BasePage implements retry logic for navigation
    rationale: Navigation is prone to transient failures - wrapping in retryAction (3 attempts) improves reliability without requiring retry in individual tests
  - decision: Page object shells use .or() chains for all locators
    rationale: Allows tests to work now with semantic selectors and auto-switch when data-testid attributes are added to production site
  - decision: Separate waitForReady() method in BasePage
    rationale: Each page can override to wait for page-specific indicators (game grid loaded, form visible, etc.) while inheriting spinner wait from base
metrics:
  duration_seconds: 145
  duration_human: "2 minutes"
  tasks_completed: 2
  files_created: 10
  files_deleted: 3
  commits: 2
  completed_date: "2026-02-15"
---

# Phase 01 Plan 02: Test Helpers and Page Object Model Summary

**One-liner:** Built Page Object Model base class with retry-enabled navigation, explicit wait helpers, and 5 page object shells using role-based selectors with data-testid fallback chains.

## Objective

Provide reusable test building blocks (helpers, base classes, page object shells) that Phase 2+ tests will import, with reliability patterns (explicit waits, retry logic, stable selectors) baked into the base classes so individual tests inherit them automatically.

## Tasks Completed

### Task 1: Create test helper utilities and BasePage class

**Status:** ✅ Complete
**Commit:** 53e8831
**Files:**
- tests/helpers/test-config.ts (configuration constants)
- tests/helpers/retry.ts (retryAction utility)
- tests/helpers/waits.ts (explicit wait helpers)
- tests/pages/BasePage.ts (base page class)

**Work performed:**
1. Created test-config.ts with:
   - Timeout constants (action: 15s, navigation: 30s, assertion: 10s, spinner: 10s, apiResponse: 15s)
   - Retry settings (maxAttempts: 3, delayMs: 1000)
   - Common spinner selectors for explicit waits
   - Tag constants (@critical, @warning, @smoke)

2. Created retry.ts with retryAction<T>() function:
   - Generic async retry wrapper
   - Configurable max attempts (default 3) and delay (default 1s)
   - Used for navigation and API calls (NOT for Playwright locator actions which already auto-retry)
   - Logs retry attempts with warning messages

3. Created waits.ts with explicit wait helpers:
   - waitForSpinnerGone() - iterates through known spinner selectors, waits for state: 'hidden'
   - waitForApiResponse() - waits for specific URL pattern with status code
   - No networkidle anywhere - explicit waits only

4. Created BasePage abstract class:
   - abstract path property forces subclasses to declare URL
   - goto() wraps page.goto() in retryAction for navigation reliability
   - waitForReady() uses waitForSpinnerGone() by default, overridable in subclasses
   - open() = goto() + waitForReady() convenience method
   - testIdOrFallback() helper implements .or() chain pattern for data-testid fallback
   - All imports use .js extensions (ESM module compliance)

**Verification:**
- TypeScript compiles without errors
- No networkidle usage found in tests/
- retryAction used in BasePage.goto()
- waitForSpinnerGone used in BasePage.waitForReady()
- maxAttempts set to 3 in test-config.ts

### Task 2: Create page object shells and selector strategy documentation

**Status:** ✅ Complete
**Commit:** f9d8f3e
**Files:**
- tests/pages/LobbyPage.ts (lobby page object)
- tests/pages/LoginPage.ts (login page object)
- tests/pages/RegistrationPage.ts (registration page object)
- tests/pages/GameDetailPage.ts (game detail page object)
- tests/pages/AccountPage.ts (account page object)
- docs/SELECTOR-STRATEGY.md (selector strategy documentation)

**Work performed:**
1. Created LobbyPage extending BasePage:
   - path = '/'
   - Locators: searchInput (getByRole searchbox), gameCategories (getByRole tablist), gameGrid, firstGameTile
   - Methods: searchForGame(), selectCategory(), clickFirstGame()
   - Override waitForReady() to wait for game grid visibility
   - All locators use role-based primary with .or(getByTestId) fallback

2. Created LoginPage extending BasePage:
   - path = '/login'
   - Locators: emailInput, passwordInput, submitButton, errorMessage
   - Methods: login(email, password), loginWithEnvCredentials()
   - loginWithEnvCredentials() reads TEST_USER_EMAIL and TEST_USER_PASSWORD from environment
   - All locators use semantic selectors (getByRole textbox, getByLabel, getByRole button, getByRole alert)

3. Created RegistrationPage extending BasePage:
   - path = '/register'
   - Locators: emailInput, passwordInput, usernameInput, submitButton, termsCheckbox
   - Method: fillForm() - implements stop-before-payment pattern (fills but doesn't submit)
   - All form fields use getByRole or getByLabel with data-testid fallback

4. Created GameDetailPage extending BasePage:
   - path = '/games' (base path, dynamic in use)
   - Locators: gameIframe (CSS selector for iframe[src*="game"]), playButton, gameName, loadingIndicator
   - Methods: gotoGame(gameIdOrSlug), isGameLoaded()
   - Override waitForReady() to wait for game name heading
   - Uses iframe CSS selector (last resort) since iframe src patterns can't use role-based

5. Created AccountPage extending BasePage:
   - path = '/account'
   - Locators: username, email (regex pattern for email format), balanceDisplay, logoutButton
   - Method: logout()
   - Uses role-based selectors where possible, data-testid primary for account-specific fields

6. Created SELECTOR-STRATEGY.md documentation:
   - Priority table: getByRole > getByLabel > getByText > getByTestId > CSS/XPath
   - Rules: never use CSS classes, always try role-based first, use .or() for fallback chains
   - Strategy for when data-testid doesn't exist (use semantic selectors now, will auto-switch)
   - Code examples showing GOOD vs BAD patterns
   - Wait pattern examples (explicit waits vs forbidden networkidle/waitForTimeout)

7. Removed .gitkeep files from tests/pages/, tests/helpers/, docs/ (replaced by real files)

**Verification:**
- TypeScript compiles without errors
- All 5 page objects extend BasePage (grep found all 5)
- No networkidle or waitForTimeout usage in tests/
- 18 instances of getByRole across page objects
- retryAction imported and used in BasePage
- All helper files exist
- All page object files exist
- SELECTOR-STRATEGY.md contains priority table

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All success criteria met:

✅ All TypeScript files compile without errors
✅ BasePage provides goto() with retry, waitForReady() without networkidle, and testIdOrFallback()
✅ retryAction() retries 3 times with 1s delay (configurable)
✅ All 5 page objects (Lobby, Login, Registration, GameDetail, Account) extend BasePage
✅ Every locator uses getByRole/getByLabel/getByText/getByTestId — no CSS class selectors (except iframe src pattern as documented last resort)
✅ Zero occurrences of networkidle or waitForTimeout in test code
✅ Selector strategy documented with priority order, rules, and examples

## Self-Check: PASSED

**Files created verification:**
```bash
✅ tests/helpers/test-config.ts exists
✅ tests/helpers/retry.ts exists
✅ tests/helpers/waits.ts exists
✅ tests/pages/BasePage.ts exists
✅ tests/pages/LobbyPage.ts exists
✅ tests/pages/LoginPage.ts exists
✅ tests/pages/RegistrationPage.ts exists
✅ tests/pages/GameDetailPage.ts exists
✅ tests/pages/AccountPage.ts exists
✅ docs/SELECTOR-STRATEGY.md exists
```

**Commits verification:**
```bash
✅ 53e8831 exists (Task 1: test helpers and BasePage)
✅ f9d8f3e exists (Task 2: page object shells and selector strategy)
```

## Output

**Project state:** Page Object Model infrastructure ready for test development

**Key capabilities delivered:**
- All page objects inherit retry logic for navigation (3 attempts, 1s delay)
- All page objects inherit explicit wait pattern (spinner checks, no networkidle)
- Selector strategy enforced: role-based primary, data-testid fallback via .or() chains
- Helper utilities available for custom waits and retry logic
- Page object shells provide structure for Phase 2 test implementation
- LoginPage.loginWithEnvCredentials() ready for auth tests
- RegistrationPage.fillForm() implements stop-before-payment pattern

**Next steps:**
- Phase 02: Critical User Flow Tests - implement actual tests using these page objects
- Phase 02-01: Authentication flows (login, logout, session validation)
- Phase 02-02: Game browsing and selection (lobby navigation, search, game launch)
- Phase 02-03: Account page verification (balance display, profile data)

## Dependencies Impact

**Provides for future plans:**
- All test plans can extend BasePage for automatic retry and wait behavior
- All test plans can import page objects (LobbyPage, LoginPage, etc.)
- All test plans can use helper utilities (retryAction, waitForSpinnerGone, waitForApiResponse)
- Selector strategy documented for consistent locator patterns
- Tag constants available for test categorization

**Blocks resolution:**
- None (no blockers identified or resolved in this plan)

## Technical Debt

None identified. Clean implementation following Playwright best practices with proper separation of concerns (helpers, base class, page objects, documentation).

## Notes

- All page object locators are structural shells - actual selectors will be refined in Phase 2 after inspecting live site
- .or() chains ensure tests work now with semantic selectors and will auto-switch when data-testid attributes are added
- GameDetailPage uses CSS selector for iframe (last resort) - this is documented in SELECTOR-STRATEGY.md as acceptable for iframe src patterns
- LoginPage.loginWithEnvCredentials() provides convenience method that reads from environment variables set in .env file
- RegistrationPage.fillForm() deliberately does NOT submit the form (stop-before-payment pattern)
- All 18 uses of getByRole demonstrate consistent adherence to selector priority strategy
- Ready for Phase 2 test implementation
