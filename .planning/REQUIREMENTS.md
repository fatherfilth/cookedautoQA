# Requirements: cooked-synthetic-monitor

**Defined:** 2026-02-16
**Core Value:** Detect breakages in key user flows on cooked.com before real users hit them, with fast alerts and actionable failure artifacts.

## v1.1 Requirements

Requirements for v1.1 Auth Coverage. Each maps to roadmap phases.

### Auth Setup

- [ ] **AUTH-05**: Each test run registers a fresh account (`smoketest+{N}@totempowered.com` / `testtest123`)
- [ ] **AUTH-06**: Playwright setup project saves storageState for reuse across all tests

### Unlock Skipped Tests

- [ ] **AUTH-07**: Login test passes with real credentials (no skip)
- [ ] **AUTH-08**: Session persistence test passes with authenticated session (no skip)
- [ ] **GAME-01**: Slot game launch passes with authenticated session (iframe visible + has src)
- [ ] **GAME-02**: Table game launch passes with authenticated session
- [ ] **GAME-03**: Live dealer game launch passes with authenticated session
- [ ] **CRYPTO-01**: Crypto buy iframe loads under authenticated session (no skip)
- [ ] **CRYPTO-02**: Crypto buy flow progresses through steps under authenticated session (no skip)
- [ ] **SOCIAL-01**: Tipping flow passes with authenticated session (tip button visible after login)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Alerting

- **ALERT-01**: Email alerting via SMTP env vars
- **ALERT-02**: Alert deduplication — suppress repeated alerts for same failing test within time window

### Observability

- **OBS-01**: Game provider health matrix — aggregate launch success rates by provider
- **OBS-02**: Response time metrics collection and trending

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-account test isolation | Single account per run is sufficient for smoke monitoring |
| Email verification in registration | Use plus-addressing to bypass; cooked.com may not require verification |
| Real money deposits/withdrawals | Safety — no real transactions |
| Password rotation | Static password `testtest123` sufficient for disposable test accounts |
| Account cleanup/deletion | Accounts are disposable; no cleanup needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-05 | — | Pending |
| AUTH-06 | — | Pending |
| AUTH-07 | — | Pending |
| AUTH-08 | — | Pending |
| GAME-01 | — | Pending |
| GAME-02 | — | Pending |
| GAME-03 | — | Pending |
| CRYPTO-01 | — | Pending |
| CRYPTO-02 | — | Pending |
| SOCIAL-01 | — | Pending |

**Coverage:**
- v1.1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after initial definition*
