# Project Research Summary

**Project:** cooked-synthetic-monitor
**Domain:** Playwright-based synthetic monitoring for online casino
**Researched:** 2026-02-15
**Confidence:** HIGH

## Executive Summary

This project implements synthetic monitoring for cooked.com, an online casino with complex third-party integrations (game provider iframes, WebSocket chat, crypto payment flows via Swapped.com). Expert consensus strongly recommends Playwright over alternatives (Selenium, Puppeteer, Cypress) due to superior iframe handling, WebSocket testing capabilities, and cross-browser support. The recommended stack is TypeScript + Playwright + GitHub Actions, leveraging free CI/CD with scheduled cron execution every 30 minutes.

The architecture follows a tag-based test categorization pattern (@smoke, @critical, @breakpoint) with Page Object Model for maintainability. This enables selective test execution based on schedule frequency: quick smoke tests every 30 minutes, comprehensive breakpoint tests hourly, and full regression suites nightly. Critical path coverage already exists for all known breakpoints (lobby, game launches, chat, registration, crypto flows), meaning the immediate priority is improving test reliability through retry logic and smart alerting rather than adding more test coverage.

The dominant risk is alert fatigue from false positives. Casino monitoring uniquely faces high false positive rates due to third-party game provider downtime (Evolution Gaming, Pragmatic Play), Cloudflare bot challenges, and WebSocket connection timing issues. Mitigation requires implementing retry logic, dependency health checks to differentiate internal vs external failures, and severity-based alerting (CRITICAL/WARNING/INFO) from day one. Secondary risks include iframe context switching mistakes, WebSocket connection state ignored in tests, and artifact storage costs spiraling without fail-only recording policies.

## Key Findings

### Recommended Stack

Playwright 1.58.2 + TypeScript 5.8 on Node.js 22.x LTS provides the best foundation for casino-specific monitoring. GitHub Actions handles scheduling (free for 2000 minutes/month), artifact storage, and Slack notifications. ESLint 9 with flat config + Prettier 3.7 ensures code quality. Critical libraries include @slack/webhook for failure alerts, @faker-js/faker for test data generation, and eslint-plugin-playwright to catch missing awaits.

**Core technologies:**
- **Playwright 1.58.2**: E2E testing framework — industry-leading browser automation with auto-wait, cross-browser support, built-in tracing/screenshots, and superior iframe/WebSocket handling compared to Selenium/Puppeteer
- **TypeScript 5.8**: Type-safe test code — provides IDE support, compile-time error catching, and native Node.js ESM support for maintainable test suites at scale
- **GitHub Actions**: CI/CD and scheduler — native GitHub integration, free cron scheduling (minimum 5-minute intervals), built-in artifact storage, and official Playwright action support
- **Node.js 22.x LTS**: Runtime environment — current LTS (supported until April 2027), required for Playwright 1.58.2, includes native TypeScript execution with --experimental-strip-types

**Version compatibility notes:**
- Playwright 1.58.x requires Node.js 20+, 22.x, or 24.x (Node.js 16/18 no longer supported)
- GitHub Actions cron has minimum 5-minute interval; 30-minute schedule uses `*/30 * * * *`
- @faker-js/faker 10.x requires TypeScript moduleResolution: "Bundler", "Node20", or "NodeNext"

**What NOT to use:**
- ts-node (use tsx instead — 3x faster for development scripts)
- Protractor (deprecated since 2021, use Playwright per Angular team recommendation)
- dotenv in production (use GitHub Secrets for CI/CD, cloud secrets managers for production)
- ESLint legacy .eslintrc (use ESLint 9 flat config)

### Expected Features

Research shows synthetic monitoring tools have evolved from simple uptime checks to comprehensive user journey validation. The feature landscape divides into table stakes (expected by all users), differentiators (competitive advantages), and anti-features (commonly requested but problematic).

**Must have (table stakes):**
- Browser-based user journey testing — core value proposition of synthetic monitoring
- Scheduled test execution — monitoring requires continuous checks at regular intervals
- Alert notifications on failure — immediate awareness when issues occur
- Screenshot capture on failure — visual debugging essential for understanding breakages
- Test history and logs — track failures over time to identify patterns
- Response time metrics — performance degradation often precedes outages

