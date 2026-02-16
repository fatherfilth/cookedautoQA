# Phase 7 Plan 1: Auth Setup Project Summary

**One-liner:** Playwright setup project auto-registers `smoketest+{timestamp}@totempowered.com` on each run and saves authenticated storageState for all test specs.

---

## Metadata

**Phase:** 07-auth-foundation
**Plan:** 01
**Subsystem:** Test infrastructure - Authentication
**Tags:** auth, setup, storageState, registration
**Status:** Complete
**Completed:** 2026-02-16

---

## Dependency Graph

**Requires:**
- Playwright test framework (Phase 1)
- RegistrationPage pattern (implicit - not imported, selectors replicated)
- Live site registration endpoint at cooked.com

**Provides:**
- `.auth/user.json` storageState file (runtime artifact, gitignored)
- `setup` project in Playwright config (runs before all tests)
- Authenticated browser context for all test specs in `chromium` project

**Affects:**
- All test specs (now run with authenticated session by default)
- CI/CD pipeline (self-contained per run - no manual credential management)
- Phase 8 execution (AUTH-05, AUTH-06, and all auth-gated tests can now run)

---

## Tech Stack Changes

**Added:**
- `tests/auth/auth.setup.ts`: Playwright setup project using `test as setup` pattern
- `.auth/` directory: Runtime storage for authenticated session state (gitignored)

**Patterns:**
- **Setup project pattern:** Separate Playwright project runs before main tests, saves shared state
- **storageState reuse:** Browser cookies + localStorage saved after setup, loaded by all downstream tests
- **Disposable accounts:** Each test run generates unique email `smoketest+{timestamp}@totempowered.com` (no credential management needed)
- **Project dependencies:** `chromium` project depends on `setup` project via `dependencies: ['setup']`

---

## Key Files

**Created:**
- `tests/auth/auth.setup.ts` - Setup project that registers fresh account and saves storageState
- (Runtime) `.auth/user.json` - Saved browser session state (cookies + localStorage)

**Modified:**
- `playwright.config.ts` - Added setup project and wired chromium project to use saved storageState
- `.gitignore` - Added `.auth/` to exclude session tokens from version control
- `.env.example` - Documented auto-registration approach, marked TEST_USER_EMAIL/PASSWORD as optional

---

## Decisions Made

1. **Setup project runs registration inline (no RegistrationPage import)**
   - Rationale: Setup project runs in isolated context; importing page objects adds coupling. Inline selectors keep setup self-contained and maintain simplicity.
   - Trade-off: Duplicates some selector logic from RegistrationPage, but ensures setup can run independently.

2. **Disposable email pattern: smoketest+{timestamp}@totempowered.com**
   - Rationale: No email verification required (stop-before-payment pattern), timestamp ensures uniqueness, totempowered.com is documented as acceptable domain.
   - Alternative considered: Real email verification flow - rejected as unnecessary for testing (no payment required, no email action needed).

3. **storageState saved to .auth/user.json (gitignored)**
   - Rationale: Playwright convention, clearly separates auth artifacts from test code, git exclusion prevents committing session tokens.
   - Alternative considered: .state/ directory - rejected to follow Playwright's standard pattern (.auth/ is widely used in Playwright docs).

4. **Setup timeout: 60 seconds**
   - Rationale: Live site registration may be slow (network, server processing, potential throttling). Generous timeout prevents flakes.
   - Trade-off: Slower failure detection if registration is broken, but reduces false negatives from timing variance.

5. **Verification uses Promise.race for multiple success signals**
   - Rationale: Registration success behavior varies (dialog closes, URL changes to /account, or stays on homepage). Racing multiple signals ensures robustness.
   - Alternative considered: Specific URL assertion - rejected as too brittle (success behavior may vary by site configuration).

---

## Tasks Completed

### Task 1: Create auth setup project that registers a fresh account and saves storageState
**Commit:** 4ed13f9
**Files:**
- Created `tests/auth/auth.setup.ts` with complete registration flow
- Updated `.gitignore` to exclude `.auth/` directory
- Updated `.env.example` to document auto-registration

