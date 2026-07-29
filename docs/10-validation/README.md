# Validation & Certification Index

**Purpose:** Permanent auditor map for RI-001 and subsequent releases.  
**Rule:** Prefer this tree for new evidence. Existing OP-001 paths remain valid; this index links them.

```text
docs/10-validation/
├── README.md
├── AUTH_AUDIT.md                         ← INFRA-003 Fase 1
├── SUPABASE_AUTH_VALIDATION.md           ← INFRA-003 Fase 2
├── AUTH_MIGRATION_REPORT.md              ← INFRA-003 cierre código
├── IDENTITY_VALIDATION_REPORT.md         ← INFRA-005 email/password
├── IDENTITY_PRODUCT_REPORT.md            ← PRODUCT-001 epic cierre
├── EMAIL_SIGNUP_VALIDATION.md            ← PRODUCT-001
├── PASSWORD_RESET_VALIDATION.md          ← PRODUCT-001
├── PHONE_AUTH_AUDIT.md                   ← PRODUCT-001
├── RBAC_VALIDATION.md                    ← INFRA-005
├── TENANT_ISOLATION_REPORT.md            ← INFRA-005
├── CHECKLIST_IDENTITY_VALIDATION.md      ← INFRA-005 operador
├── ACTA_CIERRE_OP001.md
├── AUD001_RUNTIME_DEPLOYMENT_AUDIT.md
├── MIGRATION_BOOTSTRAP_VALIDATION.md     ← Empty-DB migration gate (FOPEBA CI)
├── CUTOVER_REPORT.md                     ← INFRA-002 Supabase cutover
├── RUNTIME_VERIFICATION_EVIDENCE.md      ← Playwright 2026-07-25
├── UX_BRANDLEAFMARK_ADMIN_SHELL.md
├── DEPLOYMENT_VERIFICATION.md
├── OPERATIONAL_READINESS_CERTIFICATION.md ← Entry · Journey · Flow · ORR READY
├── FLOW_CERTIFICATION.md                 ← Nivel 2 · Bloque G (NOT STARTED)
├── FCR_FINDINGS_REGISTER.md              ← Functional Review Mode · hallazgos
├── FCR_SESSION_LOG.md                    ← jornadas × evidencia
├── RBAC_MATRIX_V1.md                     ← autorización por Tenant/Platform Surface
├── WORKSPACE_ENTRY_POLICY.md             ← WEP-001 ✅ CERTIFIED (EP-OPS-002)
├── LANDING_POLICY_VALIDATION.md          ← LP-001 ✅ CERTIFIED
├── RBAC_SURFACE_CERTIFICATION.md         ← RBAC-001 ✅ CERTIFIED
├── SURFACE_MATRIX.md                     ← rol → surface → workspace → landing
├── SURFACE_NAVIGATION_REPORT.md          ← recorrido + casos negativos
├── EP_OPS_002_PRECHECK.md                ← EP-OPS-002 CERTIFIED · acta de ciclo P13
├── ep-ops-003/                           ← EP-OPS-003 · Journeys COMPLETE
├── FCR002_FLICKER_INVESTIGATION.md       ← Render Stability Regression (CLOSED)
├── FCR007_LOGIN_BLOCKER_INVESTIGATION.md ← Login Blocker P0 · post-login no Navigate
├── platform-stabilization/               ← COMPLETE · PS-001/002/003 PASS · acta cierre
├── LOVABLE_DEPLOYMENT_AUDIT_BOOTSTRAP.md  ← Bootstrap #82 · DV-001 Lovable sync
├── POST_DEPLOY_SMOKE_OP001.md
├── RI001_CERTIFICATION_SPRINT.md
├── checklists/ · reports/ · evidence/
```

## EP-OPS-003 · Workspace Operational Journeys

[Epic](../00-status/EP_OPS_003_WORKSPACE_OPERATIONAL_JOURNEY.md) · **[Methodology FROZEN](../00-status/EP_OPS_003_METHODOLOGY_FROZEN.md)** · [Journeys COMPLETE](../00-status/EP_OPS_003_JOURNEYS_COMPLETE.md) · [Evidence index](./ep-ops-003/README.md) · 4/4 CERTIFIED · Bloque G NOT STARTED

## Official Supabase (INFRA-002)

**Project ref:** `djangucecsphnejplvic`  
Cutover report: [CUTOVER_REPORT](./CUTOVER_REPORT.md)

## INFRA-005 · Identity validation

Email/password focus · OAuth UI gated by `VITE_AUTH_OAUTH_SOCIAL_ENABLED` (default false).  
Reports: [IDENTITY](./IDENTITY_VALIDATION_REPORT.md) · [RBAC](./RBAC_VALIDATION.md) · [TENANT](./TENANT_ISOLATION_REPORT.md) · [Checklist](./CHECKLIST_IDENTITY_VALIDATION.md)

## PRODUCT-001 · Identity flows (product)

Signup / password reset / phone audit (no OAuth reactivation).  
Reports: [PRODUCT](./IDENTITY_PRODUCT_REPORT.md) · [Email signup](./EMAIL_SIGNUP_VALIDATION.md) · [Password reset](./PASSWORD_RESET_VALIDATION.md) · [Phone](./PHONE_AUTH_AUDIT.md) · [evidence](./evidence/product-001/)

## BUGFIX-002 · PO bootstrap ≠ global navigation

[BUGFIX002_NAVIGATION_DECOUPLING](./BUGFIX002_NAVIGATION_DECOUPLING.md) · [Regression](./NAVIGATION_REGRESSION_REPORT.md) · [evidence](./evidence/bugfix-002/)

## Auth Layer Frozen · CLOSEOUT

Acta: [IDENTITY_FREEZE_v1](../00-status/IDENTITY_FREEZE_v1.md) · [Checklist](./IDENTITY_CLOSEOUT_CHECKLIST.md) · [Report](./IDENTITY_CLOSEOUT_REPORT.md) · [evidence](./evidence/closeout-001/)

## P12 · Evidence Freshness (ejemplo STALE)

[P12](../20-evidence-framework/10-evidence-freshness-p12.md) · caso canónico: [FINDING_STALE_PO_NAV_LOVABLE](./FINDING_STALE_PO_NAV_LOVABLE.md) — Lovable PO-nav finding cerrado sin código (BUGFIX-001/002).

## EP-BOOTSTRAP-001 · Dev identity + FCR operacional

[BOOTSTRAP_MODE](../00-status/BOOTSTRAP_MODE.md) · [Dev Identity Adapter](../20-evidence-framework/11-development-identity-adapter.md) · [FCR checklist](./BOOTSTRAP_FCR_CHECKLIST.md)

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

1. OP-002: Platform Owners live — [PLATFORM_OWNER_VALIDATION](./PLATFORM_OWNER_VALIDATION.md) · [BOOTSTRAP_RUNBOOK](./BOOTSTRAP_RUNBOOK.md)  
2. Forgot-password para ambos owners → smoke UI `/admin` → `/saas`  
3. INFRA-005 OAuth re-enable cuando proceda · ORR / módulos
