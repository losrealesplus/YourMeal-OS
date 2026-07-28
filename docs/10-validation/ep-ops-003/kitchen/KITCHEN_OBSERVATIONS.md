# Kitchen Observations & Risks

**Pasada:** EP-OPS-003 · Kitchen Journey  
**Gate:** OBSERVATIONS  

---

## Observaciones

| ID | Sev | Hallazgo | Impacto en Gate | Acción |
|----|-----|----------|-----------------|--------|
| **OBS-K-01** | P1 | Dual spine: lotes (`kitchen_production_batches`) vs pedidos (`operational status`) no se sincronizan. `finished` en lote ≠ `ready_for_delivery`. | No bloquea: handoff Delivery se hace en detalle Kitchen sobre el **pedido**. | Documentar SOP: cerrar pedido → Delivery. Flow Gap candidato si se exige sync automática. |
| **OBS-K-02** | P1 | `dishes.prep_instructions` existe en DB pero no se muestra en production-sheet / execution. | Prep usable vía nombre · qty · ingredientes · allergens · minutes; falta texto de método. | No inventar UI en cert. Mejora futura / corrección post-gate si se exige. |
| **OBS-K-03** | P1* | Rol `production` no tiene `kitchen.operate`; no puede completar Kitchen Journey. | **Fuera del actor certificado.** Actor de esta pasada = `kitchen`. | Clarificar matriz: Kitchen Journey actor = `kitchen` (+ ops/admin). `production` = hub Production separado. |
| **OBS-K-04** | P2 | Sin validación de stock/ingredientes insuficientes en Kitchen. | N/A si inventario no está en alcance piloto Kitchen. | Inventory journey / otro epic. |
| **OBS-K-05** | P2 | Líneas con personalización excluidas de totales/acciones de lote estándar. | Lotes estándar OK; customs requieren atención en cola de pedidos. | Documentar; no FAIL. |
| **OBS-K-06** | P3 | “Descargar PDF” = `window.print()`. | Cosmético. | — |

\* Sev relativa al pack “kitchen/production actors”; no es P0 del actor `kitchen`.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Cocinero marca lotes finished y olvida `ready_for_delivery` | UX/SOP · candidato Flow/Journey improvement |
| Confundir rol `production` con Kitchen Workspace | Matriz de actores en epic |
| Exigir prep_instructions para PASS limpio | Futura corrección · no reabrir Entry |

---

## Flow Gap candidatos (→ Bloque G)

| ID | Descripción |
|----|-------------|
| FG-K-D-01 | Tras `ready_for_delivery`, ¿Delivery ve el pedido de forma inmediata y completa? (certificar en Delivery pack / Flow) |
| FG-K-D-02 | ¿Hace falta correlación lote finished ↔ pedidos listos? |

---

## Decisión

Hallazgos **no** impiden al actor `kitchen` alcanzar **Production Ready** dentro del Workspace.  
Por eso Gate = **OBSERVATIONS**, no FAIL ni PASS limpio.
