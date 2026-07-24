# RI-001 Certification Sprint

**Mode:** Certificador — **no new features**  
**Stage:** Stabilization · Integration · Certification  
**Prerequisite:** [Acta de Cierre OP-001](./ACTA_CIERRE_OP001.md) · Bootstrap Engineering = PASS  
**Goal:** DV-001 PASS → Day-0 → ORR PASS → CHECK-IT 05 → RI-001 Certification Report

Every advance should answer: deployed correctly? · demonstrated with evidence? · documented for certification?

---

## Fase 1 · Integración

**AUD-001:** PR #54 is on the feature stack only — Runtime Deployment = FAIL, Evidence = BLOCKED.  
See [AUD001_RUNTIME_DEPLOYMENT_AUDIT.md](./AUD001_RUNTIME_DEPLOYMENT_AUDIT.md).

1. Merge OP-001 → OP-001.1 → OP-001.2 stack into Lovable publish branch (`main`)  
2. Verify final SHA of `main`  
3. Trigger Lovable deploy  
4. Record new `x-deployment-id`

**No continuar si el stack no está en `main`.**

---

## Fase 2 · DV-001

**No continuar si DV-001 no pasa.**

Question: *¿Estoy probando realmente la versión correcta?*

1. [DEPLOYMENT_VERIFICATION.md](./DEPLOYMENT_VERIFICATION.md) — SHA match + deployment-id  
2. [POST_DEPLOY_SMOKE_OP001.md](./POST_DEPLOY_SMOKE_OP001.md) — 6 checks  
3. On **first PASS**: fill [evidence/op001/DV001_FIRST_PASS.md](./evidence/op001/DV001_FIRST_PASS.md) and copy the identity block into ORR + RI-001 Certification Report

| Campo | Valor |
|-------|-------|
| Branch certificada | `main` |
| Commit SHA | `<sha>` |
| Deployment ID | `<x-deployment-id>` |
| Fecha | `<timestamp>` |
| DV-001 | PASS |

---

## Fase 3 · Day-0

Only after DV-001 + smoke PASS:

```text
supabase db reset
        ↓
npm run seed
        ↓
Login
        ↓
Bootstrap completo
```

Fill [OP001_DAY0_CHECKLIST.md](./OP001_DAY0_CHECKLIST.md) (Expected / Actual / Evidence ID).  
Store EV-* under `evidence/op001/`.  
Update [ORR](./OP001_OPERATIONAL_READINESS_REPORT.md) → **PASS** (cite DV-001 identity block).

---

## Fase 4 · Certificación

1. [CHECK-IT 05](./reports/CHECKIT05_REPORT.md) — cite same SHA + Deployment ID  
2. [RI-001 Certification Report](./reports/RI001_CERTIFICATION_REPORT.md) — READY / RWO / NOT READY  

---

## Out of scope

- New modules, CRUD, UI redesigns  
- Architecture changes  
- RBAC bypasses / mocks  

---

## Definition of done (sprint)

- [ ] Stack on publish branch (`main`)  
- [ ] DV-001 PASS + identity block recorded  
- [ ] Post-deploy smoke 6/6  
- [ ] Day-0 + EV-* complete  
- [ ] ORR = PASS  
- [ ] CHECK-IT 05 recorded  
- [ ] RI-001 Certification Report issued  
