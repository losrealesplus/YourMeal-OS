# CHECK-IT 04 · RBAC Hardening

**ID:** CHECK-IT 04  
**Resultado:** ✅ **PASS**  
**Fecha:** 2026-07-24  
**Ámbito:** RI-001 · Seguridad operacional  
**Spec:** [RBAC_HARDENING_RI-001](./RBAC_HARDENING_RI-001.md)  
**Canon:** [OCM-001 §2](./EATCLEAN_OPERATIONAL_STRUCTURE.md#2--matriz-de-acceso-rbac)

---

## Objetivo

Demostrar que el acceso a módulos del Centro de Operaciones no depende solo de ocultar el menú: URL directa, capabilities y refresh de roles están enforzados.

---

## Criterios · PASS

| Criterio | Estado |
|----------|:------:|
| `assertCapabilityFromContext()` en rutas `/admin/*` protegidas | ✅ |
| Exposición por URL bloqueada (`beforeLoad` → redirect) | ✅ |
| Roles actualizados en tiempo real (`postgres_changes` · `user_roles`) | ✅ |
| Workspace Driver con home-path correcto (`/driver`) | ✅ |
| Alineación OCM-001 (parcial 🟡 / sin acceso —) | ✅ |

---

## Evidencia de implementación (`main`)

- `src/permissions/route-guards.ts` → `assertCapabilityFromContext`  
- Rutas admin con guard de capability  
- `src/hooks/use-auth.ts` → suscripción `postgres_changes` a `user_roles`  
- `src/lib/home-path.ts` → staff / saas / driver / customer  

---

## Nota

PASS de CHECK-IT 04 cierra el **hardening de implementación**.  
La **evidencia formal de revocación** (sesión real documentada) sigue siendo ítem del Certification Sprint / CHECK-IT 05.