**Should have (competitive advantages):**
- iframe game launch validation — casinos uniquely depend on third-party game iframes; most tools don't handle this well
- WebSocket connection monitoring — real-time chat is critical for casino engagement; WebSocket failures are silent killers
- Crypto payment flow end-to-end testing — tests Swapped.com integration through actual transaction flow (unique to crypto-enabled casinos)
- Game provider health matrix — tracks which game providers have degraded performance by aggregating launch success rates
- Lobby performance benchmarking — tracks Core Web Vitals (LCP, CLS, FID) for high-traffic lobby pages

**Defer (v2+):**
- Live dealer table availability — requires video stream validation; complex but high value (defer until live dealer revenue exceeds 20% of total)
- Sportsbook line availability — domain-specific; tests betting odds (defer until sportsbook launches or becomes primary revenue driver)
- Regulatory compliance checks — geo-blocking, age verification testing (defer until operating in regulated markets requiring proof)
- Multi-location monitoring — test from 3-5 global regions (defer until international user base grows or CDN issues occur)

**Anti-features (avoid building):**
- Real-time monitoring (sub-minute checks) — creates alert fatigue, burns API quotas; use 5-minute minimum intervals with RUM for true real-time insights
- Test every single game — 1000+ games = massive maintenance burden; sample representative games from each provider instead
- AI self-healing tests — masks real issues, creates false confidence; invest in stable selectors and component test IDs instead
- Built-in test recording/no-code editor — recorded tests are brittle, don't scale; maintain code-first approach with Playwright
- Alert on every test failure — single transient network blips trigger pages at 3am; require 2-3 consecutive failures before alerting
- Full video recording on all test runs — massive storage costs; 99% of successful runs never reviewed; capture only on failure

### Architecture Approach

The standard architecture for Playwright-based synthetic monitoring follows a five-layer model: Scheduling Layer (GitHub Actions cron or Quartz), Test Execution Layer (Playwright Test Runner with tag-based categorization), Page Object Model + Utilities Layer, Artifact Collection Layer (failure-only screenshots/videos/traces), and Reporting & Alerting Layer (conditional Slack/email notifications).

**Major components:**
1. **Scheduler (GitHub Actions)** — triggers test execution at 30-minute intervals using cron: `*/30 * * * *`; manages artifact retention (7 days for branches, 30 days for main); provides free 2000 CI minutes/month
2. **Test Orchestrator (Playwright Test Runner)** — discovers tests matching @smoke/@critical/@breakpoint tags; executes in parallel with 4 workers; manages browser context isolation and fixture loading; generates HTML reports and Slack notifications
3. **Page Object Model** — encapsulates page interactions in classes (LobbyPage, GameLaunchPage, ChatPage, SwappedPage); specializes in casino-specific helpers for iframe handling (frameLocator patterns), WebSocket monitoring (connection state tracking), and crypto flows (wallet readiness checks)
4. **Artifact Collector** — captures screenshots (only-on-failure), videos (retain-on-failure), and traces (on-first-retry) to minimize storage costs; uploads to GitHub Actions artifacts with 7-day retention; provides download URLs in Slack failure alerts
5. **Alert Dispatcher** — sends Slack notifications ONLY on test failure (never on success to avoid alert fatigue); includes severity levels (CRITICAL/WARNING/INFO), screenshot links, trace viewer URLs, and last success timestamp; differentiates internal cooked.com failures from external dependency failures (game providers, Swapped.com)

**Key architectural patterns:**
- **Tag-Based Test Categorization**: Tests tagged @smoke, @breakpoint, @critical enable selective execution (smoke tests every 30 min, comprehensive tests hourly, full suite nightly)
- **Page Object Model with Casino Helpers**: Centralizes iframe handling (frameLocator), WebSocket monitoring (connection state verification), and crypto flow utilities (wallet readiness checks)
- **Failure-Only Artifact Retention**: Captures traces/videos ONLY on failure to prevent storage explosion (100GB+ per month without this policy)
- **Conditional Alerting**: Slack/email notifications ONLY on failure with severity levels and actionable context to avoid alert fatigue
- **Dependency Health Checks**: Pre-flight checks for external services (game providers, Swapped.com) to skip tests when dependency is down rather than failing and alerting

### Critical Pitfalls

Research identified eight critical pitfalls specific to casino synthetic monitoring. These differ from general Playwright testing due to casino-specific integrations (iframes, WebSockets, crypto wallets).

