# Stack Research

**Domain:** Playwright-based Synthetic Monitoring Tool
**Researched:** 2026-02-15
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Playwright | ^1.58.2 | E2E testing framework for synthetic monitoring | Industry-leading browser automation with auto-wait, cross-browser support (Chromium, Firefox, WebKit), built-in tracing/screenshots, and direct browser protocol communication for stability. Microsoft-backed with active development. |
| TypeScript | ^5.8.x | Type-safe test code | Provides type safety, better IDE support, catches errors at compile time. TypeScript 5.8 adds native Node.js ESM support with `--module nodenext`. Required for maintainable test suites at scale. |
| Node.js | 22.x LTS or 24.x | Runtime environment | Node.js 22 is the current LTS (support until April 2027). Playwright requires Node.js 20.x, 22.x, or 24.x. Node 22.6+ includes `--experimental-strip-types` for native TypeScript execution. |

### CI/CD & Scheduling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| GitHub Actions | N/A | CI/CD platform and scheduler | Native integration with GitHub, built-in cron scheduling (minimum 5-minute intervals, 30-minute schedule is `*/30 * * * *`), free for public repos, artifact storage included. Official Playwright GitHub Action available. |
| actions/upload-artifact | v4 | Artifact storage in CI | Official GitHub action for storing test artifacts (screenshots, videos, traces). Use with `if: always()` to capture failures. Supports configurable retention (recommend 30 days for main, 7 days for branches). |

### Alerting & Notifications

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @slack/webhook | ^7.0.6 | Slack notifications | Send test failure alerts to Slack channels. Official Slack SDK with TypeScript support. Supports Node.js v18+. Use for real-time team notifications. |
| nodemailer | ^6.9.x | Email notifications | Send email alerts for test failures. Use Ethereal Email or Mailtrap for testing. Implement retry logic with exponential backoff for transient failures. For production email delivery. |

### Test Data & Utilities

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @faker-js/faker | ^10.3.0 | Generate realistic test data | Create fake user data (names, emails, addresses) for registration/login tests. Supports seeded randomness for reproducibility. Essential for data-driven tests without hardcoded values. |
| dotenv | ^16.x | Environment variable management | Load environment variables from .env files in development. For local development only - use GitHub Secrets for CI/CD. DO NOT commit .env files. |

### Code Quality Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| ESLint | ^9.x | TypeScript/JavaScript linting | ESLint 9 uses flat config (eslint.config.mjs). Use with @typescript-eslint/parser and eslint-plugin-playwright for Playwright-specific rules (detect missing awaits, etc.). |
| @typescript-eslint/parser | ^8.x | Parse TypeScript for ESLint | Required for ESLint to understand TypeScript syntax. Works with flat config. |
| @typescript-eslint/eslint-plugin | ^8.x | TypeScript-specific linting rules | Enforces TypeScript best practices. Use `@typescript-eslint/no-floating-promises` to catch missing awaits in Playwright tests. |
| eslint-plugin-playwright | ^2.x | Playwright-specific linting | Community plugin for Playwright best practices. Use `playwright.configs['flat/recommended']` with ESLint 9 flat config. |
| Prettier | ^3.7.x | Code formatting | Prettier 3.7 (released Nov 2025) improves TypeScript formatting consistency. Supports TypeScript config files (prettier.config.ts) with Node.js 22.6+. Auto-format code for consistency. |
| husky | ^9.x | Git hooks | Set up pre-commit hooks to run linting/formatting before commits. Initialize with `npx husky init`. Modern, zero-dependency Git hooks. |
| lint-staged | ^15.x | Run linters on staged files | Only lint/format files being committed, not entire codebase. Faster pre-commit checks. Use with husky in `.husky/pre-commit`. |

### Reporters

| Reporter | Type | Purpose | When to Use |
|----------|------|---------|-------------|
| HTML Reporter | Built-in | Interactive HTML test reports | Default reporter. Generates rich UI with test details, screenshots, videos, traces, and error stacks. Essential for debugging failures. |
| JSON Reporter | Built-in | Machine-readable test results | Programmatic analysis of test results. Use for custom dashboards or integrations. Can be used alongside HTML reporter. |
| JUnit Reporter | Built-in | XML reports for CI systems | Required for Jenkins, TeamCity, GitLab CI integration. Standard format for CI/CD tools. |
| List Reporter | Built-in | Terminal output | Real-time test progress in terminal. Good for local development and CI logs. |
| Allure Reporter | Third-party | Beautiful HTML reports with charts | Advanced reporting with test history, trends, pie charts, histograms. Use for stakeholder-facing reports. Requires allure-playwright package. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tsx | TypeScript execution | Modern, zero-config TypeScript runner powered by esbuild. Faster than ts-node for development. Use for running utility scripts. Does not type-check (use IDE for that). |
| VS Code | IDE | Recommended IDE with Playwright extension for test recording, debugging, and IntelliSense. |

