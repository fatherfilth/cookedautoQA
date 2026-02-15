# Architecture Research

**Domain:** Playwright-based Synthetic Monitoring for Online Casino
**Researched:** 2026-02-15
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SCHEDULING LAYER                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  GitHub Actions (Cron: */30 * * * *)                         │   │
│  │  OR Quartz Scheduler (Docker/K8s deployments)                 │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                           │ Triggers                                 │
├───────────────────────────┼──────────────────────────────────────────┤
│                      TEST EXECUTION LAYER                            │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │  Playwright Test Runner                                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │
│  │  │ Smoke   │  │ Critical│  │ Breakpnt│  │ Fullsute│         │   │
│  │  │ Tests   │  │ Path    │  │ Tests   │  │ Tests   │         │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘         │   │
│  └───────┼────────────┼────────────┼────────────┼──────────────┘   │
│          │            │            │            │                    │
│  ┌───────▼────────────▼────────────▼────────────▼──────────────┐   │
│  │  Page Object Model + Utilities Layer                         │   │
│  │  - Pages/     - Utils/      - Fixtures/    - Config/         │   │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │ Executes                              │
├──────────────────────────────┼───────────────────────────────────────┤
│                     ARTIFACT COLLECTION LAYER                        │
│  ┌───────────────────────────▼───────────────────────────────────┐  │
│  │  Artifact Storage (on failure/retry)                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │Screenshot│  │  Video   │  │  Trace   │  │HTML Rept.│      │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │  │
│  └───────┼─────────────┼─────────────┼─────────────┼────────────┘  │
│          │             │             │             │                │
├──────────┼─────────────┼─────────────┼─────────────┼────────────────┤
│                     REPORTING & ALERTING LAYER                       │
│  ┌───────▼─────────────▼─────────────▼─────────────▼────────────┐  │
│  │  Results Processor                                            │  │
│  │  ├─ GitHub Artifacts (upload-artifact)                        │  │
│  │  ├─ Slack Notifications (playwright-slack-report)             │  │
│  │  ├─ Email Alerts (conditional on failure)                     │  │
│  │  └─ Metrics Endpoint (Prometheus, if self-hosted)             │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Scheduler** | Triggers test execution at intervals (every 30 min for cooked-synthetic-monitor) | GitHub Actions cron workflow OR Quartz Scheduler for Docker/K8s |
| **Test Orchestrator** | Manages test discovery, categorization, parallel execution, and sharding | Playwright Test Runner with playwright.config.ts |
| **Test Suites** | Contains categorized tests (@smoke, @breakpoint, @critical) organized by feature domain | Tests organized in tests/ folder by domain (lobby/, games/, registration/, etc.) |
| **Page Objects** | Encapsulates page interactions and locators; reduces test maintenance | pages/ folder with PascalCase files (LobbyPage.ts, GameLaunchPage.ts) |
| **Utilities** | Reusable helpers for common tasks (random data, date/time, API helpers, logging) | utils/ folder with camelCase files (dateUtils.ts, apiHelpers.ts) |
| **Fixtures** | Test setup/teardown, context management, authentication state | fixtures/ folder with custom test fixtures extending base test |
| **Configuration** | Environment-specific settings (URLs, credentials, timeouts, browser configs) | config/ folder + playwright.config.ts + .env files |
| **Artifact Collector** | Captures screenshots, videos, traces on failure/retry; manages storage lifecycle | Playwright built-in (screenshot: 'only-on-failure', trace: 'retain-on-failure') |
| **Reporter** | Transforms test results into actionable alerts and reports | Built-in HTML reporter + playwright-slack-report + custom reporters |
| **Alert Dispatcher** | Sends notifications to Slack/email on test failures | GitHub Actions steps OR custom notification logic with conditional triggers |
| **Metrics Exporter** | (Optional) Exposes test metrics for external monitoring systems | Prometheus endpoint at /metrics (for self-hosted deployments) |

## Recommended Project Structure

