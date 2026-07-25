# AUD-002 · Authorization Pipeline Investigation

**Fecha:** 2026-07-25  
**Proyecto Supabase live:** `cbeegcxkayybfncnuirg` (`https://cbeegcxkayybfncnuirg.supabase.co`)  
**Sujetos:**

| Email | Rol esperado |
|-------|----------------|
| `alex1409h@gmail.com` | `saas_admin` + `company_admin` (EatClean Tenerife) |
| `alexhdezmtinez@gmail.com` | `saas_admin` + `company_admin` (EatClean Tenerife) |

**Síntoma:** entran / navegan como **cliente** (`/app`) en lugar de Gestión SaaS / Operaciones.  
**Alcance:** solo auditoría del pipeline. Sin cambios de UI, rutas, navegación, branding ni RBAC.

---

## Verdict

La cadena se rompe en el paso **4 · `ensure_platform_owner_session()`**.

**Evidencia live (anon/publishable REST, 2026-07-25):**

| Objeto | HTTP | Mensaje |
|--------|------|---------|
| `POST /rest/v1/rpc/ensure_platform_owner_session` | **404** | `Could not find the function public.ensure_platform_owner_session … in the schema cache` |
| `POST /rest/v1/rpc/ensure_platform_owner_for_user` | **404** | function not in schema cache |
| `GET /rest/v1/platform_owners` | **404** | `Could not find the table 'public.platform_owners' in the schema cache` |

Las migraciones OP-002 existen en el **repo** (`20260725120000_*`, `20260725123000_*`) pero **no están aplicadas** (o no visibles) en el schema cache del proyecto Supabase enlazado.

Consecuencia en cliente:

1. `ensurePlatformOwnerSession()` → throw (`Platform owner bootstrap failed: …`)  
2. `useAuth` traga el error (`.catch(console.error)`) y sigue  
3. `SELECT user_roles` no encuentra grants de Platform Owner (o quedan vacíos)  
4. `roles = []` → `isStaff=false` · `isSaasAdmin=false` · `isCustomer=true`  
5. `homePath = "/app"` · guards `/admin` y `/saas` redirigen a `/app`

**Punto exacto de rotura:**

> Live DB carece de `ensure_platform_owner_session` / `platform_owners` → el bootstrap de Platform Owner no puede materializar `user_roles` → el cliente clasifica al usuario como customer.

`refreshSession()` no interviene (no se usa en el código).

---

## Source of truth

| Capa | Fuente |
|------|--------|
| Identidad | `auth.users` / JWT (`sub`, `email`) — **sin roles** |
| Allowlist owners | `config/bootstrap/platform-owners.json` → (live) `public.platform_owners` — **tabla ausente en live** |
| Grants runtime | `public.user_roles` — única fuente para `useAuth` / guards |
| Membership | `public.tenant_members` |

Ambos correos están en la config del repo:

```json
"owners": [
  { "email": "alex1409h@gmail.com", ... },
  { "email": "alexhdezmtinez@gmail.com", ... }
]
```

---

## Pipeline · PASS / FAIL por paso

Leyenda: **PASS** = cumple esperado · **FAIL** = roto · **BLOCKED** = no auditable sin service-role / sesión del usuario · **N/A** = paso ausente.

### 1 · `auth.users`

| Campo | Valor |
|-------|--------|
| Fuente | `auth.users` (Admin API / SQL service-role) |
| Esperado | Filas para ambos emails (Auth user existe o se crea en seed/login) |
| Observado | **BLOCKED** — sin `SUPABASE_SERVICE_ROLE_KEY`; anon no puede leer `auth.users` |
| Resultado | **BLOCKED** |
| Nota | El síntoma de navegación customer no depende de la ausencia de Auth user (login funciona). La rotura confirmada está más abajo. |

### 2 · `public.user_roles`

| Campo | Valor |
|-------|--------|
| Fuente | `public.user_roles` |
| Esperado | Por cada sujeto: `saas_admin` (`tenant_id` NULL) + `company_admin` (tenant EatClean) |
| Observado | Lectura anon → `42501 permission denied for function is_saas_admin` (RLS). Filas por email **BLOCKED** sin service-role / JWT del usuario. |
| Resultado | **BLOCKED** (contenido) · inferencia: sin RPC/tabla OP-002, el camino oficial **no puede** escribir esos grants |
| Nota | Si hubiera grants manuales previos, `useAuth` los vería; el síntoma “entra como cliente” implica que el cliente **no** ve staff/saas (típicamente `[]`). |

