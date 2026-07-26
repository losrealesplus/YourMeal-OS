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
├── POST_DEPLOY_SMOKE_OP001.md
├── RI001_CERTIFICATION_SPRINT.md
├── checklists/ · reports/ · evidence/
```

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
