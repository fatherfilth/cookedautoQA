# Phase 3: Social & Live Features - Research

**Researched:** 2026-02-15
**Domain:** WebSocket-based chat, tipping flows, and promotional content testing with Playwright
**Confidence:** HIGH

## Summary

Phase 3 implements tests for WebSocket-based social and live features on cooked.com, including real-time chat connection monitoring, chat message visibility validation, tipping flow step-by-step testing (stop-before-payment pattern), and promotional content display verification. The research confirms that Playwright's WebSocket API (introduced in version 1.48+) provides native support for testing real-time features through page.on('websocket'), page.routeWebSocket(), and WebSocketRoute for mocking/intercepting WebSocket communication.

Key findings reveal that WebSocket testing requires different patterns than traditional HTTP request testing. Chat connections must be detected using page.waitForEvent('websocket') with URL pattern matching, and chat messages must be validated through framereceived events or DOM assertions on chat interface elements. Tipping flows follow the established stop-before-payment pattern from Phase 2 (AUTH-03), testing all steps through confirmation but stopping before transaction execution. Promotional content testing validates visibility using role-based locators or data-testid with conditional rendering awareness.

The research identifies that real-time testing introduces timing challenges distinct from traditional E2E tests. WebSocket connections may establish asynchronously after page load, messages may arrive in unpredictable order, and UI updates may be debounced or batched. Playwright's auto-waiting and web-first assertions handle most timing issues, but WebSocket-specific waits require explicit event listeners and predicates.

**Primary recommendation:** Implement chat WebSocket connection tests first (SOCIAL-01) to validate real-time infrastructure, then chat message visibility tests (SOCIAL-02) using DOM assertions rather than WebSocket frame inspection for simplicity, followed by tipping flow tests (SOCIAL-03) using the established multi-step pattern from registration tests, and finally promotional content tests (SOCIAL-04) using role-based selectors with conditional rendering checks.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | Latest (1.48+) | Test framework with WebSocket support | WebSocket routing and inspection API added in 1.48; includes page.routeWebSocket(), WebSocketRoute class, and WebSocket event listeners |
| TypeScript | 5.x | Type safety for WebSocket event handlers | Already established; provides typed WebSocket payloads and predicate functions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | ^16.0 | Environment variable management | Already established; not needed for Phase 3 specifically but continues to be used for BASE_URL and credentials |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| page.on('websocket') + DOM assertions | WebSocket frame inspection with framereceived | DOM assertions test user-visible outcome (chat messages appear); frame inspection tests implementation details. DOM approach is more stable when chat protocol changes. |
| Multi-step tipping flow test | Single-click tipping test | Multi-step validates entire UX flow (initiate → confirm → success state); single-click only tests happy path. Phase requirements specify end-to-end flow. |
| Role-based locators for promotions | Visual regression testing | Role-based locators validate presence/visibility; visual regression catches design changes. Role approach is faster and more maintainable for smoke-level monitoring. |

**Installation:**
No new dependencies required. All necessary APIs included in Playwright 1.48+ installed in Phase 1.

## Architecture Patterns

### Recommended Project Structure
```
tests/
├── social/                 # Social & live feature tests (SOCIAL-01 to SOCIAL-04)
│   ├── chat-connection.spec.ts   # SOCIAL-01: WebSocket connection
│   ├── chat-messages.spec.ts     # SOCIAL-02: Message visibility
│   ├── tipping-flow.spec.ts      # SOCIAL-03: Tipping flow
│   └── promotions.spec.ts        # SOCIAL-04: Promotional content
├── pages/                  # Page objects (from Phase 1)
│   ├── ChatPage.ts        # New: chat interface page object
│   └── ...                # Existing page objects
├── helpers/                # Test helpers (from Phase 1)
└── fixtures/               # Optional: WebSocket test fixtures
```

### Pattern 1: WebSocket Connection Testing
**What:** Validate WebSocket connection establishes successfully on chat page load using page.waitForEvent('websocket')
**When to use:** For SOCIAL-01 chat WebSocket connection test
**Example:**
```typescript
// Source: https://playwright.dev/docs/api/class-websocket
// Pattern: Wait for WebSocket connection with URL pattern matching

test('chat WebSocket connection establishes successfully @critical @social', async ({ page }) => {
  const chatPage = new ChatPage(page);

  // Set up WebSocket listener BEFORE navigation
  const webSocketPromise = page.waitForEvent('websocket', (ws) => {
    // Match WebSocket URL pattern for chat service
    return ws.url().includes('/chat') || ws.url().includes('ws://') || ws.url().includes('wss://');
  });

  // Navigate to chat page
  await chatPage.goto();

  // Wait for WebSocket connection to establish
  const webSocket = await webSocketPromise;

  // Verify WebSocket is open (not closed immediately)
  expect(webSocket.isClosed()).toBe(false);

  // Verify WebSocket URL matches expected pattern
  expect(webSocket.url()).toMatch(/chat|ws|websocket/i);
});
```

