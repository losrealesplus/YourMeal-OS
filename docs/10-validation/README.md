# Validation & Certification Index

**Purpose:** Permanent auditor map for RI-001 and subsequent releases.  
**Rule:** Prefer this tree for new evidence. Existing OP-001 paths remain valid; this index links them.

```text
docs/10-validation/
├── README.md
├── ACTA_CIERRE_OP001.md
├── AUD001_RUNTIME_DEPLOYMENT_AUDIT.md
├── AUD002_AUTH_SESSION_RBAC_RUNTIME.md
├── DEP001_RUNTIME_SCHEMA_SYNC.md
├── INFRA001_MIGRATION_HISTORY.md
├── PREFLIGHT001_GITHUB_DATABASE_SYNC.md
├── SUPABASE_CLI_ENV_AUDIT.md             ← CLI IPv6 / project-ref diagnosis
├── MIGRATION_BOOTSTRAP_VALIDATION.md     ← Empty-DB migration gate (FOPEBA CI)
├── RUNTIME_VERIFICATION_EVIDENCE.md
├── UX_BRANDLEAFMARK_ADMIN_SHELL.md
├── DEPLOYMENT_VERIFICATION.md
├── POST_DEPLOY_SMOKE_OP001.md
├── RI001_CERTIFICATION_SPRINT.md
├── OP002_PLATFORM_OWNER_BOOTSTRAP.md
├── checklists/ · reports/ · evidence/
```

## Milestone · Clean Bootstrap Verified (2026-07-25)

**Acta:** [MILESTONE_CLEAN_BOOTSTRAP_VERIFIED](../00-status/MILESTONE_CLEAN_BOOTSTRAP_VERIFIED.md)

Primer `supabase db push` completo contra proyecto vacío (`djangucecsphnejplvic`).  
Campaña de auditoría (AUD-002 · DEP-001 · INFRA-001 · PRE-FLIGHT-001 · CLI env) consolidada en este árbol.

## FOPEBA gates (CI)

| Gate | Doc | Command / workflow |
|------|-----|-------------------|
| Migration Bootstrap Validation | [MIGRATION_BOOTSTRAP_VALIDATION](./MIGRATION_BOOTSTRAP_VALIDATION.md) | `.github/workflows/migration-bootstrap.yml` · `npm run test:migration-bootstrap:static` |

## FOPEBA status (2026-07-25)

| Domain | Status |
|--------|--------|
| Bootstrap Engineering | ✅ PASS |
| **Clean Bootstrap (empty project)** | ✅ **VERIFIED** (`db push` · 22 migrations) |
| Runtime Deployment | ✅ PASS |
| Runtime Navigation / RBAC | ✅ PASS |
| Bootstrap Evidence (Day-0 seed/ops) | ⛔ BLOCKED (pendiente cutover + seed) |
| CHECK-IT 05 | ⛔ BLOCKED |

**Project stage:** Stabilization · Integration · Certification.

Canonical status: [FOPEBA_STATUS_2026-07-25.md](../00-status/FOPEBA_STATUS_2026-07-25.md)

## Next

1. Merge PR #64 (teardown + Migration Bootstrap CI) — CI ya verde  
2. Checklist Studio en el acta Clean Bootstrap  
3. Cutover `.env` → `djangucecsphnejplvic` + seed OP-002  
4. Day-0 operacional + EV-*  
5. ORR → PASS · CHECK-IT 05  
