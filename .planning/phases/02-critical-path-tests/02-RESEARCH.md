# Phase 2: Critical Path Tests - Research

**Researched:** 2026-02-15
**Domain:** E2E testing of critical user journeys (smoke tests, game monitoring, authentication) with Playwright
**Confidence:** HIGH

## Summary

Phase 2 implements critical path tests for cooked.com, validating core revenue-generating user journeys including smoke tests (homepage, navigation, lobby, search), game launch monitoring (slot/table/live dealer games via iframes), and authentication flows (login, session persistence, registration). The research confirms that Playwright's existing infrastructure from Phase 1 provides the necessary foundation for these tests.

Key findings reveal that iframe-based game testing requires frameLocator() with custom wait conditions beyond standard load states, as canvas games render asynchronously after the iframe loads. Authentication testing should leverage Playwright's storageState API to test session persistence efficiently. Registration flows should be tested step-by-step with validation at each stage, stopping before actual account creation using environment flags or test mode detection. Test categorization using @smoke and @critical tags enables selective test execution and severity-based alerting in future phases.

The research identifies that game provider iframe patterns are unknown and require live site inspection to document iframe src patterns and "game ready" indicators. Configuration-based game IDs (via environment variables) will enable testing representative games from each category without hardcoding values.

**Primary recommendation:** Implement smoke tests first (SMOKE-01 through SMOKE-04) to validate core page loads and navigation, then game monitoring tests (GAME-01 through GAME-04) using frameLocator() with provider-specific wait conditions, and finally auth tests (AUTH-01 through AUTH-03) using storageState for session persistence validation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | Latest (1.48+) | Test framework and assertions | Already established in Phase 1; provides frameLocator(), storageState(), test tagging |
| TypeScript | 5.x | Type safety for page objects and test helpers | Already established; provides strong typing for multi-step flows and game configurations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | ^16.0 | Environment variable management | Already established; critical for configurable game IDs (GAME_SLOT_ID, GAME_TABLE_ID, GAME_LIVE_ID) and test credentials |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| frameLocator() | page.frame() with waitForSelector | frameLocator() auto-waits for dynamic iframes; page.frame() requires manual waiting |
| storageState | Manual cookie inspection | storageState captures cookies + localStorage + sessionStorage in single API; manual inspection is brittle |
| Test tagging (@smoke, @critical) | Separate test directories | Tags enable flexible filtering without restructuring; directories create rigid boundaries |

**Installation:**
No new dependencies required. All necessary libraries installed in Phase 1.

## Architecture Patterns

### Recommended Project Structure
```
tests/
├── smoke/                  # Smoke tests (SMOKE-01 to SMOKE-04)
│   ├── homepage.spec.ts   # SMOKE-01: Homepage hero element
│   ├── navigation.spec.ts # SMOKE-02: Top navigation
│   ├── lobby.spec.ts      # SMOKE-03: Lobby categories
│   └── search.spec.ts     # SMOKE-04: Search flow
├── game/                   # Game monitoring tests (GAME-01 to GAME-04)
│   ├── slot-launch.spec.ts
│   ├── table-launch.spec.ts
│   └── live-dealer-launch.spec.ts
├── auth/                   # Auth tests (AUTH-01 to AUTH-03)
│   ├── login.spec.ts
│   ├── session-persistence.spec.ts
│   └── registration.spec.ts
├── helpers/                # Test helpers (from Phase 1)
├── pages/                  # Page objects (from Phase 1)
└── fixtures/               # Optional: auth fixtures for session state
```

