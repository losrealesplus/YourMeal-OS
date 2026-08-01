# AUTH-LAYOUT-001 · Auth sibling routes (non-nested)

**Fecha:** 2026-08-01  
**Estado:** Implemented (pending merge + PS-002-C PASS operator)  
**Decisión:** Opción B — rutas hermanas  
**Análisis:** [AUTH_LAYOUT_001_ROUTE_OPTIONS.md](./AUTH_LAYOUT_001_ROUTE_OPTIONS.md)

---

## Objetivo (FOPEBA)

> Separar completamente las rutas de autenticación de Cliente y Operaciones mediante rutas hermanas (non-nested), preservando URLs públicas y eliminando la dependencia del layout de `/auth`.

---

## Causa raíz

`/auth/admin` y `/auth/callback` eran hijos de `/auth`, pero `AuthPage` no renderizaba `<Outlet />`.  
TanStack nunca montaba `AdminAuthPage` / `AuthCallbackPage` → Playwright veía onboarding cliente.

---

## Cambio

| Antes | Después |
|-------|---------|
| `auth.admin.tsx` (nested under `/auth`) | `auth_.admin.tsx` (non-nested · parent = root) |
| `auth.callback.tsx` (nested under `/auth`) | `auth_.callback.tsx` (non-nested · parent = root) |
| `createFileRoute("/auth/admin")` | `createFileRoute("/auth_/admin")` |
| `createFileRoute("/auth/callback")` | `createFileRoute("/auth_/callback")` |

Mecanismo oficial: [Non-Nested Routes](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#non-nested-routes).

```text
__root
  ├── /auth                 AuthPage (cliente · onboarding/login)
  ├── /auth/admin           AdminAuthPage (ops)     ← sibling
  ├── /auth/callback        AuthCallbackPage        ← sibling
  └── …
```

**URLs públicas sin cambio:** `/auth` · `/auth/admin` · `/auth/callback`  
(`path` en `routeTree.gen.ts` sigue siendo `/auth/admin` y `/auth/callback`; `getParentRoute` → `rootRouteImport`).

---

## Definition of Done

| # | Criterio | Cómo verificar |
|---|----------|----------------|
| 1 | `/auth` sigue mostrando onboarding/login cliente | Perfil limpio → splash → onboarding; con `tenant_onboarding_done` → login |
| 2 | `/auth/admin` monta directamente `AdminAuthPage` | Perfil limpio → email/password ops (sin “Bienvenido a EatClean”) |
| 3 | `/auth/callback` monta directamente el callback | Sin onboarding cliente en esa URL |
| 4 | `npm run test:ps002-canonical-auth` → **PASS** | Operador con `.env` + dev server |
| 5 | BR-03.3 ejecutable sin cambios al runner | Tras PASS PS-002-C |

---

## Fuera de alcance

- Lógica Auth / Supabase / `checkingSession`  
- Runner Playwright (timeouts, selectors)  
- Opción A (Outlet condicional) · Opción C (pathless layout)

---

## Roadmap post-merge

```text
1. AUTH-LAYOUT-001 (este cambio)
2. npm run test:ps002-canonical-auth → PASS → PS-002-C CLOSED
3. BR-03.3 Runtime Validation
4. BR-03.4 Admin Certified → BR-03 CLOSED
5. BR-04 Client Flow
```
