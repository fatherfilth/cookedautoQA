# Phase 4: Crypto Integration - Research

**Researched:** 2026-02-15
**Domain:** Web3 wallet automation and crypto on-ramp testing
**Confidence:** MEDIUM

## Summary

Testing crypto integrations with Playwright requires choosing between three approaches: (1) real browser extension automation (Synpress/Dappwright), (2) mock wallet injection (wallet-mock), or (3) custom iframe testing without wallet automation. The critical blocker identified in project state—"wallet automation strategy unclear"—can be resolved by determining if cooked.com uses Swapped.com as an iframe widget (no wallet needed) or requires wallet connection before opening Swapped.com (wallet automation needed).

**Research reveals:** Swapped.com operates as an iframe-embedded widget that pre-fills wallet addresses from parent application context, meaning tests may not need wallet automation at all—just iframe interaction patterns already established in Phase 2. However, if cooked.com requires users to connect a wallet BEFORE accessing Swapped.com, wallet automation becomes necessary.

**Primary recommendation:** Start with iframe-only testing approach (no wallet automation). If live inspection reveals wallet connection is required, add Synpress v4 for MetaMask automation using persistent browser context with cached wallet state for performance.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | 1.x | Test framework (already in use) | Already established in Phases 1-3 |
| Synpress | 4.1.1 | MetaMask automation (if needed) | Industry standard for Web3 E2E testing, v4 rebuilt for Playwright performance |
| Dappwright | 2.13.3 | Alternative wallet automation | Community-maintained, supports MetaMask + Coinbase Wallet |
| @johanneskares/wallet-mock | 1.4.1 | EIP-6963 mock wallet (if feasible) | Headless wallet injection without browser extension overhead |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| viem | Latest | Ethereum utilities | If testing transaction formatting or signature verification |
| Anvil (Foundry) | Latest | Local testnet node | If testing requires blockchain state (unlikely for monitoring) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Synpress | Dappwright | Dappwright more actively maintained (Feb 2026), but Synpress has better docs and institutional backing (Optimism) |
| Real wallet | wallet-mock | Mock is faster/simpler but only works if Swapped.com supports EIP-6963 wallet detection |
| Wallet automation | Iframe-only testing | Simpler, faster, but skips wallet connection flow if it exists |

**Installation (conditional on approach):**

**Option A: Iframe-only (no wallet):**
```bash
# No additional libraries needed - use existing Playwright + iframe patterns from Phase 2
```

**Option B: Synpress for MetaMask automation:**
```bash
npm install -D @synthetixio/synpress@latest
```

**Option C: Mock wallet (if Swapped.com supports EIP-6963):**
```bash
npm install -D @johanneskares/wallet-mock
```

## Architecture Patterns

### Recommended Project Structure
```
tests/
├── crypto/                     # Phase 4 tests
│   ├── swapped-buy-flow.spec.ts
│   └── (optional) wallet-connection.spec.ts
├── pages/
│   └── SwappedIntegrationPage.ts   # POM for crypto buy page
├── helpers/
│   └── (optional) wallet-setup.ts  # Wallet fixture if needed
└── fixtures/
    └── (optional) synpress.fixture.ts
```

### Pattern 1: Iframe-Only Testing (Recommended First Approach)
**What:** Treat Swapped.com as third-party iframe like game providers in Phase 2
**When to use:** If wallet address is passed to Swapped.com via iframe params (no wallet connection UI)
**Example:**
```typescript
// Source: Existing Phase 2 patterns + Swapped.com docs
// https://docs.swapped.com/swapped-connect/connect-integration/iframe-initialization

test('crypto buy flow loads in iframe', async ({ page }) => {
  const cryptoPage = new SwappedIntegrationPage(page);
  await cryptoPage.open();

  // Wait for Swapped.com iframe to load
  const swappedFrame = page.frameLocator('iframe[src*="connect.swapped.com"]');

  // Verify iframe content loads
  await swappedFrame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });

  // Assert amount input field exists (pre-filled or editable)
  await expect(swappedFrame.locator('input[type="text"], input[type="number"]').first())
    .toBeVisible({ timeout: 10_000 });
});
```