### Pattern 1: iframe Game Launch Testing
**What:** Validate game iframe loads and initializes successfully using frameLocator() with custom wait conditions
**When to use:** For GAME-01, GAME-02, GAME-03 tests validating slot, table, and live dealer games
**Example:**
```typescript
// Source: https://playwright.dev/docs/api/class-frame
// Pattern adapted from research on iframe detection

test('slot game launches successfully @critical @game', async ({ page }) => {
  const slotGameId = process.env.GAME_SLOT_ID || 'default-slot-id';
  const gameDetailPage = new GameDetailPage(page);

  await gameDetailPage.gotoGame(slotGameId);

  // Wait for iframe to appear
  const gameFrame = page.frameLocator('iframe[src*="game"]');

  // Wait for game iframe to load
  await expect(gameDetailPage.gameIframe).toBeVisible();

  // Custom wait: check for game-specific ready indicator inside iframe
  // NOTE: Actual selector depends on provider, requires live site inspection
  await gameFrame.locator('[data-game-state="ready"]').waitFor({
    state: 'visible',
    timeout: 30_000 // Games may take longer to initialize
  });

  // Verify iframe src contains expected pattern
  const iframeSrc = await gameDetailPage.gameIframe.getAttribute('src');
  expect(iframeSrc).toContain('game');
});
```

### Pattern 2: Session Persistence Testing with storageState
**What:** Test login session persists across navigation using storageState API
**When to use:** For AUTH-02 session persistence validation
**Example:**
```typescript
// Source: https://playwright.dev/docs/auth
// Pattern: Test session persistence by navigating after login

test('login session persists across navigation @critical @auth', async ({ page, context }) => {
  const loginPage = new LoginPage(page);
  const accountPage = new AccountPage(page);
  const lobbyPage = new LobbyPage(page);

  // Login
  await loginPage.open();
  await loginPage.loginWithEnvCredentials();

  // Verify login successful
  await page.waitForURL('**/account');
  await expect(accountPage.accountHeading).toBeVisible();

  // Capture storage state after login
  const storageState = await context.storageState();
  expect(storageState.cookies).toContainEqual(
    expect.objectContaining({ name: 'session_token' }) // Adjust based on actual cookie name
  );

  // Navigate to different page
  await lobbyPage.goto();

  // Navigate back to account page
  await accountPage.goto();

  // Session should persist - user still logged in
  await expect(accountPage.accountHeading).toBeVisible();
  await expect(accountPage.logoutButton).toBeVisible();
});
```

### Pattern 3: Multi-Step Registration Flow (Stop Before Submission)
**What:** Test registration form step-by-step, validating each stage without creating real accounts
**When to use:** For AUTH-03 registration flow testing
**Example:**
```typescript
// Source: https://betterstack.com/community/guides/testing/playwright-signup-login/
// Pattern: Multi-step form with early exit

test('registration flow completes all steps @critical @auth', async ({ page }) => {
  const registrationPage = new RegistrationPage(page);

  await registrationPage.goto();

  // Step 1: Email/Password
  await registrationPage.fillEmail('test-user-' + Date.now() + '@example.com');
  await registrationPage.fillPassword('SecurePass123!');
  await registrationPage.clickNextStep();

  // Verify step 1 completed
  await expect(registrationPage.step2Container).toBeVisible();

  // Step 2: Personal Details
  await registrationPage.fillFirstName('Test');
  await registrationPage.fillLastName('User');
  await registrationPage.fillDateOfBirth('1990-01-01');
  await registrationPage.clickNextStep();

  // Verify step 2 completed
  await expect(registrationPage.step3Container).toBeVisible();

  // Step 3: Verification (STOP BEFORE SUBMIT)
  // Check that submit button is present but DON'T click it
  await expect(registrationPage.submitButton).toBeVisible();
  await expect(registrationPage.submitButton).toBeEnabled();

  // Optionally: verify form data is retained
  await expect(registrationPage.emailSummary).toHaveText(/test-user-.*@example.com/);

  // Exit test WITHOUT submitting
  console.log('Registration flow validated - stopped before account creation');
});
```

### Pattern 4: Test Tagging for Categorization
**What:** Tag tests with @critical and @smoke for selective execution and future alerting
**When to use:** All Phase 2 tests to enable filtering and severity-based alerting in Phase 5
**Example:**
```typescript
// Source: https://www.browserstack.com/guide/playwright-tags
// Pattern: Tag-based test categorization

// Critical smoke test - core revenue flow
test('user can log in @critical @smoke', async ({ page }) => {
  // Test implementation
});

// Critical game monitoring - revenue-generating
test('live dealer game launches @critical @game', async ({ page }) => {
  // Test implementation
});

// Non-critical smoke test - important but not revenue-blocking
test('homepage loads @smoke', async ({ page }) => {
  // Test implementation
});

// Run only critical tests:
// npx playwright test --grep @critical

// Run smoke tests:
// npx playwright test --grep @smoke
```

