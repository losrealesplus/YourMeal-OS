# INFRA-004 · Supabase Project Comparison

**Fecha:** 2026-07-29  
**Modo:** Solo lectura — no migrar · no sincronizar · no modificar proyectos  

| | Proyecto A (legacy) | Proyecto B (oficial) |
|--|---------------------|----------------------|
| Ref | `cbeegcxkayybfncnuirg` | `djangucecsphnejplvic` |
| URL | `https://cbeegcxkayybfncnuirg.supabase.co` | `https://djangucecsphnejplvic.supabase.co` |

**Límite de acceso:** solo publishable keys. Sin `SERVICE_ROLE` / Management API / Supabase MCP (`needsAuth`).  
Admin Auth, inventory completo de policies/triggers/extensions en vivo, secrets y filas RLS-protegidas = **parcial / UNVERIFIED**.

---

## 1. AUTH

| Aspecto | A | B | Veredicto |
|---------|---|---|-----------|
| `GET /auth/v1/settings` | 200 · `sb-project-ref=cbeeg…` | 200 · `sb-project-ref=djangu…` | Ambos vivos |
| Email provider | true | true | **Igual** |
| Google | **true** | **false** | **Solo en A** |
| Apple | **true** | **false** | **Solo en A** |
| Phone | false | false | **Igual** |
| `mailer_autoconfirm` | false | false | **Igual** |
| `disable_signup` | false | false | **Igual** |
| `sms_provider` | twilio | twilio | **Igual** (flag; Phone off) |
| Usuarios (admin list) | 401 sin service_role | 401 sin service_role | **UNVERIFIED** en vivo |
| Platform Owners documentados | no en evidencia OP-002 | `alex1409h@`, `alexhdezmtinez@` (OP-002 en B) | **Solo en B** (evidencia histórica) |
| Confirmados | no inventariable sin admin | owners login PASS en OP-002 | Parcial |

---

## 2. DATABASE (tablas · existencia · counts anónimos)

Método: `GET /rest/v1/{table}?select=*&limit=1` + `Prefer: count=exact` con publishable.

### Existencia en schema cache

| Veredicto | Tablas |
|-----------|--------|
| **Solo en B** | `customer_dish_favorites`, `delivery_groups`, `kitchen_production_batches`, `platform_owners` |
| **Solo en A** | — (ninguna de la candidata repo) |
| **En ambos** (HTTP ≠ 404) | 30 tablas (p.ej. `orders`, `dishes`, `profiles`, `tenants`*, `user_roles`*, …) |
| **En ninguno** (404 ambos; no en schema cache expuesto) | `employee_profiles`, `financial_period_closures`, `identity_events`, `invoice_orders`, `user_invitations` |

\* `tenants` / `tenant_members` / `user_roles` / `tenant_domains`: **401** en A y B (RLS / function deny) → existen pero count anónimo no legible.

### Registros (tablas legibles anónimamente)

Todas las tablas con HTTP 200 en **ambos**: count **0**. Diff de counts legibles: **ninguno**.

Filas detrás de RLS (tenants, members, roles, …): **UNVERIFIED** sin service_role.

Evidencia histórica B: tenant `eatclean-tenerife` + memberships de owners (OP-002) — datos reales en B no visibles con anon.

---

## 3. RLS / POLICIES

| | A | B | Veredicto |
|--|---|---|-----------|
| Inventario SQL vivo | No (sin service_role / SQL) | No | **UNVERIFIED** detalle |
| Comportamiento anon | Mismos denegados en `tenants` / `user_roles` / RPCs sensibles | Igual patrón 401/42501 | **Igual** (comportamiento observado) |
| `platform_owners` | 404 (tabla ausente) | 401 (tabla + deny) | **Solo en B** (tabla+policy) |
| Repo migrations | ~101 `CREATE POLICY` en `supabase/migrations` (destino B) | Aplicadas en bootstrap oficial (CUTOVER) | B alineado a repo; A atrasado en tablas nuevas |

---

## 4. FUNCTIONS (DB RPC)

| RPC (probe) | A | B | Veredicto |
|-------------|---|---|-----------|
| `current_user_tenants` | 401 permission denied | 401 permission denied | **Igual** (existe) |
| `ensure_platform_owner_session` | 401 permission denied | 401 permission denied | **Igual** (existe) |
| `is_saas_admin` / `has_role` (sin args) | 404 PGRST202 | 404 PGRST202 | **Igual** (firma requiere args) |

Repo: 20 functions en migrations. Paridad completa de firmas: **UNVERIFIED** sin `pg_proc`.

---

## 5. TRIGGERS

