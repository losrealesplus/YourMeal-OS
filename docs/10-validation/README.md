# Validation & Certification Index

**Purpose:** Permanent auditor map for RI-001 and subsequent releases.  
**Rule:** Prefer this tree for new evidence. Existing OP-001 paths remain valid; this index links them.

```text
docs/10-validation/
├── README.md
├── AUTH_AUDIT.md                         ← INFRA-003 Fase 1
├── SUPABASE_AUTH_VALIDATION.md           ← INFRA-003 Fase 2
├── AUTH_MIGRATION_REPORT.md              ← INFRA-003 cierre código
├── ACTA_CIERRE_OP001.md
├── AUD001_RUNTIME_DEPLOYMENT_AUDIT.md
├── MIGRATION_BOOTSTRAP_VALIDATION.md     ← Empty-DB migration gate (FOPEBA CI)
├── CUTOVER_REPORT.md                     ← INFRA-002 Supabase cutover
├── RUNTIME_VERIFICATION_EVIDENCE.md      ← Playwright 2026-07-25
├── UX_BRANDLEAFMARK_ADMIN_SHELL.md
├── DEPLOYMENT_VERIFICATION.md
├── POST_DEPLOY_SMOKE_OP001.md
├── RI001_CERTIFICATION_SPRINT.md
├── checklists/ · reports/ · evidence/
```

## Official Supabase (INFRA-002)

**Project ref:** `djangucecsphnejplvic`  
Cutover report: [CUTOVER_REPORT](./CUTOVER_REPORT.md)

## FOPEBA gates (CI)

| Gate | Doc | Command / workflow |
|------|-----|-------------------|
| Migration Bootstrap Validation | [MIGRATION_BOOTSTRAP_VALIDATION](./MIGRATION_BOOTSTRAP_VALIDATION.md) | `.github/workflows/migration-bootstrap.yml` · `npm run test:migration-bootstrap:static` |

## FOPEBA status (2026-07-25)

| Domain | Status |
|--------|--------|
| Bootstrap Engineering | ✅ PASS |
| Clean Bootstrap (schema) | ✅ PASS |
| Supabase cutover (binding) | 🟡 INFRA-002 — keys/Lovable operator steps |
| Runtime Deployment | ✅ PASS |
| Runtime Navigation / RBAC | ✅ PASS |
| Bootstrap Evidence | ⛔ BLOCKED (Day-0 pendiente) |
| CHECK-IT 05 | ⛔ BLOCKED |

**Project stage:** Stabilization · Integration · Certification.

Canonical status: [FOPEBA_STATUS_2026-07-25.md](../00-status/FOPEBA_STATUS_2026-07-25.md)

## Next

1. Completar keys + Lovable Cloud (CUTOVER_REPORT checklist)  
2. `npm run gen:types` con CLI autenticada  
3. Day-0 / Platform Owner seed + smoke SaaS/Ops  
4. ORR → PASS · CHECK-IT 05
