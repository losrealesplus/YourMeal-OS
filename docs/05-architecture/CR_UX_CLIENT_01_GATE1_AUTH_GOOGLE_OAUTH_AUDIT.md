# CR-UX-CLIENT-01 · GATE 1: AUDITORÍA DE AUTENTICACIÓN Y GOOGLE OAUTH

**Fecha:** 2026-10-03  
**Estado:** 🟢 AUDITORÍA DE GATE 1 COMPLETADA (AUDIT ONLY — 0 MUTACIONES)  
**Régimen de Gobernanza:** CR-GOV-01R  
**Objetivo:** Auditar la cadena de autenticación completa (Email/Password y Google OAuth), configuración de Supabase, flujo PKCE, materialización de usuario/cliente, persistencia de sesión y resolución de tenant.

---

## 1. Diagnóstico Técnico Estructurado

### 1.1. ¿Qué está actualmente configurado y funcional?

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CADENA IMPLEMENTADA                              │
│                                                                             │
│  1. signInWithOAuth('google') en src/auth/oauth.ts                          │
│     ├── Mapeo de proveedor: provider = 'google'                             │
│     └── URL de redirección: oauthRedirectTo() = {origin}/auth/callback      │
│                                                                             │
│  2. Retorno PKCE en src/routes/auth_.callback.tsx + src/auth/callback.ts   │
│     ├── exchangeCodeForSession(code)                                        │
│     ├── Captura de errores OAuth (?error= / ?error_description=)            │
│     ├── Sanitización de ?next= contra lista blanca                          │
│     ├── associateDeploymentAfterAuth() (vinculación a tenant)               │
│     └── resolveHomePath(userId) → /app (Customer Portal)                    │
│                                                                             │
│  3. Persistencia de Sesión en src/auth/session.ts & hooks/use-auth.tsx      │
│     ├── Almacenamiento seguro de tokens JWT en LocalStorage                 │
│     ├── Rehidratación en frío (Cold start via getSession())                 │
│     └── Cierre de sesión atómico (signOut() + limpieza de contexto)         │
│                                                                             │
│  4. Materialización de Cliente en public.customers                          │
│     └── RPC ensure_individual_customer(tenant_id, user_id, name, email)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2. ¿Qué falta o causa el fallo visible en `/auth`?

