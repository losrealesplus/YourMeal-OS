# Bootstrap · First SaaS Admin

**OP-001.1:** Platform Day-0 is **`npm run seed`** — no SQL editor.

---

## Install path (target)

```text
git clone
↓
npm install
↓
supabase db reset   # or apply migrations on linked project
↓
npm run seed
↓
Login
↓
Operate (/saas → tenant → …)
```

---

## Seed command

```bash
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export SEED_SAAS_ADMIN_EMAIL=platform@example.com
export SEED_SAAS_ADMIN_PASSWORD='........'
export SEED_SAAS_ADMIN_NAME='Platform Admin'   # optional

npm run seed
```

Behaviour:

1. If a `saas_admin` (`tenant_id IS NULL`) already exists → exit 0 (idempotent).
2. Else create/reuse Auth user (email confirmed) and upsert `user_roles`.
3. Write audit `DAY0_SAAS_ADMIN_SEEDED`.

Script: `scripts/seed-day0.mjs`

---

## After seed (no SQL)

1. Login → must land on `/saas`
2. Create / activate tenant
3. Invite Company Admin
4. Assign roles
5. Company Admin continues in `/admin` (dishes · menu · staff · orders)

Verify:

```bash
npm run bootstrap:verify
npm run bootstrap:verify -- --live
```

---

## Legacy SQL (deprecated)

Manual `insert into user_roles … saas_admin` remains possible as emergency recovery only.  
It is **not** the RI-001 install path.

---

## RI-001 note

Platform Day-0 = `npm run seed`.  
Tenant Day-0 after that must stay SQL-free (DICT-073).
