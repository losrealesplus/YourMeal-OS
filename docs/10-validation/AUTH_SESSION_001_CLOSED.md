# AUTH-SESSION-001 · CLOSED

**Fecha cierre:** 2026-08-01  
**Estado:** **CLOSED** — no hay deadlock de `checkingSession`  
**Evidencia:** AUTH-SESSION-002 (`auth_session_002` en PS-002-C)

---

## Veredicto

El cold mount de `/auth/admin` **completa**. No hay promesa colgada.

| Medición | Valor |
|----------|-------|
| `getSession` | ~2 ms |
| `hung_step` / `pending` | `null` |
| `checkingSessionCleared` | `true` |
| `SUMMARY` | alcanzado |

“Cargando…” en el primer HTML es el **first paint** (`useState(true)`), no un deadlock.

AUTH-LAYOUT-001 permanece validado (`Centro de Operaciones` = `auth_.admin.tsx`).

---

## Separación de flujos (archivada)

| Flujo | Resultado |
|-------|-----------|
| A · Cold `checkingSession` | PASS (timings) |
| B · Login canónico FCR-008 | Avanza hasta `ROLE_READY` → `STOP not_staff` (datos) |

---

## Qué no implementar

- Timeouts / `Promise.race` en el effect  
- Cambios a Auth / FCR-008 por este hallazgo  

Siguiente foco: datos staff del usuario PS002 — ver [HOME_PATH_001_CLOSED](./HOME_PATH_001_CLOSED.md) · [AUTH_SESSION_002_COLD_TIMING](./AUTH_SESSION_002_COLD_TIMING.md)
