# Kitchen Negative Cases

**Pasada:** EP-OPS-003 · Kitchen Journey  
**Fecha:** 2026-07-28  

Comportamiento observado en código / guards (sin inventar datos).

---

| ID | Caso | Esperado | Observado | Resultado |
|----|------|----------|-----------|:---------:|
| KN-01 | Usuario sin `kitchen.operate` → `/admin/kitchen` | Denegado / redirect | `assertCapabilityFromContext(context, "kitchen.operate")` → redirect `/admin` | ✅ |
| KN-02 | Usuario sin `kitchen.operate` → `/admin/kitchen-execution` | Denegado | Mismo guard | ✅ |
| KN-03 | Usuario sin `kitchen.operate` → `/admin/production-sheet` | Denegado | Mismo guard | ✅ |
| KN-04 | Customer / no-staff → Tenant Kitchen | No entra Tenant | `assertStaffRoute` → `/app` | ✅ |
| KN-05 | Acceso Platform `/saas` desde sesión kitchen | Denegado | `assertSaasRoute` sin `saas.manage` → `/admin` | ✅ |
| KN-06 | Producción incompleta (pedido `in_production`) | No handoff Delivery aún | `nextKitchenStatuses`: solo `prepared` puede → `ready_for_delivery` | ✅ |
| KN-07 | Pedido `cancelled` | Fuera de cola kitchen | Cola = `confirmed \| in_production \| prepared` | ✅ |
| KN-08 | Transición Kitchen ilegal | Rechazada | `nextKitchenStatuses` vacío / DomainError en service | ✅ (tests dominio) |
| KN-09 | Receta / ingredientes inexistentes en hoja | Empty state honesto | Production sheet sin rollup simulado | ✅ |
| KN-10 | Receta con `prep_instructions` en DB | Idealmente visible en prep | **No expuesto en UI Kitchen** | ⚠ OBS-K-02 |
| KN-11 | Ingredientes insuficientes (stock) | Si aplica, aviso | **No hay control de stock en Kitchen Journey** | ⚠ OBS-K-04 (fuera / N/A piloto) |
| KN-12 | Pedido cancelado durante producción | Sale del flujo kitchen | Status `cancelled` no en KITCHEN_QUEUE | ✅ |
| KN-13 | Rol `production` (solo `production.operate`) → Kitchen landing | ¿Puede operar? | **No** — services requieren `kitchen.operate` | ⚠ OBS-K-03 (actor fuera del Gate kitchen) |

---

## Evidencia de código

- Guards: `src/routes/_authenticated/admin.kitchen.tsx` · `admin.kitchen-execution.tsx` · `admin.production-sheet.tsx`
- Transiciones: `src/modules/operations/domain/operational-status.ts` · `*.spec.ts`
- Caps: `src/permissions/index.ts` (`kitchen` tiene `kitchen.operate`; `production` no)

---

## Conclusión negativos

Negativos de **permiso y límites de Workspace** PASS.  
Negativos de **stock / prep_instructions UI** documentados como observaciones — no bloquean Production Ready vía espina de pedido.