### 3 · Memberships (`tenant_members`)

| Campo | Valor |
|-------|--------|
| Fuente | `public.tenant_members` |
| Esperado | Membership en `eatclean-tenerife` para ambos |
| Observado | **BLOCKED** (misma limitación de credenciales) |
| Resultado | **BLOCKED** |
| Nota | Membership sola no evita `isCustomer`; sin roles staff/saas → customer igual. |

### 4 · `ensure_platform_owner_session()` · **ROTO AQUÍ**

| Campo | Valor |
|-------|--------|
| Fuente | RPC `public.ensure_platform_owner_session` vía `src/lib/ensure-platform-owner-session.ts` |
| Esperado | Función existe; para owners activos → upsert profile + membership + roles |
| Observado live | **HTTP 404** — función **no está** en schema cache del proyecto |
| Código cliente | `throw new Error("Platform owner bootstrap failed: …")` |
| `useAuth` | `.catch(console.error)` — **continúa con roles vacíos** |
| Resultado | **FAIL** (ambos sujetos; mismo proyecto) |

**Este es el primer eslabón confirmado roto en live.**

### 5 · `refreshSession()`

| Campo | Valor |
|-------|--------|
| Fuente | Supabase Auth client |
| Esperado | N/A para roles (JWT no transporta RBAC) |
| Observado | **0 usos** en `src/` (`rg refreshSession` → vacío) |
| Resultado | **N/A** — no forma parte del pipeline; no es el fallo |

### 6 · `useAuth()`

| Campo | Valor |
|-------|--------|
| Fuente | `src/hooks/use-auth.ts` |
| Esperado | Tras ensure OK → `roles` incluye `saas_admin` + `company_admin` |
| Observado (código + live) | Ensure falla → error tragado → `SELECT user_roles` → sin grants Platform Owner → `roles=[]` (síntoma) |
| Resultado | **FAIL** (efecto); causa en paso 4 |

### 7 · `isStaff`

| Campo | Valor |
|-------|--------|
| Fuente | `roles.some(r => STAFF_ROLES.includes(r))` (`company_admin` ∈ STAFF_ROLES) |
| Esperado | `true` |
| Observado (síntoma) | `false` cuando `roles=[]` |
| Resultado | **FAIL** (derivado del paso 4/6) |

### 8 · `isSaasAdmin`

| Campo | Valor |
|-------|--------|
| Fuente | `roles.includes("saas_admin")` |
| Esperado | `true` |
| Observado (síntoma) | `false` cuando `roles=[]` |
| Resultado | **FAIL** (derivado) |

### 9 · `homePath` / `resolveHomePath`

| Campo | Valor |
|-------|--------|
| Fuente | `homePathForRoles` / `resolveHomePath` |
| Esperado | `/admin` (híbrido saas + company_admin) |
| Observado (síntoma) | `/app` (`homePathForRoles([])`) |
| `resolveHomePath` | Llama ensure **antes** de SELECT → ensure throw aborta o, vía otros paths, acaba en customer |
| Resultado | **FAIL** (derivado) |

### 10 · Route guards `/admin`

| Campo | Valor |
|-------|--------|
| Fuente | `assertStaffRoute` → SELECT `user_roles` (**sin** ensure) |
| Esperado | `hasStaffAccess` → permitir |
| Observado | Con `roles=[]` → `redirect({ to: "/app" })` |
| Resultado | **FAIL** (síntoma / defensa correcta ante roles vacíos) |

### 11 · Route guards `/saas`

| Campo | Valor |
|-------|--------|
| Fuente | `assertSaasRoute` → `can(roles, "saas.manage")` (**sin** ensure) |
| Esperado | Permitir (`saas_admin`) |
| Observado | Con `roles=[]` → `redirect({ to: "/app" })` |
| Resultado | **FAIL** (síntoma / defensa correcta ante roles vacíos) |

---

## Matriz por sujeto