```
cooked-synthetic-monitor/
├── .github/
│   └── workflows/
│       ├── synthetic-monitor.yml       # Main cron schedule (every 30 min)
│       └── pr-tests.yml                 # PR validation workflow
├── tests/
│   ├── lobby/
│   │   ├── lobby-load.spec.ts           # @smoke - Lobby loads
│   │   └── game-cards-display.spec.ts   # @smoke - Game cards render
│   ├── games/
│   │   ├── slot-launch.spec.ts          # @critical - Slot iframe launch
│   │   ├── table-launch.spec.ts         # @critical - Table game launch
│   │   └── live-dealer-launch.spec.ts   # @critical - Live dealer launch
│   ├── auth/
│   │   ├── login.spec.ts                # @smoke - User login flow
│   │   └── registration.spec.ts         # @breakpoint - New user registration
│   ├── chat/
│   │   └── websocket-chat.spec.ts       # @critical - Chat WebSocket connection
│   ├── tipping/
│   │   └── tip-dealer.spec.ts           # @breakpoint - Tipping flow
│   └── swapped/
│       └── crypto-buy-flow.spec.ts      # @critical - Swapped.com integration
├── pages/
│   ├── LobbyPage.ts                     # Lobby page interactions
│   ├── GameLaunchPage.ts                # Game iframe handling
│   ├── LoginPage.ts                     # Login form interactions
│   ├── RegistrationPage.ts              # Registration flow
│   ├── ChatPage.ts                      # Chat widget interactions
│   └── SwappedPage.ts                   # Crypto buy flow
├── utils/
│   ├── webSocketHelper.ts               # WebSocket connection verification
│   ├── iframeHelper.ts                  # iframe locator and interaction helpers
│   ├── authHelper.ts                    # Authentication state management
│   ├── cryptoHelper.ts                  # Crypto flow utilities
│   └── logger.ts                        # Structured logging
├── fixtures/
│   ├── testSetup.ts                     # Custom fixtures (authenticated user, etc.)
│   └── storageState.ts                  # Persistent auth state management
├── config/
│   ├── environments.ts                  # Environment URLs (dev, staging, prod)
│   └── testData.ts                      # Test data constants
├── artifacts/                            # Local artifact storage (gitignored)
│   ├── screenshots/
│   ├── videos/
│   └── traces/
├── playwright.config.ts                  # Main Playwright configuration
├── tsconfig.json                         # TypeScript configuration
├── .env.example                          # Environment variable template
├── .env                                  # Actual environment variables (gitignored)
└── package.json                          # Dependencies and scripts
```

### Structure Rationale

- **tests/ organized by feature domain**: Groups tests by product area (lobby, games, auth) rather than test type. This mirrors user journeys and makes it easier to locate tests when features change.
- **pages/ with PascalCase naming**: Page Object Model encapsulates UI interactions. PascalCase signals these are class definitions.
- **utils/ for shared logic**: Prevents duplication across tests. Casino-specific helpers (WebSocket verification, iframe handling) live here.
- **fixtures/ for test lifecycle**: Manages authentication state, browser context setup, and teardown logic outside individual tests.
- **config/ separates environment data**: URLs, credentials, and test data live here, not hardcoded in tests. Enables multi-environment testing.
- **.github/workflows/ for scheduling**: GitHub Actions provides free cron scheduling. Main workflow runs every 30 minutes; PR workflow validates changes.
- **artifacts/ local storage**: Used during local development. CI uploads to GitHub Artifacts with retention policies.

## Architectural Patterns

### Pattern 1: Tag-Based Test Categorization

**What:** Tests are tagged with @smoke, @breakpoint, @critical to enable selective execution based on context (schedule frequency, CI/CD pipeline stage).

**When to use:** Always. Enables running fast smoke tests every 30 minutes, comprehensive breakpoint tests hourly, and full suite nightly.

**Trade-offs:**
- **Pros:** Flexible execution, faster feedback loops, reduced CI cost
- **Cons:** Requires discipline to maintain consistent tagging, potential for tag drift

**Example:**
```typescript
// tests/lobby/lobby-load.spec.ts
import { test, expect } from '@playwright/test';

test('lobby loads successfully @smoke', async ({ page }) => {
  await page.goto('https://cooked.com/lobby');
  await expect(page.locator('[data-testid="game-grid"]')).toBeVisible();
});

test('all game categories display @breakpoint', async ({ page }) => {
  await page.goto('https://cooked.com/lobby');
  await expect(page.locator('[data-category="slots"]')).toBeVisible();
  await expect(page.locator('[data-category="table-games"]')).toBeVisible();
  await expect(page.locator('[data-category="live-dealer"]')).toBeVisible();
});
```

**Execution:**
```bash
# Smoke tests (fast, every 30 min)
npx playwright test --grep @smoke

# Breakpoint tests (comprehensive, hourly)
npx playwright test --grep @breakpoint

# Critical path tests (user-facing failures, every 30 min)
npx playwright test --grep @critical

# Full suite (nightly)
npx playwright test
```

