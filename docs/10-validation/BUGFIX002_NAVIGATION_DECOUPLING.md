# BUGFIX-002 · Navigation / Platform Owner Decoupling

**Fecha:** 2026-07-26  
**Proyecto:** `djangucecsphnejplvic`  
**Estado:** Fixed  
**Relacionado:** OP-002 · BUGFIX-001 · Identity Freeze v1  

---

## Problema

`ensurePlatformOwnerSession()` se invocaba de forma **estricta** desde:

| Call site | Efecto |
|-----------|--------|
| `resolveHomePath()` | Bloqueaba `/`, `/auth` post-login, callback home |
| `enterOperationsCenter()` | Correcto — entrada Ops |
| `useAuth` | Ya tragaba errores, pero el home path no |

Un fallo de `getUser()` o de la RPC `ensure_platform_owner_session` impedía la navegación de **cualquier** usuario autenticado, incluidos clientes y empleados que no necesitan privilegios Platform Owner.

---

## Principio

Platform Owner bootstrap es una operación **especializada**.

No debe impedir login/navegación de:

- Cliente  
- Empleado  
- Tenant Admin (`company_admin`)  

si su flujo no requiere privilegios Platform Owner.

---

## Clasificación de call sites

| Sitio | Clase | Comportamiento |
|-------|-------|----------------|
| `enterOperationsCenter` (`/auth/admin`) | **A · Obligatoria** | `ensurePlatformOwnerSession()` estricto — falla → error UI + retry · **sin bypass** |
| `resolveHomePath` (`/`, `/auth`, callback) | **B · Opcional** | `tryEnsurePlatformOwnerSession()` — falla → continúa con roles existentes |
| `useAuth` session hydrate | **B · Opcional** | `tryEnsurePlatformOwnerSession()` — no bloquea carga de roles/perfil |

---

## Cambio técnico

### API

```ts
ensurePlatformOwnerSession({ required?: boolean }) // default true
tryEnsurePlatformOwnerSession()                    // required: false
```

| `required` | Auth/RPC error |
|------------|----------------|
| `true` | throw (Ops entry) |
| `false` | log + `null` (global nav) |

### Seguridad (sin cambio de modelo)

- No se conceden roles en el cliente si la RPC falla.  
- No se convierte error en éxito de acceso SaaS/Ops.  
- `/admin` y `/saas` siguen exigiendo roles vía `assertStaffRoute` / `assertSaasRoute`.  
- Entrada `/auth/admin` sigue siendo el gate estricto con ensure.

---

## Clasificación de errores (Ops entry)

Reutiliza `classifyAdminAuthBootstrapError` (BUGFIX-001):

| Caso | Kind | UX |
|------|------|-----|
| Red / timeout | `network` | Mensaje + Retry |
| RPC ausente / migration | `rpc_missing` | Mensaje + Retry |
| Auth / bootstrap failed | `auth` | Mensaje + re-login |
| Session missing | `session` | Mensaje + re-login |
| Forbidden | `forbidden` | Mensaje |
| No owner / no-op RPC | N/A | `ok` sin grants — no es error |

Para navegación global (clase B), estos errores **no** detienen el flujo; el usuario navega según roles ya persistidos (o `/app` si no hay roles).

---

## Restricciones respetadas

- Sin cambios RLS / RBAC / policies / migraciones  
- `ensurePlatformOwnerSession` **no eliminado**  
- Sin bypass de privilegios  

---

## Pruebas

Ver `src/lib/resolve-home-path.spec.ts` · `src/lib/ensure-platform-owner-session.spec.ts`  
Informe: [NAVIGATION_REGRESSION_REPORT](./NAVIGATION_REGRESSION_REPORT.md)