1. **Relying on `networkidle` for page readiness** — Casino sites constantly poll for live odds, chat messages, game state changes; network never becomes idle; tests hang for 30+ seconds waiting for timeout. Solution: Use `waitUntil: 'domcontentloaded'` and wait for specific elements like `page.locator('[data-testid="lobby-games"]').waitFor()`

2. **Missing iframe context switches for game launches** — Third-party game providers (Pragmatic Play, Evolution, NetEnt) render games in cross-origin iframes requiring explicit `frameLocator()` context switching. Tests click game tiles but never verify game loaded, resulting in false successes. Solution: Always use `page.frameLocator('iframe[src*="provider"]').locator('.game-canvas').waitFor()` after game clicks

3. **WebSocket connection state ignored in chat/live features** — WebSocket connections are asynchronous and invisible to standard Playwright waits. Chat tests send messages before connection establishes, causing intermittent failures (70% pass rate). Solution: Use `page.on('websocket')` to track connection state and wait for connection confirmation before interactions

4. **Crypto purchase flow breaks without wallet connection state** — MetaMask/WalletConnect extensions load asynchronously; `window.ethereum` may not exist when test starts. Wallet state from previous test bleeds into current test. Solution: Wait for `window.ethereum.isConnected()` and use fresh browser contexts per crypto test

5. **Alert fatigue from false positives** — 60%+ of alerts are false positives (third-party game provider downtime, Cloudflare challenges, CDN blips). Team ignores alerts; critical failures go unnoticed. Solution: Implement retry logic, severity levels (CRITICAL/WARNING/INFO), dependency health checks, and track false positive rate (target <20%)

6. **Trace/screenshot/video storage explosion** — Default config records all tests; running every 30 min = 432GB/month. Storage costs balloon to $100-500/month. Solution: Use `trace: 'on-first-retry'`, `video: 'retain-on-failure'`, 7-day retention on branches, JPEG screenshots instead of PNG

7. **Hardcoded timeouts don't match production reality** — Generic 30s timeout for all operations fails in CI. Game launches take 45s on cold start; crypto confirmations need 60-90s. Solution: Set operation-specific timeouts based on production P95 + 50% buffer (navigation: 10s, game load: 20s, crypto: 90s)

8. **Ignoring third-party dependency failures** — Tests alert when Evolution Gaming has outage, Swapped.com API is down. Team wastes time investigating issues outside their control. Solution: Pre-flight dependency health checks, skip tests (not fail) when external dependency is down, alert with INFO severity for external failures

## Implications for Roadmap

Based on combined research, the roadmap should follow a seven-phase structure that prioritizes foundation → critical paths → advanced features → reliability improvements. Current project already has test coverage for known breakpoints, so focus shifts to making monitoring production-ready.

### Phase 1: Foundation & Test Infrastructure (Week 1)
**Rationale:** Can't build reliable tests without proper configuration, environment management, and wait strategies. Must establish anti-patterns prevention (no networkidle, no hardcoded credentials, fail-only artifacts) before writing tests to avoid costly refactors.

**Delivers:**
- Project scaffolding with TypeScript + Playwright configured
- Environment management (config/environments.ts, .env files, GitHub Secrets)
- Artifact retention policies (7-day branches, fail-only recording, JPEG compression)
- Wait strategy standards (domcontentloaded + element waits, no networkidle)
- Page Object Model foundation (base classes, LobbyPage, LoginPage)
- Test categorization system (@smoke, @critical, @breakpoint tags)

**Addresses from FEATURES.md:**
- Browser-based user journey testing (core framework)
- Screenshot capture on failure (Playwright config)
- Test history and logs (GitHub Actions run history)

**Avoids from PITFALLS.md:**
- Pitfall 1: Relying on networkidle (document wait strategies)
- Pitfall 6: Storage explosion (configure fail-only artifacts)
- Pitfall 7: Hardcoded timeouts (document operation-specific timeout guide)
- Technical debt: Hardcoded credentials, CSS selectors, video recording for all tests

**Research needed:** None — standard Playwright setup with well-documented patterns.

---

### Phase 2: Critical Path Tests (Week 1-2)
**Rationale:** Validate core user journeys that directly impact revenue (lobby navigation, game launches, registration). These tests must work reliably before adding advanced features. Depends on Phase 1 page objects and fixtures.

**Delivers:**
- Authentication tests (login @smoke, registration @breakpoint)
- Game launch tests for slot, table, live dealer games (@critical)
- iframe validation using frameLocator patterns
- Lobby navigation tests (@smoke)

