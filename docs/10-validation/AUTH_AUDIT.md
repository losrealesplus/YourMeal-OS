# INFRA-003 · Fase 1 — AUTH_AUDIT

**Tipo:** Evidencia (FOPEBA — Evidence before modification)  
**Fecha:** 2026-07-25  
**Epic:** INFRA-003 · Auth Migration (Lovable → Native Supabase Auth)  
**Branch:** `cursor/infra-003-auth-migration-f54a`  
**Modo Fase 1:** Sin cambios de código en el momento de redacción

**Proyecto Supabase objetivo:** `djangucecsphnejplvic`  
**Nota de binding:** el `.env` de `main` aún apunta al project ref **legacy** `cbeegcxkayybfncnuirg` (INFRA-002 cutover pendiente). Esta auditoría describe el **código**, no el cutover de entorno.

---

## 1. Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué sigue dependiendo de Lovable Auth? | **Solo OAuth social** (Google / Apple) vía `@lovable.dev/cloud-auth-js` → `/~oauth/initiate` |
| ¿Qué ya usa Supabase? | Sesiones, email/password, signup, reset password, phone OTP UI, guards, middleware, RBAC, sign-out |
| ¿Qué se puede eliminar tras migración? | `@lovable.dev/cloud-auth-js`, `src/integrations/lovable/index.ts` (wrapper OAuth) |
| ¿Qué **no** se elimina? | `@lovable.dev/vite-tanstack-config`, `reportLovableError` (telemetría, no auth) |

**Causa del 404 local:** `createLovableAuth()` navega a `DEFAULT_OAUTH_BROKER_URL = "/~oauth/initiate"`. Ese broker solo existe en el runtime Lovable Preview/Publish; en localhost Vite no lo sirve → `404 Page not found`.

---

## 2. Inventario de piezas

### 2.1 Dependencia Lovable OAuth

| Pieza | Ubicación | Rol |
|-------|-----------|-----|
| `@lovable.dev/cloud-auth-js` ^1.1.2 | `package.json` | Broker OAuth Lovable |
| `createLovableAuth()` | `src/integrations/lovable/index.ts` | Factory del broker |
| `lovable.auth.signInWithOAuth` | mismo archivo | Wrapper: broker → `supabase.auth.setSession(tokens)` |
| UI Google / Apple | `src/routes/auth.tsx` | Únicos call sites de `lovable.auth` |
| Broker URL | `node_modules/@lovable.dev/cloud-auth-js` | Hardcoded `/~oauth/initiate` |
| Orígenes OAuth Lovable | mismo paquete | `https://oauth.lovable.app`, `https://lovable.dev` |

Flujo actual (evidencia en `cloud-auth-js` 1.1.2):

1. UI llama `lovable.auth.signInWithOAuth("google"|"apple", { redirect_uri: origin })`.
2. Broker redirige a `/~oauth/initiate?provider=…&redirect_uri=…&state=…`.
3. Fuera de Lovable → **404**.
4. En Lovable: popup/iframe/redirect; tokens vuelven; wrapper hace `supabase.auth.setSession`.

### 2.2 Cliente Supabase (ya nativo)

| Pieza | Ubicación | API |
|-------|-----------|-----|
| Browser client | `src/integrations/supabase/client.ts` | `createClient` + `persistSession: true` + localStorage |
| Auth attacher | `src/integrations/supabase/auth-attacher.ts` | Adjunta `Bearer` a server functions |
| Auth middleware | `src/integrations/supabase/auth-middleware.ts` | `getClaims(token)` en server |
| Admin server client | `src/integrations/supabase/client.server.ts` | service role (no auth UI) |

### 2.3 Session / refresh / persistence

| Operación | ¿Quién? | Evidencia |
|-----------|---------|-----------|
| `getSession()` | Supabase | `use-auth.ts`, `auth.tsx`, `auth.admin.tsx`, `index.tsx`, `auth-attacher.ts` |
| `getUser()` | Supabase | `_authenticated/route.tsx` beforeLoad |
| `onAuthStateChange()` | Supabase | `use-auth.ts`, `__root.tsx`, `use-language-sync.ts`, `localization-provider.tsx` |
| `refreshSession()` | *(implícito)* | `autoRefreshToken: true` en client browser; **sin** call sites explícitos |
| `recoverSession` / `exchangeCodeForSession` | **Ausente** | No hay ruta `/auth/callback`; recovery actual = `getSession()` en `/` y `/auth` |
| `setSession` | Lovable wrapper → Supabase | Solo tras tokens del broker Lovable |
| Persistence | localStorage | `client.ts` `storage: localStorage` (browser) |
| `signOut()` | Supabase | `admin-shell`, `app.settings`, `saas.tsx`, `auth.admin` |

