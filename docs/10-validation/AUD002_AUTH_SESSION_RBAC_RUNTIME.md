# AUD-002 · Auth Session & RBAC Runtime Audit

**Fecha:** 2026-07-25  
**Sujeto:** `alex1409h@gmail.com`  
**Síntoma:** Usuario que debería operar con `saas_admin` + `company_admin` termina navegando como **customer** (`/app`).  
**Alcance:** Auditoría de pipeline (sin corrección).  
**Fuera de alcance:** Cambios de pantallas, rutas, layouts, RBAC o Platform Owner logic.

---

## Verdict (una línea)

El usuario se clasifica como customer **en el cliente**, en el momento en que el array `roles` leído de `public.user_roles` llega **vacío (o sin staff/`saas_admin`)**. El JWT **nunca** transporta roles; `refreshSession()` **no forma parte** del pipeline. El punto de pérdida observable es:

> **`SELECT public.user_roles` (cliente) → `roles = []` → `isCustomer = true` / `homePath = "/app"` / guards redirigen a `/app`.**

La causa raíz de por qué esa SELECT está vacía (grants no escritos vs. ensure fallido vs. migración no aplicada) queda **LIVE PENDING** en este entorno (sin service-role / sin sesión del usuario).

---

## Source of truth

| Capa | Fuente | Contiene roles? |
|------|--------|-----------------|
| Auth JWT / session | Supabase Auth (`sub`, `email`, metadata) | **No** |
| Bootstrap config | `config/bootstrap/platform-owners.json` → `public.platform_owners` | Allowlist de owners (no grants runtime) |
| Grants permanentes | `public.user_roles` | **Sí — única fuente runtime** |
| Membership | `public.tenant_members` | Tenant activo (no sustituye roles) |
| Cliente | `useAuth().roles` / `loadRoles()` / `resolveHomePath()` | Copia en memoria de `user_roles` |

**Roles esperados** para Platform Owner (`alex1409h@gmail.com`):

| Rol | Scope |
|-----|--------|
| `saas_admin` | `tenant_id IS NULL` |
| `company_admin` | tenant `eatclean-tenerife` |

**Home esperado** (híbrido): `/admin` (luego SaasOpsEntry → `/saas`).  
**Home observado (síntoma):** `/app` (customer).

---

## Pipeline auditado (11 pasos)

```text
1  Login (Auth)  → JWT/session (sub + email)     [roles NO van en JWT]
2  ensure_platform_owner_session()               [debe escribir user_roles]
3  refreshSession()                              [NO EXISTE en el código]
4  useAuth()                                     [ensure catch + SELECT]
5  roles cargados                                [user_roles → AppRole[]]
6  memberships cargados                          [tenant_members]
7  isStaff                                       [STAFF_ROLES ∩ roles]
8  isSaasAdmin                                   [roles.includes saas_admin]
9  homePath                                      [homePathForRoles]
10 guards /admin                                 [assertStaffRoute]
11 guards /saas                                  [assertSaasRoute]
```

---

## Paso a paso

### 1 · Login

| Ítem | Hallazgo |
|------|----------|
| Entradas | `/auth` (`signInWithPassword` / OAuth) · `/auth/admin` (staff gate) |
| JWT | Contiene identidad (`sub`, `email`). **No** incluye `saas_admin` / `company_admin`. |
| Post-login `/auth` | `goHome` → `resolveHomePath(uid)` → navigate |
| Post-login `/auth/admin` | `ensurePlatformOwnerSession` → `loadRoles` → `hasStaffAccess` → `/admin` o “not staff” |
| Fallback peligroso | Si tras sign-in no hay `uid`: `navigate("/app")` (`auth.tsx`) |

**¿Se pierde el rol aquí?** No. El JWT nunca tuvo el rol. Solo se establece la sesión.

---

### 2 · `ensure_platform_owner_session()`

