# RI-001 Certification Sprint

**Mode:** Certificador — **no new features**  
**Stage:** Stabilization · Integration · Certification  
**Prerequisite:** Bootstrap Engineering = PASS · Runtime Deployment = PASS · Runtime Navigation/RBAC = PASS  
**Goal:** Day-0 → ORR PASS → CHECK-IT 05 → RI-001 Certification Report

---

## Current FOPEBA (2026-07-25)

```text
Bootstrap Engineering ........ PASS
Runtime Deployment ........... PASS
Runtime Navigation / RBAC .... PASS
Bootstrap Evidence ........... BLOCKED
CHECK-IT 05 ................. BLOCKED
```

Evidence: [RUNTIME_VERIFICATION_EVIDENCE.md](./RUNTIME_VERIFICATION_EVIDENCE.md)

---

## Remaining work

### Fase 3 · Day-0 (único bloqueo operativo)

```text
supabase db reset  (o entorno limpio equivalente)
        ↓
npm run seed
        ↓
Login
        ↓
Bootstrap completo
```

Fill [OP001_DAY0_CHECKLIST.md](./OP001_DAY0_CHECKLIST.md).  
Update [ORR](./OP001_OPERATIONAL_READINESS_REPORT.md) → **PASS**.

### Fase 4 · Certificación

1. [CHECK-IT 05](./reports/CHECKIT05_REPORT.md)  
2. [RI-001 Certification Report](./reports/RI001_CERTIFICATION_REPORT.md)  

---

## Closed (do not reopen as bugs)

- BrandLeafMark absent inside `/admin` shell — [UX decision](./UX_BRANDLEAFMARK_ADMIN_SHELL.md)  
- Runtime navigation / role landing — PASS  

---

## Out of scope

- New modules, CRUD, UI redesigns  
- Changes to `resolveHomePath` / `decideOperationsCenterEntry` / RBAC  
- “Fixing” BrandLeafMark on `/admin`  

---

## Definition of done (sprint)

- [x] Runtime navigation / RBAC verified (Playwright)  
- [x] DV-001 PASS recorded for navigation wave  
- [ ] Day-0 + EV-* complete  
- [ ] ORR = PASS  
- [ ] CHECK-IT 05 recorded  
- [ ] RI-001 Certification Report decision issued  
