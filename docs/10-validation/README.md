# Validation & Certification Index

**Purpose:** Permanent auditor map for RI-001 and subsequent releases.  
**Rule:** Prefer this tree for new evidence. Existing OP-001 paths remain valid; this index links them.

```text
docs/10-validation/
├── README.md                              ← this file
├── ACTA_CIERRE_OP001.md                   ← FOPEBA closing acta (2026-07-24)
├── RI001_CERTIFICATION_SPRINT.md          ← next work mode (evidence only)
│
├── checklists/
│   ├── README.md
│   ├── OP001_DAY0_CHECKLIST.md            → ../OP001_DAY0_CHECKLIST.md
│   └── RI001_FINAL_CHECKLIST.md           (stub — fill in Certification Sprint)
│
├── reports/
│   ├── README.md
│   ├── OP001_OPERATIONAL_READINESS_REPORT.md → ../OP001_OPERATIONAL_READINESS_REPORT.md
│   ├── RI001_CERTIFICATION_REPORT.md      (stub)
│   └── CHECKIT05_REPORT.md                (stub)
│
└── evidence/
    ├── op001/                             ← populated (OP-001.2)
    ├── ri001/                             ← Certification Sprint
    ├── rbac/                              ← CHECK-IT 04 / RBAC hardening
    ├── operations/                        ← kitchen / delivery journeys
    └── smoke/                             ← HP / smoke runs
```

## FOPEBA status (as of Acta OP-001 + AUD-001)

| Domain | Status |
|--------|--------|
| Bootstrap Engineering | ✅ PASS |
| Runtime Deployment | ❌ FAIL (AUD-001 — publish branch ≠ stack) |
| Bootstrap Evidence | ⛔ BLOCKED (cannot certify wrong build) |
| CHECK-IT 05 | ⛔ BLOCKED |

**Project stage:** Stabilization · Integration · Certification (not feature construction).

## Next

**No feature PRs.** Integration only:

1. Merge OP-001 stack → Lovable publish branch (`main`)  
2. [DV-001](./DEPLOYMENT_VERIFICATION.md) + [post-deploy smoke](./POST_DEPLOY_SMOKE_OP001.md)  
3. Record first PASS in [DV001_FIRST_PASS.md](./evidence/op001/DV001_FIRST_PASS.md)  
4. Then [RI001_CERTIFICATION_SPRINT.md](./RI001_CERTIFICATION_SPRINT.md) Fases 3–4