| Ítem | Hallazgo |
|------|----------|
| Archivo | `src/lib/ensure-platform-owner-session.ts` |
| RPC | `public.ensure_platform_owner_session` (SECURITY DEFINER) |
| Efecto esperado | Si email ∈ `platform_owners` activos → upsert profile + membership + `saas_admin` + `company_admin` |
| Error duro (RPC missing / SQL error) | **throw** → `/auth` `goHome` falla; en `useAuth` se **traga** con `.catch(console.error)` |
| Soft-fail | `applied: false` / `reason: not_platform_owner` / `ok: false` (`tenant_missing`) → **no throw**; sigue el flujo con `user_roles` posiblemente vacío |
| Llamado desde | `resolveHomePath`, `auth.admin` enter, `useAuth` |
| **No** llamado desde | `permissions/route-guards.ts` (`assertStaffRoute` / `assertSaasRoute`) |

**¿Se puede perder el rol aquí?** Sí — si la RPC no aplica grants, el resto del pipeline lee vacío.

---

### 3 · `refreshSession()`

| Ítem | Hallazgo |
|------|----------|
| Uso en `src/` | **Ninguno** (`rg refreshSession` → 0 hits) |
| Relevancia | Nula para roles: aunque existiera, el JWT no lleva RBAC |

**¿Se pierde el rol aquí?** N/A — paso ausente.

---

### 4 · `useAuth()`

| Ítem | Hallazgo |
|------|----------|
| Archivo | `src/hooks/use-auth.ts` |
| Session | `loading=false` en cuanto hay session — **antes** de cargar roles |
| Ensure | `await ensurePlatformOwnerSession().catch(console.error)` — falla → continúa |
| SELECT roles | `from("user_roles").select("role").eq("user_id", uid)` — **errores ignorados** (`data ?? []`) |
| Estado inicial | `roles = []` hasta que termina el async |

**¿Se pierde el rol aquí?** Aquí se **materializa** la clasificación customer si la SELECT viene vacía o si ensure falló y no hay filas.

---

### 5 · Roles cargados

```ts
// use-auth / resolve-home-path / route-guards
const roles = (data ?? []).map((r) => r.role)
```

| Esperado (`alex1409h@gmail.com`) | Observado (síntoma) |
|----------------------------------|---------------------|
| `["saas_admin", "company_admin"]` (orden irrelevante) | `[]` (efectivo para navegación customer) |

**Punto crítico:** cualquier error de PostgREST o ausencia de filas se ve igual: `roles = []`.

---

### 6 · Memberships cargados

| Ítem | Hallazgo |
|------|----------|
| SELECT | `tenant_members` (+ join `tenants`), `limit(1)` |
| Relación con customer | Membership **no** gobierna `isCustomer` / `homePath` |
| Esperado Platform Owner | Fila en EatClean Tenerife |

Si membership falta pero roles existen → sigue siendo staff/saas.  
Si roles faltan pero membership existe → **sigue siendo customer** para navegación.

---

### 7 · `isStaff`

```ts
const isStaff = roles.some((r) => STAFF_ROLES.includes(r));
// STAFF_ROLES incluye company_admin, NO saas_admin
```

| roles | isStaff |
|-------|---------|
| `company_admin` (+ opcional saas) | `true` |
| solo `saas_admin` | `false` |
| `[]` | **`false`** ← síntoma |

---

### 8 · `isSaasAdmin`

```ts
const isSaasAdmin = roles.includes("saas_admin");
```

| roles | isSaasAdmin |
|-------|-------------|
| incluye `saas_admin` | `true` |
| `[]` | **`false`** ← síntoma |

---

### 9 · `homePath`

```ts
// home-path.ts
// hybrid saas_admin + company_admin → "/admin"
// empty / non-staff / non-saas → "/app"
```

| roles | homePath |
|-------|----------|
| `saas_admin` + `company_admin` | `/admin` |
| `[]` | **`/app`** ← navegación customer |

