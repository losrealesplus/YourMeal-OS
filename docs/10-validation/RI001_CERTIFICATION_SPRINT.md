# RI-001 Certification Sprint

**Mode:** Certificador — **no new features**  
**Prerequisite:** [Acta de Cierre OP-001](./ACTA_CIERRE_OP001.md) · Bootstrap Engineering = PASS  
**Goal:** Convert ORR PASS WITH OBSERVATIONS → PASS, then CHECK-IT 05 → RI-001 Certification Report

---

## Order of work

### 1. Merge stack to `main` (Lovable publish branch)

**AUD-001:** PR #54 merged into feature branch only — Runtime Deployment = **FAIL**, Evidence = **BLOCKED**.

See [AUD001_RUNTIME_DEPLOYMENT_AUDIT.md](./AUD001_RUNTIME_DEPLOYMENT_AUDIT.md).

**No more feature code.** Integration checklist:

1. Merge OP-001 stack → `main` (or Lovable-connected branch)  
2. Verify SHA on publish branch  
3. New Lovable deploy → record `x-deployment-id` in [DV-001](./DEPLOYMENT_VERIFICATION.md)  
4. [Post-deploy smoke](./POST_DEPLOY_SMOKE_OP001.md) (6 checks)  
5. Only if smoke PASS → Day-0

### 2. Clean environment

```bash
supabase db reset
npm run seed
# login as seeded saas_admin → /saas
```

### 3. Complete Day-0 checklist

Fill [OP001_DAY0_CHECKLIST.md](./OP001_DAY0_CHECKLIST.md) with Expected / Actual / **Evidence ID**.  
Store artifacts under `evidence/op001/screenshots/` and `evidence/op001/run-logs/`.

### 4. Update ORR

[OP001_OPERATIONAL_READINESS_REPORT.md](./OP001_OPERATIONAL_READINESS_REPORT.md)

```text
PASS WITH OBSERVATIONS  →  PASS
```

Remove ORR-01 once Day-0 is demonstrated with service role.

### 5. Re-run CHECK-IT 05

Record result in [reports/CHECKIT05_REPORT.md](./reports/CHECKIT05_REPORT.md) and `evidence/ri001/`.

### 6. Emit RI-001 Certification Report

Fill [reports/RI001_CERTIFICATION_REPORT.md](./reports/RI001_CERTIFICATION_REPORT.md)  
Decision: READY / READY WITH OBSERVATIONS / NOT READY (CG-RI-001).

---

## Out of scope

- New modules, CRUD, UI redesigns  
- Architecture changes  
- RBAC bypasses / mocks  

---

## Definition of done (sprint)

- [ ] Day-0 executed on clean env  
- [ ] Checklist EV-* complete  
- [ ] ORR = PASS  
- [ ] CHECK-IT 05 recorded  
- [ ] RI-001 Certification Report issued  
