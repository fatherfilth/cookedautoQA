# Requirements: cooked-synthetic-monitor

**Defined:** 2026-02-16
**Core Value:** Detect breakages in key user flows on cooked.com before real users hit them, with fast alerts and actionable failure artifacts.

## v1.2 Requirements

Requirements for v1.2 Verification & Observability. Each maps to roadmap phases.

### Verification

- [ ] **VERIFY-01**: Auth setup project completes details verification form with fake data (name, DOB, address) after registration
- [ ] **VERIFY-02**: Game launch tests assert actual game iframe loads (not just "Set your details" modal) after verification is complete

### Betting Activity

- [ ] **BET-01**: Test validates "All Bets" tab shows betting entries at bottom of page
- [ ] **BET-02**: Test validates "High Rollers" tab shows betting entries at bottom of page

### Logging

- [ ] **LOG-01**: JSON summary report is committed to the repo after each test run
- [ ] **LOG-02**: Results history is browsable in git (timestamped files or append to log)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Alerting

- **ALERT-01**: Email alerting via SMTP env vars
- **ALERT-02**: Alert deduplication — suppress repeated alerts for same failing test within time window

### Metrics

- **METRIC-01**: Game provider health matrix — aggregate launch success rates by provider
- **METRIC-02**: Response time metrics collection and trending

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real identity data for verification | Disposable test accounts — fake data sufficient |
| Full KYC document upload | Too complex for synthetic monitoring, not needed for game access |
| Sportsbook monitoring | Not a fragile area currently |
| Custom dashboard UI | Use GitHub Actions UI + git history for now |
| Real money transactions | Safety — all flows stop before payment confirmation |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VERIFY-01 | — | Pending |
| VERIFY-02 | — | Pending |
| BET-01 | — | Pending |
| BET-02 | — | Pending |
| LOG-01 | — | Pending |
| LOG-02 | — | Pending |

**Coverage:**
- v1.2 requirements: 6 total
- Mapped to phases: 0
- Unmapped: 6 ⚠️

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after initial definition*