**Uses from STACK.md:**
- Playwright frameLocator API for iframe handling
- @faker-js/faker for registration test data
- Fixtures for authentication state management

**Implements from ARCHITECTURE.md:**
- Page Object Model (GameLaunchPage, RegistrationPage)
- iframe helper utilities (iframeHelper.ts)
- Tag-based test categorization for selective execution

**Avoids from PITFALLS.md:**
- Pitfall 2: Missing iframe context switches (use frameLocator for all game launches)
- UX pitfall: Not testing mobile viewport (add mobile device configs)

**Research needed:** None — game launch patterns well-documented in ARCHITECTURE.md.

---

### Phase 3: WebSocket & Live Features (Week 2-3)
**Rationale:** Chat is critical for engagement; WebSocket failures are silent killers that basic UI tests miss. Requires WebSocket monitoring utilities built in Phase 1. Live dealer tests depend on game launch patterns from Phase 2.

**Delivers:**
- Chat WebSocket connection monitoring (@critical)
- WebSocket helper utilities (webSocketHelper.ts)
- Live dealer game launch validation (if live dealer revenue >10%)
- Real-time message delivery verification

**Uses from STACK.md:**
- Playwright page.on('websocket') API
- WebSocket frame inspection and filtering

**Implements from ARCHITECTURE.md:**
- WebSocket monitoring pattern (listen for connection_established events)
- WebSocket validation flow (wait for connection before interactions)

**Avoids from PITFALLS.md:**
- Pitfall 3: WebSocket state ignored (verify connection before sending chat messages)
- Integration gotcha: Sending messages immediately after page load

**Research needed:** None — WebSocket patterns documented in ARCHITECTURE.md and PITFALLS.md.

---

### Phase 4: Crypto Integration Tests (Week 3)
**Rationale:** Swapped.com integration is complex with wallet connection state, blockchain timing, and cross-origin iframe challenges. Requires fresh browser contexts to prevent wallet state pollution. Depends on iframe patterns from Phase 2.

**Delivers:**
- Swapped.com crypto buy flow test (@critical)
- Tipping flow validation (@breakpoint)
- Wallet connection state verification
- Browser context isolation for crypto tests

**Uses from STACK.md:**
- Synpress or wallet-mock for MetaMask automation
- Fresh browser contexts per test (await browser.newContext())

**Implements from ARCHITECTURE.md:**
- Crypto helper utilities (cryptoHelper.ts)
- Context isolation pattern for wallet tests

**Avoids from PITFALLS.md:**
- Pitfall 4: Crypto wallet state pollution (fresh contexts, wait for window.ethereum.isConnected())
- Security mistake: Hardcoded wallet private keys (use testnet wallets only)
- Integration gotcha: Assuming wallet is ready when page loads

**Research needed:** MEDIUM — If using real MetaMask extension, research Synpress setup. Consider mocking wallet for deterministic CI tests.

---

### Phase 5: CI/CD Integration & Alerting (Week 3-4)
**Rationale:** Tests must run reliably in CI before enabling production monitoring. Alerting requires smart retry logic and severity levels to avoid alert fatigue. Depends on all tests from Phases 2-4.

**Delivers:**
- GitHub Actions workflow with cron schedule (every 30 min)
- Artifact upload on failure with 7-day retention
- Slack integration with severity levels (CRITICAL/WARNING/INFO)
- Retry logic for transient failures (retries: 2 in CI)
- Dependency health checks (game providers, Swapped.com)
- Email fallback for critical failures

**Uses from STACK.md:**
- GitHub Actions (actions/upload-artifact@v4, slackapi/slack-github-action@v1)
- @slack/webhook for Slack notifications
- nodemailer for email alerts

**Implements from ARCHITECTURE.md:**
- Conditional alerting pattern (if: failure() in GitHub Actions)
- Alert dispatcher with severity levels and actionable context
- Dependency health check framework

**Avoids from PITFALLS.md:**
- Pitfall 5: Alert fatigue (severity levels, retry logic, false positive tracking <20%)
- Anti-pattern: Alerting on every test run (only alert on failure)
- Performance trap: No alert severity levels (implement CRITICAL/WARNING/INFO)

**Research needed:** LOW — Standard GitHub Actions patterns. May need custom reporter for severity-based Slack messages.

---

