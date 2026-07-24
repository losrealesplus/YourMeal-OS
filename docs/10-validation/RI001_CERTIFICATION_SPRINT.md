# RI-001 Certification Sprint

**Mode:** Certificador — **no new features**  
**Prerequisite:** [Acta de Cierre OP-001](./ACTA_CIERRE_OP001.md) · Bootstrap Engineering = PASS  
**Goal:** Convert ORR PASS WITH OBSERVATIONS → PASS, then CHECK-IT 05 → RI-001 Certification Report

---

## Order of work

### 1. Merge stack to `main` (or Lovable-connected branch)

**Blocked by AUD-001 until done.**  
PR #54 merged into `cursor/op-001-1-bootstrap-validation-f54a` only — **not** `main`.  
Lovable field build was still `main`-class (Dish Library placeholder).  
See [AUD001_RUNTIME_DEPLOYMENT_AUDIT.md](./AUD001_RUNTIME_DEPLOYMENT_AUDIT.md).

Merge OP-001 → OP-001.1 → OP-001.2 stack → publish branch → confirm new `x-deployment-id` → re-probe.

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