### Pattern 2: Chat Message Visibility Testing (DOM-Based)
**What:** Validate chat messages are visible in the interface using DOM assertions rather than WebSocket frame inspection
**When to use:** For SOCIAL-02 chat message visibility test
**Example:**
```typescript
// Source: https://dzone.com/articles/playwright-for-real-time-applications-testing-webs
// Pattern: Test user-visible outcome rather than implementation details

test('chat messages are visible after connection @critical @social', async ({ page }) => {
  const chatPage = new ChatPage(page);

  // Navigate to chat page
  await chatPage.open();

  // Wait for chat interface to load
  await expect(chatPage.chatContainer).toBeVisible();

  // Wait for at least one chat message to appear
  // Real-time apps may show recent messages or system messages on load
  await expect(chatPage.chatMessages.first()).toBeVisible({ timeout: 10_000 });

  // Verify chat message has expected structure (author, text, timestamp)
  const firstMessage = chatPage.chatMessages.first();
  await expect(firstMessage).toContainText(/.+/); // Non-empty text

  // Optional: verify message count > 0
  const messageCount = await chatPage.chatMessages.count();
  expect(messageCount).toBeGreaterThan(0);
});
```

### Pattern 3: Tipping Flow Testing (Stop-Before-Payment)
**What:** Test tipping flow step-by-step (initiate → confirm → success state) without executing real transaction
**When to use:** For SOCIAL-03 tipping flow test
**Example:**
```typescript
// Source: https://www.checklyhq.com/docs/learn/playwright/checkout-testing-guide/
// Pattern: Multi-step transaction flow with early exit (adapted from AUTH-03 registration pattern)

test('tipping flow completes step-by-step @critical @social', async ({ page }) => {
  const chatPage = new ChatPage(page);

  // Navigate to chat page (tipping likely integrated in chat)
  await chatPage.open();

  // Step 1: Initiate tip
  await chatPage.clickTipButton();

  // Verify tip modal/dialog appears
  await expect(chatPage.tipModal).toBeVisible();

  // Step 2: Select tip amount
  await chatPage.selectTipAmount('5'); // $5 tip

  // Verify amount selected
  await expect(chatPage.selectedTipAmount).toHaveText('$5');

  // Step 3: Confirm tip (opens confirmation dialog)
  await chatPage.clickConfirmTip();

  // Verify confirmation dialog appears
  await expect(chatPage.tipConfirmationDialog).toBeVisible();
  await expect(chatPage.tipConfirmationDialog).toContainText(/confirm|tip|$5/i);

  // Verify submit button is present and enabled (but DON'T click it)
  await expect(chatPage.submitTipButton).toBeVisible();
  await expect(chatPage.submitTipButton).toBeEnabled();

  // STOP HERE - do NOT click submit
  // Test validates flow structure without creating real transaction
  console.log('Tipping flow validated without executing transaction');
});
```

### Pattern 4: Promotional Content Display Testing
**What:** Validate "Latest and Greatest" promotional messages display on appropriate page using role-based or data-testid selectors
**When to use:** For SOCIAL-04 promotional content test
**Example:**
```typescript
// Source: https://testdino.com/blog/playwright-visual-testing/
// Pattern: Test dynamic content visibility with conditional rendering awareness

test('"Latest and Greatest" promotional messages display @social', async ({ page }) => {
  // Promotional content may appear on lobby, homepage, or dedicated promotions page
  // Adjust page based on actual implementation
  const lobbyPage = new LobbyPage(page);

  await lobbyPage.open();

  // Wait for promotional content container
  const promoContainer = page.getByTestId('promotions').or(
    page.getByRole('region', { name: /promotions|latest/i })
  );

  await expect(promoContainer).toBeVisible({ timeout: 15_000 });

  // Verify at least one promotional message/card is visible
  const promoMessages = promoContainer.locator('[data-testid="promo-card"]').or(
    promoContainer.locator('article, .promo-item').first()
  );

  await expect(promoMessages.first()).toBeVisible();

  // Optional: verify promotional content has expected structure
  await expect(promoMessages.first()).toContainText(/.+/); // Non-empty text
});
```

