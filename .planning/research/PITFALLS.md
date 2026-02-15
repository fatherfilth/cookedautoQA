# Pitfalls Research

**Domain:** Playwright-based synthetic monitoring for online casino with iframes, WebSockets, and crypto integrations
**Researched:** 2026-02-15
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Relying on `networkidle` for Page Readiness

**What goes wrong:**
Tests hang indefinitely or timeout because casino sites constantly poll for live odds updates, chat messages, game state changes, and analytics. The network never becomes truly idle, causing `page.goto({ waitUntil: 'networkidle' })` to wait the full timeout period (30s+) on every navigation.

**Why it happens:**
Developers assume `networkidle` means "page is ready" when documentation explicitly discourages it for testing. Online casinos have continuous WebSocket connections and background API polling that prevent network idle state from ever being reached.

**How to avoid:**
- Use `waitUntil: 'domcontentloaded'` or `waitUntil: 'commit'` for navigation
- Wait for specific elements that indicate readiness: `await page.locator('[data-testid="lobby-games"]').waitFor()`
- For game launches, wait for iframe to load: `await page.frameLocator('iframe[src*="game-provider"]').locator('.game-canvas').waitFor()`
- Never rely on network silence for SPAs with live data feeds

**Warning signs:**
- Tests taking 25-30 seconds per navigation consistently
- Timeouts occurring during `goto()` calls
- CI logs showing "waiting for networkidle" messages
- Tests passing locally but timing out in CI

**Phase to address:**
Phase 1 (Foundation) - Set up correct wait strategies before building test suite. Add explicit guidance in test patterns documentation.

---

### Pitfall 2: Missing iframe Context Switches for Game Launches

**What goes wrong:**
Game interactions fail silently or throw "element not found" errors because third-party game providers (Pragmatic Play, Evolution, NetEnt) render games in cross-origin iframes that require explicit context switching. Tests appear to click game tiles but never verify the game actually loaded.

**Why it happens:**
Developers write `page.click('.game-tile')` and assume the game launched. They don't realize game content lives in a separate iframe context that Playwright can't access without `frameLocator()`. Cross-origin iframes from game providers prevent direct DOM inspection.

**How to avoid:**
```typescript
// WRONG - clicks tile but can't verify game loaded
await page.click('[data-game-id="starburst"]');

// CORRECT - switches to iframe and verifies game loaded
await page.click('[data-game-id="starburst"]');
const gameFrame = page.frameLocator('iframe[src*="netent"]');
await gameFrame.locator('.game-canvas, .game-container').waitFor({ timeout: 15000 });
```

- Always verify iframe presence after game launch: `expect(page.locator('iframe[src*="game-provider"]')).toBeVisible()`
- Use `frameLocator()` not `frame()` for dynamic/delayed iframes
- Chain `frameLocator()` calls for nested iframes: `page.frameLocator('iframe.outer').frameLocator('iframe.inner')`
- Set longer timeouts for game iframes (10-15s) - they load heavy assets

**Warning signs:**
- Tests report success but screenshots show lobby, not game
- "Locator not found" errors for game controls
- Tests pass when game loads fast, fail when slow
- Can't interact with game UI elements (spin button, bet controls)

**Phase to address:**
Phase 1 (Foundation) - Document iframe patterns for all game providers. Phase 2 (Game Launch Tests) - Implement robust iframe verification before interactions.

---

### Pitfall 3: WebSocket Connection State Ignored in Chat/Live Features

**What goes wrong:**
Chat tests fail intermittently because they send messages before the WebSocket connection is established. Live dealer tests break because they don't wait for dealer video stream to connect. Tests pass 70% of the time, creating false confidence.

**Why it happens:**
WebSocket connections are asynchronous and invisible to standard Playwright waits. Developers see the chat UI render and assume it's ready to send messages. Page load completes before WebSocket handshake finishes.

**How to avoid:**
```typescript
// Monitor WebSocket connection
let chatConnected = false;
page.on('websocket', ws => {
  if (ws.url().includes('chat.cooked.com')) {
    ws.on('framereceived', frame => {
      if (frame.payload.includes('connected')) {
        chatConnected = true;
      }
    });
  }
});

await page.goto('/casino');
// Wait for WS connection before testing chat
await page.waitForFunction(() => chatConnected, { timeout: 10000 });
await page.locator('[data-testid="chat-input"]').fill('Test message');
```