### Pattern 2: Page Object Model with Casino-Specific Helpers

**What:** Encapsulates page interactions in classes, with specialized helpers for casino features (iframe games, WebSocket chat, crypto flows).

**When to use:** For all UI interactions. Critical for iframe testing and WebSocket verification in casino context.

**Trade-offs:**
- **Pros:** Centralized locator management, reduced test maintenance, easier iframe handling
- **Cons:** Initial setup overhead, can become over-abstracted if not disciplined

**Example:**
```typescript
// pages/GameLaunchPage.ts
import { Page, FrameLocator } from '@playwright/test';

export class GameLaunchPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async launchSlotGame(gameId: string) {
    await this.page.click(`[data-game-id="${gameId}"]`);

    // Wait for game iframe to load
    const gameFrame = this.getGameFrame();
    await gameFrame.locator('[data-game-state="ready"]').waitFor();
  }

  getGameFrame(): FrameLocator {
    // Casino games typically load in iframes
    return this.page.frameLocator('iframe[id="game-frame"]');
  }

  async verifyGameLoaded(): Promise<boolean> {
    const gameFrame = this.getGameFrame();
    const isReady = await gameFrame.locator('[data-game-state="ready"]').isVisible();
    return isReady;
  }
}

// tests/games/slot-launch.spec.ts
import { test, expect } from '@playwright/test';
import { GameLaunchPage } from '../../pages/GameLaunchPage';

test('slot game launches successfully @critical', async ({ page }) => {
  const gameLaunchPage = new GameLaunchPage(page);
  await page.goto('https://cooked.com/lobby');

  await gameLaunchPage.launchSlotGame('slot-123');
  expect(await gameLaunchPage.verifyGameLoaded()).toBe(true);
});
```

### Pattern 3: WebSocket Monitoring for Live Features

**What:** Validates WebSocket connections for chat, live dealer feeds, and real-time updates rather than just UI state.

**When to use:** For casino live features (chat, live dealer, real-time odds updates). Ensures backend connectivity, not just frontend rendering.

**Trade-offs:**
- **Pros:** Detects network issues before users report them, validates real-time data flow
- **Cons:** More complex than UI-only tests, requires careful event filtering to avoid noise

**Example:**
```typescript
// utils/webSocketHelper.ts
import { Page } from '@playwright/test';

export class WebSocketHelper {
  static async waitForWebSocketMessage(
    page: Page,
    urlPattern: RegExp,
    messageFilter: (data: any) => boolean,
    timeout: number = 10000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`WebSocket message not received within ${timeout}ms`));
      }, timeout);

      page.on('websocket', ws => {
        if (urlPattern.test(ws.url())) {
          ws.on('framereceived', event => {
            try {
              const data = JSON.parse(event.payload as string);
              if (messageFilter(data)) {
                clearTimeout(timeoutId);
                resolve(data);
              }
            } catch (e) {
              // Ignore non-JSON frames
            }
          });
        }
      });
    });
  }
}

// tests/chat/websocket-chat.spec.ts
import { test, expect } from '@playwright/test';
import { WebSocketHelper } from '../../utils/webSocketHelper';

test('chat WebSocket connects successfully @critical', async ({ page }) => {
  await page.goto('https://cooked.com/lobby');

  // Wait for WebSocket connection message
  const wsMessage = await WebSocketHelper.waitForWebSocketMessage(
    page,
    /wss:\/\/cooked\.com\/chat/,
    (data) => data.type === 'connection_established'
  );

  expect(wsMessage.status).toBe('connected');
});
```

### Pattern 4: Artifact Retention Strategy (Failure-Only)

**What:** Capture screenshots, videos, and traces ONLY on test failure or retry to minimize storage costs.

**When to use:** Always in CI. Traces can be 10-50MB each; storing all traces wastes money and slows artifact upload.

**Trade-offs:**
- **Pros:** Dramatically reduces storage costs, faster CI runs
- **Cons:** No artifacts for passing tests (acceptable trade-off)

