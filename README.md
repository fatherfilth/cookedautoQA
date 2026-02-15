# COOKEDQA - Synthetic Monitoring for cooked.com

Automated end-to-end tests monitoring critical user flows (authentication, games, chat, crypto) running on GitHub Actions every 30 minutes with Slack alerts on failure.

## Prerequisites

- Node.js 20+
- npm 10.9.2 (specified in `package.json`)
- Git

## Installation

```bash
# Clone repository
git clone <repository-url>
cd COOKEDQA

# Install dependencies
npm install

# Install Playwright browser (Chromium only)
npx playwright install chromium
```

## Configuration

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in required values in `.env`:

See [.env.example](.env.example) for all available options.

**Environment Variables:**

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `BASE_URL` | Yes | `https://cooked.com` | Base URL for cooked.com site |
| `TEST_USER_EMAIL` | Yes | (none) | Test user credentials - get from team lead |
| `TEST_USER_PASSWORD` | Yes | (none) | Test user credentials - get from team lead |
| `SLACK_WEBHOOK_URL` | No | (none) | Slack incoming webhook URL for failure notifications |
| `HEADLESS` | No | `true` | Set to "false" for headed mode (see browser) |
| `GAME_SLOT_ID` | No | `starburst` | Representative slot game ID |
| `GAME_SLOT_NAME` | No | `Starburst` | Representative slot game name |
| `GAME_TABLE_ID` | No | `blackjack` | Representative table game ID |
| `GAME_TABLE_NAME` | No | `Blackjack` | Representative table game name |
| `GAME_LIVE_ID` | No | `live-roulette` | Representative live dealer game ID |
| `GAME_LIVE_NAME` | No | `Live Roulette` | Representative live dealer game name |
| `CRYPTO_BUY_PATH` | No | `/crypto/buy` | Path to crypto buy page on cooked.com |
| `CRYPTO_IFRAME_SRC` | No | `connect.swapped.com` | Swapped.com iframe src pattern for detection |

**Where to get credentials:**
- `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`: Get from team lead
- `SLACK_WEBHOOK_URL`: Create at https://api.slack.com/messaging/webhooks (optional for local dev)

## Running Tests

```bash
# Run all tests
npm test

# Run only critical tests (@critical tag)
npm run test:critical

# Run only warning-level tests (@warning tag)
npm run test:warning

# Run in headed mode (see browser)
npm run test:headed

# Debug specific test with Playwright Inspector
npm run test:debug

# Run specific test file
npx playwright test tests/auth/login.spec.ts
```

## Project Structure

```
tests/
├── auth/           # Login, registration, session persistence (3 tests)
│   ├── login.spec.ts
│   ├── registration.spec.ts
│   └── session-persistence.spec.ts
├── smoke/          # Homepage, navigation, lobby, search (5 tests)
│   ├── health-check.spec.ts
│   ├── homepage.spec.ts
│   ├── lobby.spec.ts
│   ├── navigation.spec.ts
│   └── search.spec.ts
├── game/           # Slot, table, live dealer launch (3 tests)
│   ├── slot-launch.spec.ts
│   ├── table-launch.spec.ts
│   └── live-dealer-launch.spec.ts
├── social/         # Chat, tipping, promotions (4 tests)
│   ├── chat-connection.spec.ts
│   ├── chat-messages.spec.ts
│   ├── promotions.spec.ts
│   └── tipping-flow.spec.ts
├── crypto/         # Swapped.com buy flow (2 tests)
│   └── swapped-buy-flow.spec.ts
├── pages/          # Page Object Model classes
└── helpers/        # Config, retry, waits utilities

scripts/
└── notify-slack.js # Slack alerting with severity + consecutive failure tracking

docs/
├── SELECTOR-STRATEGY.md  # Selector priority and patterns
└── RUNBOOK.md            # Alert triage guide
```

## Adding New Tests

1. **Create test file** in appropriate category: `tests/<category>/<name>.spec.ts`

2. **Import Playwright and page objects:**
   ```typescript
   import { test, expect } from '@playwright/test';
   import { LobbyPage } from '../pages/LobbyPage.js';
   ```

3. **Follow selector strategy:** Use role-based selectors with data-testid fallback. See [docs/SELECTOR-STRATEGY.md](docs/SELECTOR-STRATEGY.md) for full guidelines.

4. **Add severity tag** in test title:
   - `@critical` - Revenue-impacting flows (auth, games, crypto)
   - `@warning` - Non-critical features (smoke, social)