- Listen to `page.on('websocket')` and track connection state
- Wait for connection confirmation message/event before interactions
- For live dealer: verify video stream started before testing game controls
- Add explicit 2-3 second buffer after connection for initialization
- Use `page.waitForFunction()` to wait for client-side connection flags

**Warning signs:**
- Chat messages send but don't appear
- Tests fail with "connection not ready" in app logs
- Flaky failures that pass on retry
- Higher failure rate in CI (slower network) vs local
- WebSocket disconnect errors in browser console

**Phase to address:**
Phase 1 (Foundation) - Build WebSocket monitoring utilities. Phase 3 (Chat/Live Dealer Tests) - Implement connection state verification before all WS-dependent tests.

---

### Pitfall 4: Crypto Purchase Flow Breaks Without Wallet Connection State

**What goes wrong:**
Swapped.com integration tests fail because they don't wait for MetaMask/wallet extension to initialize. Tests click "Buy Crypto" and timeout waiting for wallet popup that never appears. Wallet state from previous test bleeds into current test, causing unpredictable failures.

**Why it happens:**
Web3 wallet extensions (MetaMask, WalletConnect) load asynchronously via browser extensions or injected scripts. `window.ethereum` object may not exist when test starts. Developers don't verify wallet readiness before triggering crypto flows.

**How to avoid:**
```typescript
// Wait for wallet provider injection
await page.waitForFunction(() => {
  return typeof window.ethereum !== 'undefined' && window.ethereum.isConnected();
}, { timeout: 10000 });

// Use fresh browser context per test to isolate wallet state
test('crypto purchase flow', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  // ... test code
  await context.close(); // Clean slate for next test
});
```

- Use Synpress or wallet-mock for MetaMask automation
- Verify `window.ethereum` exists before crypto interactions
- Create fresh browser contexts per crypto test to prevent state pollution
- Mock wallet responses for deterministic CI tests (real wallet only in E2E smoke tests)
- Add 5+ second timeout for wallet popup/confirmation dialogs

**Warning signs:**
- "window.ethereum is undefined" errors
- Wallet popup doesn't appear when expected
- Tests pass when run individually, fail in suite
- Wallet shows wrong network/account from previous test
- Transaction confirmations stuck in pending state

**Phase to address:**
Phase 1 (Foundation) - Set up Synpress/wallet mocking infrastructure. Phase 4 (Crypto Integration Tests) - Implement wallet state verification and context isolation.

---

### Pitfall 5: Alert Fatigue from False Positives

**What goes wrong:**
Team ignores Slack alerts because 60%+ are false positives (third-party game provider downtime, Cloudflare challenges, CDN blips). When real production issues occur, they're buried in noise. Critical failures go unnoticed for hours.

**Why it happens:**
Tests alert on any failure without distinguishing between cooked.com issues and external dependencies. No retry logic for transient failures. Alerts lack context (which flow, which dependency, severity level).

**How to avoid:**
- Implement smart retry logic: retry once after 30s for transient failures
- Categorize alerts by severity: CRITICAL (registration/login broken), WARNING (single game provider down), INFO (slowness)
- Add dependency health checks before alerting: if game provider API returns 503, skip alert
- Include actionable context in alerts:
  ```
  CRITICAL: Registration flow failing
  Failure: Submit button timeout after 30s
  Screenshot: https://...
  Trace: https://...
  Last success: 2 hours ago
  ```
- Set up dedicated alert channels: #critical-monitoring vs #monitoring-info
- Track false positive rate weekly, tune thresholds if above 20%

**Warning signs:**
- Team mutes monitoring channel
- Alerts go unread for hours
- Engineers say "monitoring is always broken"
- No response to legitimate production outages
- False positive rate above 30%

**Phase to address:**
Phase 1 (Foundation) - Design alert taxonomy and retry logic. Phase 5 (Alerting & Reporting) - Implement smart alerting with severity levels and false positive tracking.

---

### Pitfall 6: Trace/Screenshot/Video Storage Explosion

**What goes wrong:**
GitHub Actions artifacts hit storage limits (100GB+ per month). Trace files at 10-50MB each, videos at 20MB each. Older test runs get deleted, losing critical debugging data from intermittent issues. Costs balloon to $100-500/month for artifact storage.

