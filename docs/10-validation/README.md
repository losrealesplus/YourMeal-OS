# Validation & Certification Index

**Purpose:** Permanent auditor map for RI-001 and subsequent releases.  
**Rule:** Prefer this tree for new evidence. Existing OP-001 paths remain valid; this index links them.

```text
docs/10-validation/
├── README.md
├── ACTA_CIERRE_OP001.md
├── AUD001_RUNTIME_DEPLOYMENT_AUDIT.md
├── SUPABASE_CLI_ENV_AUDIT.md             ← CLI IPv6 / project-ref diagnosis
├── RUNTIME_VERIFICATION_EVIDENCE.md      ← Playwright 2026-07-25
├── UX_BRANDLEAFMARK_ADMIN_SHELL.md
├── DEPLOYMENT_VERIFICATION.md
├── POST_DEPLOY_SMOKE_OP001.md
├── RI001_CERTIFICATION_SPRINT.md
├── checklists/ · reports/ · evidence/
```

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

**No feature PRs** for navigation/RBAC (PASS).

1. Day-0 operacional + EV-*  
2. ORR → PASS  
3. CHECK-IT 05  
4. Emit decision on [RI001_CERTIFICATION_REPORT.md](./reports/RI001_CERTIFICATION_REPORT.md)