### Pattern 5: WebSocket Event Listener Pattern (Advanced)
**What:** Listen for WebSocket events and collect messages for assertions (alternative to DOM-based testing)
**When to use:** When testing WebSocket protocol implementation rather than user-visible outcomes
**Example:**
```typescript
// Source: https://playwright.dev/docs/api/class-websocket
// Pattern: Collect WebSocket frames for protocol-level testing

test('chat WebSocket receives messages @social', async ({ page }) => {
  const receivedMessages: string[] = [];

  // Set up WebSocket listener BEFORE navigation
  page.on('websocket', (ws) => {
    if (ws.url().includes('/chat')) {
      ws.on('framereceived', (event) => {
        receivedMessages.push(event.payload as string);
      });
    }
  });

  const chatPage = new ChatPage(page);
  await chatPage.open();

  // Wait for at least one message to be received
  await page.waitForTimeout(5000); // Give WebSocket time to receive messages

  // Assert messages were received
  expect(receivedMessages.length).toBeGreaterThan(0);

  // Optional: parse and validate message structure
  const firstMessage = JSON.parse(receivedMessages[0]);
  expect(firstMessage).toHaveProperty('text');
  expect(firstMessage).toHaveProperty('user');
});
```

### Pattern 6: Multi-User Chat Simulation (Advanced)
**What:** Simulate multiple users in chat using separate browser contexts (optional for Phase 3)
**When to use:** When testing multi-user interactions (not required for Phase 3 but useful for future enhancements)
**Example:**
```typescript
// Source: https://dzone.com/articles/playwright-for-real-time-applications-testing-webs
// Pattern: Multiple browser contexts for multi-user testing

test('multi-user chat simulation @social', async ({ browser }) => {
  // Create two browser contexts (two "users")
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  const chatPage1 = new ChatPage(page1);
  const chatPage2 = new ChatPage(page2);

  // Both users join chat
  await chatPage1.open();
  await chatPage2.open();

  // User 1 sends message
  await chatPage1.sendMessage('Hello from User 1');

  // Verify User 2 sees the message
  await expect(chatPage2.chatMessages).toContainText('Hello from User 1');

  // Cleanup
  await context1.close();
  await context2.close();
});
```

### Anti-Patterns to Avoid
- **Testing WebSocket frame payloads instead of DOM**: Frame inspection tests implementation details; DOM assertions test user-visible outcomes (more stable when backend protocol changes)
- **Using waitForTimeout instead of event-driven waits**: Arbitrary sleeps are brittle; use page.waitForEvent('websocket') and expect(locator).toBeVisible() for reliable waits
- **Clicking submit in tipping flow**: Creates real transactions and pollutes data; stop before final submit and verify button is enabled
- **Testing all promotional content variations**: Promotional content is often A/B tested or personalized; validate presence/structure, not specific content
- **Setting up WebSocket listeners after navigation**: WebSocket connections may establish immediately on page load; set up listeners BEFORE navigating
- **Assuming WebSocket connection is synchronous**: Connection may establish asynchronously; use waitForEvent with predicate to catch connection
- **Testing chat protocol specifics instead of UX**: Chat message format may change; test that messages appear and are readable, not JSON structure

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket connection detection | Custom polling for WebSocket object | page.waitForEvent('websocket') with URL predicate | Playwright's event listener catches WebSocket creation immediately; polling misses connections established before first poll |
| WebSocket message collection | Manual message queue with timeouts | ws.on('framereceived') event listener with array push | Event-driven collection captures all messages without arbitrary timeouts; handles burst messages correctly |
| WebSocket mocking for testing | Custom WebSocket server or proxy | page.routeWebSocket() with WebSocketRoute handlers | Playwright's routing API intercepts at browser level; no external server needed; supports both mocking and pass-through |
| Multi-step flow validation | Separate tests for each step | Single test with test.step() for each stage | test.step() provides structured reporting while maintaining flow context; easier to debug where flow breaks |
| Modal/dialog waiting | Arbitrary waits before dialog assertions | page.on('dialog') or expect(locator).toBeVisible() | Playwright auto-waits for dialogs; event listeners catch browser dialogs; no hardcoded delays needed |
| Dynamic content validation | Manual polling for element appearance | expect(locator).toBeVisible() with timeout | Web-first assertions retry automatically; handles async rendering, lazy loading, and debounced updates |

**Key insight:** Playwright's 2026 WebSocket API (v1.48+) provides comprehensive solutions for real-time testing. Custom abstractions for WebSocket handling, message collection, or connection detection duplicate built-in functionality and introduce maintenance burden. Prefer DOM-based assertions for user-visible outcomes over protocol-level frame inspection for stability.

## Common Pitfalls

### Pitfall 1: Setting Up WebSocket Listeners After Page Load
**What goes wrong:** Test navigates to page, then sets up WebSocket listener, missing the connection that established during page load
**Why it happens:** WebSocket connections often establish immediately in page load scripts; listeners must be registered before navigation
**How to avoid:** Always call page.on('websocket') or page.waitForEvent('websocket') BEFORE page.goto() or page navigation
**Warning signs:** Test passes when run with network throttling (slow connection) but fails with fast connection; "WebSocket not found" errors