### 2.4 Métodos de login (estado por canal)

| Canal | Implementación actual | Proveedor efectivo |
|-------|----------------------|--------------------|
| Email + password | `supabase.auth.signInWithPassword` / `signUp` | Supabase |
| Forgot password | `resetPasswordForEmail` → `/reset-password` | Supabase |
| Phone OTP | `signInWithOtp` / `verifyOtp` | Supabase (UI presente) |
| Google OAuth | `lovable.auth.signInWithOAuth("google")` | **Lovable broker** |
| Apple OAuth | `lovable.auth.signInWithOAuth("apple")` | **Lovable broker** |
| Microsoft | Soportado en tipos del wrapper; **sin UI** | N/A |

### 2.5 Callbacks / redirects

| Surface | Valor actual |
|---------|--------------|
| OAuth `redirect_uri` | `window.location.origin` (raíz `/`) |
| Email signup `emailRedirectTo` | `window.location.origin` |
| Password reset `redirectTo` | `${origin}/reset-password` |
| Post-login home | `resolveHomePath(userId)` → `/app` \| `/admin` \| … |
| Staff entry | `/auth/admin` + returnTo Ops Center |
| Authenticated gate | redirect → `/auth` si no hay user |
| Dedicated OAuth callback route | **No existe** |

La landing `/` ya rehidrata sesión (`getSession` → `resolveHomePath`) — comentario OP-001 en `index.tsx`. Eso amortigua redirects a origin, pero **no** sustituye un callback PKCE explícito.

### 2.6 Auth context / guards

| Pieza | Ubicación | Dependencia |
|-------|-----------|-------------|
| `useAuth()` | `src/hooks/use-auth.ts` | Supabase session + `user_roles` / profile / tenant |
| `_authenticated` beforeLoad | `src/routes/_authenticated/route.tsx` | `supabase.auth.getUser()` |
| Capability / staff / SaaS / driver | `src/permissions/route-guards.ts` | Supabase + `user_roles` |
| Server fn auth | `requireSupabaseAuth` | JWT via header (Supabase claims) |
| Platform Owner bootstrap | `ensurePlatformOwnerSession` | RPC tras sesión Supabase |

No hay `AuthProvider` React separado: el estado vive en `useAuth` + listeners globales.

### 2.7 Rutas auth

| Ruta | Archivo | Auth backend |
|------|---------|--------------|
| `/auth` | `auth.tsx` | Mix: email/phone Supabase + OAuth Lovable |
| `/auth/admin` | `auth.admin.tsx` | Solo email/password Supabase |
| `/reset-password` | `reset-password.tsx` | Supabase `updateUser` |
| `/auth/callback` | — | **Missing** |

---

## 3. Respuestas de la Fase 1

### ¿Qué piezas siguen dependiendo de Lovable?

1. Paquete `@lovable.dev/cloud-auth-js`.
2. Wrapper `src/integrations/lovable/index.ts`.
3. Botones Google/Apple en `src/routes/auth.tsx`.
4. Indirectamente: el broker `/~oauth/initiate` y orígenes `oauth.lovable.app` / `lovable.dev`.

### ¿Cuáles ya utilizan Supabase?

- Persistencia y refresh de sesión (`client.ts`).
- Email/password, signup, reset, phone OTP (UI).
- `getSession` / `getUser` / `onAuthStateChange` / `signOut`.
- Route guards, server middleware, RBAC (`user_roles`), Platform Owner ensure.
- Post-login routing (`resolveHomePath`).

### ¿Qué dependencias pueden eliminarse?

| Eliminable tras Fase 7 | Conservar |
|------------------------|-----------|
| `@lovable.dev/cloud-auth-js` | `@supabase/supabase-js` |
| `src/integrations/lovable/` (si queda vacío) | `@lovable.dev/vite-tanstack-config` (build Lovable) |
| Imports `lovable` en UI | `src/lib/lovable-error-reporting.ts` (no es auth) |

---

## 4. Gaps que la migración debe cerrar

1. Sustituir OAuth Lovable por `supabase.auth.signInWithOAuth`.
2. Introducir ruta de callback alineada al router (`/auth/callback`) + `exchangeCodeForSession` / recovery PKCE.
3. Centralizar auth en `src/auth/` para que la UI no llame al SDK ni a Lovable directamente.
4. Documentar Redirect URLs / providers en el proyecto Supabase **oficial** (ver `SUPABASE_AUTH_VALIDATION.md`).
5. No romper sign-out, guards, ni recuperación en `/` y `/auth`.

---

## 5. Criterio de salida Fase 1

PASS: inventario completo, dependencia Lovable acotada a OAuth social, gaps listados, sin modificación de comportamiento aún.

**Siguiente:** Fase 2 — `SUPABASE_AUTH_VALIDATION.md`.