**Why it happens:**
Default config records traces/videos for ALL tests, not just failures. Running every 30 minutes = 48 runs/day * 30 days = 1,440 runs/month. With 20 tests averaging 15MB of artifacts each, that's 432GB/month.

**How to avoid:**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry', // Only on failures, not passing tests
    video: 'retain-on-failure', // Only save failed test videos
    screenshot: 'only-on-failure', // Only failed tests
  },
  retries: process.env.CI ? 1 : 0, // One retry in CI for transient failures
});
```

- Use `trace: 'on-first-retry'` - captures only failing tests
- Use `video: 'retain-on-failure'` - don't record passing tests
- Set 7-day retention on feature branches, 30 days on main
- Compress screenshots: `type: 'jpeg'` instead of PNG (3-5x smaller)
- Store only last 100 test runs, delete older artifacts
- For long-running tests, disable video and rely on screenshots + trace

**Warning signs:**
- GitHub Actions artifacts exceed free tier
- Storage costs growing month-over-month
- Old test run artifacts missing when debugging historical issues
- CI jobs failing due to artifact upload timeouts
- Trace files taking 30+ seconds to load in viewer

**Phase to address:**
Phase 1 (Foundation) - Configure artifact retention policies before first CI run. Phase 5 (Alerting & Reporting) - Monitor storage usage and implement cleanup automation.

---

### Pitfall 7: Hardcoded Timeouts Don't Match Production Reality

**What goes wrong:**
Tests use generic 30s timeout for all operations. Game launches fail in CI because some providers take 45s to load on cold start. Registration flow times out during promotional periods when backend is slow. Tests are too brittle or too lenient.

**Why it happens:**
Developers use Playwright's default 30s timeout for everything. They don't measure actual production performance to set realistic thresholds. CI environment is slower than local (network latency, shared resources).

**How to avoid:**
```typescript
// Operation-specific timeouts based on production monitoring
test('game launch', async ({ page }) => {
  await page.goto('/casino', { timeout: 10000 }); // Fast navigation

  await page.click('[data-game-id="starburst"]');

  // Game iframe load - measured at 8-12s in production, set 20s buffer
  await page.frameLocator('iframe').locator('.game-canvas')
    .waitFor({ timeout: 20000 });
});

test('crypto purchase', async ({ page }) => {
  // Blockchain confirmation can take 30-60s
  await expect(page.locator('.transaction-confirmed'))
    .toBeVisible({ timeout: 90000 });
});
```

- Measure production performance for each flow (P95 latency)
- Set timeouts to P95 + 50% buffer (if P95 = 8s, timeout = 12s)
- Use shorter timeouts for fast operations (navigation: 10s)
- Use longer timeouts for known slow operations (game load: 20s, crypto: 90s)
- Different timeouts for CI vs local: `const timeout = process.env.CI ? 20000 : 10000`
- Monitor timeout failures - if >5% of runs hit timeout, increase threshold

**Warning signs:**
- Tests timeout at exactly 30s (default timeout)
- Same timeout value used everywhere in test suite
- Tests pass locally, fail in CI with timeout errors
- Timeout errors during peak traffic/promotional events
- No performance monitoring to validate timeout thresholds

**Phase to address:**
Phase 1 (Foundation) - Document production performance baselines and set operation-specific timeouts. Phase 5 (Monitoring Optimization) - Tune timeouts based on observed failure patterns.

---

### Pitfall 8: Ignoring Third-Party Dependency Failures

**What goes wrong:**
Tests fail and alert when Evolution Gaming has an outage, Swapped.com API is down, or Cloudflare blocks the bot. Team wastes time investigating issues outside their control. Alerts lose credibility because they can't fix external dependencies.

**Why it happens:**
Tests don't differentiate between cooked.com failures and third-party failures. No pre-flight checks for external dependencies. Tests treat all failures as equal severity.

**How to avoid:**
```typescript
// Pre-flight dependency health checks
async function checkDependencies(): Promise<DependencyStatus> {
  const checks = await Promise.allSettled([
    fetch('https://swapped.com/health'),
    fetch('https://api.evolution.com/status'),
    page.goto('https://www.cooked.com', { waitUntil: 'domcontentloaded' }),
  ]);

  return {
    swapped: checks[0].status === 'fulfilled',
    evolution: checks[1].status === 'fulfilled',
    cooked: checks[2].status === 'fulfilled',
  };
}

