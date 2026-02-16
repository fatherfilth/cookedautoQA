# Roadmap: cooked-synthetic-monitor

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-02-16)
- ✅ **v1.1 Auth Coverage** - Phases 7-8 (shipped 2026-02-16)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) - SHIPPED 2026-02-16</summary>

### Phase 1: Foundation & Test Infrastructure
**Goal**: Playwright foundation with reliable patterns for casino testing
**Plans**: 2 plans (complete)

### Phase 2: Critical Path Tests
**Goal**: Core navigation, lobby, game discovery flows validated
**Plans**: 3 plans (complete)

### Phase 3: Social & Live Features
**Goal**: Chat, tipping, promotions validated
**Plans**: 2 plans (complete)

### Phase 4: Crypto Integration
**Goal**: Swapped.com integration tested with iframe isolation
**Plans**: 1 plan (complete)

### Phase 5: CI/CD & Alerting
**Goal**: Automated scheduling, artifacts, and Slack alerting
**Plans**: 3 plans (complete)

### Phase 6: Documentation & Polish
**Goal**: Documentation enables new developers and operators
**Plans**: 1 plan (complete)

</details>

### ✅ v1.1 Auth Coverage (Shipped 2026-02-16)

**Milestone Goal:** Enable authenticated test sessions via per-run registration, unlock all 8 auth-gated tests to achieve 17/17 passing tests with 0 skipped.

#### Phase 7: Auth Foundation
**Goal**: Every test run creates a fresh authenticated session via disposable account registration
**Depends on**: v1.0 completion (Phase 6)
**Requirements**: AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. Each CI run registers a unique test account using `smoketest+{timestamp}@totempowered.com` with password `testtest123`
  2. Registration completes successfully and returns authentication tokens
  3. Playwright setup project saves storageState to `.auth/user.json` for reuse
  4. All test specs can load saved storageState without re-authenticating
  5. Tests run with authenticated session (cookies and local storage persist)
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md — Auth setup project: per-run registration + storageState wiring

#### Phase 8: Test Enablement
**Goal**: All 8 auth-gated tests pass with real authenticated sessions (0 skipped tests)
**Depends on**: Phase 7
**Requirements**: AUTH-07, AUTH-08, GAME-01, GAME-02, GAME-03, CRYPTO-01, CRYPTO-02, SOCIAL-01
**Success Criteria** (what must be TRUE):
  1. Login test (`auth.spec.ts`) passes without skip directive (verifies login form and session creation)
  2. Session persistence test passes (authenticated session survives page reloads and navigation)
  3. All 3 game launch tests pass with authenticated session (slot, table, live dealer iframes load with src)
  4. Crypto buy iframe loads under authenticated session (Swapped.com widget appears)
  5. Crypto buy flow progresses through wallet selection step under authenticated session
  6. Tipping flow passes (tip button visible after authenticated session established)
**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md — Rewrite auth tests to use storageState (login + session persistence)
- [x] 08-02-PLAN.md — Remove conditional skips from game, crypto, and tipping tests
- [x] 08-03-PLAN.md — Fix auth.setup.ts checkbox selector strict mode violation (gap closure)

## Progress

**Execution Order:**
Phases execute in numeric order: 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Test Infrastructure | v1.0 | 2/2 | Complete | 2026-02-15 |
| 2. Critical Path Tests | v1.0 | 3/3 | Complete | 2026-02-15 |
| 3. Social & Live Features | v1.0 | 2/2 | Complete | 2026-02-15 |
| 4. Crypto Integration | v1.0 | 1/1 | Complete | 2026-02-15 |
| 5. CI/CD & Alerting | v1.0 | 3/3 | Complete | 2026-02-16 |
| 6. Documentation & Polish | v1.0 | 1/1 | Complete | 2026-02-16 |
| 7. Auth Foundation | v1.1 | 1/1 | Complete | 2026-02-16 |
| 8. Test Enablement | v1.1 | 3/3 | Complete | 2026-02-16 |

---
*Roadmap created: 2026-02-15*
*Last updated: 2026-02-16 — Phase 8 complete, v1.1 Auth Coverage shipped*
