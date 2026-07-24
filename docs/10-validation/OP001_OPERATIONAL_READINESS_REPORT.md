# OP-001 · Operational Readiness Report (ORR)

**Document type:** Certification evidence (FOPEBA / RI-001)  
**Package:** OP-001 → OP-001.1 → OP-001.2  
**Status:** PARTIAL — automated integrity PASS; clean Day-0 live run blocked in this agent environment

---

## Identity

| Field | Value |
|-------|-------|
| Date (UTC) | 2026-07-24 |
| Branch | `cursor/op-001-2-bootstrap-evidence-f54a` |
| Commit | `b8b3ff6` (b8b3ff6a8a51e6c760c723dc5f9d6d49a18ce391) |
| Environment | Cursor Cloud Agent workspace |
| Seed mechanism | `npm run seed` (`scripts/seed-day0.mjs`) |
| Seed version | OP-001.2 Day-0 (idempotent saas_admin) |
| Checklist | [OP001_DAY0_CHECKLIST.md](./OP001_DAY0_CHECKLIST.md) |
| Evidence pack | [evidence/op001/](./evidence/op001/) |
| State machine | [BOOTSTRAP_STATE_MACHINE.md](../05-architecture/BOOTSTRAP_STATE_MACHINE.md) |

---

## Certified runtime identity (DV-001)

Fill when the publish-branch deploy is verified — **required before ORR → PASS**.

| Campo | Valor |
|-------|-------|
| Branch certificada | `main` |
| Commit SHA | _(pending merge + DV-001)_ |
| Deployment ID | _(pending)_ |
| Fecha | _(pending)_ |
| DV-001 | _(pending)_ |

See [DEPLOYMENT_VERIFICATION.md](./DEPLOYMENT_VERIFICATION.md).

---

## Scope verified in this run

| Item | Result |
|------|--------|
| Service-level integrity guards (menu, orders, staff, kitchen, delivery) | PASS (code review + tests) |
| Negative automated tests (5 impossible cases) | PASS |
| `npm run bootstrap:verify` pure matrix | PASS |
| `npm run bootstrap:verify:ci` | PASS (pure; no service role → no live) |
| Relationship chain validation in verifier | PASS (implemented) |
| Clean Day-0: `npm install` → `db reset` → `seed` → login → operate | **NOT EXECUTED** — missing `SUPABASE_SERVICE_ROLE_KEY` and Supabase CLI in agent env |
| Screenshots / video of full journey | PENDING (operator on deployed env) |

---

## Incidents

| ID | Severity | Description | Disposition |
|----|----------|-------------|-------------|
| ORR-01 | Medium | Agent environment lacks service-role key and `supabase` CLI | Documented; Day-0 must be run on linked project / local Supabase |
| ORR-02 | Low | ManagePullRequest API unavailable from agent (403) | Branches pushed; PR opened via compare URL |

---

## Commands executed (this agent)

```text
npm run bootstrap:verify
npm run bootstrap:verify:ci
npx vitest run src/modules/bootstrap-integrity
npx tsc --noEmit
```

Logs: [evidence/op001/run-logs/](./evidence/op001/run-logs/)

---

## Conclusion

```text
VERDICT: PASS WITH OBSERVATIONS
```

**Meaning:** Bootstrap is technically and integrity-ready for RI-001 evidence collection.  
The **Operational** close of Day-0 (login → operate on a clean deploy) remains an operator execution of the checklist on an environment with service role + Auth. After that run, update this ORR to `PASS` and attach EV-* artifacts, then re-run CHECK-IT 05.

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Executor | Cursor Agent (OP-001.2) | 2026-07-24 | automated |
| Reviewer | | | |
| RI-001 Auditor | | | |