**Details:**
- Setup project uses `test as setup` import pattern (Playwright standard)
- Registration flow: navigate to homepage → click Register button → fill form (email, password, optional username/terms) → submit → verify authenticated state → save storageState
- Email generation: `smoketest+${Date.now()}@totempowered.com` (unique per run)
- Password: `testtest123` (hardcoded, no env var needed)
- Success verification: waits for dialog to close OR URL change to /account OR URL stays at /, then asserts auth indicator visible (logout button, welcome message, or avatar)
- storageState saved to `.auth/user.json` for reuse by all tests
- Console logging for debugging: logs registered email

### Task 2: Wire setup project into playwright.config.ts so all tests use authenticated state
**Commit:** 9b29cba
**Files:**
- Updated `playwright.config.ts` projects array

**Details:**
- Added `setup` project with `testMatch: /auth\.setup\.ts/` (runs only setup file)
- Updated `chromium` project with `storageState: '.auth/user.json'` in `use` block
- Added `dependencies: ['setup']` to chromium project (ensures setup runs first)
- All 17 existing test specs now run under chromium project with authenticated session
- Test listing shows 18 tests total: 1 setup + 17 specs

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Verification Results

**TypeScript compilation:** ✓ Passed (`npx tsc --noEmit`)

**Test listing:** ✓ Correct
- Setup project: 1 test (`[setup] › auth\auth.setup.ts:5:1 › register and authenticate`)
- Chromium project: 17 tests (all existing specs)
- Total: 18 tests

**Setup file structure:** ✓ Verified
- Uses `setup()` function pattern
- Saves storageState to `.auth/user.json`
- Timeout set to 60 seconds

**Config wiring:** ✓ Verified
- Setup project has `testMatch: /auth\.setup\.ts/`
- Chromium project has `storageState: '.auth/user.json'`
- Chromium project has `dependencies: ['setup']`

**Gitignore:** ✓ Verified
- `.auth/` listed in `.gitignore`

**Documentation:** ✓ Verified
- `.env.example` documents auto-registration and marks TEST_USER_EMAIL/PASSWORD as optional

---

## Performance Metrics

**Execution time:** 105 seconds (1.8 minutes)
**Tasks completed:** 2
**Files created:** 1
**Files modified:** 3
**Commits:** 2

---

## Testing Notes

**Not tested in this plan:**
- Actual registration against live site (will be verified in Phase 8 execution)
- storageState persistence across test runs (Playwright handles this, will be verified end-to-end in Phase 8)
- Handling of registration failures (retry logic included but not exercised)

**Known limitations:**
- Setup runs once per test run (not per worker) - this is Playwright's default behavior for setup projects
- If registration fails due to email already existing, setup will fail the entire test run (no retry implemented at setup level)
- Selectors in setup file may need adjustment if live site DOM differs from assumptions

**Recommendations for Phase 8:**
- Monitor setup project execution time (60s timeout may be excessive or insufficient depending on live site)
- Verify auth indicators match actual live site DOM (avatar, logout button, welcome message patterns)
- Test with HEADLESS=false locally to observe registration flow visually before CI run

---

## Next Steps

**Immediate (Phase 8):**
1. Execute full test suite to verify setup project works against live site
2. Adjust selectors in `auth.setup.ts` if live site DOM differs
3. Verify all 17 existing tests now run with authenticated session

**Future enhancements (out of scope for v1.1):**
- Retry logic if registration fails (e.g., email collision despite timestamp uniqueness)
- Parameterized setup for different user roles (if needed for future test coverage)
- Cleanup script to delete disposable accounts (if totempowered.com admin access is available)

---

## Self-Check: PASSED

**Created files exist:**
```
FOUND: tests/auth/auth.setup.ts
```

**Modified files exist:**
```
FOUND: playwright.config.ts
FOUND: .gitignore
FOUND: .env.example
```

**Commits exist:**
```
FOUND: 4ed13f9
FOUND: 9b29cba
```

**Key patterns verified:**
```
✓ auth.setup.ts contains: storageState.*\.auth/user\.json
✓ playwright.config.ts contains: testMatch.*auth\.setup
✓ playwright.config.ts contains: storageState.*\.auth/user\.json
✓ playwright.config.ts contains: dependencies.*setup
✓ .gitignore contains: \.auth/
```

All verification criteria met.