5. **Example test structure:**
   ```typescript
   import { test, expect } from '@playwright/test';
   import { LobbyPage } from '../pages/LobbyPage.js';

   test('lobby displays game categories @critical', async ({ page }) => {
     const lobbyPage = new LobbyPage(page);
     await lobbyPage.open();
     await expect(lobbyPage.slotGamesCategory).toBeVisible();
   });
   ```

6. **Stop-before-payment pattern:** For any flow involving transactions (registration, tipping, crypto), verify elements but DO NOT click final submit/purchase buttons.

## Troubleshooting Flaky Tests

### Tests pass locally but fail in CI

**Symptoms:** Test passes locally but fails in GitHub Actions intermittently.

**Common causes:**
- CI environment is slower than local
- Retries differ (1 locally, 2 in CI - see `playwright.config.ts`)
- Network conditions vary

**Solutions:**
1. Download trace from GitHub Actions artifacts: Actions run > Artifacts > `test-results`
2. View trace locally: `npx playwright show-trace test-results/<test-name>/trace.zip`
3. Check for timing issues - avoid `waitForTimeout()`, use `waitFor({ state: 'visible' })` instead
4. Compare local vs CI execution in trace timeline

### Element not found errors

**Symptoms:** `Locator.click: Timeout 30000ms exceeded` or `Element not visible`.

**Solutions:**
1. Use Playwright Inspector to verify selector:
   ```bash
   npm run test:debug tests/auth/login.spec.ts
   ```
2. Check if element requires explicit wait (usually not needed - Playwright auto-waits):
   ```typescript
   await element.waitFor({ state: 'visible' });
   ```
3. Review selector strategy - prefer `getByRole()` over CSS selectors. See [docs/SELECTOR-STRATEGY.md](docs/SELECTOR-STRATEGY.md)
4. Check if element is in iframe - use `page.frameLocator()` for iframe content

### Network/timeout failures

**Symptoms:** `page.goto: Timeout 30000ms exceeded` or WebSocket connection errors.

**Solutions:**
1. Verify `BASE_URL` env var is set correctly
2. Use `retryAction()` helper from `tests/helpers/retry.ts` for flaky operations:
   ```typescript
   import { retryAction } from '../helpers/retry.js';

   await retryAction(async () => {
     await page.goto('/path');
   }, 3);
   ```
3. Increase timeout in `playwright.config.ts` if needed:
   ```typescript
   actionTimeout: 30000, // 30 seconds
   navigationTimeout: 30000,
   ```
4. Check network tab in trace viewer for failed requests

## CI/CD

Tests run automatically on GitHub Actions:

**Triggers:**
- **Schedule:** Every 30 minutes (UTC) via cron
- **Push:** On commits to `main` branch
- **Manual:** Via workflow dispatch in GitHub UI

**Workflow file:** [.github/workflows/playwright.yml](.github/workflows/playwright.yml)

**Artifacts:**
- `playwright-report` - HTML report (30-day retention)
- `test-results` - Screenshots, traces, JSON results (7-day retention)

**Alerts:**
- Slack notifications on failure (consecutive failures only, threshold = 2)
- Separate messages for `@critical` and `@warning` severity
- See [docs/RUNBOOK.md](docs/RUNBOOK.md) for alert triage

**Viewing results:**
1. Navigate to repository Actions tab
2. Click on workflow run
3. Download artifacts (top right)
4. Extract and open:
   ```bash
   npx playwright show-report playwright-report/
   npx playwright show-trace test-results/<test-name>/trace.zip
   ```

## Selector Strategy

Tests prioritize resilient selectors:

1. `getByRole()` - Buttons, links, form fields (preferred)
2. `getByLabel()` - Labeled inputs
3. `getByTestId()` - Dynamic content, complex components
4. Avoid CSS class selectors (brittle, change with design updates)

**Quick reference:**
```typescript
// GOOD: Role-based primary, testid fallback
page.getByRole('button', { name: /submit/i }).or(page.getByTestId('submit-btn'))

// GOOD: Label-based for form fields
page.getByLabel('Email address')

// BAD: CSS class selector
page.locator('.btn-submit')
```

**Full guidelines:** [docs/SELECTOR-STRATEGY.md](docs/SELECTOR-STRATEGY.md)

## Type Checking

```bash
# Run TypeScript type checking
npm run typecheck
```

## License

(Add your license here)

## Contributing

(Add contributing guidelines here)