test('crypto purchase', async ({ page }) => {
  const deps = await checkDependencies();

  if (!deps.swapped) {
    test.skip('Swapped.com unavailable');
    return;
  }

  // Run test only if dependency is healthy
});
```

- Run dependency health checks before test suite
- Skip tests (not fail) when external dependency is down
- Alert differently for external failures: "INFO: Evolution Gaming down, skipping live dealer tests"
- Track external dependency uptime separately from cooked.com uptime
- Set up external dependency monitoring: subscribe to game provider status pages
- Use circuit breaker pattern: if provider fails 3 times in a row, skip tests for 30 min

**Warning signs:**
- Alerts for issues team can't fix
- Tests fail in batches when game provider has outage
- Same external API failure across multiple test runs
- Weekend failures (when third-party maintenance windows occur)
- Alert fatigue from unactionable notifications

**Phase to address:**
Phase 1 (Foundation) - Build dependency health check framework. Phase 2 (Test Implementation) - Add dependency checks to all tests with external integrations.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using CSS selectors instead of `data-testid` attributes | Tests work immediately without code changes | Breaks every UI redesign, 10x maintenance burden | Never - add `data-testid` from day one |
| Recording video for all tests | Complete debugging visibility | 10-50x storage costs, slow CI uploads | Never - use `retain-on-failure` |
| Mocking all external dependencies | Fast, deterministic tests | Miss real integration issues, false confidence | Only for unit-level tests; keep E2E smoke tests with real integrations |
| Using `page.waitForTimeout(5000)` for loading | Quick fix for flaky waits | Adds 5s to every test run, still flaky | Never - use `waitFor()` with element locators |
| Single browser context for entire suite | Faster test execution (no context creation overhead) | State pollution between tests, impossible to debug | Never for tests with authentication/wallets |
| Hardcoding credentials in test files | Easy to get started | Security risk, credential rotation breaks tests | Never - use environment variables from day one |
| No retry logic on CI | Simpler configuration | False failures from transient network issues | Only acceptable if alert fatigue is not a problem (it will be) |
| Alerting on all failures | Immediate notification of issues | Alert fatigue, ignored alerts, missed real issues | Never - implement severity levels from start |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Game provider iframes (Evolution, Pragmatic Play) | Using `page.locator()` to find game elements inside iframe | Use `page.frameLocator('iframe[src*="provider"]').locator('.game-element')` and wait for iframe to load first |
| WebSocket chat | Sending messages immediately after page load | Listen to `page.on('websocket')` and wait for connection confirmation before interactions |
| Swapped.com crypto flow | Assuming wallet is ready when page loads | Wait for `window.ethereum` to exist and verify `isConnected()` before triggering flows |
| Live dealer games | Checking if iframe exists, not if video stream loaded | Wait for video element to have `readyState >= 3` (HAVE_FUTURE_DATA) before testing controls |
| Cloudflare protection | Tests blocked by bot detection/CAPTCHA | Use stealth plugins or run from whitelisted IPs; add detection for challenge pages |
| Third-party analytics/tracking scripts | Tests wait for all analytics to load (GA, Mixpanel) | Block analytics domains in Playwright: `page.route('**/*.google-analytics.com/**', route => route.abort())` |
| Registration flow during promotions | Using fixed timeout that works during normal traffic | Implement dynamic timeouts based on response time monitoring; increase during promotional periods |
| Multi-currency support | Testing only USD flows | Parameterize tests to run against EUR, GBP, crypto currencies; exchange rate APIs can fail |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recording traces for all tests | First 5 tests work fine, suite slows down | Use `trace: 'on-first-retry'` to only capture failures | 20+ tests: 30% slower CI, 50+ tests: artifact upload timeouts |
| Using `waitUntil: 'networkidle'` | Tests pass locally, timeout in CI | Use `waitUntil: 'domcontentloaded'` and element-based waits | Immediately on sites with polling/WebSockets (online casinos always have this) |
| Sequential test execution | Reliable locally, slow in CI | Run tests in parallel with `fullyParallel: true` in config | 10+ tests: 5x longer CI time, 30+ tests: unacceptable 30+ min runs |
| Storing all screenshots/videos | First week is fine | Implement 7-day retention, compress images, fail-only recording | After 1 month: 100GB+ storage, $50-200/month costs |
| No dependency health checks | Team investigates every failure | Add pre-flight checks and skip tests when dependency is down | First major third-party outage: 50+ false alerts, team trust broken |
| Hardcoded 30s timeouts | Tests pass during off-peak hours | Set operation-specific timeouts based on production P95 + buffer | First promotional event: 80% failure rate, alerts during peak revenue time |
| Single GitHub Actions runner | 5 tests in 2 minutes is fine | Use matrix strategy to parallelize across 4-8 runners | 30+ tests: 15+ minute runs, blocks deployment pipeline |
| No alert severity levels | First alert gets immediate attention | Implement CRITICAL/WARNING/INFO levels with separate channels | After 1 week: alert fatigue, team mutes channel, misses real outage |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Hardcoding crypto wallet private keys in tests | Key theft = loss of funds, compromised customer wallets | Use throwaway testnet wallets only, never mainnet keys; rotate weekly |
| Storing production credentials in GitHub Actions secrets | Credential leak in logs, unauthorized access to production | Use separate staging environment for monitoring; production monitoring should use service accounts with minimal permissions |
| Not verifying iframe sandbox attributes | Malicious game provider iframe could access parent page data | Verify iframes have proper sandbox: `expect(await page.locator('iframe').getAttribute('sandbox')).toContain('allow-scripts')` |
| Running tests with admin/superuser accounts | Leaked credentials = full system access | Create dedicated monitoring user with minimal permissions (read-only where possible) |
| Clicking through to external payment processors | Accidentally triggering real transactions | Mock payment flows or use sandbox API keys; verify test mode before clicking "Pay" |
| Not sanitizing alert messages | Screenshots contain PII (email, username, balance) | Redact PII before sending alerts: blur screenshots, sanitize logs |
| Exposing API keys in test code | Keys committed to repo, accessible to anyone with read access | Use environment variables exclusively: `process.env.API_KEY`, never hardcode |
| Testing with real customer data | Privacy violations, GDPR/compliance issues | Generate synthetic test data; never use production database for tests |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Not testing mobile viewport | 60%+ of casino users on mobile, tests only validate desktop | Add mobile viewport tests: `{ ...devices['iPhone 13'] }` in Playwright config |
| Ignoring game load time perception | Users see blank screen for 10s, assume game is broken | Verify loading spinner/progress indicator visible while game loads |
| Not testing with slow network | Users on 3G see timeouts, tests only run on fast CI network | Add slow network simulation: `page.route('**/*', route => route.continue({ delay: 2000 }))` |
| Missing error message validation | Tests verify error occurs, don't check if message is helpful | Assert error message contains actionable guidance: `expect(error).toContain('Try again or contact support')` |
| Not verifying promo banners | Critical revenue-driving banners broken, tests don't cover them | Add tests for promo banner visibility and click-through to landing pages |
| Ignoring chat responsiveness | Users wait 10s for chat to open, tests only verify it works eventually | Add chat open time assertion: `<3s on desktop, <5s on mobile` |
| Testing only happy paths | Edge cases (insufficient balance, network errors) create bad UX | Add negative tests: test with $0 balance, network failure, session expiry |
| Not testing logout/session expiry | Users lose in-progress game sessions, frustrating experience | Verify session expiry redirects gracefully and shows warning before expiry |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Game launch tests:** Often missing iframe load verification — verify `frameLocator()` actually finds game canvas, not just iframe element
- [ ] **Chat tests:** Often missing WebSocket connection state check — verify WS connected before sending messages
- [ ] **Crypto flow tests:** Often missing wallet readiness check — verify `window.ethereum.isConnected()` before interactions
- [ ] **Alert notifications:** Often missing severity levels and context — verify alerts include screenshot, trace, last success time, and severity
- [ ] **Retry logic:** Often missing transient failure detection — verify tests retry once for network errors, not application errors
- [ ] **Dependency health checks:** Often missing pre-flight validation — verify tests skip (not fail) when external dependency is down
- [ ] **Timeout configuration:** Often using default 30s everywhere — verify operation-specific timeouts based on production P95
- [ ] **Artifact retention:** Often storing everything forever — verify 7-day retention on branches, compression enabled, fail-only recording
- [ ] **Browser context isolation:** Often reusing contexts — verify fresh context per test for auth/wallet tests
- [ ] **Mobile testing:** Often desktop-only — verify critical flows tested on mobile viewport
- [ ] **Selector resilience:** Often using CSS classes — verify `data-testid` attributes for all test interactions
- [ ] **Error scenarios:** Often happy-path only — verify insufficient balance, network error, session expiry tests exist
- [ ] **Third-party failures:** Often treating all failures as cooked.com issues — verify alerts differentiate internal vs external failures
- [ ] **Parallel execution:** Often sequential — verify `fullyParallel: true` and tests are state-independent
- [ ] **Credentials security:** Often hardcoded — verify all credentials from environment variables, no secrets in code

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Alert fatigue from false positives | MEDIUM (1-2 weeks) | 1. Audit last 50 alerts, categorize true vs false positives. 2. Implement severity levels (CRITICAL/WARNING/INFO). 3. Add retry logic for transient failures. 4. Set up dependency health checks. 5. Track false positive rate weekly. |
| Storage explosion from traces/videos | LOW (1 day) | 1. Change config to `trace: 'on-first-retry'` and `video: 'retain-on-failure'`. 2. Delete old artifacts manually. 3. Set up 7-day retention policy. 4. Enable JPEG screenshots instead of PNG. |
| Tests using `networkidle` causing timeouts | MEDIUM (3-5 days) | 1. Find all `waitUntil: 'networkidle'` usages. 2. Replace with `domcontentloaded`. 3. Add element-based waits for actual readiness. 4. Measure test duration before/after to validate improvement. |
| Missing iframe context switches | MEDIUM (2-3 days) | 1. Identify all game launch tests. 2. Add `frameLocator()` after game clicks. 3. Wait for game canvas element. 4. Verify with screenshot that game actually loaded. |
| WebSocket state ignored | HIGH (1 week) | 1. Build WebSocket monitoring utility. 2. Add to all chat/live dealer tests. 3. Wait for connection before interactions. 4. Add connection state to test artifacts for debugging. |
| Crypto wallet state pollution | MEDIUM (2-3 days) | 1. Refactor crypto tests to use fresh browser context each. 2. Add `window.ethereum` readiness checks. 3. Set up Synpress for reliable wallet automation. 4. Add wallet state verification to debug artifacts. |
| Hardcoded timeouts causing CI failures | LOW (1-2 days) | 1. Measure production P95 for each operation type. 2. Set operation-specific timeouts (P95 + 50%). 3. Use longer timeouts in CI: `process.env.CI ? 20000 : 10000`. 4. Monitor timeout failure rate. |
| No dependency failure detection | MEDIUM (3-4 days) | 1. Build dependency health check function. 2. Add to test suite setup. 3. Skip tests when dependency down. 4. Change alerts to INFO level for external failures. 5. Subscribe to third-party status pages. |
| CSS selectors breaking on UI changes | HIGH (1-2 weeks) | 1. Add `data-testid` attributes to all interactive elements. 2. Replace CSS selectors with `getByTestId()`. 3. Add to development standards: all new features need test IDs. 4. Set up pre-commit hook to warn on CSS selectors in tests. |
| Sequential tests causing slow CI | LOW (1 day) | 1. Set `fullyParallel: true` in config. 2. Verify tests are state-independent (fresh context). 3. Use GitHub Actions matrix strategy for parallelization. 4. Measure CI time before/after. |
| Hardcoded credentials in code | MEDIUM (2-3 days) | 1. Move all credentials to environment variables. 2. Set up GitHub Actions secrets. 3. Scan codebase for hardcoded secrets (use truffleHog/git-secrets). 4. Rotate all exposed credentials. 5. Add pre-commit hook to prevent future hardcoding. |
| Missing mobile testing | MEDIUM (1 week) | 1. Add mobile device configs: `{ ...devices['iPhone 13'] }`. 2. Duplicate critical flows with mobile viewport. 3. Test on real devices or BrowserStack. 4. Add mobile-specific assertions (touch targets, viewport width). |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Relying on `networkidle` for page readiness | Phase 1: Foundation | Config review: no `networkidle` in codebase; all navigation uses `domcontentloaded` + element waits |
| Missing iframe context switches | Phase 2: Game Launch Tests | Code review: all game launch tests use `frameLocator()` and verify canvas element |
| WebSocket state ignored | Phase 3: Chat/Live Tests | Manual test: disconnect network, verify test fails with clear "WS not connected" message |
| Crypto wallet state pollution | Phase 4: Crypto Tests | Test isolation check: run crypto tests 10 times in sequence, verify no state leakage |
| Alert fatigue from false positives | Phase 5: Alerting | Metrics: false positive rate <20%, all alerts have severity level, retry logic for transient failures |
| Trace/screenshot/video storage explosion | Phase 1: Foundation | Config review: `trace: 'on-first-retry'`, retention policy set, storage costs <$20/month |
| Hardcoded timeouts don't match production | Phase 1: Foundation | Documentation: timeout guide with operation types and measured P95 values from production |
| Ignoring third-party dependency failures | Phase 1: Foundation | Dependency health check framework in place; alerts differentiate internal vs external |
| Using CSS selectors instead of test IDs | Phase 1: Foundation | Linting rule: warn on CSS class/ID selectors in tests; `data-testid` required for PR approval |
| No mobile testing | Phase 6: Mobile/Cross-Browser | Test suite runs on mobile viewports; mobile-specific assertions for touch targets |
| Sequential test execution | Phase 1: Foundation | CI metrics: tests run in parallel, total suite time <5 minutes for 30 tests |
| Hardcoded credentials | Phase 1: Foundation | Security scan: no credentials in code, all from environment variables, pre-commit hook prevents hardcoding |

## Sources

### Playwright Best Practices & Common Mistakes
- [15 Best Practices for Playwright testing in 2026](https://www.browserstack.com/guide/playwright-best-practices)
- [Playwright Skill: The Complete Guide to Mastering Playwright Testing [2026]](https://testdino.com/blog/playwright-skill/)
- [Flaky Tests in 2026: Key Causes, Fixes, and Prevention](https://www.accelq.com/blog/flaky-tests/)
- [What is a Flaky Test? Causes, Identification & Remediation](https://middleware.io/blog/flaky-test/)

### Iframe Testing
- [Testing iframes with Playwright](https://debbie.codes/blog/testing-iframes-with-playwright/)
- [How to Handle Playwright iFrames: A Complete Tutorial](https://www.testmu.ai/learning-hub/handling-iframes-in-playwright/)
- [How to Handle iFrames in Playwright - Checkly Docs](https://www.checklyhq.com/docs/learn/playwright/iframe-interaction/)
- [Bug: Issues with iframes - GitHub Issue #33674](https://github.com/microsoft/playwright/issues/33674)

### WebSocket Testing
- [Playwright: Testing WebSockets and Live Data Streams](https://dzone.com/articles/playwright-for-real-time-applications-testing-webs)
- [Is It Worth Mocking WebSockets by Playwright?](https://adequatica.medium.com/is-it-worth-mocking-websockets-by-playwright-e611cb016ec5)
- [Inspect WebSockets with Playwright - A Practical Guide](https://www.linkedin.com/pulse/inspect-websockets-playwright-practical-guide-sachith-palihawadana)
- [Real-Time Application Testing: WebSocket Basics and Mock Interception](https://abigailarmijo.substack.com/p/real-time-application-testing-websocket)

### Crypto/Web3 Testing
- [Guideline to be QA Web3: Complete E2E DeFi Project with Synpress (Playwright) and Hardhat/Anvil](https://medium.com/coinmonks/guideline-to-be-qa-web3-complete-e2e-defi-project-with-synpress-playwright-and-hardhat-anvil-5e3af494cca4)
- [Playwright + Blockchain Testing: Validating dApps and Smart Contract Frontends](https://testrig.medium.com/playwright-blockchain-testing-validating-dapps-and-smart-contract-frontends-9d6dd8b6c7a9)
- [Mocking window.ethereum in Playwright for end-to-end dApp testing](https://massimilianomirra.com/notes/mocking-window-ethereum-in-playwright-for-end-to-end-dapp-testing)
- [Testing behind the scenes: crypto wallet QA in 2026](https://betterqa.co/testing-behind-the-scenes-a-crypto-wallet-project/)

### GitHub Actions & CI/CD
- [Automating Playwright Tests with GitHub Actions](https://www.browserstack.com/guide/playwright-github-action)
- [End-to-End Test Automation Pipeline with Playwright, GitHub Actions, and Allure Reports](https://kailash-pathak.medium.com/end-to-end-test-automation-with-playwright-github-actions-and-allure-reports-5f9817ae4648)
- [Setting up CI - Playwright Docs](https://playwright.dev/docs/ci-intro)
- [On Playwright in GitHub Actions](https://radekmie.dev/blog/on-playwright-in-github-actions/)

### Artifact Storage & Performance
- [How Testrig Reduced Playwright Test Artifact Storage by More Than 60%](https://www.testrigtechnologies.com/how-testrig-reduced-playwright-test-artifact-storage-by-more-than-60-real-ci-cd-insights/)
- [Feature: Possibility to reduce sizes of screenshots and trace files - GitHub Issue #29218](https://github.com/microsoft/playwright/issues/29218)
- [Feature: Keep only artifacts of latest failure - GitHub Issue #23723](https://github.com/microsoft/playwright/issues/23723)
- [Question: Uploading large files reduces test inspection performance - GitHub Issue #20157](https://github.com/microsoft/playwright/issues/20157)

### Alert Fatigue & False Positives
- [How to Fight Alert Fatigue with Synthetic Monitoring](https://www.checklyhq.com/blog/alert-fatigue/)
- [Alert Fatigue: What It Is and How to Prevent It](https://www.datadoghq.com/blog/best-practices-to-prevent-alert-fatigue/)
- [Alert Fatigue Is Killing Your SOC. Here's What Actually Works in 2026.](https://torq.io/blog/cybersecurity-alert-management-2026/)
- [SOC Alert Fatigue: Causes, Impact & AI Solutions for Security Analysts (2026)](https://cyberdefenders.org/blog/soc-alert-fatigue/)

### Timeouts & Wait Strategies
- [Understanding Playwright Timeout [2026]](https://www.browserstack.com/guide/playwright-timeout)
- [Understanding Playwright waitforloadstate [2026]](https://www.browserstack.com/guide/playwright-waitforloadstate)
- [Why "page.goto()" is slowing down your Playwright tests in 2026](https://www.browserstack.com/guide/playwright-goto)
- [Waituntil Option in Playwright](https://www.browserstack.com/guide/playwright-waituntil)
- [Timeouts - Playwright Docs](https://playwright.dev/docs/test-timeouts)

### Online Casino Security & Integrations
- [Integrating Third-Party Services in Casino Game Architecture](https://sdlccorp.com/post/integrating-third-party-services-in-casino-game-architecture/)
- [What APIs are essential for iGaming software integration?](https://whitelabelcoders.com/blog/what-apis-are-essential-for-igaming-software-integration/)
- [2026 Iframe Security Risks and 10 Ways to Secure Them](https://qrvey.com/blog/iframe-security/)
- [Online Casino Security: How Casinos Prevent Data Breaches](https://northeasttimes.com/online-casino-security/)

### Browser Context & Security
- [Isolation - Playwright Docs](https://playwright.dev/docs/browser-contexts)
- [What are the security implications of using Playwright?](https://webscraping.ai/faq/playwright/what-are-the-security-implications-of-using-playwright)
- [Block Scripts, Styles, Media, and Ads with Playwright](https://www.browsercat.com/post/block-inline-and-network-resources-with-playwright)

### Synthetic Monitoring
- [Synthetic Monitoring with Playwright - Checkly](https://www.checklyhq.com/blog/synthetic-monitoring-with-checkly-and-playwright-test/)
- [Synthetic Monitoring Management Using Playwright, @elastic/synthetics and Semaphore](https://semaphore.io/blog/synthetic-monitoring)
- [Synthetic Monitoring in Application Insights Using Playwright: A Game-Changer](https://techcommunity.microsoft.com/blog/azurearchitectureblog/synthetic-monitoring-in-application-insights-using-playwright-a-game-changer/4400509)

---
*Pitfalls research for: Playwright-based synthetic monitoring for online casino (cooked.com)*
*Researched: 2026-02-15*