| | Veredicto |
|--|-----------|
| Inventario vivo | **UNVERIFIED** |
| Repo migrations | 8 triggers definidos (`on_auth_user_created`, `*_touch_updated_at`, validators tenants/profiles, …) — destino oficial B |

---

## 6. STORAGE

| | A | B | Veredicto |
|--|---|---|-----------|
| `GET /storage/v1/bucket` | 200 · `[]` | 200 · `[]` | **Igual** (sin buckets públicos listables) |

---

## 7. EDGE FUNCTIONS

| | A | B | Veredicto |
|--|---|---|-----------|
| `GET /functions/v1/` | 404 NOT_FOUND | 404 NOT_FOUND | **Igual** (ninguna expuesta) |
| Repo `supabase/functions/` | Ausente | Ausente | **Igual** |

---

## 8. SECRETS

| | Veredicto |
|--|-----------|
| Dashboard secrets / vault | **UNVERIFIED** (Management API / MCP no disponibles) |
| Publishable keys | Distintas y project-bound (cross-project → 401) |

---

## 9. EXTENSIONS

| | Veredicto |
|--|-----------|
| Inventario vivo | **UNVERIFIED** |
| Migrations repo | sin `CREATE EXTENSION` explícito (Supabase defaults típicos) |

---

## 10. REALTIME

| | Veredicto |
|--|-----------|
| Probe `/realtime/v1/` con publishable | no usable sin key de canal |
| Publicaciones / tablas realtime | **UNVERIFIED** |

---

## 11. MIGRATIONS

| | A | B | Veredicto |
|--|---|---|-----------|
| Repo `supabase/migrations` | 29 archivos · `config.toml` → B | Mismo repo | Origen único = B |
| Schema observado | Faltan ≥4 tablas presentes en B | Superset vs A | **B adelantado** |
| Bootstrap oficial | — | Documentado aplicado (CUTOVER) | **Solo en B** (historia) |

---

## Resumen de diferencias

| Área | Solo A | Solo B | Igual |
|------|--------|--------|-------|
| Auth providers | Google, Apple ON | — | Email ON, phone OFF, autoconfirm OFF |
| Auth owners (docs) | — | Platform owners OP-002 | — |
| Tablas | — | 4 tablas (+ `platform_owners`) | 30 tablas comunes |
| Counts anon legibles | — | — | 0 en tablas abiertas |
| RLS comportamiento anon | — | `platform_owners` deny | denegados tenants/roles |
| Storage buckets | — | — | vacíos |
| Edge functions | — | — | ninguna |
| Secrets / extensions / realtime / triggers vivos | — | — | UNVERIFIED |

---

## Respuestas pedidas

### 1. ¿Puede migrarse a `djangucecsphnejplvic` sin pérdida?

**No** (no demostrable sin service_role; y hay config Auth solo en A).

### 2. ¿Qué datos habría que copiar?

- Inventario Auth de A (usuarios/confirmación/identities) → decidir qué usuarios faltan en B.  
- Filas RLS-protegidas de A (`tenants`, `tenant_members`, `user_roles`, `profiles` no vacíos, orders reales, …) tras dump con service_role.  
- **No** copiar schema de A→B: B ya es **superset**.  
- Evidencia actual: tablas abiertas en A están a **0**; riesgo de pérdida de datos de negocio en A es **desconocido** hasta dump.

### 3. ¿Qué configuración habría que recrear?

- En B (si se necesita paridad OAuth): providers **Google** y **Apple** (+ Client IDs / secrets / redirect URLs).  
- URL Configuration (Site URL / Redirects) en B para el dominio Lovable/prod.  
- SMTP / plantillas email (ambos `mailer_autoconfirm=false`).  
- Secrets de Edge/DB si existieran en A (UNVERIFIED).  
- Binding runtime (`.env` / Lovable Cloud) → B (hoy `main` volvió a A tras merge — fuera de alcance de esta comparación).

### 4. Riesgo

**Medio**

- Schema: B más completo → bajo riesgo de “perder tablas” al ir a B.  
- Auth providers solo en A → medio si producto depende de Google/Apple.  
- Datos RLS / Auth users sin inventariar → medio hasta dump.

### 5. Recomendación técnica

1. Tratar **B (`djangucecsphnejplvic`) como Single Source of Truth** (ya lo es en docs/migrations).  
2. **No** sincronizar schema A→B.  
3. Con service_role: dump Auth users + counts de todas las tablas en A; copiar solo filas/usuarios que falten en B.  
4. Recrear Google/Apple en B solo si el producto los requiere (hoy UI OAuth gated off).  
5. Mantener A en freeze/read-only hasta cierre del inventario; luego decommission.