**Example:**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    screenshot: 'only-on-failure',  // Screenshot on failure only
    video: 'retain-on-failure',     // Video on failure only
    trace: 'retain-on-failure',     // Trace on failure or first retry
  },

  retries: process.env.CI ? 2 : 0,  // Retry twice in CI

  reporter: [
    ['html'],
    ['playwright-slack-report', {
      channels: ['qa-alerts'],
      sendResults: 'on-failure',     // Only notify on failures
    }],
  ],
});
```

### Pattern 5: Conditional Alerting (Avoid Alert Fatigue)

**What:** Send Slack/email notifications ONLY when tests fail, not on every run. Include failure context (screenshots, trace links).

**When to use:** For production monitoring. Alerts should be actionable, not noise.

**Trade-offs:**
- **Pros:** Team focuses on real issues, reduces alert fatigue
- **Cons:** No "heartbeat" signal (mitigate with dashboard or metrics endpoint)

**Example:**
```yaml
# .github/workflows/synthetic-monitor.yml
name: Synthetic Monitoring

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run smoke tests
        run: npx playwright test --grep @smoke

      - name: Upload artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: smoke-test-results
          path: |
            playwright-report/
            test-results/
          retention-days: 7

      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Synthetic monitoring FAILED",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Synthetic Monitoring Alert*\n:x: Smoke tests failed\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Results>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Data Flow

### Test Execution Flow

```
[GitHub Actions Cron Trigger (every 30 min)]
    ↓
[Workflow: synthetic-monitor.yml starts]
    ↓
[Install dependencies & Playwright browsers]
    ↓
[Playwright Test Runner starts]
    ↓
[Load playwright.config.ts] → [Read config/, .env]
    ↓
[Discover tests matching --grep @smoke]
    ↓
[Execute tests in parallel (workers: 4)]
    ↓
┌─────────────────────────────────────┐
│  Test Execution (per worker)        │
│  ├─ Load fixtures (auth state)      │
│  ├─ Navigate to page                │
│  ├─ Execute Page Object methods     │
│  ├─ Assert expectations             │
│  ├─ Capture artifacts on failure    │
│  │   ├─ Screenshot                  │
│  │   ├─ Video                       │
│  │   └─ Trace                       │
│  └─ Report result to runner         │
└─────────────────────────────────────┘
    ↓
[Aggregate results across workers]
    ↓
[Generate HTML Report + playwright-slack-report processes results]
    ↓
┌─────────────────────────────────────────┐
│  IF: Any test failed                    │
│  ├─ Upload artifacts to GitHub Actions  │
│  ├─ Send Slack notification with link   │
│  └─ Mark workflow as failed             │
│  ELSE:                                  │
│  └─ Mark workflow as passed (no alert)  │
└─────────────────────────────────────────┘
```

### Artifact Storage Flow

```
[Test Failure Detected]
    ↓
[Playwright captures artifacts]
    ├─ Screenshot: test-results/<test-name>/test-failed-1.png
    ├─ Video: test-results/<test-name>/video.webm
    └─ Trace: test-results/<test-name>/trace.zip
    ↓
[GitHub Actions: upload-artifact step]
    ↓
[Compress artifacts]
    ↓
[Upload to GitHub Artifacts API]
    ↓
[Store with retention-days: 7]
    ↓
[Generate download URL]
    ↓
[Include URL in Slack notification]
```

### WebSocket Validation Flow (Chat Feature)

```
[Test: Chat WebSocket @critical starts]
    ↓
[Navigate to https://cooked.com/lobby]
    ↓
[Register WebSocket listener via page.on('websocket')]
    ↓
[Page loads → Chat widget initializes]
    ↓
[WebSocket connection to wss://cooked.com/chat opens]
    ↓
[Playwright intercepts WebSocket frames]
    ↓
[Filter frames for type: 'connection_established']
    ↓
[Assert: status === 'connected']
    ↓
[Send test message via chat UI]
    ↓
[Filter frames for type: 'message_sent']
    ↓
[Assert: message delivered successfully]
    ↓
[Test passes → No artifacts captured]
```

### iframe Game Launch Flow