1. **Feature Flag de Exposición UI:**
   - En [`src/auth/features.ts`](file:///Users/alex/Developer/YourMeal-OS/src/auth/features.ts#L47), la función `isGoogleOAuthEnabled()` evalúa:
     ```typescript
     export function isGoogleOAuthEnabled(): boolean {
       return (
         flagFromEnv("VITE_AUTH_GOOGLE_ENABLED") ??
         flagFromEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED") ??
         false
       );
     }
     ```
   - Al no estar definidas explícitamente en el entorno de build o ejecución, ambas banderas resuelven a `false`.
   - En [`src/routes/auth.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/auth.tsx#L384), el componente `<SocialAuthButtons />` evalúa `if (!googleEnabled && !appleEnabled) return null;`, lo que causa que **el botón de Google no se renderice en la pantalla de bienvenida**.

2. **Verificación de Proveedor en Supabase Dashboard:**
   - El código cliente envía la petición a GoTrue (`/auth/v1/authorize?provider=google`).
   - Para que la redirección funcione en los entornos activos, la consola de Google Cloud y Supabase Auth deben tener registradas en su lista blanca (*Authorized Redirect URIs*):
     - `https://eatclean.yourmealos.com/auth/callback` (Producción)
     - `https://eatclean-staging.yourmealos.com/auth/callback` (Staging)
     - `http://localhost:5173/auth/callback` (Desarrollo local / E2E)

---

### 1.3. ¿Qué cambios técnicos específicos se requieren?

| Componente | Archivo / Ubicación | Cambio Propuesto | Impacto / Rationale |
|---|---|---|---|
| **Feature Flags** | `src/auth/features.ts` / Config de entorno | Habilitar `VITE_AUTH_GOOGLE_ENABLED=true` (o ajustar el valor por defecto si la política de la plataforma establece Google OAuth como método estándar de login para clientes). | Permite que `<SocialAuthButtons />` se renderice inmediatamente en `/auth` sin afectar otros proveedores. |
| **Diseño y UX Social** | `src/routes/auth.tsx` | Validar que el botón de Google mantenga la estética de la marca EatClean, con estado de carga interactivo (`Loader2`) durante la redirección. | Mejora la experiencia de usuario y evita clicks duplicados durante el handshake PKCE. |

---

### 1.4. Análisis de Casos Borde y Coexistencia de Identidades

1. **Usuario que se registra con Email/Password y luego hace Login con Google (mismo email):**
   - Supabase Auth vincula automáticamente las identidades en `auth.identities` cuando el email coincide y está verificado.
   - Si no está verificado, GoTrue devuelve `identities: []` (anti-enumeration), el cual ya está capturado en `src/routes/auth.tsx` (`emailAlreadyRegistered`).
2. **Usuarios OAuth sin contraseña:**
   - No requieren password para iniciar sesión.
   - Si acceden a `/reset-password`, pueden establecer una contraseña opcional para su cuenta sin perder el vínculo de Google.
3. **Persistencia tras Refresh:**
   - La sesión se mantiene en el almacenamiento local del navegador; el hook `useAuth()` recupera el usuario y el rol `customer` de forma síncrona/rehidratada sin expulsar al usuario a `/auth`.
4. **Logout:**
   - `supabase.auth.signOut()` invalida el token de sesión y el guard de rutas (`_authenticated/route.tsx`) redirige inmediatamente a `/auth`.

---

## 2. Plan de Pruebas y Matriz de Verificación para Gate 1

| Prueba | Descripción | Criterio de Aceptación |
|---|---|---|
| **T1.1: Renderizado Social** | Con la bandera activada, verificar que el botón "Continuar con Google" aparece en `/auth`. | Botón visible con icono oficial de Google y tipografía corporativa. |
| **T1.2: Handshake PKCE** | Click en botón Google dispara `signInWithOAuth('google')` hacia `eatclean.yourmealos.com/auth/callback`. | Generación de code_verifier y redirección a Google Accounts. |
| **T1.3: Callback & Redirección** | Retorno desde Google a `/auth/callback` con código PKCE válido. | `exchangeCodeForSession` exitoso y navegación hacia `/app`. |
| **T1.4: Materialización Cliente** | Comprobar que tras el login se crea el registro en `public.customers`. | Fila en `public.customers` con `tenant_id = 8bba00ba-331b-42c8-9283-4e3836ffb870`. |
| **T1.5: Persistencia & Refresh** | Recargar la página en `/app` o `/app/menu`. | La sesión se conserva intacta sin pantallas de splash o redirecciones no deseadas. |
| **T1.6: Logout Limpio** | Click en Cerrar sesión desde el perfil. | Sesión destruida en Supabase y aterrizaje seguro en `/auth`. |

---

## 3. Estado de Gobernanza y STRICT STOP

```text
CR-UX-CLIENT-01
══════════════════════════════════════════════════════════════════════
GATE 0 · Discovery & Architecture Audit     ✅ ACEPTADO
GATE 1 · Auth & Google OAuth Audit          ✅ AUDITORÍA COMPLETADA
GATE 2 · Registro Manual & Perfil Sintético 🔒 BLOQUEADO (STRICT STOP)
GATE 3 · Direcciones & Perfil Dietético     🔒 BLOQUEADO (STRICT STOP)
GATE 4 · Menú Semanal & Pedido E2E          🔒 BLOQUEADO (STRICT STOP)
GATE 5 · Centro de Operaciones Sync         🔒 BLOQUEADO (STRICT STOP)
GATE 6 · Modificación & Cancelación E2E     🔒 BLOQUEADO (STRICT STOP)
GATE 7 · RLS & Seguridad Multi-tenant       🔒 BLOQUEADO (STRICT STOP)
GATE 8 · Matriz de Tests & Evidencias       🔒 BLOQUEADO (STRICT STOP)
GATE 9 · Certificación Visual & Cierre      🔒 BLOQUEADO (STRICT STOP)
══════════════════════════════════════════════════════════════════════
```

> **STRICT STOP ACTIVO:**  
> Ninguna línea de código ha sido modificada todavía.  
> El sistema queda en reposo a la espera de la evaluación y autorización de la Autoridad Humana para el siguiente Gate.
