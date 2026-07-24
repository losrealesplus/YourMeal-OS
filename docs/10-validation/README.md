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

## FOPEBA status (as of Acta OP-001)

| Domain | Status |
|--------|--------|
| Bootstrap Engineering | PASS |
| Bootstrap Evidence | PASS WITH OBSERVATIONS — credentials blocked Day-0 in agent env |

## Next

Do **not** open functional PRs until [AUD-001](./AUD001_RUNTIME_DEPLOYMENT_AUDIT.md) is resolved (stack on Lovable publish branch + field re-probe).

Then execute [RI001_CERTIFICATION_SPRINT.md](./RI001_CERTIFICATION_SPRINT.md).