```
[Test: Slot game launch @critical starts]
    ↓
[Navigate to lobby page]
    ↓
[Click game card with data-game-id="slot-123"]
    ↓
[Page loads iframe with src="https://game-provider.com/slot-123"]
    ↓
[Use FrameLocator: page.frameLocator('iframe#game-frame')]
    ↓
[Wait for iframe content: frameLocator.locator('[data-game-state="ready"]').waitFor()]
    ↓
[Assert: Game ready indicator visible]
    ↓
[Optional: Verify game provider logo in iframe]
    ↓
[Test passes → No artifacts captured]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 tests, 1 environment** | Single GitHub Actions workflow with 4 workers. No sharding needed. Runs complete in <5 minutes. Use --grep for test categorization. |
| **100-500 tests, multiple environments** | Add sharding (--shard=1/3, 2/3, 3/3) to parallelize across 3 jobs. Use matrix strategy in GitHub Actions for multi-environment testing (dev, staging, prod). Test suite completes in 5-8 minutes. |
| **500+ tests, high frequency** | Move to self-hosted runners or cloud CI (CircleCI, BuildKite) for more workers. Implement test impact analysis to run only affected tests on PR. Use distributed tracing for debugging. Consider Playwright Test Sharding with 5+ shards. |

### Scaling Priorities

1. **First bottleneck: GitHub Actions runner CPU (2 cores)**
   - **Symptom:** Test suite takes >10 minutes
   - **Fix:** Add sharding to split tests across multiple jobs. Use matrix strategy to run shards in parallel.
   - **Implementation:**
     ```yaml
     jobs:
       smoke-tests:
         strategy:
           matrix:
             shardIndex: [1, 2, 3]
             shardTotal: [3]
         steps:
           - run: npx playwright test --grep @smoke --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
     ```

2. **Second bottleneck: Artifact storage costs**
   - **Symptom:** GitHub storage quota exceeded, slow artifact uploads
   - **Fix:** Reduce retention-days from 30 to 7. Use trace: 'on-first-retry' instead of 'retain-on-failure' to skip trace on first failure.
   - **Alternative:** Move to external storage (S3, Azure Blob) for long-term retention.

3. **Third bottleneck: Alert fatigue from flaky tests**
   - **Symptom:** Team ignores Slack alerts due to false positives
   - **Fix:** Implement retry logic (retries: 2) to auto-heal flaky tests. Track flaky tests with Playwright's built-in flakiness detection. Send separate alerts for flaky vs. consistently failing tests.

## Anti-Patterns

### Anti-Pattern 1: Hardcoding URLs and Credentials in Tests

**What people do:** Embed URLs like `https://cooked.com/lobby` and credentials directly in test files.

**Why it's wrong:** Makes tests environment-dependent. Can't run same tests against dev/staging/prod. Credentials leak in version control.

**Do this instead:** Use environment variables and config files.

```typescript
// BAD
test('login', async ({ page }) => {
  await page.goto('https://cooked.com/login');
  await page.fill('#username', 'testuser@cooked.com');
  await page.fill('#password', 'Test123!');
});

// GOOD
// config/environments.ts
export const environments = {
  dev: 'https://dev.cooked.com',
  staging: 'https://staging.cooked.com',
  prod: 'https://cooked.com',
};

// .env
BASE_URL=https://staging.cooked.com
TEST_USERNAME=testuser@cooked.com
TEST_PASSWORD=stored_in_secrets_manager

// tests/auth/login.spec.ts
import { test } from '@playwright/test';
test('login', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/login`);
  await page.fill('#username', process.env.TEST_USERNAME);
  await page.fill('#password', process.env.TEST_PASSWORD);
});
```

### Anti-Pattern 2: Using CSS/XPath Selectors Instead of Semantic Locators

**What people do:** Use brittle selectors like `div.game-card:nth-child(3) > span.title` or `//div[@class='game-card'][3]/span[@class='title']`.

**Why it's wrong:** Breaks when DOM structure changes (new wrapper div, CSS class rename). Harder to read and maintain.

**Do this instead:** Use role-based locators (getByRole) or data-testid attributes.

```typescript
// BAD
await page.click('div.lobby-nav > ul > li:nth-child(2) > a');

// BETTER (but still fragile)
await page.click('.lobby-nav .slots-link');

// BEST
await page.getByRole('link', { name: 'Slots' }).click();
// OR with data-testid
await page.locator('[data-testid="slots-nav-link"]').click();
```

### Anti-Pattern 3: Storing ALL Test Artifacts (Passing Tests Too)

**What people do:** Configure `screenshot: 'on'`, `video: 'on'`, `trace: 'on'` to capture everything.

**Why it's wrong:** Generates gigabytes of artifacts per run. A 100-test suite with traces creates 1-5GB of storage per run. GitHub Actions storage quota is limited. Artifact upload slows down CI by 2-5 minutes.