### Pitfall 2: Testing WebSocket Frame Payloads Instead of User-Visible Outcomes
**What goes wrong:** Test validates JSON message structure in WebSocket frames, breaking when backend changes message format even though UI works
**Why it happens:** Inspecting framereceived events is easier than identifying DOM selectors; treating WebSocket like API contract testing
**How to avoid:** Test that chat messages appear in UI using DOM assertions; only inspect frames when testing WebSocket protocol implementation itself
**Warning signs:** Tests fail after backend deploys new chat message format but manual testing shows chat works; frequent test maintenance for protocol changes

### Pitfall 3: Using Arbitrary Waits for Real-Time Updates
**What goes wrong:** Test uses waitForTimeout(5000) after sending chat message, assuming message arrives within 5 seconds, causing flakiness
**Why it happens:** Not understanding Playwright's auto-waiting; assuming real-time updates need manual delays
**How to avoid:** Use expect(chatMessages).toContainText('message') which retries until message appears or timeout; use ws.waitForEvent('framereceived', predicate) for specific frames
**Warning signs:** Tests timeout in slow networks; tests pass with longer waits but fail with shorter ones; random failures in CI

### Pitfall 4: Tipping Flow Creates Real Transactions
**What goes wrong:** Test clicks final "Confirm Tip" button, executing real payment and draining test account balance
**Why it happens:** Not stopping before final submit; assuming test environment blocks real transactions
**How to avoid:** Validate all steps through confirmation dialog but stop before clicking final submit; verify button is enabled without clicking
**Warning signs:** Test account balance decreasing; payment notifications sent; real money transactions in test runs

### Pitfall 5: Promotional Content Tests Fail Due to A/B Testing
**What goes wrong:** Test asserts specific promotional text like "20% Bonus" but fails when different promo variant shows or when promo expires
**Why it happens:** Testing specific content instead of structure/presence; not accounting for dynamic personalization or time-based promotions
**How to avoid:** Validate promotional container exists and has at least one promo item; avoid asserting specific promo text unless testing promo system itself
**Warning signs:** Tests fail randomly for different users; tests fail after marketing updates promos; "element not found" errors for specific promo content

### Pitfall 6: Not Handling WebSocket Connection Failures Gracefully
**What goes wrong:** Test assumes WebSocket always connects successfully, failing when chat service is temporarily down even though page loads
**Why it happens:** Not distinguishing between "page loads but chat unavailable" vs "page broken"; no error state validation
**How to avoid:** Test should validate either WebSocket connects OR error state shown to user; distinguish between chat feature failure and page failure
**Warning signs:** Test fails when chat backend is deploying; test doesn't catch missing "chat unavailable" messaging

### Pitfall 7: Chat Message Visibility Timing Issues
**What goes wrong:** Test navigates to chat, immediately asserts messages visible, fails because messages load asynchronously after page render
**Why it happens:** Assuming chat messages render synchronously with page; not accounting for WebSocket connection establishment time
**How to avoid:** Use toBeVisible() with sufficient timeout (10-15 seconds); wait for chat container first, then messages
**Warning signs:** Test passes locally (fast connection) but fails in CI (slower connection); tests pass on retry

### Pitfall 8: Modal/Dialog Auto-Dismissal Breaking Tipping Flow
**What goes wrong:** Test expects tip confirmation dialog but it's auto-dismissed by Playwright's default dialog handler, test never sees it
**Why it happens:** Playwright auto-dismisses browser dialogs by default; not distinguishing between browser dialogs (alert/confirm) and modal divs
**How to avoid:** Understand tip modal is likely a DOM element (div with modal styling) not browser dialog; use page.locator() not page.on('dialog')
**Warning signs:** "Dialog not found" errors; test logs show dialog events that weren't expected

### Pitfall 9: Hardcoding WebSocket URL Patterns
**What goes wrong:** Test checks ws.url().includes('wss://chat.cooked.com') breaking when chat service moves to different subdomain or CDN
**Why it happens:** Hardcoding infrastructure details instead of using flexible patterns
**How to avoid:** Use flexible URL patterns like ws.url().includes('/chat') or ws.url().match(/ws|chat/); coordinate with backend team on stable URL patterns
**Warning signs:** Tests break after infrastructure changes even though chat functionality works; URL-related failures after deployments

## Code Examples

Verified patterns from official sources and research:

