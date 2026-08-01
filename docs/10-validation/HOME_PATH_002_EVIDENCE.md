# HOME-PATH-002 · Evidence for ROLE_READY → HOME_PATH_RESOLVED

**Fecha:** 2026-08-01  
**Alcance:** Instrumentación del runner PS-002-C **solo** — no Auth · no navegación · no `resolvePostAdminLoginPath`  
**Hipótesis a confirmar:** `STOP reason: not_staff` tras `ROLE_READY`

---

## Por qué

Tras AUTH-PIPELINE-002, PS-002-C alcanza `ROLE_READY` y falla el siguiente paso canónico (`HOME_PATH_RESOLVED`). En `/auth/admin`, ese emit solo ocurre si `hasStaffAccess(roles)` es true (`enterOperationsCenter`).  
Los logs de consola de Playwright a menudo muestran `JSHandle@object` y no los `roles` / `reason`.

---

## Qué captura

`npm run test:ps002-canonical-auth` ahora:

1. Lee args de `console.info` vía `jsonValue()`  
2. Guarda `fcr008Events[]` (step + detail)  
3. Construye `home_path_gap` en la evidencia JSON:

| Campo | Contenido |
|-------|-----------|
| `role_ready.roles` / `userId` / `roleCount` | Payload `ROLE_READY` (+ `roleCount` de `MEMBERSHIP_READY` si existe) |
| `stop.reason` / `message` / `status` | Payload `STOP` |
| `diagnosis.is_not_staff` | `true` si `reason === "not_staff"` |
| `diagnosis.roles_at_role_ready` | Roles observados en el momento del gate |

Consola FAIL imprime un bloque `HOME-PATH-002 · …` legible.

Archivo: `docs/10-validation/platform-stabilization/evidence/ps002c-canonical-auth.json` → clave `home_path_gap`.

Código: `scripts/lib/ps002c-home-path-evidence.mjs` · wiring en `scripts/ps002-canonical-auth.mjs`.

---

## Cómo interpretar

| Evidencia | Conclusión |
|-----------|------------|
| `is_not_staff: true` + `roles: []` o solo customer | Asignar rol staff al usuario PS002 (no tocar pipeline) |
| `is_not_staff: false` + otro `stop_reason` | Investigar ese reason (no asumir home-path) |
| `ROLE_READY` sin `STOP` ni `HOME_PATH` | Captura incompleta o camino inesperado |

---

## Qué no cambia

- `post-login-pipeline.ts`  
- `enterOperationsCenter` / `resolvePostAdminLoginPath` / `homePathForRoles`  
- UI Auth
