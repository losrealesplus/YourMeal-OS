# Verification procedure (OP-001.2)

## Local / CI (no secrets)

```bash
npm run bootstrap:verify:ci
npx vitest run src/modules/bootstrap-integrity
```

Expected: exit 0; all negative cases PASS.

Exit codes:

| Code | Meaning |
|------|---------|
| 0 | PASS |
| 1 | FAIL data / integrity |
| 2 | FAIL configuration (missing env) |
| 3 | FAIL permissions |

## Live (service role required)

```bash
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
npm run bootstrap:verify -- --live --tenant=eatclean-tenerife \
  --json=docs/10-validation/evidence/op001/bootstrap-report.json
```

Validates entity **relationships** (Tenant→CompanyAdmin→Roles→Dishes→PublishedMenu→Customers→Orders→Kitchen→Delivery→Routes), not only row existence.

## Clean Day-0

```bash
npm install
supabase db reset
export SEED_SAAS_ADMIN_EMAIL=...
export SEED_SAAS_ADMIN_PASSWORD=...
npm run seed
# login → /saas → operate per Day-0 checklist
```

Record duration, commit SHA, and EV-* artifacts under `screenshots/` and `logs/`.