| Paso | `alex1409h@gmail.com` | `alexhdezmtinez@gmail.com` |
|------|------------------------|----------------------------|
| 1 auth.users | BLOCKED | BLOCKED |
| 2 user_roles | BLOCKED (contenido) | BLOCKED (contenido) |
| 3 memberships | BLOCKED | BLOCKED |
| 4 ensure_platform_owner_session | **FAIL** (RPC 404) | **FAIL** (RPC 404) |
| 5 refreshSession | N/A | N/A |
| 6 useAuth | **FAIL** (ensure catch → roles vacíos) | **FAIL** |
| 7 isStaff | **FAIL** (derivado) | **FAIL** |
| 8 isSaasAdmin | **FAIL** (derivado) | **FAIL** |
| 9 homePath | **FAIL** → `/app` | **FAIL** → `/app` |
| 10 guard /admin | **FAIL** → `/app` | **FAIL** → `/app` |
| 11 guard /saas | **FAIL** → `/app` | **FAIL** → `/app` |

Ambos sujetos comparten el mismo fallo de infraestructura: **schema OP-002 no desplegado en live**.

---

## Diagrama del corte

```text
Repo: migraciones OP-002 + config/bootstrap/platform-owners.json
                    │
                    ▼
Live Supabase schema cache
  [missing] platform_owners
  [missing] ensure_platform_owner_session   <--- FAIL CONFIRMED (HTTP 404)
  [missing] ensure_platform_owner_for_user
                    │
                    ▼
Client ensurePlatformOwnerSession() -> throw
                    │
                    ▼
useAuth .catch -> SELECT user_roles -> no saas_admin/company_admin
                    │
                    ▼
isStaff=false · isSaasAdmin=false · isCustomer=true
                    │
                    ▼
homePath=/app · /admin,/saas -> /app
                    │
                    ▼
User enters as customer
```

---

## Señales adicionales de frescura del schema live

| Objeto (migración reciente en repo) | Live |
|-------------------------------------|------|
| `public.feature_flags` | existe (HTTP 200) |
| `public.profiles` | existe (HTTP 200) |
| `public.kitchen_production_batches` | **404** (no en schema cache) |
| `public.customer_dish_favorites` | **404** |
| `public.platform_owners` | **404** |

Indica que el proyecto live **no está al día** con migraciones del repo (al menos varias del 2026-07-24/25), no solo OP-002.

---

## Qué NO es el fallo

| Hipótesis | Estado |
|-----------|--------|
| JWT sin roles / falta `refreshSession` | Descartado — diseño table-backed; refresh no se usa |
| Guards “maliciosos” | Correctos: redirigen a `/app` si no hay staff/saas |
| homePath híbrido mal definido | Correcto en código/tests si `roles` llegan |
| Branding / layouts | Fuera de causa |
| Correos ausentes de config repo | Descartado — ambos están en `platform-owners.json` |

---

## Cierre de investigación

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dónde se rompe la cadena? | **Paso 4 — `ensure_platform_owner_session` ausente en live (404)** |
| ¿Por qué entran como cliente? | Ensure no puede grantar → `roles[]` sin staff/saas → customer path |
| ¿Afecta a ambos emails? | **Sí** (mismo proyecto / misma RPC faltante) |
| ¿Hace falta tocar RBAC/UI? | No para este hallazgo; hace falta **aplicar migraciones OP-002** (+ seed) en el Supabase enlazado — eso es un FIX posterior, fuera de AUD-002 |
| ¿Filas auth/roles por email? | BLOCKED aquí; no necesario para afirmar el corte en schema/RPC |

**AUD-002 root cause (infra):** **PASS — identificado**  
**AUD-002 row-level grants por email:** **BLOCKED** (service-role) — no bloquea el veredicto del pipeline

---

## Próximo FIX sugerido (no ejecutado aquí)

1. Aplicar migraciones en el proyecto `cbeegcxkayybfncnuirg` (incl. OP-002).  
2. Verificar: `GET/POST` RPC `ensure_platform_owner_session` deja de ser 404.  
3. `npm run seed:platform-owners`.  
4. Login de ambos correos → confirmar `user_roles` + home `/admin`.  
5. Re-auditar pasos 1–3 con service-role para PASS completo.
