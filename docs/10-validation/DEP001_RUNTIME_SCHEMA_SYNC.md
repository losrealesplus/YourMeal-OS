# DEP-001 · Supabase Runtime Schema Synchronization Audit

**Fecha:** 2026-07-25  
**Proyecto live:** `cbeegcxkayybfncnuirg` (`https://cbeegcxkayybfncnuirg.supabase.co`)  
**Método:** comparación Git (`supabase/migrations/*.sql`) vs PostgREST schema cache (publishable key probes)  
**Alcance:** solo auditoría. Sin cambios de código, frontend, React ni RBAC. Sin aplicar migraciones.

Evidencia:

- `docs/10-validation/evidence/dep001/live-probes.json`
- `docs/10-validation/evidence/dep001/migration-table-presence.json`

---

## Verdict

El schema live **no está sincronizado** con el repositorio.

Para **OP-002** faltan **ambas** migraciones (en orden):

| # | Archivo | Timestamp |
|---|---------|-----------|
| 1 | `supabase/migrations/20260725120000_op002_platform_owners_bootstrap.sql` | `20260725120000` |
| 2 | `supabase/migrations/20260725123000_op002_platform_owners_config.sql` | `20260725123000` |

Además hay **drift previo** (proxy por tablas/RPCs ausentes) desde al menos:

- `20260723183000_b2b_b2c_customer_model.sql` (`delivery_groups` MISSING)

hasta OP-002. El corte de sincronización no es solo OP-002.

---

## Comparación OP-002 (Git ↔ Live)

Leyenda Live:

- **EXISTS** — visible en schema cache (o 401 por RLS/EXECUTE → objeto existe)
- **MISSING** — PostgREST 404 “not in schema cache”
- **N/A (API)** — no expuesto vía REST; no verificable con publishable key
- **N/A** — OP-002 no introduce ese tipo de objeto

| Objeto | Tipo | Existe en Git | Existe en Live | Estado | PASS / FAIL |
|--------|------|---------------|----------------|--------|-------------|
| `public.platform_owners` | TABLE | Sí (`…123000`) | **MISSING** (404) | Ausente en live | **FAIL** |
| `platform_owners` RLS enabled | RLS | Sí (`…123000`) | **MISSING** (tabla ausente) | Ausente | **FAIL** |
| Policies nombradas en `platform_owners` | POLICY | No (deny-by-default + REVOKE) | N/A | Diseño: sin policies SELECT para authenticated | PASS (diseño) / FAIL (tabla) |
| `platform_owners_active_idx` | INDEX | Sí (`…123000`) | **N/A (API)** | No sondeable vía REST | BLOCKED |
| `user_roles_saas_admin_uidx` | INDEX | Sí (`…120000`) | **N/A (API)** | No sondeable vía REST | BLOCKED |
| `public.is_platform_owner_email(text)` | FUNCTION / RPC | Sí (ambos) | **MISSING** (404) | Ausente | **FAIL** |
| `public.ensure_platform_owner_for_user(uuid)` | FUNCTION / RPC | Sí (ambos) | **MISSING** (404) | Ausente | **FAIL** |
| `public.ensure_platform_owner_session()` | FUNCTION / RPC | Sí (`…120000`) | **MISSING** (404) | Ausente | **FAIL** |
| `public.revoke_platform_owner_for_email(text)` | FUNCTION / RPC | Sí (`…123000`) | **MISSING** (404) | Ausente | **FAIL** |
| `public.handle_new_user()` (body OP-002) | FUNCTION / TRIGGER | Sí replace (`…120000`) | **N/A (API)** | No expuesto como RPC; trigger no verificable aquí | BLOCKED |
| GRANT EXECUTE `ensure_platform_owner_session` → authenticated, service_role | GRANT | Sí | **MISSING** (función ausente) | Ausente | **FAIL** |
| GRANT EXECUTE `ensure_platform_owner_for_user` → service_role | GRANT | Sí | **MISSING** | Ausente | **FAIL** |
| GRANT EXECUTE `is_platform_owner_email` → authenticated, service_role | GRANT | Sí | **MISSING** | Ausente | **FAIL** |
| GRANT ALL `platform_owners` → service_role | GRANT | Sí | **MISSING** | Ausente | **FAIL** |
| REVOKE `platform_owners` FROM PUBLIC, anon, authenticated | REVOKE | Sí | **MISSING** | Ausente | **FAIL** |
| Seed rows Platform Owners en `platform_owners` | DATA | Sí (`…123000` INSERT) | **MISSING** | Ausente | **FAIL** |
| Nuevo enum / valor `app_role` | ENUM | **No** (OP-002 no añade enums) | N/A | Sin cambio OP-002 | PASS (N/A) |
| Trigger `on_auth_user_created` | TRIGGER | Preexistente; OP-002 solo reemplaza función | **N/A (API)** | No verificado | BLOCKED |

### Controles (sanity — objetos no-OP-002)

| Objeto | Git | Live | PASS / FAIL |
|--------|-----|------|-------------|
| `public.profiles` | Sí (foundation) | EXISTS | PASS |
| `public.user_roles` | Sí | EXISTS (401 RLS) | PASS |
| `public.tenants` | Sí | EXISTS (401 RLS) | PASS |
| `public.feature_flags` | Sí | EXISTS | PASS |
| `public.audit_log` | Sí | EXISTS | PASS |
| `public.is_saas_admin(uuid)` | Sí | EXISTS (401 exec) | PASS |
| `public.delivery_groups` | Sí (`…183000` b2b) | **MISSING** | **FAIL** |
| `public.customer_dish_favorites` | Sí (`…160000`) | **MISSING** | **FAIL** |
| `public.kitchen_production_batches` | Sí (`…170000`) | **MISSING** | **FAIL** |
| `public.transition_order_status` | Sí (`…200100`) | **MISSING** (404 RPC) | **FAIL** |