### Pattern 5: Environment-Based Game Configuration
**What:** Use environment variables to configure game IDs for each category, enabling test reusability across environments
**When to use:** For GAME-04 configurable game ID requirement
**Example:**
```typescript
// Source: https://www.browserstack.com/guide/playwright-env-variables
// Pattern: Environment-based test configuration

// .env.example
/*
GAME_SLOT_ID=starburst-slot-123
GAME_TABLE_ID=blackjack-table-456
GAME_LIVE_ID=live-roulette-789
*/

// In test file
test('slot game launches with configured game ID @critical @game', async ({ page }) => {
  const gameId = process.env.GAME_SLOT_ID;
  if (!gameId) {
    throw new Error('GAME_SLOT_ID must be set in environment');
  }

  const gameDetailPage = new GameDetailPage(page);
  await gameDetailPage.gotoGame(gameId);

  // Wait for game to launch
  await expect(gameDetailPage.gameIframe).toBeVisible();
});

// test-config.ts - centralized game config
export const gameConfig = {
  slot: process.env.GAME_SLOT_ID || 'default-slot',
  table: process.env.GAME_TABLE_ID || 'default-table',
  live: process.env.GAME_LIVE_ID || 'default-live',
} as const;
```

### Anti-Patterns to Avoid
- **Testing all games instead of representative samples:** Game monitoring is smoke-level; test 1 game per category (slot/table/live), not all 1000+ games
- **Clicking registration submit in tests:** Creates real accounts and pollutes production data; stop before final submission or use test mode flag
- **Using waitForTimeout instead of iframe ready indicators:** Arbitrary sleeps are brittle; wait for specific game ready state inside iframe
- **Hardcoding game IDs in test files:** Reduces portability across environments; use environment variables for game configuration
- **Testing authentication in every test:** Slow and brittle; use storageState fixtures (future optimization) to share authenticated sessions
- **Relying on networkidle for game iframes:** Games make continuous API calls; use specific element visibility instead

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication state management | Custom cookie saving/loading logic | Playwright's storageState API | Captures cookies + localStorage + sessionStorage automatically; handles JSON serialization; integrated with context creation |
| iframe content waiting | Custom polling loops for iframe ready state | frameLocator() with element visibility assertions | Auto-waits for iframe to appear and load; retries until timeout; handles dynamic iframe creation |
| Test categorization | Separate test directories by priority | Playwright test tagging (@critical, @smoke) | Flexible filtering with --grep; single test can have multiple tags; no directory restructuring needed |
| Multi-step form state validation | Manual form field inspection after each step | Page object methods with explicit assertions | Encapsulates validation logic; reusable across tests; clear assertion failures |
| Environment-specific configuration | Hardcoded values with comments for different envs | dotenv with .env.example pattern | Single codebase works across environments; secrets stay out of version control; CI/CD friendly |

**Key insight:** Playwright's 2026 API provides mature solutions for iframe testing, auth state management, and test organization. Avoid custom abstractions that duplicate built-in functionality or introduce complexity without value.

## Common Pitfalls

### Pitfall 1: Assuming iframe Load Event Means Game is Ready
**What goes wrong:** Test passes immediately after iframe src loads, but game canvas hasn't rendered yet, causing false positives
**Why it happens:** iframe load event fires when HTML loads, not when canvas/WebGL initializes; game providers load games asynchronously
**How to avoid:** Wait for provider-specific ready indicator inside iframe (requires live site inspection to identify correct selector)
**Warning signs:** Tests pass locally but fail in CI due to timing differences; tests pass but screenshots show blank game iframe