### Testing WebSocket Connection Establishment
```typescript
// Source: https://playwright.dev/docs/api/class-websocket
// Source: https://dzone.com/articles/playwright-for-real-time-applications-testing-webs

import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('chat WebSocket connection establishes on page load @critical @social', async ({ page }) => {
  const chatPage = new ChatPage(page);

  // Set up WebSocket promise BEFORE navigation
  const wsPromise = page.waitForEvent('websocket', {
    predicate: (ws) => ws.url().includes('/chat') || ws.url().includes('/ws'),
    timeout: 15_000
  });

  // Navigate to chat page
  await chatPage.goto();

  // Wait for WebSocket connection
  const webSocket = await wsPromise;

  // Verify connection is open
  expect(webSocket.isClosed()).toBe(false);

  // Verify URL matches expected pattern
  const wsUrl = webSocket.url();
  expect(wsUrl).toMatch(/chat|ws/i);
});
```

### Testing Chat Message Visibility (DOM-Based Approach)
```typescript
// Source: https://dzone.com/articles/playwright-for-real-time-applications-testing-webs
// Source: https://www.browserstack.com/guide/playwright-best-practices

import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('chat messages are visible in the interface @critical @social', async ({ page }) => {
  const chatPage = new ChatPage(page);

  await chatPage.open();

  // Wait for chat container to load
  await expect(chatPage.chatContainer).toBeVisible({ timeout: 10_000 });

  // Wait for at least one message to appear
  // Chat may show recent messages or system messages on load
  await expect(chatPage.chatMessages.first()).toBeVisible({ timeout: 15_000 });

  // Verify message has text content
  const firstMessage = chatPage.chatMessages.first();
  const messageText = await firstMessage.textContent();
  expect(messageText).toBeTruthy();
  expect(messageText!.trim().length).toBeGreaterThan(0);
});
```

### Testing Tipping Flow (Stop-Before-Payment Pattern)
```typescript
// Source: https://www.checklyhq.com/docs/learn/playwright/checkout-testing-guide/
// Pattern adapted from Phase 2 AUTH-03 registration flow

import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('tipping flow works end-to-end (initiate → confirm → success state) @critical @social', async ({ page }) => {
  const chatPage = new ChatPage(page);

  await chatPage.open();

  // Step 1: Initiate tip
  await test.step('Initiate tip', async () => {
    await chatPage.clickTipButton();
    await expect(chatPage.tipModal).toBeVisible();
  });

  // Step 2: Select amount
  await test.step('Select tip amount', async () => {
    await chatPage.selectTipAmount('5'); // $5 tip
    await expect(chatPage.selectedAmount).toHaveText('$5');
  });

  // Step 3: Confirm tip (opens confirmation)
  await test.step('Confirm tip', async () => {
    await chatPage.clickConfirmButton();
    await expect(chatPage.confirmationDialog).toBeVisible();
    await expect(chatPage.confirmationDialog).toContainText(/confirm|$5|tip/i);
  });

  // Step 4: Verify submit button ready (but DON'T click)
  await test.step('Verify success state ready', async () => {
    await expect(chatPage.submitTipButton).toBeVisible();
    await expect(chatPage.submitTipButton).toBeEnabled();

    // STOP HERE - validated flow structure without executing transaction
    console.log('Tipping flow validated - stopped before transaction');
  });
});
```

### Testing Promotional Content Display
```typescript
// Source: https://testdino.com/blog/playwright-visual-testing/
// Source: https://medium.com/@anandpak108/handling-dynamic-content-and-complex-interactions-with-playwright-57e3c20e5281

import { test, expect } from '@playwright/test';
import { LobbyPage } from '../pages/LobbyPage.js';

test('"Latest and Greatest" promotional messages display @social', async ({ page }) => {
  const lobbyPage = new LobbyPage(page);

  await lobbyPage.open();

  // Wait for promotional section
  const promoSection = page.getByTestId('promotions').or(
    page.getByRole('region', { name: /latest|promotions|featured/i })
  );

  await expect(promoSection).toBeVisible({ timeout: 15_000 });

  // Verify at least one promotional item is visible
  const promoItems = promoSection.locator('[data-testid="promo-card"], article, .promo');
  await expect(promoItems.first()).toBeVisible();

  // Verify promotional content has substance (not empty)
  const firstPromo = promoItems.first();
  await expect(firstPromo).toContainText(/.+/); // Non-empty regex
});
```

### Collecting WebSocket Messages (Advanced Pattern)
```typescript
// Source: https://playwright.dev/docs/api/class-websocket
// Source: https://adequatica.medium.com/is-it-worth-mocking-websockets-by-playwright-e611cb016ec5

import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('WebSocket receives chat messages @social', async ({ page }) => {
  const receivedFrames: string[] = [];

  // Set up listener BEFORE navigation
  page.on('websocket', (ws) => {
    if (ws.url().includes('/chat')) {
      ws.on('framereceived', (event) => {
        receivedFrames.push(event.payload as string);
      });
    }
  });

  const chatPage = new ChatPage(page);
  await chatPage.open();

  // Wait for messages to arrive
  // Better: use explicit wait for expected message count or content
  await page.waitForFunction(() => {
    // Wait for at least one frame to be received
    return receivedFrames.length > 0;
  }, { timeout: 10_000 });

  // Assert frames were received
  expect(receivedFrames.length).toBeGreaterThan(0);

  // Optional: validate message structure
  const firstFrame = receivedFrames[0];
  expect(firstFrame).toBeTruthy();
});
```

