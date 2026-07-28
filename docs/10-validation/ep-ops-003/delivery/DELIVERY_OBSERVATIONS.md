# Delivery Observations & Risks

**Pasada:** EP-OPS-003 · Delivery Journey  
**Gate:** OBSERVATIONS  

---

## Observaciones

| ID | Sev | Hallazgo | Impacto en Gate | Acción |
|----|-----|----------|-----------------|--------|
| **OBS-D-01** | P1 | Dual surface: landing `/admin/delivery` vs hub `/admin/routes*` (FF nav `admin_module_routes` default OFF) | Outcome mínimo en landing; asignación/ruta en hub misma cap | SOP · no FAIL |
| **OBS-D-02** | P1 | `RouteService.setDriver` sin UI | Asignación conductor incompleta en producto | Mejora futura · no bloquea `delivered` |
| **OBS-D-03** | P1 | `markStopDelivered` ≠ `order.delivered` | Desync posible stop↔pedido | Usar transition/attempt para Outcome |
| **OBS-D-04** | P1 | `/driver` PlaceholderPanel | Actor conductor no certifica este Journey | Driver fuera del Gate · arquitectura deferred |
| **OBS-D-05** | P2 | Pedidos `delivered` salen de cola Delivery | Confirmación post-facto vía timeline/orders | Esperado |
| **OBS-D-06** | P3 | Filtro “Ruta” en landing stub | Cosmético | — |
| **OBS-D-07** | P3 | Label `delivery.orchestrate` display-only | No es capability real | — |

---

## Continuidad / Flow Gaps (→ Bloque G)

| ID | Descripción |
|----|-------------|
| FG-K-D-01 | Post-handoff: ¿Delivery ve siempre el pedido Kitchen `ready_for_delivery` de forma completa? (cerrado en código de cola; validar en campo multi-tenant) |
| FG-D-S-01 | Tras `Orders Delivered`, ¿Support puede abrir incidencia sobre pedido entregado? → Input Support |

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Operar solo stops sin transition | SOP: Outcome = status `delivered` |
| Confundir actor driver con Gate Delivery Ops | Matriz de actores |
| FF oculta Routes | Cap + URL directa; documentar |

---

## Decisión

Hallazgos **no** impiden a `delivery`/`logistics` alcanzar **Orders Delivered** consumiendo **Production Ready**.  
Gate = **OBSERVATIONS** (mismo patrón FOPEBA que Kitchen).
