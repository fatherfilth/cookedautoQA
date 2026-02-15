# Roadmap: cooked-synthetic-monitor

## Overview

This roadmap delivers a production-ready synthetic monitoring system for cooked.com across six phases. Starting with foundational infrastructure and reliability patterns, we build critical path tests (lobby, games, auth), then layer in advanced features (WebSocket chat, crypto flows), CI/CD automation with smart alerting, and finally documentation for team handoff. Each phase delivers verifiable capabilities that compound toward continuous production monitoring with fast failure detection.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Test Infrastructure** - Project scaffolding, Page Object Model, reliability standards ✓ 2026-02-15
- [x] **Phase 2: Critical Path Tests** - Smoke tests, auth flows, game launch monitoring ✓ 2026-02-15
- [x] **Phase 3: Social & Live Features** - WebSocket chat monitoring, tipping, Latest & Greatest ✓ 2026-02-15
- [x] **Phase 4: Crypto Integration** - Swapped.com buy flow, crypto transaction testing ✓ 2026-02-15
- [x] **Phase 5: CI/CD & Alerting** - GitHub Actions scheduling, Slack alerts, artifact management ✓ 2026-02-16
- [ ] **Phase 6: Documentation & Polish** - README, runbook, selector strategy documentation

## Phase Details

### Phase 1: Foundation & Test Infrastructure
**Goal**: Establish test infrastructure with reliability patterns baked in from day one
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, RELY-01, RELY-02, RELY-03, RELY-04
**Success Criteria** (what must be TRUE):
  1. Project scaffolded with TypeScript, Playwright, and tsconfig configured for ESM
  2. Folder structure exists (tests/smoke/, tests/helpers/, scripts/, docs/)
  3. Page Object Model base classes implemented (BasePage with navigation and retry helpers)
  4. Test helper provides configurable timeouts and auto-retry for flaky steps
  5. Screenshots, videos, and traces captured only on failure (not success)
  6. All secrets managed via environment variables (BASE_URL, SLACK_WEBHOOK_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD)
  7. Stable selector strategy documented (data-testid preferred, role-based fallbacks)
  8. Explicit wait patterns enforced (waitForSelector, no networkidle)
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md -- Project scaffolding, Playwright config, folder structure, health-check test ✓
- [x] 01-02-PLAN.md -- Test helpers, Page Object Model, selector strategy documentation ✓

### Phase 2: Critical Path Tests
**Goal**: Validate core revenue-generating user journeys (lobby, games, auth)
**Depends on**: Phase 1
**Requirements**: SMOKE-01, SMOKE-02, SMOKE-03, SMOKE-04, GAME-01, GAME-02, GAME-03, GAME-04, AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. Homepage loads and hero element is visible
  2. User can navigate to at least 2 major sections via top navigation
  3. Lobby page displays game categories and user can search for games
  4. Slot, table, and live dealer games launch successfully (iframe loads, game initializes)
  5. User can log in with email/password and session persists across navigation
  6. Registration flow completes step-by-step without creating real accounts
  7. Game launch tests use configurable game IDs per provider (slot/table/live)
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md -- Smoke tests: homepage hero, navigation, lobby categories, search flow ✓
- [x] 02-02-PLAN.md -- Game launch monitoring: slot, table, live dealer with configurable game IDs ✓
- [x] 02-03-PLAN.md -- Auth flows: login, session persistence, registration (stop-before-submit) ✓

### Phase 3: Social & Live Features
**Goal**: Monitor WebSocket-based chat and social engagement features
**Depends on**: Phase 2
**Requirements**: SOCIAL-01, SOCIAL-02, SOCIAL-03, SOCIAL-04
**Success Criteria** (what must be TRUE):
  1. Chat WebSocket connection establishes successfully on chat page load
  2. Chat messages are visible in the interface after connection
  3. Tipping flow initiates, confirms, and reaches success state (stop before real transaction)
  4. "Latest and Greatest" promotional messages display on appropriate page
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md -- ChatPage page object, WebSocket connection test, chat message visibility test ✓
- [x] 03-02-PLAN.md -- Tipping flow test (stop-before-payment), promotional content display test ✓

### Phase 4: Crypto Integration
**Goal**: Test Swapped.com crypto purchase flow end-to-end
**Depends on**: Phase 2 (iframe patterns)
**Requirements**: CRYPTO-01, CRYPTO-02
**Success Criteria** (what must be TRUE):
  1. Swapped.com buy crypto flow is reachable from cooked.com and loads correctly
  2. Crypto buy flow progresses through steps (wallet connection, amount selection) and stops before real purchase
  3. Browser context isolation prevents wallet state pollution between tests
**Plans:** 1 plan

Plans:
- [x] 04-01-PLAN.md -- SwappedIntegrationPage page object, crypto config, Swapped.com buy flow tests (CRYPTO-01, CRYPTO-02) ✓

### Phase 5: CI/CD & Alerting
**Goal**: Automate test execution on schedule with smart failure alerting
**Depends on**: Phases 2, 3, 4 (all tests exist)
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04, CICD-05, CICD-06, CICD-07, ALERT-01, ALERT-02, ALERT-03, ALERT-04, REPORT-01, REPORT-02
**Success Criteria** (what must be TRUE):
  1. GitHub Actions workflow runs tests on schedule (every 30 minutes)
  2. Tests run on push to main and via manual workflow_dispatch trigger
  3. Slack notification sent on failure with test names, severity level, and GitHub Actions run link
  4. Slack message includes links to screenshots and trace artifacts
  5. Alerts implement severity-based logic (CRITICAL vs WARNING flows)
  6. Consecutive failure threshold requires 2+ failures before alerting to reduce noise
  7. Playwright HTML report and JSON summary uploaded as GitHub Actions artifacts
  8. Node modules cached for faster CI runs
  9. Concurrency control prevents overlapping scheduled runs
**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md -- GitHub Actions workflow with schedule, push, dispatch triggers, caching, and artifact uploads ✓
- [x] 05-02-PLAN.md -- Slack alerting script with severity logic, consecutive failure tracking, and JSON summary reporting ✓
- [x] 05-03-PLAN.md -- Severity tags on existing tests and end-to-end integration verification ✓

### Phase 6: Documentation & Polish
**Goal**: Provide team with clear docs for local setup, test authoring, and alert triage
**Depends on**: Phase 5 (system is operational)
**Requirements**: DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. README covers how to run locally, set env vars, add new tests, and troubleshoot flakiness
  2. docs/RUNBOOK.md provides alert triage checklist (what to check first, escalation paths, common false positives)
  3. Selector strategy is documented (how to add data-testid, fallback patterns)
**Plans**: TBD

Plans:
- TBD (to be planned via /gsd:plan-phase 6)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Test Infrastructure | 2/2 | ✓ Complete | 2026-02-15 |
| 2. Critical Path Tests | 3/3 | ✓ Complete | 2026-02-15 |
| 3. Social & Live Features | 2/2 | ✓ Complete | 2026-02-15 |
| 4. Crypto Integration | 1/1 | ✓ Complete | 2026-02-15 |
| 5. CI/CD & Alerting | 3/3 | ✓ Complete | 2026-02-16 |
| 6. Documentation & Polish | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-15*
*Last updated: 2026-02-16 -- Phase 5 complete*
