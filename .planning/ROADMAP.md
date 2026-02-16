# Roadmap: cooked-synthetic-monitor

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-02-16)
- ✅ **v1.1 Auth Coverage** - Phases 7-8 (shipped 2026-02-16)
- 🚧 **v1.2 Verification & Observability** - Phases 9-11 (in progress)

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

<details>
<summary>✅ v1.1 Auth Coverage (Phases 7-8) - SHIPPED 2026-02-16</summary>

### Phase 7: Auth Foundation
**Goal**: Every test run creates a fresh authenticated session via disposable account registration
**Plans**: 1 plan (complete)

### Phase 8: Test Enablement
**Goal**: All 8 auth-gated tests pass with real authenticated sessions (0 skipped tests)
**Plans**: 3 plans (complete)

</details>

### 🚧 v1.2 Verification & Observability (In Progress)

**Milestone Goal:** Complete account verification in auth setup, add betting activity tests, and commit test result history to git.

#### Phase 9: Account Verification ✅
**Goal**: Auth setup completes details verification, enabling game iframe tests
**Depends on**: Phase 8 (authenticated sessions)
**Requirements**: VERIFY-01, VERIFY-02
**Success Criteria** (what must be TRUE):
  1. Auth setup project submits details verification form with fake data (name, DOB, address)
  2. Verification form completes successfully without manual intervention
  3. Game launch tests assert actual game iframe presence (not just "Set your details" modal)
  4. All game tests pass with iframe validation after verification completes
**Plans**: 2 plans (complete)
**Verified**: 2026-02-16 — 7/7 must-haves passed

Plans:
- [x] 09-01-PLAN.md — Add verification form completion to auth setup project
- [x] 09-02-PLAN.md — Update game tests to assert iframe-only (remove modal workaround)

#### Phase 10: Betting Activity Tests ✅
**Goal**: Betting activity component validated in All Bets and High Rollers tabs
**Depends on**: Phase 9 (verification may be needed for betting visibility)
**Requirements**: BET-01, BET-02
**Success Criteria** (what must be TRUE):
  1. Test validates "All Bets" tab shows betting entries at bottom of page
  2. Test validates "High Rollers" tab shows betting entries at bottom of page
  3. Both betting activity tests pass reliably in CI
**Plans**: 1 plan (complete)
**Verified**: 2026-02-16 — 3/3 must-haves passed

Plans:
- [x] 10-01-PLAN.md — Betting activity tests for All Bets and High Rollers tabs

#### Phase 11: Test Result History
**Goal**: Every CI run commits test results to git for browsable history
**Depends on**: Nothing (independent infrastructure work)
**Requirements**: LOG-01, LOG-02
**Success Criteria** (what must be TRUE):
  1. JSON summary report is committed to repo after each test run
  2. Results are browsable in git history (timestamped commits or files)
  3. Commit logic runs in CI without manual intervention
  4. Git history shows progression of test results over time
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

## Progress

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
| 9. Account Verification | v1.2 | 2/2 | Complete | 2026-02-16 |
| 10. Betting Activity Tests | v1.2 | 1/1 | Complete | 2026-02-16 |
| 11. Test Result History | v1.2 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-15*
*Last updated: 2026-02-16 — Phase 10 complete (1/1 plans, verified)*
