# INFRA-009 · FINAL READINESS
## Project B (`djangucecsphnejplvic`) cutover readiness

**Fecha:** 2026-07-29  
**Pre-check:** PR #107 MERGED  
**Alcance:** preparación final schema/storage/seeds scripts — **no** Lovable · **no** frontend · **no** negocio  

---

## Bucket checklist

| Check | Estado |
|-------|--------|
| Código / policies esperan `tenant-branding` | Sí |
| Live B `GET /storage/v1/bucket` | **`[]`** (ausente) |
| Migration idempotente | **Añadida** `20260729190000_infra009_tenant_branding_bucket.sql` |
| `000_consolidated_schema.sql` crea bucket | **Añadido** (INFRA-009) |
| Live B tras apply | **Pendiente operador** (`db push` o SQL Editor) |

**Veredicto live hoy:** MISSING · **Repo preparado:** sí  

---

## Schema checklist

| Objeto esperado (`000_consolidated_schema.sql`) | Live B (publishable) |
|------------------------------------------------|----------------------|
| 39 tablas | **34 existen** · **5 ausentes (404)** |
| Ausentes | `employee_profiles`, `user_invitations`, `identity_events`, `invoice_orders`, `financial_period_closures` |
| Functions (20) / Triggers (8) / RLS (~108 policies) | En consolidated · parcial en B (núcleo OK; objetos de identity/accounting faltan con las tablas) |
| Drift Lovable migrations `20260729184828_*` / `20260729184916_*` | Variantes de lifecycle/hardening — consolidated ya incluye `20260729100000` + `20260729120000` |

**Veredicto live hoy:** MISSING (aplicar consolidated o `db push` de migrations pendientes)  
**Scripts:** consolidated cubre el schema esperado + bucket  

---

## Seed checklist

| Check | Estado |
|-------|--------|
| `010_seed_eatclean.sql` | Tenant fijo + flags + 3 dishes + weekly menu (idempotente) |
| Seed embebido antiguo en `000_*` (slug sin UUID fijo) | **Eliminado** (INFRA-009) — evita drift vs `010_*` |
| Live dishes/menus legibles anon | count 0 (RLS / no seed cutover aplicado o no visible) |
| Auth-bound data (profiles, roles, members) | Fuera de seed (README cutover) |

**Veredicto aplicación en B:** MISSING (ejecutar `010_seed_eatclean.sql` tras schema)  
**Script:** READY  

---

## Runtime checklist (repo / no Lovable)

| Check | Estado |
|-------|--------|
| `supabase/config.toml` → B | Sí |
| `.env.example` → B | Sí |
| `gen:types` → B | Sí |
| Cliente sin hardcode de proyecto | Sí |
| Lovable Cloud / `.env` runtime | **No modificado** (fuera de alcance) |
| Site URL / Redirects / SMTP | **No configurados** aquí (INFRA-006) |

---

## Acciones realizadas en este PR

1. Migration `20260729190000_infra009_tenant_branding_bucket.sql`  
2. `000_consolidated_schema.sql`: INSERT bucket + quitar seed embebido conflictivo  
3. `scripts/cutover/README.md`: storage ya no es manual  
4. Este documento  

**No aplicado** contra el proyecto remoto (sin service_role / CLI link en este entorno).

---

## POST-CHECK (live B hoy)

| Campo | Valor |
|-------|--------|
| Bucket `tenant-branding` | **MISSING** |
| Schema | **MISSING** |
| Seeds | **MISSING** |
| ¿Completamente preparado para conectar Lovable? | **NO** |

Operador para pasar a YES: SQL Editor/`db push` de schema (o `000_*`) + bucket migration + `010_seed_eatclean.sql`, luego Site URL/Redirects + publishable en Lovable.