### Pattern 2: Synpress MetaMask Automation (If Wallet Connection Required)
**What:** Persistent browser context with MetaMask extension, cached wallet state
**When to use:** If cooked.com requires wallet connection before showing Swapped.com
**Example:**
```typescript
// Source: Synpress v4 docs - https://docs.synpress.io/docs/guides/playwright
import { testWithSynpress } from '@synthetixio/synpress';
import { MetaMask, defineWalletSetup } from '@synthetixio/synpress';

const walletSetup = defineWalletSetup(
  'http://127.0.0.1:8545', // Local network or testnet
  async (context, page, { metamaskPage }) => {
    // Setup wallet once, cached across tests
    await metamaskPage.importWallet('test test test test test test test test test test test junk');
  }
);

const test = testWithSynpress(walletSetup);

test('connect wallet and access crypto buy', async ({ page, metamask }) => {
  // Navigate to cooked.com crypto buy page
  await page.goto('/crypto/buy');

  // Click "Connect Wallet" button
  await page.getByRole('button', { name: /connect wallet/i }).click();

  // MetaMask popup handled by Synpress fixture
  await metamask.connectToDapp();

  // Verify wallet connected
  await expect(page.getByText(/0x[a-fA-F0-9]{40}/)).toBeVisible();

  // Now Swapped.com iframe should load with wallet address
  const swappedFrame = page.frameLocator('iframe[src*="connect.swapped.com"]');
  await expect(swappedFrame.locator('body')).toBeVisible();
});
```

### Pattern 3: Stop-Before-Transaction (Already Established in Phase 3)
**What:** Navigate through flow to final pre-transaction state, verify submit button ready, STOP
**When to use:** All crypto buy tests (per PROJECT.md: "No real purchases")
**Example:**
```typescript
// Source: Phase 3 tipping-flow.spec.ts pattern
test('crypto buy flow reaches payment confirmation', async ({ page }) => {
  const cryptoPage = new SwappedIntegrationPage(page);
  await cryptoPage.open();

  const swappedFrame = page.frameLocator('iframe[src*="connect.swapped.com"]');

  await test.step('Enter amount', async () => {
    await swappedFrame.locator('input[type="number"]').first().fill('50');
  });

  await test.step('Select payment method', async () => {
    // Wait for payment options to load
    await swappedFrame.locator('[data-testid="payment-method"], button').first().click();
  });

  await test.step('Verify submit ready (STOP HERE)', async () => {
    const submitButton = swappedFrame.locator('button[type="submit"], button:has-text("Buy")').first();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // STOP HERE: Do NOT click submit
    // Per PROJECT.md: "No real purchases or destructive actions"
  });
});
```

### Anti-Patterns to Avoid

- **Anti-pattern 1: Hardcoded waits for wallet popups**
  - Why bad: MetaMask extension popup timing varies (500ms-3000ms)
  - What to do: Use Synpress fixtures which handle popup detection automatically, or use `page.waitForEvent('popup')` with timeout

- **Anti-pattern 2: Sharing wallet state across tests**
  - Why bad: Test 1 approves transaction → Test 2 inherits approval state → false positive
  - What to do: Use fresh browser context per test (Playwright default) or wallet state snapshots

- **Anti-pattern 3: Testing on live blockchain networks**
  - Why bad: Non-idempotent (transaction history persists), gas costs, rate limits
  - What to do: Use mock wallet for monitoring tests (no real blockchain interaction needed)

- **Anti-pattern 4: Using global MetaMask object (window.ethereum)**
  - Why bad: EIP-6963 multi-wallet standard replaces global window.ethereum pattern
  - What to do: Use EIP-6963 wallet discovery events or Synpress fixtures (handles this internally)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MetaMask extension automation | Custom Puppeteer scripts for extension popup handling | Synpress or Dappwright | Browser extension context isolation, popup timing, seed phrase import, transaction signing all handled; custom solutions break on MetaMask updates |
| Blockchain RPC mocking | Manual fetch() interception for eth_sendTransaction | wallet-mock with EIP-6963, or Anvil local testnet | RPC methods evolve (EIP-1559, EIP-4844), signature formats complex, wallet-mock provides tested interface |
| Wallet connection state management | Custom localStorage manipulation for "connected" state | Synpress wallet fixtures with caching | Wallet connection involves extension permissions, account switching events, network changes—fixtures handle edge cases |
| Transaction confirmation polling | Custom setInterval checking transaction status | viem's waitForTransactionReceipt | Handles reorgs, confirmation depth, timeout, gas price changes—deceptively complex |

**Key insight:** Web3 testing complexity is hidden in browser extension sandbox, wallet approval popups, and EIP standards evolution. Synpress/Dappwright abstract 2+ years of edge case handling.