### Pitfall 2: Testing Registration Flow Creates Real Accounts
**What goes wrong:** Test submits registration form, creating test accounts in production database that pollute data and trigger alerts
**Why it happens:** Not stopping before final submit button click; assuming test mode exists when it doesn't
**How to avoid:** Test form validation and step progression, but stop before submit click; verify submit button is visible/enabled without clicking
**Warning signs:** Production database fills with test accounts; customer support receives verification emails for test users; rate limiting triggered

### Pitfall 3: Session Persistence Tests Don't Actually Validate Persistence
**What goes wrong:** Test navigates after login but doesn't verify session state is preserved, just that page loads
**Why it happens:** Testing navigation instead of authentication state; not checking cookies or authenticated UI elements
**How to avoid:** Assert session cookies exist after login; verify authenticated-only UI elements visible after navigation; check storageState contains expected tokens
**Warning signs:** Test passes even when session expires immediately; test doesn't catch broken session management

### Pitfall 4: Hardcoded Game IDs Break When Games are Removed
**What goes wrong:** Tests fail when specific game is removed from platform, even though game launch functionality works
**Why it happens:** Hardcoding game IDs for specific provider games that get rotated out of catalog
**How to avoid:** Use environment variables for game IDs; document which games are representative; coordinate with product team on stable test games
**Warning signs:** Tests fail with 404 errors for game pages; game IDs in test don't match production catalog

### Pitfall 5: Not Tagging Tests Prevents Selective Execution
**What goes wrong:** Cannot run critical tests separately from full suite; CI/CD runs all tests even for quick smoke checks
**Why it happens:** Not adding @critical, @smoke tags to tests during initial development
**How to avoid:** Add tags to test titles immediately during Phase 2; document tagging strategy for future test authors
**Warning signs:** CI/CD pipeline takes too long; cannot filter tests by severity; future alerting phase requires test refactoring

### Pitfall 6: Search Tests Don't Validate Results, Just Search Action
**What goes wrong:** Test fills search input and submits but doesn't verify results match query, missing broken search logic
**Why it happens:** Testing interaction (fill + submit) instead of outcome (correct results displayed)
**How to avoid:** Assert search results contain expected game after search; verify result count > 0; optionally check result relevance
**Warning signs:** Test passes when search returns no results; test doesn't catch broken search backend

### Pitfall 7: Navigation Tests Only Check URL, Not Page Content
**What goes wrong:** Test navigates and asserts URL changed but doesn't verify page content loaded, missing rendering errors
**Why it happens:** Using page.waitForURL() without checking page-specific ready state
**How to avoid:** Wait for URL change AND page-specific element (heading, hero element, data grid); use Page Object waitForReady() methods
**Warning signs:** Tests pass when pages show error messages; tests don't catch JS errors that prevent rendering

### Pitfall 8: Game Launch Tests Don't Handle Different Provider Patterns
**What goes wrong:** Tests work for one provider's iframe pattern but fail for others with different loading indicators
**Why it happens:** Assuming all game providers use same iframe structure and ready state signals
**How to avoid:** Document provider-specific patterns during live site inspection; use provider-aware wait conditions; test at least one game per provider type
**Warning signs:** Tests pass for slots but fail for live dealer games; provider-specific error messages in traces

## Code Examples

Verified patterns from official sources and research:

### Testing iframe Game Launch
```typescript
// Source: https://playwright.dev/docs/api/class-frame
// Source: https://debbie.codes/blog/testing-iframes-with-playwright/

import { test, expect } from '@playwright/test';
import { GameDetailPage } from '../pages/GameDetailPage.js';

test('slot game iframe loads and initializes @critical @game', async ({ page }) => {
  const slotGameId = process.env.GAME_SLOT_ID || 'default-slot';
  const gameDetailPage = new GameDetailPage(page);

  await gameDetailPage.gotoGame(slotGameId);

  // Step 1: Verify iframe element appears
  await expect(gameDetailPage.gameIframe).toBeVisible({ timeout: 15_000 });

  // Step 2: Access iframe content using frameLocator
  const gameFrame = page.frameLocator('iframe[src*="game"]');

  // Step 3: Wait for game-specific ready indicator
  // NOTE: Actual selector requires live site inspection
  // Examples of potential ready indicators:
  // - Canvas element with specific class
  // - "Play" button inside iframe
  // - Game logo/branding element
  // - data-game-state attribute

  // Example wait condition (adjust based on actual provider):
  await gameFrame.locator('canvas.game-canvas').waitFor({
    state: 'visible',
    timeout: 30_000 // Games may take longer than standard timeout
  });

  // Step 4: Verify iframe src contains expected pattern
  const iframeSrc = await gameDetailPage.gameIframe.getAttribute('src');
  expect(iframeSrc).toMatch(/game|provider|iframe/i);
});
```

