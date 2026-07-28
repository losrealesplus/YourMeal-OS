# Delivery Negative Cases

**Pasada:** EP-OPS-003 · Delivery Journey  
**Fecha:** 2026-07-28  

---

| ID | Caso | Esperado | Observado | Resultado |
|----|------|----------|-----------|:---------:|
| DN-01 | Sin `logistics.operate` → `/admin/delivery` | Denegado | `assertCapabilityFromContext` | ✅ |
| DN-02 | Kitchen-only → Delivery deep link | Denegado | Sin cap logistics | ✅ |
| DN-03 | Customer → `/admin/delivery` | Redirect `/app` | `assertStaffRoute` | ✅ |
| DN-04 | Transición ilegal (p.ej. `confirmed` → `delivered`) | Rechazada | `nextDeliveryStatuses` + DomainError/RPC | ✅ |
| DN-05 | Cola vacía (sin Production Ready) | Empty honesto | Empty UI · bootstrap gate writes | ✅ |
| DN-06 | Intento desde status no Delivery | Rechazado | `recordAttempt` INVALID_STATE | ✅ |
| DN-07 | Incidencia sin nota (si UI exige) | Validación | Attempt UI requiere nota en issue | ✅ |
| DN-08 | Actor `driver` completa Ops journey | No (deferred) | `/driver` PlaceholderPanel | ⚠ OBS-D-04 |
| DN-09 | Platform `/saas` desde logistics | Denegado | `assertSaasRoute` | ✅ |
| DN-10 | Solo marcar stop delivered | Pedido puede quedar no `delivered` | `markStopDelivered` no fuerza order status | ⚠ OBS-D-03 |

---

## Evidencia

- Guards: `admin.delivery.tsx` · `admin.routes*.tsx` · `route-guards.ts`
- Transiciones: `operational-status.ts` · `operations-service.ts` · `delivery-service.ts`
- Caps: `permissions/index.ts` (`delivery` / `logistics` → `logistics.operate`)

---

## Conclusión

Negativos de permiso y transiciones ilegales **PASS**.  
Driver stub y desync stop/order = observaciones — no bloquean Outcome vía status spine en `/admin/delivery`.