**Do this instead:** Use failure-only artifact capture.

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',   // Only on failure
    video: 'retain-on-failure',      // Only on failure
    trace: 'on-first-retry',          // Only on retry (skips first failure)
  },
});
```

### Anti-Pattern 4: Alerting on Every Test Run (Even Success)

**What people do:** Send Slack notification after every test run: "Smoke tests passed ✅" every 30 minutes.

**Why it's wrong:** Creates alert fatigue. Team learns to ignore notifications. Critical failures get lost in noise.

**Do this instead:** Alert ONLY on failure. Use dashboard for success visibility.

```yaml
# BAD
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    payload: '{"text": "Tests completed: ${{ job.status }}"}'

# GOOD
- name: Notify Slack on failure
  if: failure()  # Only runs if job failed
  uses: slackapi/slack-github-action@v1
  with:
    payload: '{"text": ":x: Synthetic monitoring FAILED"}'
```

### Anti-Pattern 5: Not Using Test Categorization (Running Full Suite Always)

**What people do:** Run all 200 tests every 30 minutes, even though 80% are slow integration tests.

**Why it's wrong:** Wastes CI time and runner quota. Slow feedback loop (20 minutes per run). Can't prioritize critical paths.

**Do this instead:** Tag tests and run categories on different schedules.

```typescript
// Tag tests
test('lobby loads @smoke', async ({ page }) => { ... });
test('checkout flow @critical', async ({ page }) => { ... });
test('admin panel @regression', async ({ page }) => { ... });

// Schedule workflows
// Every 30 min: npx playwright test --grep @smoke
// Every hour:   npx playwright test --grep @critical
// Nightly:      npx playwright test --grep @regression
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **GitHub Actions** | Cron trigger in workflow YAML | Free for public repos; 2000 min/month for private repos. Use cron: '*/30 * * * *' for every 30 min. |
| **Slack** | Webhook via playwright-slack-report or GitHub Action | Use incoming webhook URL stored in GitHub Secrets. Configure sendResults: 'on-failure' to avoid spam. |
| **Email (SendGrid/Mailgun)** | Custom reporter or GitHub Action | Typically used as secondary channel. Send digest emails (daily summary) rather than per-run alerts. |
| **Prometheus** | Metrics endpoint (self-hosted only) | Requires custom Docker image (playwright-synthetic-monitoring project pattern). Exposes /metrics endpoint with pass/fail counts. |
| **Game Providers (iframes)** | FrameLocator API | Games load in third-party iframes. Use page.frameLocator('iframe#game-frame') to interact. Cannot access cross-origin iframe content. |
| **Swapped.com (Crypto)** | Standard page navigation or API testing | If Swapped flow is in iframe, use FrameLocator. If separate domain, navigate directly. Consider API testing for crypto purchase verification. |
| **WebSocket (Chat)** | page.on('websocket') event listener | Monitor WebSocket frames for connection_established and message events. Filter by URL pattern to avoid noise. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Tests ↔ Page Objects** | Direct method calls | Tests import page classes, call methods like `loginPage.login(username, password)`. Page objects return promises or values. |
| **Page Objects ↔ Utils** | Direct imports | Page objects use utils for complex tasks (WebSocket verification, iframe handling). Keeps page objects focused on UI interactions. |
| **Tests ↔ Fixtures** | Playwright fixture system | Fixtures inject dependencies (authenticated page, test data) into tests via destructuring: `async ({ authenticatedPage }) => { ... }`. |
| **Config ↔ Runtime** | process.env and imports | Tests read process.env.BASE_URL at runtime. playwright.config.ts sets global defaults. |
| **Reporter ↔ Alerting** | Plugin system | Reporters run after test completion, receive test results as input. Output Slack messages, HTML reports, or metrics. |
| **Scheduler ↔ Test Runner** | Shell command execution | GitHub Actions runs `npx playwright test --grep @smoke`. Test runner exits with code 0 (success) or 1 (failure). Workflow reacts to exit code. |

## Build Order Recommendations

Based on component dependencies, recommended build order for cooked-synthetic-monitor:

### Phase 1: Foundation (Week 1)
1. **Project scaffolding**: Initialize with `npm init playwright@latest`, set up TypeScript
2. **Basic configuration**: playwright.config.ts with base URL, browser settings, artifact configs
3. **Environment management**: .env file, config/environments.ts for multi-environment support
4. **First smoke test**: Simple lobby load test to validate setup

**Why first:** Can't build page objects or utilities without base framework. Validates Playwright installation and basic configuration.