`resolveHomePath` llama ensure **antes** de SELECT; si ensure no escribió filas, el path sigue siendo `/app`.

---

### 10 · Guards `/admin`

| Ítem | Hallazgo |
|------|----------|
| Ruta | `src/routes/_authenticated/admin.tsx` → `assertStaffRoute` |
| Carga roles | SELECT directa — **sin** `ensurePlatformOwnerSession` |
| Fallo | `!hasStaffAccess(roles)` → **`redirect({ to: "/app" })`** |
| Efecto | Usuario con roles aún no grantados / SELECT vacía es **expulsado a customer surface** y permanece ahí |

---

### 11 · Guards `/saas`

| Ótem | Hallazgo |
|------|----------|
| Ruta | `src/routes/_authenticated/saas.tsx` → `assertSaasRoute` |
| Carga roles | SELECT directa — **sin** ensure |
| Fallo | `!can(roles, "saas.manage")` → **`redirect({ to: "/app" })`** |
| Nota | Solo `saas_admin` tiene `saas.manage` |

---

## Clasificación customer (fórmula exacta)

```169:170:src/hooks/use-auth.ts
  const isCustomer =
    roles.includes("customer") || (!isSaasAdmin && !isStaff && !isDriver);
```

Con `roles = []`:

| Flag | Valor |
|------|-------|
| isSaasAdmin | false |
| isStaff | false |
| isDriver | false |
| **isCustomer** | **true** |
| homePath | `/app` |

---

## Registro del sujeto · `alex1409h@gmail.com`

| Campo | Valor |
|-------|-------|
| Email | `alex1409h@gmail.com` |
| Config bootstrap | Presente en `config/bootstrap/platform-owners.json` |
| Roles esperados | `saas_admin` + `company_admin` |
| Tenant esperado | `eatclean-tenerife` |
| Home esperado | `/admin` |
| JWT — roles | **No aplican** (no viajan en JWT) |
| JWT — identidad | Esperado: `email = alex1409h@gmail.com` tras login |
| Roles leídos (cliente, síntoma) | Efectivamente vacíos para navegación (`→ /app`) |
| Roles en DB live | **PENDING** — sin `SUPABASE_SERVICE_ROLE_KEY` / sin sesión del usuario en este entorno |
| `platform_owners` live | **PENDING** |
| RPC ensure live | **PENDING** |

### Live inspection status

| Check | Estado |
|-------|--------|
| Service-role seed/query | BLOCKED (clave ausente en agente) |
| Supabase MCP | `needsAuth` |
| Playwright login del sujeto | No ejecutado (credenciales no disponibles aquí) |

---

## Punto exacto donde se pierde el rol

### Definición operativa de “pérdida”

El rol no se “borra” del JWT (nunca estuvo). Se **deja de considerar staff/saas_admin** cuando el cliente opera con `roles` sin esos valores.

### Punto exacto (código)

1. **Primera clasificación customer:**  
   `useAuth` / `homePathForRoles` / `assertStaffRoute` / `assertSaasRoute`  
   cuando `loadRoles` / SELECT retorna `[]`.

2. **Navegación customer concreta:**  
   - Login `/auth`: `resolveHomePath` → `homePathForRoles([])` → **`navigate("/app")`**.  
   - Acceso `/admin` o `/saas` con `roles=[]`: guard → **`redirect("/app")`**.

3. **Causa más probable aguas arriba (a confirmar live):**  
   Paso **2 (`ensure_platform_owner_session`)** no materializó filas en `user_roles` *antes* del paso **5 (SELECT)**, por una de:

   | Hipótesis | Señal live |
   |-----------|------------|
   | H1 · Migración OP-002 no aplicada en el proyecto Supabase enlazado | RPC 404 / function not found |
   | H2 · `platform_owners` no sincronizado / email inactivo | RPC `{ applied:false, reason:"not_platform_owner" }` |
   | H3 · Tenant `eatclean-tenerife` ausente | RPC `{ ok:false, reason:"tenant_missing" }` |
   | H4 · Ensure throw; `useAuth` lo traga; seed tampoco corrió | Console: `Platform owner bootstrap failed`; `user_roles` vacío |
   | H5 · Roles sí en DB pero SELECT cliente falla y se ignora | Network error en `user_roles`; UI igual que vacío |
   | H6 · Guard `/admin` corre sin ensure y rebota a `/app` antes de grants | Timeline: hit `/admin` → 302-like redirect `/app` |