## Common Pitfalls

### Pitfall 1: Wallet Extension Requires Persistent Context (Chromium-Only)
**What goes wrong:** Tests launch default browser context, MetaMask extension not loaded, wallet connection button does nothing
**Why it happens:** Playwright's default isolated context doesn't support extensions; extensions require `chromium.launchPersistentContext()` with specific flags
**How to avoid:** Use Synpress fixtures (handles persistent context setup) OR manually configure:
```typescript
const context = await chromium.launchPersistentContext('/path/to/user-data', {
  args: [
    '--disable-extensions-except=/path/to/metamask',
    '--load-extension=/path/to/metamask'
  ]
});
```
**Warning signs:** Wallet connect button visible but clicking does nothing, no MetaMask popup, console error "window.ethereum is undefined"

### Pitfall 2: Account Switching Doesn't Update dApp UI
**What goes wrong:** User switches MetaMask account → dApp still shows old wallet address
**Why it happens:** dApp must listen for `accountsChanged` event from MetaMask; tests assume UI auto-updates
**How to avoid:** In tests, if switching accounts is part of flow, verify dApp listens to events:
```typescript
// After switching accounts in MetaMask fixture
await expect(page.getByText(/0x[new-address]/)).toBeVisible({ timeout: 5_000 });
```
**Warning signs:** Wallet address in UI doesn't match MetaMask popup address after account switch

### Pitfall 3: Iframe Security Policies Block Wallet Access
**What goes wrong:** Swapped.com iframe loads but can't access parent page's wallet connection
**Why it happens:** Cross-origin iframe restrictions prevent `window.ethereum` access unless explicitly allowed
**How to avoid:** Verify Swapped.com integration method—if it's iframe-embedded, wallet address is likely passed via URL params (not injected provider)
**Warning signs:** Swapped.com iframe shows "Connect Wallet" button even though parent page already connected

