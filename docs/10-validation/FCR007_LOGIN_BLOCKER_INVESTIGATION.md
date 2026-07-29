# FCR-007 · Login Blocker Investigation

**Alias (prompt):** FCR-003 Login Blocker — el ID `FCR-003` ya estaba asignado a “Superficie Ops validada”; este hallazgo usa **FCR-007**.  
**Severidad:** P0 — bloquea acceso E2E a Ops y Customer Portal  
**Clasificación:** Access Pipeline Regression  
**Estado:** Investigado · **sin fix en este PR**  
**Fecha:** 2026-07-29  
**Pre-check:** VALID

---

## Pre-check

| Chequeo | Resultado |
|---------|-----------|
| Rama base | `cursor/platform-stabilization-complete-f54a` (#100) |
| PRs #89→#100 | Revisados |
| Regresión reportada (post-login sin navegar) | **VALID** (síntoma de producto) |
| PS-002 = PASS implica login E2E real | **INVALID / contradicción** — ver abajo |
| ¿Corregir ahora? | **NO** — solo causa raíz |

### Contradicción PS-002

PS-002 se ejecutó en **Bootstrap Mode** (`BootstrapIdentityProvider`):

- No usa `SupabaseIdentityProvider`
- No ejecuta `signInWithPassword` de producción
- No atraviesa `getSession` tras login real ni `beforeLoad` con sesión Supabase

Por tanto **PS-002 PASS no demuestra** el pipeline real Login → Dashboard. El smoke estabilizó un camino distinto al que falla.

---

## Pipeline esperado

```text
1  Login                (signInWithPassword)
2  Session              (getSession / auth event)
3  Auth Provider        (SupabaseIdentityProvider setSession)
4  Identity cargada     (user id)
5  Profile cargado      (profiles row)
6  Membership resuelta  (tenant_members)     ← no es gate de navigate en /auth
7  Role resuelto        (user_roles / requireAuthRoles)
8  Workspace / homePath (homePathForRoles)
9  Route resuelta       (path string)
10 Navigate             (router.navigate)
11 Layout montado       (_authenticated beforeLoad)
12 Dashboard            (/admin | /app | /saas)
```

---

## Punto exacto del bloqueo

```text
LOGIN OK
    ↓
SESSION  ← ⛔ PRIMER PASO QUE NO AVANZA DE FORMA FIABLE
    ↓
(goHome / tryEnterOperationsCenter no llegan a Navigate)
    ↓
STOP  (usuario permanece en /auth o /auth/admin)
```

**Paso #2 · Session post-login** es el primer eslabón frágil del camino real.

No hay evidencia de que el fallo empiece en Membership / Role / Workspace: esos pasos solo corren **después** de obtener `uid` y llamar a `goHome` / `tryEnterOperationsCenter`. Si la UI no abandona la pantalla de login, el corte es **antes de Navigate (#10)**.

---

## Causa raíz (hipótesis confirmada por código + clase conocida)

### Cambio desencadenante (#99 / Stabilization)

`src/identity/supabase-identity-provider.tsx` eliminó el `getSession()` paralelo al montar y dejó **solo** `onAuthStateChange` para:

- hidratar `session`
- poner `loading = false`

```text
Antes: onAuthStateChange + getSession().then → setSession + setLoading(false)
Ahora: onAuthStateChange only → setSession + setLoading(false)
```

### Camino de login real (sigue esperando Session síncrona)

| Archivo | Tras Login |
|---------|------------|
| `src/routes/auth.tsx` (`EmailForm`) | `signInWithPassword` → **`await getSession()`** → `goHome` → `navigate` |
| `src/routes/auth.admin.tsx` | igual → `tryEnterOperationsCenter` → `navigate` |
| `src/lib/resolve-home-path.ts` | `tryEnsurePlatformOwnerSession` → `getUser()` + roles |

### Mecánica

1. `signInWithPassword` notifica `SIGNED_IN` a listeners (`SupabaseIdentityProvider` + `routes/__root.tsx`).  
2. El provider hace `setSession` y, en un `useEffect` derivado, lanza `tryEnsurePlatformOwnerSession()` → **`getUser()`** + queries PostgREST.  
3. El formulario de login, en la misma ventana temporal, hace **`await getSession()`** para obtener `uid`.  
4. Bajo el modelo de **lock de auth-js / supabase-js**, solapar `getSession` / `getUser` con la notificación de auth es una clase de fallo documentada (deadlock / promesa que no resuelve).  
5. Efecto observable: el `await` del login **no completa** → no hay `goHome` / `navigate` → el usuario “se queda” tras autenticarse.  
   Variante: `getSession()` resuelve `null` → fallback `navigate("/app")` → `requireAuthenticatedUser` redirige a `/auth` → misma percepción de bloqueo.

### Riesgo secundario (ready-state)

Si `INITIAL_SESSION` no pone `loading=false`, `useAuth().loading` permanece `true`:

- `BrandLeafMark` (`src/components/tenant/brand-leaf-mark.tsx`) queda `disabled={loading}` → no se puede entrar a Ops desde landing.  
- Refuerza el síntoma “no navega al Centro de Operaciones”.

`useCan` / `rolesKey` **no** están en el camino crítico de Navigate post-login; el cambio causal es la **eliminación del `getSession` de hidratación** en el Identity Provider.

---

## Archivos implicados

| Archivo | Rol |
|---------|-----|
| `src/identity/supabase-identity-provider.tsx` | Cambio #99: quitó `getSession` de mount; effect post-session llama `getUser`/DB |
| `src/routes/auth.tsx` | Post-login: `await getSession()` → `goHome` |
| `src/routes/auth.admin.tsx` | Post-login Ops: `await getSession()` → enter Ops |
| `src/lib/resolve-home-path.ts` | `tryEnsurePlatformOwnerSession` + roles |
| `src/lib/ensure-platform-owner-session.ts` | `getUser()` + RPC |
| `src/routes/__root.tsx` | Segundo `onAuthStateChange` → `router.invalidate` en `SIGNED_IN` |
| `src/routes/_authenticated/route.tsx` | `requireAuthenticatedUser` → `getUser()`; rebote a `/auth` si sesión ausente |
| `src/components/tenant/brand-leaf-mark.tsx` | Bloqueado mientras `loading` |
| `docs/10-validation/platform-stabilization/*` | PS-002 no cubrió este camino |

---

## Propuesta mínima de corrección (NO implementada)

1. **Restaurar hidratación segura de sesión** en `SupabaseIdentityProvider` sin reintroducir el loop FCR-002:  
   - volver a `getSession()` en mount **o**  
   - `void getSession().then(...)` **después** de registrar el listener, con `setLoading(false)` garantizado en ambos caminos (session o null).  
2. **Post-login:** preferir `user` / `session` devueltos por `signInWithPassword` (`data.session`) para `goHome`, evitando un segundo `getSession()` inmediato cuando ya hay sesión en la respuesta.  
3. **No** llamar APIs auth (`getUser`/`getSession`) **dentro** del callback de `onAuthStateChange` (mantener sync `setState`; diferir RPC/DB al `useEffect` como ahora, tras release del lock).  
4. Reabrir gate **PS-002** con smoke **sin Bootstrap** (o dual: Bootstrap + Supabase) antes de volver a declarar Platform Stabilization COMPLETE / Flow ready.

---

## Resultado (formato pedido)

1. **Punto exacto del bloqueo:** Session post-login (paso 2) — entre `signInWithPassword` OK y `navigate` a Dashboard.  
2. **Causa raíz:** Regresión de hidratación/sincronización de sesión tras quitar `getSession` del Identity Provider (#99), en concurrencia con `getSession`/`getUser` del flujo de login (clase deadlock / sesión no lista). PS-002 no lo detectó por usar solo Bootstrap.  
3. **Archivos:** listados arriba (provider + `auth.tsx` / `auth.admin.tsx` + ensure PO + root + `_authenticated`).  
4. **Fix mínimo propuesto:** rehidratar sesión de forma segura + usar `data.session` del sign-in para navegar; revalidar PS-002 en auth real. **Sin implementar aquí.**

---

## Impacto en Flow

```text
FLOW-01          ⏸ NO ABRIR
Platform Ready   ❌ bloqueado por FCR-007
Stabilization    🟡 COMPLETE en acta #100 — INVALIDADA para Flow hasta fix FCR-007
```