### Phase 2: Core Test Infrastructure (Week 1-2)
5. **Page Object Model foundation**: Create base page class, implement LobbyPage and LoginPage
6. **Fixture setup**: Authentication fixtures, storage state management for logged-in tests
7. **Utilities**: iframeHelper.ts for game launch testing, logger.ts for structured logging
8. **Test categorization**: Implement @smoke, @critical, @breakpoint tagging system

**Why second:** Depends on base config. Enables writing maintainable tests for critical paths.

### Phase 3: Critical Path Tests (Week 2)
9. **Authentication tests**: Login flow (@smoke), registration flow (@breakpoint)
10. **Game launch tests**: Slot, table, live dealer iframe testing (@critical)
11. **iframe validation**: Implement FrameLocator patterns, verify game provider content loads

**Why third:** Depends on page objects and iframe utilities. Validates core user journeys.

### Phase 4: Advanced Features (Week 3)
12. **WebSocket testing**: Chat WebSocket verification (@critical)
13. **Crypto integration**: Swapped.com buy flow test (@critical)
14. **Tipping flow**: Dealer tipping test (@breakpoint)

**Why fourth:** Requires WebSocket helper utilities. More complex than basic page navigation.

### Phase 5: CI/CD Integration (Week 3)
15. **GitHub Actions workflow**: .github/workflows/synthetic-monitor.yml with cron schedule
16. **Artifact upload**: Configure upload-artifact on failure with 7-day retention
17. **Sharding setup**: Matrix strategy for parallel execution if needed

**Why fifth:** Tests must exist before CI can run them. Validates local tests work in CI environment.

### Phase 6: Alerting & Monitoring (Week 4)
18. **Slack integration**: playwright-slack-report configuration, failure-only alerts
19. **Email fallback**: Secondary notification channel for critical failures
20. **Metrics dashboard**: (Optional) HTML report hosting or Prometheus endpoint for self-hosted

**Why sixth:** Requires working tests and CI. Completes monitoring feedback loop.

### Phase 7: Refinement (Week 4+)
21. **Flaky test handling**: Implement retries, track flaky tests, alert separately
22. **Performance optimization**: Adjust worker count, implement sharding if suite grows
23. **Documentation**: README with architecture overview, runbook for alert response

**Why last:** Optimization requires baseline metrics from running tests. Documentation captures finalized architecture.

## Sources

- [GitHub - workadventure/playwright-synthetic-monitoring](https://github.com/workadventure/playwright-synthetic-monitoring)
- [Playwright Folder Structure Best Practices](https://medium.com/@divyakandpal93/playwright-test-framework-structure-best-practices-for-scalability-eddf6232593d)
- [Testing Framework Setup and Config](https://testrig.medium.com/playwright-testing-framework-from-scratch-folder-structure-config-and-best-practices-a8f8b3623938)
- [End-to-End Test Automation with GitHub Actions](https://kailash-pathak.medium.com/end-to-end-test-automation-with-playwright-github-actions-and-allure-reports-5f9817ae4648)
- [Playwright Slack Notifications](https://medium.com/@ma11hewthomas/send-playwright-test-results-to-slack-7b07b6e3467e)
- [Playwright Test Sharding](https://playwright.dev/docs/test-sharding)
- [Using Tags in Playwright](https://www.browserstack.com/guide/playwright-tags)
- [Playwright WebSocket Testing](https://dzone.com/articles/playwright-for-real-time-applications-testing-webs)
- [Testing iframes with Playwright](https://debbie.codes/blog/testing-iframes-with-playwright/)
- [Synthetic Monitoring Architecture - Dynatrace](https://docs.dynatrace.com/docs/observe/digital-experience/synthetic-monitoring/general-information/architecture-communication)
- [Building Scalable Synthetic Monitoring](https://medium.com/@thisissvikas/building-a-highly-scalable-synthetic-monitoring-solution-f15f3ff3cb9d)
- [Playwright Artifacts in GitHub Actions](https://github.com/microsoft/playwright/issues/24319)
- [Page Object Model with Playwright](https://www.browserstack.com/guide/page-object-model-with-playwright)
- [Microsoft Playwright Documentation](https://playwright.dev/docs/ci-intro)
- [playwright-slack-report npm package](https://www.npmjs.com/package/playwright-slack-report)

---
*Architecture research for: Playwright-based Synthetic Monitoring for Online Casino*
*Researched: 2026-02-15*