### Pitfall 4: Stop-Before-Payment Misses Transaction Approval Popup
**What goes wrong:** Test clicks final submit → MetaMask popup appears → test doesn't handle popup → timeout failure
**Why it happens:** "Stop before payment" pattern stops at submit button, but some flows require approving MetaMask popup to reach "ready to transact" state
**How to avoid:** Clarify "final pre-transaction state":
  - If MetaMask popup IS the transaction → stop before clicking submit
  - If submit opens popup for amount confirmation → stop after popup appears (verify popup visible, don't approve)
**Warning signs:** Test occasionally times out waiting for element after clicking submit (popup blocks execution)

### Pitfall 5: Browser Context Isolation Breaks Between Tests
**What goes wrong:** Test 1 connects wallet → Test 2 expects fresh state but wallet still connected → Test 2 fails
**Why it happens:** Persistent browser context for extensions shares state unless explicitly cleared
**How to avoid:** Use Synpress wallet fixtures with `beforeEach` wallet reset, OR manually clear extension state:
```typescript
test.beforeEach(async ({ context }) => {
  // Synpress handles this automatically via fixtures
  // Manual approach: clear cookies/storage in extension context
  await context.clearCookies();
  await context.clearPermissions();
});
```
**Warning signs:** First test passes, same test fails when run after another wallet test

## Code Examples

Verified patterns from official sources:

### Iframe Detection and Interaction (Swapped.com)
```typescript
// Source: Phase 2 game launch patterns + Swapped.com docs
// https://docs.swapped.com/swapped-connect/connect-integration/iframe-initialization

test('detect Swapped.com iframe and verify content', async ({ page }) => {
  await page.goto('/crypto/buy');

  // Wait for iframe element to be attached
  const iframeElement = page.locator('iframe[src*="connect.swapped.com"]');
  await expect(iframeElement).toBeVisible({ timeout: 15_000 });

  // Verify iframe has src attribute
  const iframeSrc = await iframeElement.getAttribute('src');
  expect(iframeSrc).toContain('connect.swapped.com');

  // Access iframe content
  const swappedFrame = page.frameLocator('iframe[src*="connect.swapped.com"]');

  // Wait for iframe internal content to load (use broad selector first)
  await swappedFrame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });

  // More specific assertions after live inspection
  // TODO: Replace with actual Swapped.com UI selectors after inspecting iframe content
  await expect(swappedFrame.locator('input, button').first()).toBeVisible({ timeout: 10_000 });
});
```

### Browser Context Isolation for Wallet State
```typescript
// Source: Playwright docs - https://playwright.dev/docs/browser-contexts
// Each test gets fresh context = no wallet state pollution

test.describe('crypto buy flow', () => {
  test('test 1 with wallet', async ({ page }) => {
    // Fresh context - no prior wallet connection
    // Connect wallet → perform actions
  });

  test('test 2 starts clean', async ({ page }) => {
    // New context - Test 1's wallet state does not persist
    // This test starts with no wallet connected
  });
});

// If using Synpress with persistent context, use fixtures:
test.beforeEach(async ({ metamask }) => {
  // Synpress resets wallet state automatically via fixtures
  // No manual cleanup needed
});
```

### Stop-Before-Transaction Pattern (Crypto)
```typescript
// Source: Phase 3 tipping-flow.spec.ts
// https://github.com/[project]/tests/social/tipping-flow.spec.ts

test('crypto buy stops before real purchase', async ({ page }) => {
  await page.goto('/crypto/buy');

  const swappedFrame = page.frameLocator('iframe[src*="connect.swapped.com"]');

  // Step 1: Enter amount
  await swappedFrame.locator('input[placeholder*="amount"], input[type="number"]')
    .first()
    .fill('50.00');

  // Step 2: Select payment method (card, bank transfer, etc.)
  await swappedFrame.locator('button:has-text("Credit Card"), [data-payment-method]')
    .first()
    .click();

  // Step 3: Verify final submit button is ready
  const buyButton = swappedFrame.locator('button:has-text("Buy"), button[type="submit"]').first();
  await expect(buyButton).toBeVisible();
  await expect(buyButton).toBeEnabled();

  // STOP HERE - do NOT click buy button
  // Per PROJECT.md: "No real purchases or destructive actions"
  console.log('Crypto buy flow validated - stopped before purchase');
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| window.ethereum global | EIP-6963 multi-wallet discovery | Oct 2023 (EIP approved) | Wallets now announce via events instead of racing for window.ethereum; tests using wallet-mock must support EIP-6963 |
| Synpress v3 (Cypress-based) | Synpress v4 (Playwright-native) | 2024 (v4.1.1 latest) | v4 rebuilt for Playwright performance: cached browser state, parallel tests, fully-typed API |
| Manual extension loading | Synpress/Dappwright fixtures | Ongoing | Fixtures abstract persistent context setup, seed phrase import, popup handling |
| Testing on live testnets | Local Anvil node + mock wallets | 2023-2024 trend | Faster, idempotent, no gas costs; Anvil (Foundry) replaced Ganache as standard |

**Deprecated/outdated:**
- **Synpress v3**: v4 is Playwright-native rewrite, v3 was Cypress-based (source: GitHub releases, May 2024)
- **Ganache**: Replaced by Anvil (Foundry) for local testnets (faster, better Ethereum fork support)
- **window.ethereum direct access**: Use EIP-6963 wallet discovery events (MetaMask still supports window.ethereum but multi-wallet dApps should migrate)

## Open Questions

### 1. **Does cooked.com require wallet connection before Swapped.com loads?**
   - **What we know:** Swapped.com docs show iframe integration with pre-filled wallet address via URL params (https://docs.swapped.com/swapped-connect/connect-integration/iframe-initialization)
   - **What's unclear:** Whether cooked.com (a) passes wallet address to Swapped.com iframe automatically (no wallet UI needed), or (b) requires users to connect MetaMask/wallet first
   - **Recommendation:** Live inspection FIRST before choosing wallet automation approach. If wallet button exists on crypto buy page, wallet automation is needed (Synpress). If iframe loads without wallet interaction, use iframe-only testing (simpler).

### 2. **Does Swapped.com emit events to parent page during buy flow?**
   - **What we know:** Swapped.com uses iframe integration, typical pattern is postMessage events for flow state
   - **What's unclear:** What events are emitted (e.g., `swapped:loaded`, `swapped:success`, `swapped:cancelled`), event payload structure
   - **Recommendation:** During live inspection, add `window.addEventListener('message', console.log)` to detect events; use events for more precise assertions than polling iframe content

### 3. **What is "stop before purchase" for Swapped.com specifically?**
   - **What we know:** Swapped.com handles KYC, payment method selection, amount input; final step likely redirects to payment processor
   - **What's unclear:** Where exactly to stop—after amount entered? After payment method selected? After clicking final "Buy" button (popup appears)?
   - **Recommendation:** Define stop point as: "Final Buy/Confirm button is visible and enabled, but not clicked" (consistent with Phase 2 registration, Phase 3 tipping)

### 4. **Does Swapped.com have a sandbox/test mode?**
   - **What we know:** Most crypto on-ramps (Stripe, Transak, MoonPay) offer sandbox environments with test API keys
   - **What's unclear:** Whether Swapped.com provides test environment, how to enable it (API key prefix? URL parameter?)
   - **Recommendation:** Contact Swapped.com support or check developer dashboard for test mode; if available, use test API key in .env for safe testing

## Sources

### Primary (HIGH confidence)
- **Synpress v4 Official Docs**: https://docs.synpress.io/docs/introduction (features, wallet support, Playwright integration)
- **Synpress GitHub**: https://github.com/synpress-io/synpress (version 4.1.1, MetaMask + Phantom support, v4 release notes)
- **Swapped.com Official Docs**: https://docs.swapped.com/swapped-connect/connect-integration/iframe-initialization (iframe integration params, signature generation)
- **Dappwright GitHub**: https://github.com/TenKeyLabs/dappwright (v2.13.3 released Feb 10, 2026, MetaMask + Coinbase Wallet)
- **wallet-mock GitHub**: https://github.com/johanneskares/wallet-mock (v1.4.1, EIP-6963 support, Playwright integration)
- **Playwright Browser Contexts**: https://playwright.dev/docs/browser-contexts (context isolation, state management)
- **Playwright Chrome Extensions**: https://playwright.dev/docs/chrome-extensions (persistent context setup for extensions)

### Secondary (MEDIUM confidence)
- **Testing dApps with Playwright**: https://www.rombrom.com/posts/testing-dapps-with-playwright-anvil-wagmi/ (mock connector approach, Anvil local testnet, stop-before-transaction patterns) — Verified with Wagmi official docs
- **Web3 Testing Guide (Medium)**: https://medium.com/coinmonks/guideline-to-be-qa-web3-complete-e2e-defi-project-with-synpress-playwright-and-hardhat-anvil-5e3af494cca4 (Synpress setup, common pitfalls) — Cross-verified with Synpress docs
- **Playwright Blockchain Testing (Testrig)**: https://testrig.medium.com/playwright-blockchain-testing-validating-dapps-and-smart-contract-frontends-9d6dd8b6c7a9 (network interception, multi-context testing, WalletConnect patterns)

### Tertiary (LOW confidence - WebSearch only)
- **EIP-6963 Overview**: https://eips.ethereum.org/EIPS/eip-6963 (multi-wallet discovery standard, approved Oct 2023) — Marked LOW pending official Ethereum EIP verification
- **Swapped.com Reviews (Trustpilot)**: https://www.trustpilot.com/review/swapped.com (4.5 rating, 1M+ customers) — User feedback, not technical documentation

## Metadata

**Confidence breakdown:**
- **Standard stack: MEDIUM** — Synpress v4 is current standard (verified via GitHub, npm, docs), but planner needs live inspection to confirm if wallet automation is needed at all. Iframe-only approach may suffice.
- **Architecture: HIGH** — Patterns based on existing Phase 2 iframe tests + official Synpress docs + Playwright context isolation (well-documented). Stop-before-payment pattern proven in Phase 3.
- **Pitfalls: MEDIUM** — Pitfalls sourced from Synpress community discussions, Playwright GitHub issues, and Medium tutorials (cross-verified where possible). Persistent context pitfall verified via Playwright official docs (HIGH). Account switching pitfall from Medium tutorial (unverified with official MetaMask docs → MEDIUM).

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - relatively stable domain; Synpress v4 released 2024, Playwright stable, EIP-6963 approved 2023)

**Research limitations:**
- No access to cooked.com live site to determine if wallet connection UI exists
- Swapped.com docs do not provide event API reference or sandbox mode details
- Cannot verify if Swapped.com supports EIP-6963 wallet detection (affects wallet-mock feasibility)

**Next steps for planner:**
1. **Live inspection FIRST**: Check if crypto buy page has "Connect Wallet" button OR Swapped.com iframe loads immediately
2. If wallet button exists → Plan Synpress setup task + wallet connection test
3. If no wallet button → Plan iframe-only tests (simpler, reuse Phase 2 patterns)
4. Investigate Swapped.com test mode (contact support or check docs) before planning tests
