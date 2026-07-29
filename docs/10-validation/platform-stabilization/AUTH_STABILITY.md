# Platform Stabilization · Auth Stability

**Documento:** `AUTH_STABILITY.md`  
**Fase:** Platform Stabilization v1  
**Fecha:** 2026-07-29  
**Restricción:** No rediseñar Auth / Identity / RBAC / Membership.

---

## Problema

Riesgo de doble carga de sesión al montar (flash / loading duplicado) y refrescos innecesarios.

## Pre-check

| Ítem | Clasificación |
|------|----------------|
| Dual `getSession` + `onAuthStateChange` → doble `setSession` | **VALID** |
| `router.invalidate` en TOKEN_REFRESHED (root) | **STALE** — root ya filtra; solo SIGNED_IN / OUT / USER_UPDATED |
| Rediseño de Auth | ❌ Fuera de alcance |

## Causa

`SupabaseIdentityProvider` suscribía `onAuthStateChange` **y** llamaba `getSession()` en paralelo → dos actualizaciones de sesión en el mount.

## Corrección

`src/identity/supabase-identity-provider.tsx`: una sola fuente — `onAuthStateChange` (incluye `INITIAL_SESSION`) pone `session` y `loading=false`.

## Evidencia

| Chequeo | Resultado |
|---------|-----------|
| Un solo camino de setSession en mount | ✅ |
| Root no invalida en TOKEN_REFRESHED | ✅ (ya existente) |
| Realtime RBAC → invalidate solo al cambiar roles | ✅ (sin cambio de contrato) |

## Resultado

Auth mount path estabilizado sin tocar el contrato Identity.  
Validación E2E login/logout/refresh: ⏳ pendiente smoke.
