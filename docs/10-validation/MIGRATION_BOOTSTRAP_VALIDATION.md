# Migration Bootstrap Validation

**FOPEBA check:** `Migration Bootstrap Validation`  
**Purpose:** Ensure the migration chain applies cleanly on an **empty** database — the same path as a new Supabase project (`db push`) or a local wipe (`db reset`).  
**Origin:** Incident 2026-07-25 — `companies_read` already exists (SQLSTATE 42710) when B2B redefined Foundation Lock RLS without teardown.

---

## Gate

```text
Proyecto / DB vacía
        ↓
supabase db start   (o db reset --yes)
        ↓
Aplicar todas las migraciones en orden
        ↓
¿Finaliza sin errores?
        ↓
✅ Merge permitido (check verde)
❌ Merge bloqueado (check rojo)
```

This catches **inter-migration conflicts** (redefine without teardown) that unit tests and linked “dirty” projects often miss.

---

## What it detects

| Class | Example |
|-------|---------|
| `CREATE POLICY` without dropping a prior same-name policy | Foundation Lock → B2B `companies_read` |
| Other non-idempotent `CREATE …` that collide on re-apply from zero | duplicate objects without `IF NOT EXISTS` / prior `DROP` |
| Broken ordering / missing dependencies on a clean schema | functions/tables referenced before creation |

## What it does **not** replace

- Live Day-0 seed / `bootstrap:verify` (OP-001)
- Remote `db push` to a linked project (network / pooler / secrets)
- Runtime RBAC / UX certification

---

## CI jobs

Workflow: [`.github/workflows/migration-bootstrap.yml`](../../.github/workflows/migration-bootstrap.yml)

| Job | Command | Role |
|-----|---------|------|
| **Static policy teardown preflight** | `npm run test:migration-bootstrap:static` | Offline simulation of policy live-set; fails on CREATE without DROP |
| **Empty DB · apply all migrations** | `supabase db start` then `supabase db reset --yes` | Ground truth on a fresh local Postgres |

Static preflight is fast and catches the RLS evolution class. Docker bootstrap is authoritative.

---

## Local commands

```bash
# Fast (no Docker) — policy collision simulation
npm run test:migration-bootstrap:static

# Full (requires Docker + Supabase CLI)
npm run test:migration-bootstrap
```

`test:migration-bootstrap` runs:

1. static preflight  
2. `supabase db start` (if not already up)  
3. `supabase db reset --yes`

---

## Methodological rule (Knowledge Evolution)

When a later migration **redefines** behaviour introduced by an earlier one:

1. Make teardown explicit (`DROP … IF EXISTS` / replace with the new definition).
2. Do **not** hide divergence with `CREATE … IF NOT EXISTS` when the **definition must change**.
3. Comment **why** the teardown exists (which prior migration defined the old object).

Clean bootstrap and incremental upgrade must converge to the same schema+RLS end state.

---

## Branch protection (recommended)

In GitHub → Settings → Branches → rule for `main`:

- Require status checks to pass before merging  
- Require: **Static policy teardown preflight** and **Empty DB · apply all migrations**

Until required, treat a red Migration Bootstrap Validation as a **merge blocker** by convention (FOPEBA).

---

## Related

- Fix that motivated this gate: PR teardown of `companies_*` before B2B redefine  
- [OP001_DAY0_CHECKLIST](./OP001_DAY0_CHECKLIST.md) — `db reset` → seed → operate  
- [PR_CHANGE_LEVELS](../22-implementation/PR_CHANGE_LEVELS.md) — Infrastructure / schema PRs  
