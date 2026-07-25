# Validation & Certification Index

**Purpose:** Permanent auditor map for RI-001 and subsequent releases.  
**Rule:** Prefer this tree for new evidence. Existing OP-001 paths remain valid; this index links them.

```text
docs/10-validation/
├── README.md
├── INFRA002_1_LOVABLE_ENV_CUTOVER.md     ← Cómo Lovable lee VITE_* / Cloud
├── INFRA004_PRODUCTION_READINESS.md      ← Epic cierre infra (002→003→004)
├── ACTA_CIERRE_OP001.md
├── AUD001_RUNTIME_DEPLOYMENT_AUDIT.md
├── MIGRATION_BOOTSTRAP_VALIDATION.md     ← Empty-DB migration gate (FOPEBA CI)
├── RUNTIME_VERIFICATION_EVIDENCE.md      ← Playwright 2026-07-25
├── UX_BRANDLEAFMARK_ADMIN_SHELL.md
├── DEPLOYMENT_VERIFICATION.md
├── POST_DEPLOY_SMOKE_OP001.md
├── RI001_CERTIFICATION_SPRINT.md
├── checklists/ · reports/ · evidence/
```

## Infrastructure closure (active)

| Epic | Doc / PR | Status |
|------|----------|--------|
| INFRA-002 Cutover | PR [#66](https://github.com/losrealesplus/YourMeal-OS/pull/66) · CUTOVER_REPORT en branch | OPEN — keys vacías hasta Dashboard |
| INFRA-002.1 Lovable env | [INFRA002_1](./INFRA002_1_LOVABLE_ENV_CUTOVER.md) | Doc |
| INFRA-003 Auth | PR [#68](https://github.com/losrealesplus/YourMeal-OS/pull/68) · AUTH_* en branch | Código listo — merge tras cutover |
| INFRA-004 Prod readiness | [INFRA004](./INFRA004_PRODUCTION_READINESS.md) · [checklist](./checklists/INFRA004_PRODUCTION_READINESS_CHECKLIST.md) | OPEN |

**Freeze:** no abrir módulos funcionales nuevos hasta PASS de INFRA-004 + tag `v0.2.0-auth-complete`.

## FOPEBA gates (CI)

| Gate | Doc | Command / workflow |
|------|-----|-------------------|
| Migration Bootstrap Validation | [MIGRATION_BOOTSTRAP_VALIDATION](./MIGRATION_BOOTSTRAP_VALIDATION.md) | `.github/workflows/migration-bootstrap.yml` · `npm run test:migration-bootstrap:static` |
## FOPEBA status (2026-07-25)

| Domain | Status |
|--------|--------|
| Bootstrap Engineering | ✅ PASS |
| Runtime Deployment | ✅ PASS |
| Runtime Navigation / RBAC | ✅ PASS |
| Bootstrap Evidence | ⛔ BLOCKED (Day-0 pendiente) |
| CHECK-IT 05 | ⛔ BLOCKED |

**Project stage:** Stabilization · Integration · Certification.

Canonical status: [FOPEBA_STATUS_2026-07-25.md](../00-status/FOPEBA_STATUS_2026-07-25.md)

## Next

1. **INFRA-002** — pegar publishable + merge #66 (cero refs a `cbeegcxkayybfncnuirg` en binding)  
2. **Dashboard Auth** — Google/Apple + Redirect URLs (`/auth/callback`)  
3. **INFRA-003** — merge #68  
4. **INFRA-004** — OAuth E2E + smoke portales + tag `v0.2.0-auth-complete`  
5. Luego: Day-0 / ORR / features