### Testing Navigation to Multiple Pages
```typescript
// Source: https://playwright.dev/docs/best-practices
// Source: https://www.browserstack.com/guide/playwright-best-practices

import { test, expect } from '@playwright/test';

test('top navigation works - user can reach lobby and account @smoke', async ({ page }) => {
  // Start at homepage
  await page.goto('/');

  // Navigate to lobby via top nav
  await page.getByRole('link', { name: /lobby|games/i }).click();
  await page.waitForURL('**/lobby');

  // Verify lobby page loaded (not just URL)
  await expect(page.getByRole('heading', { name: /lobby|games/i })).toBeVisible();

  // Navigate to account via top nav
  await page.getByRole('link', { name: /account|profile/i }).click();
  await page.waitForURL('**/account');

  // Verify account page loaded
  await expect(page.getByRole('heading', { name: /account|profile/i })).toBeVisible();
});
```

### Testing Search Flow
```typescript
// Source: https://www.checklyhq.com/docs/learn/playwright/how-to-search/
// Source: https://www.browserstack.com/guide/playwright-best-practices

import { test, expect } from '@playwright/test';
import { LobbyPage } from '../pages/LobbyPage.js';

test('search returns results and user can open game @smoke', async ({ page }) => {
  const lobbyPage = new LobbyPage(page);

  await lobbyPage.open();

  // Execute search
  await lobbyPage.searchForGame('blackjack');

  // Wait for search results to appear
  await expect(lobbyPage.gameGrid).toBeVisible();

  // Verify at least one result exists
  const resultCount = await lobbyPage.gameGrid.locator('> *').count();
  expect(resultCount).toBeGreaterThan(0);

  // Click first result
  await lobbyPage.clickFirstGame();

  // Verify navigation to game detail page
  await page.waitForURL('**/games/**');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

### Testing Login and Session Persistence
```typescript
// Source: https://playwright.dev/docs/auth
// Source: https://betterstack.com/community/guides/testing/playwright-signup-login/

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { AccountPage } from '../pages/AccountPage.js';
import { LobbyPage } from '../pages/LobbyPage.js';

test('user can log in and reach account page @critical @auth', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const accountPage = new AccountPage(page);

  await loginPage.open();
  await loginPage.loginWithEnvCredentials();

  // Wait for login to complete
  await page.waitForURL('**/account');

  // Verify account page loaded with user-specific content
  await expect(accountPage.accountHeading).toBeVisible();
  await expect(accountPage.userEmail).toHaveText(process.env.TEST_USER_EMAIL!);
});

test('login session persists across navigation @critical @auth', async ({ page, context }) => {
  const loginPage = new LoginPage(page);
  const accountPage = new AccountPage(page);
  const lobbyPage = new LobbyPage(page);

  // Login
  await loginPage.open();
  await loginPage.loginWithEnvCredentials();
  await page.waitForURL('**/account');

  // Capture storage state
  const stateAfterLogin = await context.storageState();
  const sessionCookie = stateAfterLogin.cookies.find(c =>
    c.name.includes('session') || c.name.includes('token')
  );
  expect(sessionCookie).toBeDefined();

  // Navigate away
  await lobbyPage.goto();
  await expect(lobbyPage.gameGrid).toBeVisible();

  // Navigate back to account
  await accountPage.goto();

  // Session should persist - account page still shows user as logged in
  await expect(accountPage.accountHeading).toBeVisible();
  await expect(accountPage.logoutButton).toBeVisible();

  // Storage state should still have session cookie
  const stateAfterNav = await context.storageState();
  const persistedCookie = stateAfterNav.cookies.find(c => c.name === sessionCookie.name);
  expect(persistedCookie).toBeDefined();
});
```

### Testing Registration Flow (Stop Before Submit)
```typescript
// Source: https://blog.apify.com/playwright-how-to-automate-forms/
// Source: https://betterstack.com/community/guides/testing/playwright-signup-login/