### Phase 6: Reliability & Observability (Week 4)
**Rationale:** After monitoring runs in production, tune based on observed failure patterns. Track flaky tests, optimize timeouts, monitor false positive rates. This phase is ongoing refinement.

**Delivers:**
- Flaky test tracking and separate alerts for flaky vs. consistently failing tests
- Performance optimization (worker count tuning, sharding if suite grows)
- Timeout tuning based on production P95 metrics
- False positive rate monitoring (target <20%)
- Response time metrics collection from Playwright timing APIs
- Uptime percentage tracking (SLA reporting)

**Addresses from FEATURES.md:**
- Response time metrics (capture from existing flows)
- Uptime percentage tracking (calculate from test history)
- Retry logic for false positive reduction (already in Phase 5, tune here)

**Avoids from PITFALLS.md:**
- Performance trap: Alert fatigue from flaky tests (track flakiness, alert separately)
- Recovery strategy: Audit alerts weekly, categorize true vs. false positives

**Research needed:** None — monitoring and tuning based on live data.

---

### Phase 7: Extended Coverage (Future)
**Rationale:** Defer until core monitoring proves stable and valuable. Features here have lower ROI or require significant effort. Only pursue if specific business triggers occur.

**Delivers:**
- HTTP/API endpoint monitoring (trigger: after 2 weeks of stable browser monitoring)
- Game provider health matrix (trigger: game provider issues cause escalations)
- SSL/TLS certificate monitoring (trigger: approaching cert renewal dates)
- Lobby performance benchmarking with Lighthouse (trigger: performance becomes competitive concern)
- Multi-location monitoring from 3-5 global regions (trigger: international user base grows or CDN issues occur)
- Live dealer table availability with video stream validation (trigger: live dealer revenue exceeds 20% of total)
- Sportsbook line availability testing (trigger: sportsbook launches or becomes primary revenue)
- Regulatory compliance checks for geo-blocking, age verification (trigger: operating in regulated markets)

**Addresses from FEATURES.md:**
- All deferred features (v1.x and v2+ from feature research)

**Research needed:** VARIES — Each feature likely needs domain-specific research (e.g., Lighthouse integration, multi-region testing infrastructure).

---

### Phase Ordering Rationale

**Foundation-first approach:**
Phases 1-2 establish test infrastructure and critical paths before advanced features. This prevents costly refactors if anti-patterns (networkidle waits, hardcoded credentials, full artifact recording) are baked into early tests.

**Complexity progression:**
Phase 2 (basic UI testing) → Phase 3 (WebSocket async complexity) → Phase 4 (crypto wallet state management). Each phase builds on patterns from previous phases.

**Production-ready gate:**
Phase 5 (CI/CD) requires all critical tests (Phases 2-4) to exist before enabling production monitoring. Alerting must be intelligent (retry logic, severity levels) to avoid alert fatigue from day one.

**Optimization follows measurement:**
Phase 6 (reliability) tunes based on production metrics. Can't optimize timeout values or false positive rates without baseline data from running tests.

**Deferred features have triggers:**
Phase 7 features only pursued when business conditions justify the effort (e.g., live dealer monitoring when live dealer revenue >20% of total).

### Research Flags

**Phases with well-documented patterns (skip research-phase):**
- **Phase 1: Foundation** — standard Playwright setup with TypeScript
- **Phase 2: Critical Paths** — iframe testing patterns documented in ARCHITECTURE.md
- **Phase 3: WebSocket** — WebSocket monitoring patterns documented in ARCHITECTURE.md and PITFALLS.md
- **Phase 5: CI/CD** — GitHub Actions integration is standard
- **Phase 6: Reliability** — monitoring and tuning based on live data, no upfront research needed