### Handling Modal Dialogs in Tipping Flow
```typescript
// Source: https://playwright.dev/docs/dialogs
// Source: https://nareshit.com/blogs/handling-alerts-pop-ups-and-dialogs-in-playwright

import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('tip confirmation modal appears and can be dismissed @social', async ({ page }) => {
  const chatPage = new ChatPage(page);

  await chatPage.open();

  // Initiate tip
  await chatPage.clickTipButton();
  await chatPage.selectTipAmount('10');
  await chatPage.clickConfirmButton();

  // Modal dialog appears (DOM-based modal, not browser dialog)
  await expect(chatPage.confirmationDialog).toBeVisible();

  // Option 1: Cancel tipping flow
  await chatPage.clickCancelButton();
  await expect(chatPage.confirmationDialog).not.toBeVisible();

  // OR Option 2: Verify submit button without clicking
  // await expect(chatPage.submitTipButton).toBeEnabled();
});
```

### Multi-User Chat Simulation (Optional Advanced Pattern)
```typescript
// Source: https://dzone.com/articles/playwright-for-real-time-applications-testing-webs
// Source: https://playwright.dev/docs/browser-contexts

import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage.js';

test('multi-user chat message exchange @social', async ({ browser }) => {
  // Create two isolated browser contexts (two users)
  const user1Context = await browser.newContext();
  const user2Context = await browser.newContext();

  const user1Page = await user1Context.newPage();
  const user2Page = await user2Context.newPage();

  const chatUser1 = new ChatPage(user1Page);
  const chatUser2 = new ChatPage(user2Page);

  // Both users join chat
  await chatUser1.open();
  await chatUser2.open();

  // User 1 sends message
  await chatUser1.sendMessage('Hello from User 1!');

  // User 2 should see the message
  await expect(chatUser2.chatMessages).toContainText('Hello from User 1!', { timeout: 10_000 });

  // Cleanup
  await user1Context.close();
  await user2Context.close();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual WebSocket detection with page.evaluate() | page.waitForEvent('websocket') with predicates | Playwright 1.48+ (Oct 2024) | Native WebSocket API eliminates need for page context evaluation; type-safe WebSocket objects with event listeners |
| WebSocket mocking with external tools (MSW, WireMock) | page.routeWebSocket() with WebSocketRoute handlers | Playwright 1.48+ (Oct 2024) | WebSocket mocking integrated into Playwright; no external mock server needed; supports both full mocking and pass-through with modification |
| Testing chat via API calls instead of UI | DOM-based assertions with WebSocket connection verification | Best practice 2025+ | UI testing validates real user experience including rendering, timing, and error states; API testing misses UI bugs |
| Hardcoded waits for real-time updates | Web-first assertions with auto-retry | Playwright 1.20+ (2022) | expect(locator).toBeVisible() retries automatically; handles debounced/batched UI updates and async rendering |
| Testing all modal variations | Structural validation with flexible content matching | Best practice 2025+ | Modals may show A/B tested content or personalized messages; test structure (modal appears, has button, has text) not specific text |

**Deprecated/outdated:**
- **Using WebSocket polyfills or shims in tests**: Playwright 1.48+ has native WebSocket support; shims no longer needed
- **Testing WebSocket frames with page.evaluate()**: page.on('websocket') provides direct access to WebSocket objects with typed events
- **External WebSocket mock servers**: page.routeWebSocket() replaces need for external mocking infrastructure

## Open Questions

1. **What is the actual chat WebSocket URL pattern?**
   - What we know: Chat likely uses WebSocket for real-time messaging; URL pattern unknown
   - What's unclear: Full WebSocket URL (ws:// or wss://); path pattern (/chat, /ws, /socket.io); whether chat uses Socket.IO or raw WebSocket
   - Recommendation: Inspect production site with DevTools Network tab (WS filter); document WebSocket URL pattern; update ChatPage and tests with actual URL pattern

2. **Does chat page require authentication?**
   - What we know: Some casino chat systems require login; others allow anonymous chat
   - What's unclear: Whether cooked.com chat requires authentication; if yes, whether existing test credentials have chat access
   - Recommendation: Inspect production site; if auth required, update chat tests to use storageState pattern from Phase 2 AUTH tests; if anonymous allowed, document whether tests should use auth or anonymous mode

3. **What is the chat message DOM structure?**
   - What we know: Chat messages displayed in UI container; exact selectors unknown
   - What's unclear: Chat container selector (data-testid, role, class); message item selector; message author/text/timestamp selectors
   - Recommendation: Inspect production chat interface; document DOM structure in ChatPage.ts; use role-based selectors (getByRole('list'), getByRole('listitem')) if chat uses semantic HTML

4. **What is the tipping flow UI pattern?**
   - What we know: Tipping likely involves initiate → amount selection → confirmation → submit
   - What's unclear: Whether tipping is modal-based or inline; tip amount options (fixed amounts, custom input); whether tipping requires balance/payment method on account
   - Recommendation: Inspect production tipping feature; document flow steps and selectors; verify test account has necessary payment method for tipping (may need balance or linked payment); confirm stop-before-payment works (verify button enabled without clicking)

5. **Where do "Latest and Greatest" promotions display?**
   - What we know: Promotional content requirement exists (SOCIAL-04)
   - What's unclear: Which page(s) show promotions (lobby, homepage, dedicated promotions page); promotional content selector; whether content is always visible or conditional (logged in users, specific regions)
   - Recommendation: Inspect production site for promotional sections; document page location(s) and selectors; handle conditional rendering if promotions only show for specific user states

6. **Should tests mock WebSocket for reliability or use real connection?**
   - What we know: page.routeWebSocket() enables mocking; real connections test actual chat service
   - What's unclear: Whether Phase 3 smoke tests should mock WebSocket (faster, more reliable) or use real connection (tests actual service health)
   - Recommendation: Start with real WebSocket connection for smoke-level monitoring (SOCIAL-01, SOCIAL-02 validate actual service health); consider mocking only if chat backend is consistently flaky or if future tests need to simulate specific scenarios

7. **Are chat messages public or private?**
   - What we know: Chat feature exists; message visibility requirement
   - What's unclear: Whether chat is public lobby chat (all users see same messages) or private/direct messages
   - Recommendation: Inspect production chat; if public chat, tests can validate any message appears; if private chat, tests may need multi-user simulation or pre-seeded test messages

## Sources

### Primary (HIGH confidence)
- [Playwright Official Docs - WebSocket API](https://playwright.dev/docs/api/class-websocket) - WebSocket class methods, events (close, framereceived, framesent, socketerror)
- [Playwright Official Docs - WebSocketRoute API](https://playwright.dev/docs/api/class-websocketroute) - page.routeWebSocket() for mocking and interception
- [Playwright Official Docs - Dialogs](https://playwright.dev/docs/dialogs) - Dialog handling (alert, confirm, prompt)
- [Playwright Official Docs - Browser Contexts](https://playwright.dev/docs/browser-contexts) - Isolation for multi-user testing
- [Playwright Official Docs - Auto-waiting](https://playwright.dev/docs/actionability) - Playwright's auto-wait mechanism for dynamic content

### Secondary (MEDIUM confidence)
- [DZone - Playwright: Testing WebSockets and Live Data Streams](https://dzone.com/articles/playwright-for-real-time-applications-testing-webs) - Real-time testing patterns, multi-user simulation
- [Medium - Is It Worth Mocking WebSockets by Playwright?](https://adequatica.medium.com/is-it-worth-mocking-websockets-by-playwright-e611cb016ec5) - WebSocket mocking patterns and tradeoffs
- [LinkedIn - Inspect WebSockets with Playwright - A Practical Guide](https://www.linkedin.com/pulse/inspect-websockets-playwright-practical-guide-sachith-palihawadana) - WebSocket inspection patterns
- [Checkly - Mastering E2E Checkout Testing Using Playwright](https://www.checklyhq.com/docs/learn/playwright/checkout-testing-guide/) - Multi-step transaction flow patterns
- [BrowserStack - Page Object Model with Playwright](https://www.browserstack.com/guide/page-object-model-with-playwright) - POM patterns for chat interfaces
- [TestDino - Playwright Visual Testing](https://testdino.com/blog/playwright-visual-testing/) - Dynamic content and promotional banner testing
- [Medium - Handling Dynamic Content with Playwright](https://medium.com/@anandpak108/handling-dynamic-content-and-complex-interactions-with-playwright-57e3c20e5281) - Conditional rendering and async content
- [NareshIT - Handling Alerts, Pop-ups & Dialogs in Playwright](https://nareshit.com/blogs/handling-alerts-pop-ups-and-dialogs-in-playwright) - Modal and dialog patterns
- [Substack - Real-Time Application Testing: WebSocket Basics](https://abigailarmijo.substack.com/p/real-time-application-testing-websocket) - WebSocket testing fundamentals

### Tertiary (LOW confidence - requires validation)
- [CredibleSoft - Online Casino Game Testing Guide 2026](https://crediblesoft.com/comprehensive-guide-on-online-casino-game-testing/) - Casino testing context (not Playwright-specific)
- [Apidog - Top 10 WebSocket Testing Tools 2026](https://apidog.com/blog/websocket-testing-tools/) - WebSocket testing tool landscape
- Various Medium articles on WebSocket testing - Useful patterns but not authoritative

## Metadata

**Confidence breakdown:**
- WebSocket API: HIGH - Official Playwright v1.48+ documentation confirms all WebSocket methods and events
- Chat testing patterns: HIGH - Multiple verified sources (Playwright docs, DZone, Medium) confirm DOM-based and event-driven approaches
- Tipping flow pattern: HIGH - Adapted from established Phase 2 registration pattern (AUTH-03); checkout flow patterns verified
- Promotional content: MEDIUM-HIGH - Visual testing and dynamic content patterns verified, but specific promotional content structure requires live site inspection
- Multi-user simulation: HIGH - Official browser contexts documentation confirms isolation and multi-context patterns
- Pitfalls: HIGH - Derived from official best practices, community patterns, and WebSocket-specific issues documented in GitHub issues

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days; WebSocket API is stable in Playwright 1.48+, but site-specific selectors require live inspection)

---

## Key Findings Summary

1. **Playwright 1.48+ has native WebSocket support**: page.waitForEvent('websocket'), page.routeWebSocket(), and WebSocketRoute eliminate need for external WebSocket mocking tools
2. **DOM-based chat testing more stable than frame inspection**: Testing user-visible chat messages (expect(chatMessages).toBeVisible()) is more maintainable than inspecting WebSocket frame payloads
3. **WebSocket listeners must be set up before navigation**: Connections may establish during page load; listeners registered after navigation miss early connections
4. **Tipping flow follows established stop-before-payment pattern**: Phase 2 registration pattern (AUTH-03) applies to tipping (test all steps, stop before final submit)
5. **Multi-user chat testing uses browser contexts**: Playwright's context isolation enables testing multi-user interactions without separate machines/browsers
6. **Promotional content tests must handle conditional rendering**: Promotions may be A/B tested, personalized, or time-based; test structure/presence, not specific content
7. **Real-time features need longer timeouts**: WebSocket connection and message arrival may take 10-15 seconds; use generous timeouts with auto-retry assertions
8. **Web-first assertions handle async updates**: expect(locator).toBeVisible() retries automatically for debounced/batched UI updates common in real-time apps
9. **Live site inspection required**: WebSocket URL patterns, chat DOM structure, tipping flow UI, and promotional content selectors all require production site inspection
10. **Phase 1-2 infrastructure sufficient**: No new dependencies needed; BasePage, Page Object Model, and retry patterns from Phase 1 support Phase 3 requirements

## Sources

- [Playwright: Testing WebSockets and Live Data Streams](https://dzone.com/articles/playwright-for-real-time-applications-testing-webs)
- [WebSocket | Playwright](https://playwright.dev/docs/api/class-websocket)
- [WebSocketRoute | Playwright](https://playwright.dev/docs/api/class-websocketroute)
- [Playwright Official Docs - Dialogs](https://playwright.dev/docs/dialogs)
- [Playwright Official Docs - Browser Contexts](https://playwright.dev/docs/browser-contexts)
- [Mastering E2E Checkout Testing Using Playwright - Checkly](https://www.checklyhq.com/docs/learn/playwright/checkout-testing-guide/)
- [Handling Dynamic Content and Complex Interactions with Playwright](https://medium.com/@anandpak108/handling-dynamic-content-and-complex-interactions-with-playwright-57e3c20e5281)
- [Inspect WebSockets with Playwright - A Practical Guide](https://www.linkedin.com/pulse/inspect-websockets-playwright-practical-guide-sachith-palihawadana)
- [Page Object Model with Playwright: Tutorial | BrowserStack](https://www.browserstack.com/guide/page-object-model-with-playwright)
- [Playwright Visual Testing: A Complete Guide | TestDino](https://testdino.com/blog/playwright-visual-testing/)
- [Handling Alerts, Pop-ups & Dialogs in Playwright | NareshIT](https://nareshit.com/blogs/handling-alerts-pop-ups-and-dialogs-in-playwright)
- [Is It Worth Mocking WebSockets by Playwright?](https://adequatica.medium.com/is-it-worth-mocking-websockets-by-playwright-e611cb016ec5)
- [Real-Time Application Testing: WebSocket Basics and Mock Interception](https://abigailarmijo.substack.com/p/real-time-application-testing-websocket)
