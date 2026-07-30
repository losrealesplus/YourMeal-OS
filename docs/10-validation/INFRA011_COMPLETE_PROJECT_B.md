# INFRA-011 · COMPLETE PROJECT B — Checklist final

**Fecha:** 2026-07-29  
**Proyecto:** `djangucecsphnejplvic`  
**Alcance:** bucket + scripts de verificación — **no** Lovable · **no** Auth/OAuth/SMTP · **no** frontend  

---

## Artefactos

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/20260729191000_infra011_tenant_branding_bucket.sql` | Migration idempotente del bucket |
| `scripts/cutover/015_tenant_branding_bucket.sql` | Mismo SQL para SQL Editor (re-ejecutable) |
| `scripts/cutover/verify_project_b.sql` | Verificación READ-ONLY (bucket, owners, tenant, menú) |
| `scripts/cutover/000_consolidated_schema.sql` | Incluye `INSERT … ON CONFLICT DO NOTHING` del bucket |

---

## Checklist operador (SQL Editor en B)

```text
□ Ejecutar scripts/cutover/015_tenant_branding_bucket.sql
□ (Si schema incompleto) Ejecutar 000_consolidated_schema.sql o db push
□ (Si seeds incompletos) Ejecutar 010_seed_eatclean.sql
□ Ejecutar scripts/cutover/verify_project_b.sql
□ Confirmación: bucket / platform_owners / tenant / weekly_menu → EXISTS
```

---

## Verificación desde este entorno (publishable only)

| Check | Resultado 2026-07-29 |
|-------|----------------------|
| `POST /storage/v1/bucket` con publishable | **403** RLS — no se puede crear vía API anon |
| `GET /storage/v1/bucket` | `[]` |
| `GET .../bucket/tenant-branding` | **404 NoSuchBucket** |
| Tablas core (`customer_dish_favorites`, `delivery_groups`, `kitchen_production_batches`, `platform_owners`) | **EXISTS** (REST 200/401) |
| Seeds (tenant / owners / menú) vía publishable | **UNVERIFIED** (RLS) — usar `verify_project_b.sql` |

---

## Resultado INFRA-011 (repo vs live)

| Campo | Repo | Live B |
|-------|------|--------|
| Bucket SQL idempotente | READY | MISSING hasta SQL Editor |
| Schema mínimo (tablas probe) | READY | READY (4 tablas clave) |
| Seeds | Script READY | UNVERIFIED / pendiente verify SQL |
| Proyecto preparado para Lovable | — | **NO** hasta bucket EXISTS en verify |

---

## Post-merge · bootstrap FOPEBA

Tras merge de #111, el empty-DB reset fallaba porque las mirrors Lovable
`20260729184828_*` / `20260729184916_*` re-creaban enums/tablas ya aplicadas por
`20260729100000_*` / `20260729120000_*`. Fix: `CREATE TYPE` con
`EXCEPTION WHEN duplicate_object` + `CREATE TABLE IF NOT EXISTS`.

---

## Fuera de alcance

Usuarios · Auth · OAuth · SMTP · Environment Variables · conexión Lovable
