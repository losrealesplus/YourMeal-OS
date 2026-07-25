# Validation & Certification Index

**Purpose:** Permanent auditor map for RI-001 and subsequent releases.  
**Rule:** Prefer this tree for new evidence. Existing OP-001 paths remain valid; this index links them.

```text
docs/10-validation/
├── README.md
├── ACTA_CIERRE_OP001.md
├── AUD001_RUNTIME_DEPLOYMENT_AUDIT.md
├── MIGRATION_BOOTSTRAP_VALIDATION.md     ← Empty-DB migration gate (FOPEBA CI)
├── CUTOVER_REPORT.md                     ← INFRA-002 (cuando esté en main)
├── G03_PRODUCTION_SMOKE_CHECKLIST.md     ← Smoke E2E → Gate G-03
├── RUNTIME_VERIFICATION_EVIDENCE.md
├── UX_BRANDLEAFMARK_ADMIN_SHELL.md
├── DEPLOYMENT_VERIFICATION.md
├── POST_DEPLOY_SMOKE_OP001.md
├── RI001_CERTIFICATION_SPRINT.md
├── checklists/ · reports/ · evidence/
```

## FOPEBA gates

| Gate | Doc | Notas |
|------|-----|-------|
| Migration Bootstrap (CI) | [MIGRATION_BOOTSTRAP_VALIDATION](./MIGRATION_BOOTSTRAP_VALIDATION.md) | Empty DB |
| **G-03 Platform Operational Baseline** | [Gate](../20-evidence-framework/10-gate-g03-platform-operational-baseline.md) · [Smoke](./G03_PRODUCTION_SMOKE_CHECKLIST.md) | **Siguiente** — tras keys/cutover |
| G-02 Pilot Readiness | [08-gate-g02](../20-evidence-framework/08-gate-g02-pilot-readiness.md) | Después de G-03 + módulos |

> **Nombres:** **OP-001** = Day-0 seed histórico. El smoke post-cutover es **G-03**, no un segundo OP-001.

## FOPEBA status (2026-07-25)

| Domain | Status |
|--------|--------|
| Bootstrap Engineering | ✅ PASS |
| Schema clean bootstrap | ✅ PASS |
| Binding cutover (INFRA-002) | 🟡 keys / Lovable operator |
| **G-03 smoke E2E** | ⏳ PENDING |
| Runtime Navigation / RBAC | ✅ código PASS · runtime ⏳ G-03 |
| Bootstrap Evidence Day-0 | ⛔ BLOCKED |
| CHECK-IT 05 | ⛔ BLOCKED |

## Next

1. Completar keys (`.env` + Lovable) — INFRA-002  
2. Ejecutar [G03_PRODUCTION_SMOKE_CHECKLIST](./G03_PRODUCTION_SMOKE_CHECKLIST.md)  
3. Acta G-03 PASS → reanudar módulos  
4. No abrir CAP/feature dependiente de Supabase hasta G-03 PASS  
