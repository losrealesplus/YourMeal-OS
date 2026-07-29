# FCR-008 · Canonical Post-Login Session

**Documento:** `FCR008_CANONICAL_POST_LOGIN_SESSION.md`  
**Fecha:** 2026-07-29  
**Estado:** ✅ Implemented (código) · revalidación PS-002 auth real pendiente  
**Cierra:** [FCR-007](./FCR007_LOGIN_BLOCKER_INVESTIGATION.md) (causa raíz)  
**No reabre:** FCR-002 · Foundation · Identity · Core · FOPEBA

---

## Contrato

```text
Una autenticación correcta
    ↓
produce exactamente una sesión canónica  (data.session del auth API)
    ↓
bootstrap / home resolution
    ↓
navigate
    ↓
dashboard

sin relecturas inmediatas de getSession() tras el login
```

## Pregunta respondida

> ¿Cuál es la fuente canónica de la sesión inmediatamente después del login?

**Respuesta:** `data.session` (y si hace falta `data.user`) devuelto por `signInWithPassword` / `signUp` / `verifyOtpSms` — no un `await getSession()` inmediato.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/auth/post-login-pipeline.ts` | Helper + logs `[FCR-008]` |
| `src/routes/auth.tsx` | Sign-in / OTP / signup usan sesión canónica |
| `src/routes/auth.admin.tsx` | Submit Ops usa sesión canónica |
| `src/identity/supabase-identity-provider.tsx` | Comentario: **no** restaurar `getSession` de mount |

Cold start (`getSession` al montar `/auth` si ya hay sesión en storage) **sigue permitido** — no es la race post-`SIGNED_IN`.

## Pipeline de traza

```text
LOGIN_OK
CANONICAL_SESSION
BOOTSTRAP_START
HOME_PATH
NAVIGATE
(or STOP + reason)
```

Consola: prefijo `[FCR-008]`.

## Validación

| Chequeo | Estado |
|---------|--------|
| Unit `post-login-pipeline.spec.ts` | PASS |
| No `getSession` inmediato tras `signInWithPassword` en auth routes | ✅ |
| Identity Provider sin `getSession` de mount (FCR-002 intacto) | ✅ |
| PS-002 con auth Supabase real | ⏳ pendiente smoke humano / credenciales |

## Flow

```text
FLOW-01  ⏸ NO ABRIR hasta PS-002 real PASS
```
