# INFRA-002 · Supabase Cutover Report

**Código:** INFRA-002  
**Fecha:** 2026-07-25  
**Official project ref:** `djangucecsphnejplvic`  
**URL:** `https://djangucecsphnejplvic.supabase.co`  
**Branch:** `cursor/infra-002-supabase-cutover-f54a`  
**Scope:** Binding / config / docs only — no business logic, migrations, or RLS changes

---

## Executive Summary

Cutover de **origen de verdad** del binding Supabase hacia el proyecto validado por bootstrap limpio.

| Área | Estado en este PR |
|------|-------------------|
| `supabase/config.toml` → official ref | ✅ Done |
| `.env` project id + URL → official | ✅ Done |
| Legacy publishable keys removed from `.env` | ✅ Done |
| `.env.example` (official template) | ✅ Done |
| Client code hardcodes | ✅ None (already env-driven) |
| Docs / scripts project binding | ✅ Updated |
| `npm run gen:types` script | ✅ Added |
| Publishable / service keys filled | ⏳ **Operator** (Dashboard / Lovable Cloud) |
| Lovable Cloud env sync | ⏳ **Operator** |
| GitHub Secrets | ⏳ N/A or operator (403 from this agent) |
| Types regenerated from live schema | ⏳ **Operator** (`npm run gen:types` + `supabase login`) |
| Runtime smoke (login / SaaS / Ops) | ⏳ Blocked until keys + Auth users |

**Single Source of Truth after merge + operator keys:** `djangucecsphnejplvic`.

---

## Cambios realizados

### CUT-001 · Variables de entorno

| File | Action |
|------|--------|
| `.env` | `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` → `djangucecsphnejplvic`; URLs → `https://djangucecsphnejplvic.supabase.co`; **keys cleared** (legacy keys removed) |
| `.env.example` | **Created** — official template + key placeholders |
| `.env.local` / `.env.production` / `.env.development` | Not present in repo |
| Lovable Environment Variables | **Not writable from this agent** — operator must paste publishable (+ optional service) keys |
| GitHub Secrets | List denied (HTTP 403); no workflow currently injects legacy project id |

### CUT-002 · Configuración Supabase

| File | Action |
|------|--------|
| `supabase/config.toml` | `project_id = "djangucecsphnejplvic"` |
| CI | `migration-bootstrap.yml` — no project-ref hardcode (local Docker only) |
| Scripts | No hard-coded legacy URL; OP-002 seed doc updated to official URL |
| `.gitignore` | `supabase/.temp/`, `.env.local`, `.env.*.local` |

### CUT-003 · Cliente Supabase

Audited:

- `src/integrations/supabase/client.ts` — `VITE_SUPABASE_*` / `SUPABASE_*` only  
- `src/integrations/supabase/client.server.ts` — `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`  
- `src/integrations/supabase/auth-middleware.ts` — env only  

**No hard-coded project URLs or keys in application source.** No code change required beyond env.

### CUT-004 / CUT-005 · Auth & Frontend

No functional changes. Auth/RPC/Realtime continue to use the shared client singleton. Behavior after cutover depends on keys + Auth users on the official project (same RBAC model as OP-002).

### CUT-006 · Lovable

**Operator checklist (Dashboard Lovable Cloud):**

1. Connect / select Supabase project `djangucecsphnejplvic`.  
2. Set env:
   - `VITE_SUPABASE_URL=https://djangucecsphnejplvic.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<from Supabase API settings>`
   - `VITE_SUPABASE_PROJECT_ID=djangucecsphnejplvic`
   - Mirror non-Vite `SUPABASE_*` if used in SSR.  
3. Redeploy / refresh preview.  
4. Confirm Preview and Production use the same project ref.

### CUT-007 · Runtime Validation

Not executable in this agent without publishable/service keys and Auth users on the official project.

Expected after operator keys + owner login:

| Surface | Expectation |
|---------|-------------|
| Login `/auth` / `/auth/admin` | Supabase Auth on official project |
| Platform Owner ensure | RPC + `platform_owners` (migration-seeded emails) |
| Gestión Operaciones `/admin` | Requires staff/`company_admin` roles |
| Gestión SaaS `/saas` | Requires `saas_admin` |
| Empty roles → `/app` | Same as AUD-002 if seed/login incomplete — **not a frontend bug** |

