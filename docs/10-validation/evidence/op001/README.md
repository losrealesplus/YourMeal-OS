# OP-001 Evidence Pack

Auditor reconstruction kit for RI-001 / CHECK-IT 05.

```text
docs/10-validation/evidence/op001/
├── README.md                 ← this file
├── screenshots/              ← operator captures (EV-NAV-*, EV-TEN-*, …)
├── logs/                     ← command transcripts from verification runs
├── bootstrap-report.json     ← output of bootstrap:verify --json=…
├── checklist.md              ← pointer / snapshot of Day-0 checklist status
└── verification.md           ← how to re-run verification
```

## How to refresh

```bash
npm run bootstrap:verify:ci -- --json=docs/10-validation/evidence/op001/bootstrap-report.json
npx vitest run src/modules/bootstrap-integrity > docs/10-validation/evidence/op001/logs/vitest-bootstrap.txt

# When service role available:
npm run bootstrap:verify -- --live --tenant=eatclean-tenerife \
  --json=docs/10-validation/evidence/op001/bootstrap-report.json
```

## Linked documents

- [OP001_DAY0_CHECKLIST.md](../OP001_DAY0_CHECKLIST.md)
- [OP001_OPERATIONAL_READINESS_REPORT.md](../OP001_OPERATIONAL_READINESS_REPORT.md)
- [BOOTSTRAP_STATE_MACHINE_TRANSITIONS.md](../../05-architecture/BOOTSTRAP_STATE_MACHINE_TRANSITIONS.md)