---

## Migraciones concretas que faltan (OP-002)

### 1 · `20260725120000_op002_platform_owners_bootstrap.sql`

| Campo | Valor |
|-------|--------|
| Path | `supabase/migrations/20260725120000_op002_platform_owners_bootstrap.sql` |
| Timestamp | `20260725120000` (2026-07-25 12:00:00) |
| Live | **NO aplicada** (RPCs OP-002 ausentes) |

**Objetos que introduce / modifica:**

| Objeto | Acción |
|--------|--------|
| `user_roles_saas_admin_uidx` | CREATE UNIQUE INDEX (parcial `saas_admin` + `tenant_id IS NULL`) |
| `public.is_platform_owner_email(text)` | CREATE OR REPLACE (placeholder `SELECT false`) |
| `public.ensure_platform_owner_for_user(uuid)` | CREATE OR REPLACE (SECURITY DEFINER; grants roles) |
| `public.ensure_platform_owner_session()` | CREATE OR REPLACE (sesión autenticada → ensure self) |
| `public.handle_new_user()` | CREATE OR REPLACE (profile + ensure si owner) |
| GRANTs / REVOKEs | EXECUTE a `authenticated` / `service_role`; REVOKE de `PUBLIC`/`anon` |

### 2 · `20260725123000_op002_platform_owners_config.sql`

| Campo | Valor |
|-------|--------|
| Path | `supabase/migrations/20260725123000_op002_platform_owners_config.sql` |
| Timestamp | `20260725123000` (2026-07-25 12:30:00) |
| Live | **NO aplicada** (`platform_owners` + RPCs config/revoke ausentes) |

**Objetos que introduce / modifica:**

| Objeto | Acción |
|--------|--------|
| `public.platform_owners` | CREATE TABLE |
| `platform_owners_active_idx` | CREATE INDEX (parcial `active`) |
| RLS on `platform_owners` | ENABLE |
| GRANT/REVOKE table | service_role ALL; REVOKE PUBLIC/anon/authenticated |
| Seed rows | INSERT `alex1409h@gmail.com`, `alexhdezmtinez@gmail.com` |
| `is_platform_owner_email` | REPLACE → lectura de tabla |
| `ensure_platform_owner_for_user` | REPLACE → tenant_slug desde config row |
| `revoke_platform_owner_for_email(text)` | CREATE |
| Backfill DO block | ensure para Auth users cuyo email está en allowlist |

**Orden de aplicación requerido:** `…120000` → `…123000`.

---

## Drift más amplio (contexto)

Proxy por presencia de tablas creadas en cada migración:

| Migración | Proxy tabla(s) | Live |
|-----------|----------------|------|
| Foundation … `20260722*` | `tenants`, `dishes`, `audit_log`, … | PRESENT |
| `20260723183000_b2b_b2c_customer_model.sql` | `delivery_groups` | **MISSING** ← primer corte claro |
| `20260724160000_customer_dish_favorites.sql` | `customer_dish_favorites` | **MISSING** |
| `20260724170000_kitchen_production_batches.sql` | `kitchen_production_batches` | **MISSING** |
| `20260725120000_op002_…bootstrap.sql` | (RPCs) | **MISSING** |
| `20260725123000_op002_…config.sql` | `platform_owners` | **MISSING** |

**Conclusión de sync:** el runtime está aproximadamente al día hasta migraciones ~`20260722` / soft-delete flags; **desde `20260723183000` en adelante hay objetos Git no presentes en live**, incluyendo todo OP-002.

DEP-001 no ejecuta migraciones. Para cerrar Platform Owner runtime hace falta aplicar al menos las dos OP-002 (y, para paridad total repo↔live, la cola desde el primer corte).

---

## Resumen PASS / FAIL OP-002

| Categoría | Resultado |
|-----------|----------|
| Tablas OP-002 | **FAIL** |
| Funciones / RPCs OP-002 | **FAIL** |
| Grants OP-002 | **FAIL** (dependen de objetos ausentes) |
| RLS `platform_owners` | **FAIL** (tabla ausente) |
| Policies nombradas nuevas | N/A (ninguna creada) |
| Triggers (verificación API) | BLOCKED |
| Indexes (verificación API) | BLOCKED |
| Enums nuevos OP-002 | PASS (ninguno) |

**DEP-001 overall (OP-002 sync):** **FAIL**

---

## No ejecutado (por diseño)

- `supabase db push` / `migration up`
- `npm run seed:platform-owners`
- Cambios de frontend / RBAC / React

---

## Próximo paso operativo (fuera de DEP-001)

1. Aplicar en `cbeegcxkayybfncnuirg` (orden):  
   - opcional pero recomendado: migraciones faltantes desde `20260723183000_…`  
   - **obligatorio OP-002:** `20260725120000_…` luego `20260725123000_…`
2. Re-probe: `platform_owners` ≠ 404; `rpc/ensure_platform_owner_session` ≠ 404  
3. `npm run seed:platform-owners`  
4. Re-auditar AUD-002 pasos 1–3 con service-role