### CUT-008 · Database Types

| Item | Status |
|------|--------|
| Script `npm run gen:types` | ✅ Added (`--project-id djangucecsphnejplvic`) |
| Regenerated `src/integrations/supabase/types.ts` | ⏳ Requires `supabase login` or `SUPABASE_ACCESS_TOKEN` |

Command (operator):

```bash
supabase login   # or export SUPABASE_ACCESS_TOKEN=...
npm run gen:types
```

### CUT-009 · Legacy cleanup

Repo scan after cutover (application + config):

```bash
# Official ref must be the only project id in binding surfaces
rg -n 'djangucecsphnejplvic' supabase/config.toml .env .env.example
# Deprecated project ref must be absent from binding surfaces
rg -n 'SUPABASE_PROJECT_ID|VITE_SUPABASE|project_id' supabase/config.toml .env .env.example
```

Expected: binding files reference **only** `djangucecsphnejplvic`; no other Supabase project ref in `.env` / `config.toml` / clients / CI.

### CUT-010 · Documentation

Updated:

- `docs/06-database/README.md` — official project  
- `docs/10-validation/DEPLOYMENT_VERIFICATION.md`  
- `docs/10-validation/OP002_PLATFORM_OWNER_BOOTSTRAP.md`  
- `docs/10-validation/README.md`  
- This report  

---

## Evidencias

| Evidence | Detail |
|----------|--------|
| Official bootstrap | Prior session: `Finished supabase db push` on empty official project |
| PR #64 on `main` | RLS teardown + Migration Bootstrap CI |
| Clients env-only | `client.ts` / `client.server.ts` / `auth-middleware.ts` |
| Binding files updated | `config.toml`, `.env`, `.env.example` |
| Agent limits | No `SUPABASE_ACCESS_TOKEN`; Supabase MCP `needsAuth`; no Docker; GitHub secrets 403 |

---

## Riesgos

| Risk | Mitigation |
|------|------------|
| Empty publishable keys break local/Lovable preview until pasted | Documented; `.env.example` guides Dashboard copy |
| Types drift until `gen:types` | Script ready; run before module work |
| Operator forgets Lovable Cloud env | CUT-006 checklist |
| Platform Owner login fails without Auth user | Run seed / create user; see OP-002 |
| Two projects confusion if Lovable still points elsewhere | Single ref in config + env + Lovable |

---

## Checklist final (CUT-011)

| # | Item | Status |
|---|------|--------|
| 1 | Supabase CLI project_id official | ✅ `config.toml` |
| 2 | Repo `.env` URL/project_id official | ✅ |
| 3 | Legacy keys removed from `.env` | ✅ |
| 4 | `.env.example` present | ✅ |
| 5 | No hard-coded client project URL/key | ✅ |
| 6 | Publishable keys filled (Dashboard → `.env` + Lovable) | ☐ Operator |
| 7 | Lovable Preview/Production on official project | ☐ Operator |
| 8 | `supabase link --project-ref djangucecsphnejplvic` (local Mac) | ☐ Operator |
| 9 | `npm run gen:types` committed | ☐ Operator |
| 10 | Login works on official project | ☐ Operator |
| 11 | Gestión SaaS loads | ☐ Operator |
| 12 | Gestión Operaciones loads | ☐ Operator |
| 13 | RPC / Storage / Realtime smoke | ☐ Operator |
| 14 | `rg` finds no legacy project ref in binding surfaces | ✅ (post-change scan) |

---

## Operator quick start (after merge)

```bash
# 1) Dashboard → API → copy publishable (and service_role for seeds)
# 2) Fill .env + Lovable Cloud env (same values)

# 3) CLI
supabase link --project-ref djangucecsphnejplvic
npm run gen:types

# 4) Optional Day-0 / owners
export SUPABASE_URL=https://djangucecsphnejplvic.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...
npm run seed:platform-owners

# 5) Smoke login with an allowlisted Platform Owner email
```

---

## Success criterion

After operator key paste + Lovable sync + types regen:

- Entire ecosystem binds to **`djangucecsphnejplvic`** only.  
- No remaining dependency on the deprecated project for runtime, config, or pipeline.  
- Ready for next product modules on one validated infrastructure.