import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage.js';

test('registration flow completes step-by-step @critical @auth', async ({ page }) => {
  const registrationPage = new RegistrationPage(page);

  await registrationPage.goto();

  // Generate unique test email
  const testEmail = `test-${Date.now()}@example.com`;

  // Step 1: Credentials
  await registrationPage.fillEmail(testEmail);
  await registrationPage.fillPassword('SecurePassword123!');
  await registrationPage.fillPasswordConfirm('SecurePassword123!');

  // Verify step 1 validation passes
  await expect(registrationPage.emailInput).toHaveValue(testEmail);

  // Progress to step 2 (if multi-step form)
  const hasMultipleSteps = await registrationPage.nextStepButton.isVisible();
  if (hasMultipleSteps) {
    await registrationPage.clickNextStep();
    await expect(registrationPage.step2Container).toBeVisible();

    // Step 2: Personal details
    await registrationPage.fillFirstName('Test');
    await registrationPage.fillLastName('User');
    await registrationPage.fillDateOfBirth('1990-01-01');

    await registrationPage.clickNextStep();
    await expect(registrationPage.step3Container).toBeVisible();
  }

  // Final step: verify submit button is present and enabled
  await expect(registrationPage.submitButton).toBeVisible();
  await expect(registrationPage.submitButton).toBeEnabled();

  // STOP HERE - do NOT click submit
  // Test validates form structure and validation, not account creation
  console.log('Registration flow validated without creating account');
});
```

### Testing Homepage Hero Element
```typescript
// Source: https://playwright.dev/docs/test-assertions
// Source: https://www.browserstack.com/guide/playwright-assertions

import { test, expect } from '@playwright/test';

test('homepage loads and hero element is visible @smoke', async ({ page }) => {
  await page.goto('/');

  // Verify hero element appears (adjust selector based on actual site)
  const hero = page.locator('[data-testid="hero"]').or(
    page.locator('.hero').or(
      page.locator('section').first()
    )
  );

  await expect(hero).toBeVisible();

  // Optional: verify hero contains expected content
  await expect(hero).toContainText(/welcome|play|casino/i);
});
```

### Environment-Based Game Configuration
```typescript
// Source: https://www.browserstack.com/guide/playwright-env-variables

// tests/helpers/game-config.ts
export const gameConfig = {
  slot: {
    id: process.env.GAME_SLOT_ID || 'default-slot-game',
    name: process.env.GAME_SLOT_NAME || 'Starburst',
  },
  table: {
    id: process.env.GAME_TABLE_ID || 'default-table-game',
    name: process.env.GAME_TABLE_NAME || 'Blackjack',
  },
  live: {
    id: process.env.GAME_LIVE_ID || 'default-live-game',
    name: process.env.GAME_LIVE_NAME || 'Live Roulette',
  },
} as const;

// In test file
import { gameConfig } from '../helpers/game-config.js';

