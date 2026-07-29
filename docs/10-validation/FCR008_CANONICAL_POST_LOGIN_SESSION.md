# FCR-008 · Canonical Post-Login Session

**Documento:** `FCR008_CANONICAL_POST_LOGIN_SESSION.md`  
**Fecha:** 2026-07-29  
**Estado:** ✅ Implemented (código + validador PS-002) · **PS-002-C Auth real ⏳ PENDING**  
**Cierra:** [FCR-007](./FCR007_LOGIN_BLOCKER_INVESTIGATION.md) (causa raíz)  
**No reabre:** FCR-002 · Foundation · Identity · Core · FOPEBA

---

## Contrato

```text
signInWithPassword / signUp / verifyOtp
    ↓
data.session  (CANONICAL_SESSION)
    ↓
Bootstrap
    ↓
Identity → Profile → Membership → Role
    ↓
Home path resolved
    ↓
Navigate
    ↓
Dashboard rendered

sin relecturas inmediatas de getSession() tras el login
```

## Pregunta respondida

> ¿Cuál es la fuente canónica de la sesión inmediatamente después del login?

**Respuesta:** `data.session` (y si hace falta `data.user`) del auth API — no un `await getSession()` inmediato.

## Pipeline de traza (PS-002-C)

```text
LOGIN
LOGIN_OK
CANONICAL_SESSION
BOOTSTRAP_START
IDENTITY_READY
PROFILE_READY
MEMBERSHIP_READY
ROLE_READY
HOME_PATH_RESOLVED
NAVIGATE
DASHBOARD_RENDERED
(or STOP + reason)
```

Consola: `[FCR-008]` · cada paso **exactamente una vez**.  
Validador: `validateCanonicalPipeline(observed)` · tabla de fallo: `formatPipelineComparisonTable`.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/auth/post-login-pipeline.ts` | Contrato, tracer, validador once-only |
| `src/auth/post-login-pipeline.spec.ts` | Unit PASS + casos FAIL |
| `src/routes/auth.tsx` / `auth.admin.tsx` | `beginPostLoginPipeline` + sesión canónica |
| `src/lib/resolve-home-path.ts` | Emite IDENTITY…HOME_PATH_RESOLVED si pipeline activo |
| `src/lib/admin-auth-bootstrap.ts` | Ídem en `enterOperationsCenter` |
| `docs/10-validation/platform-stabilization/PS-002.md` | Canonical Session Validation |

Cold start (`getSession` al montar `/auth`) **sigue permitido**.

## Validación

| Chequeo | Estado |
|---------|--------|
| Unit pipeline + `validateCanonicalPipeline` | PASS |
| No `getSession` inmediato tras login en auth routes | ✅ |
| Identity Provider sin `getSession` de mount | ✅ |
| PS-002-C Auth Supabase real | ⏳ pendiente |

## Flow

```text
PRIORIDAD: PS-002-C PASS (Auth real + evidencia)
  → entonces resolver/rebase docs (#98 vs tip)
  → entonces FLOW-01 Specification

HOLD ahora:
  merge #98 · FLOW-01 · “parece que login funciona”
```

Runner: `npm run test:ps002-canonical-auth` · ver [PRIORITY_PS002C_BEFORE_FLOW](./PRIORITY_PS002C_BEFORE_FLOW.md)