**H1–H4 son las más coherentes con “Platform Owner que navega como customer” tras OP-002.**  
H5 es menos probable (RLS self-read permite `user_id = auth.uid()`).  
H6 explica el síntoma si el usuario entra por URL `/admin` sin pasar por `resolveHomePath`.

---

## Diagrama de pérdida

```text
Login OK (JWT: sub+email, sin roles)
        │
        ▼
ensure_platform_owner_session()
        │
        ├─ FAIL / soft-fail / no-op ──► user_roles sin saas_admin/company_admin
        │
        ▼
SELECT user_roles  ──►  roles = []          ◄── PUNTO DE PÉRDIDA OBSERVABLE
        │
        ▼
isSaasAdmin=false · isStaff=false · isCustomer=true
        │
        ▼
homePath="/app"  ·  /admin,/saas → redirect "/app"
        │
        ▼
Navegación como customer
```

---

## Qué NO es el bug (descartados por código)

| Hipótesis | Motivo de descarte |
|-----------|-------------------|
| JWT no refresca roles | Roles nunca van en JWT; diseño table-backed |
| `refreshSession` roto | No se llama en ningún sitio |
| Layout/ruta customer forzada por UI | Home/guards dependen solo de `roles[]` |
| `company_admin` + `saas_admin` mal mapeados a home | Spec/tests: híbrido → `/admin` (correcto si roles llegan) |
| RLS oculta filas propias | Policy `user_id = auth.uid()` permite self-read |

---

## Checklist live (para cerrar H1–H6)

Ejecutar autenticado como `alex1409h@gmail.com` (DevTools → Network):

1. Tras login: request `rpc/ensure_platform_owner_session`  
   - Status, body (`ok`, `applied`, `reason`, `roles`, `tenant_slug`)
2. Request `user_roles?user_id=eq.<uid>`  
   - Filas: ¿`saas_admin` + `company_admin`?
3. Request `tenant_members?user_id=eq.<uid>`  
   - ¿Tenant EatClean?
4. Ruta final del browser: `/app` vs `/admin`
5. Si `/app`: ¿hubo intento previo a `/admin` con redirect?
6. Server-side (service role):  
   ```sql
   select email from auth.users where email = 'alex1409h@gmail.com';
   select * from public.platform_owners where email = 'alex1409h@gmail.com';
   select ur.* from public.user_roles ur
     join auth.users u on u.id = ur.user_id
    where u.email = 'alex1409h@gmail.com';
   ```

Marcar la hipótesis confirmada y solo entonces abrir un FIX (fuera de AUD-002).

---

## Conclusión

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dónde deja de ser staff/saas_admin? | Cuando el cliente obtiene `roles = []` desde `user_roles` y aplica la fórmula `isCustomer` / `homePathForRoles` / guards |
| ¿Archivo/función del síntoma? | `use-auth.ts` (flags) + `home-path.ts` (`/app`) + `route-guards.ts` (redirect `/app`) |
| ¿Paso aguas arriba más sospechoso? | **`ensure_platform_owner_session` no materializa grants** (o no se invoca en el path del guard) antes de la SELECT |
| ¿JWT / refreshSession? | No involucrados en la pérdida |
| ¿Corrección en este PR? | **No** — solo auditoría |

**AUD-002 engineering audit:** PASS (pipeline identificado)  
**AUD-002 live root-cause pin:** PENDING (requiere evidencia Network/SQL del sujeto)
