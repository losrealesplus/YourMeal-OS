# BUGFIX-001 · Admin Auth Deadlock on Platform Owner Bootstrap Failure

**Fecha:** 2026-07-26  
**Branch:** `cursor/bugfix-001-admin-auth-deadlock-f54a`  
**Ruta afectada:** `/auth/admin`  
**Severidad:** Alta (UI deadlock → “Loading…” infinito)

---

## 1. Problema

En `AdminAuthPage`, el `useEffect` de sesión llamaba:

```text
getSession → enterOperationsCenter → ensurePlatformOwnerSession → RPC
```

Si `ensurePlatformOwnerSession()` (u otra etapa) **lanzaba**, el error no se capturaba → `checkingSession` quedaba `true` → pantalla bloqueada en `common:loading`.

Afecta a **cualquier** sesión autenticada en `/auth/admin`, no solo Platform Owners.

---

## 2. Fix (solo consumidor)

| Cambio | Detalle |
|--------|---------|
| `src/routes/auth.admin.tsx` | `try/catch/finally` · siempre `checkingSession=false` · UI error + Reintentar |
| `src/lib/admin-auth-bootstrap.ts` | Clasificación de errores · telemetría · `enterOperationsCenter` testeable |
| i18n `auth.*` | Mensajes por tipo (network / rpc / auth / session / forbidden / unexpected) |
| Tests | `src/lib/admin-auth-bootstrap.spec.ts` |

**No modificado:** `src/lib/ensure-platform-owner-session.ts` (sigue lanzando).

---

## 3. Seguridad (sin bypass)

| Garantía | Evidencia |
|----------|-----------|
| Fallo de ensure ≠ éxito | `catch` no navega a `/admin` |
| No se inventan roles | `loadRoles` solo tras ensure OK |
| No fallback Platform Owner | ensure intacto; excepciones se propagan desde el core |
| `not_staff` sin ensure error | sigue mostrando switch account |

---

## 4. Clasificación de errores

| Kind | Ejemplo | UI |
|------|---------|-----|
| `network` | Failed to fetch / timeout | Mensaje + Reintentar |
| `rpc_missing` | function ensure_platform_owner_session / migration | Mensaje + Reintentar |
| `auth` | bootstrap auth failure | Toast (submit) / panel (effect) |
| `session` | session missing / JWT | Mensaje + Reintentar |
| `forbidden` | permission denied | Mensaje + Reintentar |
| `unexpected` | resto | Mensaje + Reintentar |

Sin stack traces en UI. Telemetría: `console.error` + `reportLovableError` con `kind`, `route`, `userId`, timestamp — sin secretos.

---

## 5. Evidencia tests

```bash
npm test -- src/lib/admin-auth-bootstrap.spec.ts
```

Contrato de loading: en RPC OK, RPC throw, auth failure, timeout, not_staff, migration missing → **`checkingSession === false`**.

Ensure exceptions **siguen rechazando** `enterOperationsCenter` (no swallow).

---

## 6. Criterio de éxito

| Criterio | Estado |
|----------|--------|
| UI nunca bloqueada en Loading… | ✅ finally siempre libera |
| Errores presentados + Reintentar | ✅ |
| Seguridad idéntica (no bypass) | ✅ |
| `ensurePlatformOwnerSession` sin cambios | ✅ |
| Tests de regresión | ✅ |

**Veredicto:** PASS (código).