## Installation

```bash
# Core dependencies
npm install -D playwright@^1.58.2 @playwright/test@^1.58.2

# TypeScript (if not already in project)
npm install -D typescript@^5.8.0

# Alerting
npm install @slack/webhook@^7.0.6 nodemailer@^6.9.0

# Test utilities
npm install -D @faker-js/faker@^10.3.0
npm install dotenv@^16.0.0

# Code quality
npm install -D eslint@^9.0.0 @typescript-eslint/parser@^8.0.0 @typescript-eslint/eslint-plugin@^8.0.0 eslint-plugin-playwright@^2.0.0
npm install -D prettier@^3.7.0
npm install -D husky@^9.0.0 lint-staged@^15.0.0

# Development tools
npm install -D tsx@latest

# Initialize Playwright (installs browsers)
npx playwright install chromium firefox webkit

# Initialize Husky
npx husky init
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Playwright | Puppeteer | Use Puppeteer ONLY if you need Chrome-specific features or are already heavily invested in the Puppeteer ecosystem. Playwright offers superior cross-browser support, multi-language support, built-in test runner, and auto-waiting. Playwright is 15% faster than Puppeteer in navigation-heavy scenarios. |
| Playwright | Selenium WebDriver | Use Selenium ONLY if you need legacy browser support (IE11) or have existing Selenium infrastructure. Playwright is 2x faster (~290ms vs ~536ms for element clicks), has better stability (auto-wait eliminates flakiness), and communicates directly with browsers via WebSocket instead of client-server model. |
| Playwright | Cypress | Use Cypress if team prioritizes simplicity and intuitive debugging over performance. Playwright offers better cross-browser support (true WebKit/Safari, not just Chrome/Edge), faster parallel execution in CI/CD, and supports iframe/multi-tab scenarios that Cypress struggles with. Playwright operates outside browser (protocol-level) vs Cypress inside browser (DOM manipulation). |
| GitHub Actions | Jenkins | Use Jenkins if you already have on-premise Jenkins infrastructure. GitHub Actions offers native GitHub integration, free artifact storage, built-in cron scheduling, and simpler YAML configuration. For greenfield projects, GitHub Actions is the default choice. |
| @slack/webhook | Custom webhook impl | Always use official @slack/webhook SDK. It handles TypeScript types, error handling, and API versioning correctly. Custom implementations are error-prone. |
| nodemailer | SendGrid/Mailgun SDKs | Use SendGrid/Mailgun SDKs if you're already paying for those services. nodemailer is transport-agnostic and works with any SMTP provider (Gmail, AWS SES, etc.), making it more flexible for synthetic monitoring alerts. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ts-node (without --swc) | Default ts-node uses TypeScript compiler, which is slow. In large projects, tsx is consistently 3x faster. ts-node's default mode introduces compilation overhead. | tsx (powered by esbuild) for development scripts. For type-checking, rely on IDE (VS Code) or `tsc --noEmit` in CI. |
| Protractor | Deprecated and unmaintained. Angular team deprecated Protractor in 2021. No updates, security patches, or modern browser support. | Playwright - officially recommended by Angular team as Protractor replacement. |
| Nightmare.js | Abandoned project (last update 2019). Built on outdated Electron version. Security vulnerabilities, no modern browser support. | Playwright - modern, actively maintained, Microsoft-backed. |
| dotenv in production | Loading .env files in production is a security anti-pattern. Files can be accidentally committed, leaked in logs, or exposed in error messages. | Use GitHub Secrets for CI/CD. For production, use cloud provider secrets (AWS Secrets Manager, Azure Key Vault, etc.) with runtime injection. |
| ESLint < 9 (legacy .eslintrc) | ESLint 9+ uses flat config (eslint.config.mjs), which is simpler and more performant. Legacy .eslintrc will be deprecated. | ESLint 9 with flat config. Migration is straightforward and future-proof. |
| @types/faker | Deprecated. The original faker.js library was unmaintained and @types/faker provided types for it. | @faker-js/faker (which includes built-in TypeScript types). This is the official, maintained fork. |
| Playwright with Node.js 16 or 18 | Node.js 16 support removed from Playwright. Node.js 18 is deprecated. Both are past EOL or approaching it. | Node.js 22.x LTS (supported until April 2027) or Node.js 24.x. Playwright requires Node.js 20+. |
| selenium-webdriver | For synthetic monitoring, Selenium's client-server architecture introduces latency and instability. 2x slower than Playwright and requires explicit waits (flaky tests). | Playwright - built for modern web, direct browser communication, auto-wait, better performance. |

## Stack Patterns by Variant

**If testing requires real browser UI (visual regression, screenshot comparison):**
- Use headed mode: `headless: false` in playwright.config.ts
- Enable video recording: `video: 'retain-on-failure'`
- Enable screenshots: `screenshot: 'only-on-failure'`
- Because synthetic monitoring benefits from visual proof of failures

**If testing high-frequency (< 5 minutes intervals):**
- Cannot use GitHub Actions (minimum 5-minute cron interval)
- Use external scheduler (AWS EventBridge, Google Cloud Scheduler) to trigger GitHub workflow via repository_dispatch
- Or self-host runner with custom cron
- Because GitHub Actions schedule has minimum 5-minute frequency

**If testing WebSocket-heavy applications (live chat, real-time updates):**
- Use `page.on('websocket')` to intercept WebSocket frames
- Use `page.routeWebSocket()` for mocking/modifying WebSocket traffic (Playwright 1.48+)
- Enable trace: `trace: 'on-first-retry'` to capture WebSocket activity in failures
- Because casino sites use WebSockets for live chat, live dealer games, and real-time updates

**If testing iframe-heavy content (embedded games):**
- Use `page.frameLocator()` for dynamic/delayed iframes (recommended)
- Use `page.frame()` for static iframes with known name/URL
- Chain `frameLocator()` calls for nested iframes: `page.frameLocator('iframe').frameLocator('iframe#inner')`
- Because casino game providers embed games in iframes, often nested

**If tests are flaky/unreliable:**
- Configure retries in playwright.config.ts: `retries: process.env.CI ? 2 : 0` (2 retries in CI, 0 locally)
- Enable trace on first retry: `trace: 'on-first-retry'` (generates trace.zip for debugging)
- Monitor flaky tests: Playwright marks tests as "flaky" if they pass on retry
- Investigate root cause - retries mask issues, don't fix them
- Because synthetic monitoring must distinguish real failures from transient network issues

**If monitoring crypto payment flow (Swapped.com):**
- Use `page.route()` to mock blockchain RPC calls (avoid real transactions)
- Use test wallets with zero balance in staging
- Set `testIdAttribute: 'data-testid'` in config for stable selectors
- Mock price feeds to avoid flaky tests from volatile crypto prices
- Because synthetic monitoring must NEVER execute real crypto transactions

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Playwright 1.58.x | Node.js 20.x, 22.x, 24.x | Node.js 16 support removed. Node.js 18 deprecated. |
| TypeScript 5.8.x | Node.js 22.6+ (native TypeScript) | Use `--experimental-strip-types` flag for native TS execution. Or use tsx/esbuild. |
| @slack/webhook 7.x | TypeScript 5.3+ | Supports TS 5.3+. Higher minor versions (5.4+) may have breaking changes. |
| ESLint 9.x | @typescript-eslint/parser 8.x | Requires flat config. Legacy .eslintrc not supported. |
| Prettier 3.7.x | Node.js 22.6+ (for TS config) | TypeScript config files require Node.js 22.6+ and --experimental-strip-types. |
| @faker-js/faker 10.x | TypeScript moduleResolution: "Bundler", "Node20", or "NodeNext" | Breaking change from v9. CJS projects must use these moduleResolution values. |

## Sources

### High Confidence (Official Docs + Context7)
- [Playwright Official Installation Docs](https://playwright.dev/docs/intro) - Latest version, Node.js requirements
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) - Version history, breaking changes
- [Playwright CI Setup](https://playwright.dev/docs/ci-intro) - GitHub Actions integration, artifact upload
- [Playwright Test Assertions](https://playwright.dev/docs/test-assertions) - Built-in assertions (toHaveURL, toBeVisible)
- [Playwright Test Retries](https://playwright.dev/docs/test-retries) - Retry configuration, flaky test detection
- [Playwright Reporters](https://playwright.dev/docs/test-reporters) - Built-in reporters (HTML, JSON, JUnit, List)
- [Playwright WebSocket API](https://playwright.dev/docs/api/class-websocket) - WebSocket testing capabilities
- [Playwright FrameLocator API](https://playwright.dev/docs/api/class-framelocator) - iframe handling
- [ESLint 9 Configuration Files](https://eslint.org/docs/latest/use/configure/configuration-files) - Flat config syntax
- [TypeScript 5.8 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html) - ESM support, Node.js interop
- [Prettier 3.7 Blog Post](https://prettier.io/blog/2025/11/27/3.7.0) - TypeScript formatting improvements
- [@slack/webhook npm](https://www.npmjs.com/package/@slack/webhook) - Version 7.0.6, TypeScript support
- [@faker-js/faker Releases](https://github.com/faker-js/faker/releases) - Version 10.3.0, breaking changes
- [GitHub Actions Events Documentation](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows) - Cron syntax, schedule trigger

### Medium Confidence (Community + Multiple Sources)
- [Why use Playwright for Synthetic Monitoring - Checkly](https://www.checklyhq.com/blog/synthetic-monitoring-with-checkly-and-playwright-test/) - Best practices
- [Playwright Synthetic Monitoring GitHub](https://github.com/workadventure/playwright-synthetic-monitoring) - Real-world implementation
- [Measuring Page Performance Using Playwright - Checkly](https://www.checklyhq.com/docs/learn/playwright/performance/) - Web Vitals monitoring
- [End-to-End Test Automation Pipeline with Playwright, GitHub Actions, and Allure Reports](https://kailash-pathak.medium.com/end-to-end-test-automation-with-playwright-github-actions-and-allure-reports-5f9817ae4648) - CI/CD patterns
- [Send Playwright Test Results to Slack](https://medium.com/@ma11hewthomas/send-playwright-test-results-to-slack-7b07b6e3467e) - Slack notification patterns
- [Playwright with GitHub Actions and Slack Notification](https://medium.com/@vinayakhk9/playwright-with-github-actions-and-slack-notification-b56eb982659b) - Integration example
- [Playwright: Testing WebSockets and Live Data Streams](https://dzone.com/articles/playwright-for-real-time-applications-testing-webs) - WebSocket testing approach
- [Testing Third-Party Integrations and iFrames with Playwright](https://testrig.medium.com/testing-third-party-integrations-and-iframes-with-playwright-64e3b334953b) - iframe testing patterns
- [Managing Test Data in Playwright: Fixtures, JSON, and Dynamic Values](https://medium.com/@divyakandpal93/managing-test-data-in-playwright-fixtures-json-and-dynamic-values-f69934cdbb3e) - Faker integration
- [TSX vs ts-node: The Definitive TypeScript Runtime Comparison](https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-ts-node/) - Performance comparison
- [The Ultimate 2025 ESLint, Prettier & Pre-Commit Setup for Playwright TypeScript](https://medium.com/@kryo/the-ultimate-2025-eslint-prettier-pre-commit-setup-for-playwright-typescript-test-automation-270a20658a96) - Code quality setup
- [Avoiding Flaky Tests in Playwright](https://betterstack.com/community/guides/testing/avoid-flaky-playwright-tests/) - Flaky test prevention
- [Playwright vs Puppeteer: Which to choose in 2026?](https://www.browserstack.com/guide/playwright-vs-puppeteer) - Tool comparison
- [Playwright vs Selenium 2025: Comparing Test Automation](https://www.browserless.io/blog/playwright-vs-selenium-2025-browser-automation-comparison) - Tool comparison
- [Cypress vs Playwright: The Essential 2025 Comparison](https://devin-rosario.medium.com/cypress-vs-playwright-the-essential-2025-comparison-for-developers-d2e40f20f450) - Tool comparison

---
*Stack research for: cooked-synthetic-monitor*
*Researched: 2026-02-15*
*Confidence: HIGH - All versions verified with official sources as of Feb 2025*