test('configured slot game launches @critical @game', async ({ page }) => {
  const gameDetailPage = new GameDetailPage(page);

  await gameDetailPage.gotoGame(gameConfig.slot.id);
  await expect(gameDetailPage.gameIframe).toBeVisible();

  // Optionally verify game name matches configuration
  await expect(gameDetailPage.gameName).toContainText(gameConfig.slot.name);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| page.frame() for iframes | frameLocator() for dynamic iframes | Playwright 1.17+ (2021) | frameLocator auto-waits for iframe to appear; handles dynamic iframe creation |
| Manual cookie inspection for session | storageState() API | Playwright 1.11+ (2021) | Single API captures cookies + localStorage + sessionStorage; easier session testing |
| Hard-coded test data | Environment variables for configuration | Standard practice 2023+ | Tests work across environments; game IDs configurable without code changes |
| Separate test files by priority | Test tagging (@smoke, @critical) | Playwright 1.27+ (2022) | Flexible filtering; single test can have multiple tags |
| Testing all registration fields | Stop before submit with validation checks | Best practice 2024+ | Avoids creating test accounts; validates flow without side effects |
| waitForLoadState('networkidle') for games | Custom game-ready indicators | Discouraged 2023+ | Games make continuous API calls; networkidle never fires or takes too long |

**Deprecated/outdated:**
- **Using page.frame() without waiting for iframe to appear**: frameLocator() replaces this pattern with auto-waiting
- **Hardcoding game IDs in test files**: Environment variables are now standard for configuration
- **Testing iframe content with CSS selectors only**: Provider-specific ready indicators are more reliable than generic selectors

## Open Questions

1. **What are the actual game provider iframe patterns?**
   - What we know: Games load in iframes with src containing provider URLs; canvas-based rendering is common
   - What's unclear: Specific iframe src patterns for each provider; game-ready indicators vary by provider; which providers are used (slot/table/live)
   - Recommendation: Inspect production site for 1 game in each category (slot/table/live); document iframe src patterns and ready indicators; update GameDetailPage with provider-specific waits

2. **Does registration flow have test mode or staging environment?**
   - What we know: Production site doesn't allow real account creation in tests (requirement AUTH-03)
   - What's unclear: Whether test mode flag exists (e.g., ?test=true); whether staging environment mirrors production registration flow; how to stop before account creation
   - Recommendation: Coordinate with backend team to identify test mode flag or create staging test user endpoint; alternatively, test form validation only and stop before final submit

3. **What session cookie names does the site use?**
   - What we know: Login creates session that should persist across navigation
   - What's unclear: Cookie name(s) for session (session_token, auth_token, etc.); whether localStorage or sessionStorage is used
   - Recommendation: Inspect production login flow in browser DevTools; document cookie names for session persistence assertions; update test to check actual cookie names

4. **What are the actual hero element selectors?**
   - What we know: Homepage has hero element that should be visible (SMOKE-01)
   - What's unclear: Specific selector (class, data-testid, role); whether hero is static or dynamic
   - Recommendation: Inspect production homepage; document hero selector; update test with actual selector using role-based > data-testid > CSS fallback pattern

5. **How should tests handle lobby game categories?**
   - What we know: Lobby displays game categories (SMOKE-03)
   - What's unclear: Category structure (tabs, dropdown, grid); category names; whether categories are static or dynamic
   - Recommendation: Inspect production lobby; document category UI pattern and names; update LobbyPage with appropriate selectors

6. **Should auth state be shared via fixtures for faster tests?**
   - What we know: Playwright fixtures can share authenticated state across tests to avoid repeated logins
   - What's unclear: Whether Phase 2 should implement auth fixtures or test login in each test
   - Recommendation: Start with login in each test for Phase 2 (simpler, validates auth flow); consider fixtures optimization in Phase 3 or later if test suite becomes slow

## Sources

### Primary (HIGH confidence)
- [Playwright Official Docs - Frames](https://playwright.dev/docs/api/class-frame) - frameLocator() API and iframe handling
- [Playwright Official Docs - Authentication](https://playwright.dev/docs/auth) - storageState API and session management
- [Playwright Official Docs - Assertions](https://playwright.dev/docs/test-assertions) - toBeVisible() and web-first assertions
- [Playwright Official Docs - Test Annotations](https://playwright.dev/docs/test-annotations) - Test tagging implementation
- [Playwright Official Docs - Best Practices](https://playwright.dev/docs/best-practices) - Selector strategies and navigation patterns
- [Playwright Official Docs - Navigations](https://playwright.dev/docs/navigations) - waitForURL() and navigation handling

### Secondary (MEDIUM confidence)
- [BrowserStack - Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices) - Test isolation and waiting strategies
- [BrowserStack - Playwright Tags](https://www.browserstack.com/guide/playwright-tags) - Test categorization patterns
- [BrowserStack - Playwright Environment Variables 2025](https://www.browserstack.com/guide/playwright-env-variables) - Configuration management
- [BrowserStack - Playwright Assertions 2026](https://www.browserstack.com/guide/playwright-assertions) - Assertion best practices
- [Better Stack - E2E Testing Signup and Login](https://betterstack.com/community/guides/testing/playwright-signup-login/) - Authentication flow patterns
- [Debbie Codes - Testing iframes with Playwright](https://debbie.codes/blog/testing-iframes-with-playwright/) - iframe testing patterns
- [TestMu - Handling iFrames in Playwright](https://www.testmuai.com/learning-hub/handling-iframes-in-playwright/) - iframe detection and waiting
- [Checkly - How to search with Playwright](https://www.checklyhq.com/docs/learn/playwright/how-to-search/) - Search functionality testing
- [Apify - Form automation with Playwright](https://blog.apify.com/playwright-how-to-automate-forms/) - Multi-step form patterns
- [Medium - Using Playwright's storageState](https://medium.com/@byteAndStream/using-playwrights-storagestate-for-persistent-authentication-f5b7384995d6) - Session persistence patterns
- [Medium - Playwright Tags](https://medium.com/@merisstupar11/strategic-tagging-optimizing-your-playwright-test-suit-4ab109343fed) - Strategic tagging approaches

### Tertiary (LOW confidence - requires validation)
- [CredibleSoft - Online Casino Game Testing Guide 2026](https://crediblesoft.com/comprehensive-guide-on-online-casino-game-testing/) - Casino testing overview (industry context)
- [Ministry of Testing - Casino Game Automation Discussion](https://club.ministryoftesting.com/t/has-anyone-had-experience-automating-casino-online-games-slot-machines/71857) - Community discussion on casino game testing challenges
- Various Medium articles on Playwright patterns - Useful examples but not authoritative

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; using established Phase 1 infrastructure
- Architecture patterns: HIGH - Patterns verified against official Playwright docs and recent 2025-2026 guides
- iframe testing: MEDIUM-HIGH - frameLocator() approach verified, but actual game provider patterns require live site inspection
- Session persistence: HIGH - storageState API is official Playwright feature with comprehensive documentation
- Registration flow: MEDIUM - Pattern verified, but actual implementation depends on site's multi-step form structure
- Test tagging: HIGH - Official Playwright feature with clear documentation
- Pitfalls: HIGH - Derived from official best practices and common anti-patterns in research

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days; Playwright patterns are stable, but site-specific selectors require live inspection)

---

## Key Findings Summary

1. **iframe game testing requires frameLocator() + custom ready indicators**: Standard load events insufficient for canvas games; provider-specific wait conditions needed
2. **storageState API simplifies session persistence testing**: Single API captures all session data; enables efficient validation of auth state across navigation
3. **Registration flow testing must stop before submit**: Validate form structure and step progression without creating real accounts; use test mode flag if available
4. **Test tagging enables future alerting**: @critical and @smoke tags required for Phase 5 severity-based alerting; add during Phase 2 to avoid refactoring
5. **Environment variables required for game IDs**: GAME-04 requires configurable game IDs per category; use dotenv pattern established in Phase 1
6. **Live site inspection required**: Hero element selectors, iframe patterns, session cookie names, lobby categories, and game-ready indicators all require production site inspection
7. **Navigation testing must validate content, not just URL**: page.waitForURL() insufficient; assert page-specific elements visible after navigation
8. **Search testing must validate results**: Fill + submit insufficient; assert search results appear and contain relevant games
9. **Avoid networkidle for game iframes**: Games make continuous API calls; use specific element visibility instead
10. **Page objects from Phase 1 provide foundation**: LobbyPage, LoginPage, GameDetailPage, RegistrationPage, AccountPage already exist with selector chains; update with actual production selectors