**Phases likely needing deeper research:**
- **Phase 4: Crypto Integration** — If using real MetaMask extension, research Synpress setup and wallet mocking strategies. Consider whether to use real wallet (E2E smoke tests) vs. mocked wallet (deterministic CI tests). Complexity: MEDIUM (2-3 days investigation).
- **Phase 7: Multi-location monitoring** — If pursuing, research AWS/GCP infrastructure for multi-region GitHub Actions runners or external scheduler (AWS EventBridge) to trigger workflows. Complexity: HIGH (1 week).
- **Phase 7: Lighthouse integration** — If pursuing lobby performance benchmarking, research Lighthouse CI integration and Core Web Vitals thresholds for casino sites. Complexity: MEDIUM (2-3 days).
- **Phase 7: Live dealer video validation** — If pursuing, research video stream readyState verification and potential need for computer vision to detect frozen streams. Complexity: HIGH (1-2 weeks).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified with official Playwright docs, npm registry, and TypeScript release notes. Microsoft-backed project with active development. Node.js 22.x LTS verified against Playwright compatibility matrix. |
| Features | HIGH | Multiple synthetic monitoring tool comparisons (Datadog, Checkly, Pingdom) establish table stakes. Casino-specific features validated against iGaming monitoring articles and Playwright iframe/WebSocket documentation. |
| Architecture | HIGH | Validated against real-world implementations (workadventure/playwright-synthetic-monitoring GitHub repo). Page Object Model and tag-based categorization are established Playwright patterns. Casino-specific patterns (iframe, WebSocket) backed by official Playwright API docs. |
| Pitfalls | HIGH | Pitfalls sourced from Playwright GitHub issues (iframe handling #33674, artifact storage #29218), BrowserStack/Checkly best practices articles, and synthetic monitoring alert fatigue case studies. Casino-specific pitfalls (WebSocket state, crypto wallets) validated against Web3 testing guides and Synpress documentation. |

**Overall confidence:** HIGH

All four research areas have strong source validation from official documentation, real-world implementation examples, and domain expert consensus. Casino-specific concerns (iframe testing, WebSocket monitoring, crypto wallet automation) are well-covered in Playwright documentation and community resources.

### Gaps to Address

**Gap 1: MetaMask/wallet automation strategy**
Research shows Synpress is the standard for MetaMask automation in E2E tests, but it's unclear whether cooked.com uses MetaMask specifically or other wallet providers (WalletConnect, Coinbase Wallet). During Phase 4 planning, validate which wallet provider Swapped.com integration uses and whether to mock wallet (deterministic CI) vs. real wallet (E2E smoke tests).

**Validation approach:** Inspect Swapped.com integration code; check if window.ethereum, window.coinbaseWallet, or WalletConnect SDK is used. Decision tree: If MetaMask → use Synpress; if other wallet → research provider-specific mocking libraries; if integration is simple button click → consider mocking window.ethereum object for CI tests.

**Gap 2: Actual game provider iframe URLs and selectors**
Research documents general iframe patterns (use frameLocator, wait for .game-canvas or .game-container), but actual iframe URLs and selectors depend on cooked.com's game provider integrations. Game providers may use different iframe structures.

**Validation approach:** During Phase 2 planning, inspect production cooked.com game launches in browser DevTools. Document iframe src patterns for each provider (Evolution, Pragmatic Play, NetEnt, etc.). Identify common selectors for "game ready" state (canvas element, loading spinner disappears, etc.). Build provider-specific helpers if iframe structures vary significantly.

**Gap 3: Production performance baselines for timeout tuning**
Research recommends operation-specific timeouts based on production P95 + 50% buffer, but actual production performance data doesn't exist yet in research. Timeout values in PITFALLS.md are estimates (lobby: 10s, game load: 20s, crypto: 90s).

**Validation approach:** During Phase 1-2 execution, instrument tests to log actual operation durations. Run tests against production (or staging) for 1 week to collect P95 metrics for navigation, game launches, registration, crypto flows. Use collected data to set final timeout values in Phase 6 tuning.

**Gap 4: GitHub Actions minutes usage for 30-minute schedule**
Research confirms GitHub Actions free tier provides 2000 minutes/month, but actual minute consumption depends on test suite duration. With 20 tests running every 30 minutes (48 runs/day), estimated usage is 48 runs/day * 5 min/run * 30 days = 7,200 minutes/month (exceeds free tier).

**Validation approach:** During Phase 5, monitor actual CI run duration. If suite runs <3 minutes, usage fits free tier (48 * 3 * 30 = 4,320 minutes). If exceeding free tier, options: (1) reduce frequency to 45-60 min, (2) run only @smoke tests every 30 min, @critical tests hourly, (3) upgrade to paid plan ($0.008/min = ~$40/month for 7,200 min).

**Gap 5: Cloudflare bot detection frequency**
PITFALLS.md mentions Cloudflare challenges as potential false positives, but frequency is unknown. If cooked.com uses aggressive Cloudflare bot protection, synthetic monitoring may trigger CAPTCHA challenges on every run.

**Validation approach:** During Phase 2 execution, monitor whether Playwright triggers Cloudflare challenges. If challenges occur frequently, options: (1) whitelist GitHub Actions IP ranges in Cloudflare, (2) use stealth plugins (playwright-extra-plugin-stealth), (3) run tests from dedicated monitoring IP added to allowlist. This is a production environment configuration issue, not a code issue.

## Sources

### Primary (HIGH confidence)

**Stack Research:**
- Playwright Official Docs (playwright.dev) — installation, CI setup, API reference for WebSocket, FrameLocator, test retries
- TypeScript 5.8 Release Notes (typescriptlang.org) — ESM support, Node.js interop
- GitHub Actions Documentation (docs.github.com) — cron syntax, schedule trigger, artifact upload
- npm registry (@slack/webhook, @faker-js/faker, eslint-plugin-playwright) — version compatibility, TypeScript support
- ESLint 9 Configuration Docs (eslint.org) — flat config syntax

**Feature Research:**
- Synthetic monitoring tool comparisons (Datadog, Checkly, Pingdom official docs) — feature capabilities, pricing models
- Playwright WebSocket API docs (playwright.dev/docs/api/class-websocket) — WebSocket testing approach
- Checkly blog (checklyhq.com/blog) — synthetic monitoring best practices, alert fatigue prevention

**Architecture Research:**
- workadventure/playwright-synthetic-monitoring GitHub repo — real-world implementation reference
- Playwright CI Intro docs (playwright.dev/docs/ci-intro) — GitHub Actions integration patterns
- Page Object Model guides (browserstack.com/guide/page-object-model-with-playwright) — POM best practices

**Pitfalls Research:**
- Playwright GitHub Issues (#33674 iframe issues, #29218 artifact storage, #23723 artifact retention) — known problems and solutions
- BrowserStack Playwright Best Practices (browserstack.com/guide/playwright-best-practices) — timeout strategies, wait patterns
- Checkly alert fatigue blog (checklyhq.com/blog/alert-fatigue/) — false positive prevention
- Synpress documentation (synpress.io) — MetaMask automation for Web3 testing

### Secondary (MEDIUM confidence)

**Stack Research:**
- Playwright vs Puppeteer vs Selenium comparisons (browserstack.com, browserless.io) — performance benchmarks, feature comparisons
- Medium articles on Playwright + GitHub Actions integration — CI/CD patterns, Slack notification setup
- tsx vs ts-node comparison (betterstack.com) — performance analysis

**Feature Research:**
- iGaming monitoring articles (sdlccorp.com, seon.io) — casino-specific monitoring needs
- Alert management strategy guides (hyperping.com, logz.io, atlassian.com) — DevOps alerting best practices
- Synthetic monitoring frequency guides (dotcom-monitor.com, moss.sh) — scheduling recommendations

**Architecture Research:**
- Medium articles on Playwright test framework structure — folder organization, scaling patterns
- Playwright test sharding docs (playwright.dev/docs/test-sharding) — parallel execution strategies
- playwright-slack-report npm package — integration example

**Pitfalls Research:**
- Flaky test articles (accelq.com, middleware.io, codecov.io) — identification and remediation strategies
- iframe testing guides (debbie.codes, testmu.ai, checklyhq.com) — Playwright iframe interaction patterns
- WebSocket testing articles (dzone.com, adequatica.medium.com) — WebSocket mocking and monitoring
- Web3 testing guides (medium.com/coinmonks, testrig.medium.com) — crypto wallet automation with Synpress/Hardhat
- GitHub Actions performance articles (radekmie.dev, testrigtechnologies.com) — artifact optimization, CI tuning

### Tertiary (LOW confidence)

**Stack Research:**
- Community opinions on self-healing tests (mabl.com, accelq.com) — AI automation limitations
- Allure reporter guides (kailash-pathak.medium.com) — advanced reporting options

**Feature Research:**
- Casino software trends (thehake.com) — what features casinos prioritize in 2026
- RUM vs synthetic monitoring comparisons — complementary approaches

**Pitfalls Research:**
- Cybersecurity alert fatigue in SOC context (torq.io, cyberdefenders.org) — transferable alert management concepts
- iframe security articles (qrvey.com) — sandbox attribute considerations
- Online casino security (northeasttimes.com) — general security practices

---

*Research completed: 2026-02-15*
*Ready for roadmap: yes*
