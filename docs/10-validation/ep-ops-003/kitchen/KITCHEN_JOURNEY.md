# Kitchen Journey · KJ-01 → KJ-04

**Epic:** EP-OPS-003 · Kitchen Journey Certification  
**Workspace:** `/admin/kitchen` (+ `/admin/production-sheet` · `/admin/kitchen-execution`)  
**Actor certificado:** `kitchen` (cap `kitchen.operate`)  
**Outcome:** **Production Ready**  
**Fecha pasada:** 2026-07-28  
**Alcance:** Solo Kitchen — no Delivery · Support · Accounting  

```text
Demanda pendiente
        ↓
KJ-01 Recepción
        ↓
KJ-02 Preparación
        ↓
KJ-03 Producción
        ↓
KJ-04 Finalización → Production Ready (listo para Delivery)
```

Todo el recorrido se ejecuta en rutas Kitchen (`kitchen.operate`). No se abandona el Workspace Kitchen.

---

## KJ-01 · Recepción

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Órdenes de producción visibles | ✅ | `/admin/kitchen` · `OperationsService.listKitchenOrders` · statuses `confirmed \| in_production \| prepared` |
| Trabajo pendiente visible | ✅ | Cola kitchen + filtros fecha/empresa/site/grupo |
| Priorización / filtrado | ✅ | Filtros de cola |
| Estado inicial | ✅ | Timeline + labels ES (`operational-status.ts`) |

**Rutas:** `src/routes/_authenticated/admin.kitchen.tsx`  
**Servicio:** `src/modules/operations/application/operations-service.ts`

---

## KJ-02 · Preparación

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Acceso a hoja de prep por plato | ✅ | `/admin/production-sheet` |
| Cantidades / clientes | ✅ | Agrupa líneas kitchen-queue por plato |
| Ingredientes requeridos (rollup) | ⚠ | Sí si existen `dish_ingredients`; vacío honesto si no hay receta |
| Instrucciones de preparación | ⚠ | Campo DB `prep_instructions` **no** expuesto en UI Kitchen |
| Allergens / prep minutes | ✅ | En hoja y ejecución |

**Rutas:** `src/routes/_authenticated/admin.production-sheet.tsx`  
**Servicio:** `src/modules/operations/application/production-report-service.ts`  
**Obs:** ver [KITCHEN_OBSERVATIONS](./KITCHEN_OBSERVATIONS.md) · OBS-K-02

---

## KJ-03 · Producción

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Ejecución por lote plato×día | ✅ | `/admin/kitchen-execution` · `KitchenExecutionService.transitionBatch` |
| Actualización de estados (lote) | ✅ | `pending → preparing → plating → finished` |
| Actualización de estados (pedido) | ✅ | `confirmed → in_production → prepared` desde detalle Kitchen |
| Progreso visible | ✅ | Cards de lote + cola de pedidos |
| Incidencias operativas | ⚠ | Sin módulo de incidencia Kitchen dedicado; notas de pedido visibles |

**Rutas:** `src/routes/_authenticated/admin.kitchen-execution.tsx` · `admin.kitchen.tsx`  
**Dominio:** `kitchen-batch-status.ts` · `operational-status.ts`  
**Tests:** `kitchen-batch-status.spec.ts` · `operational-status.spec.ts` (PASS)

**Obs:** dos espinas (lote vs pedido) no sincronizadas automáticamente — OBS-K-01.

---

## KJ-04 · Finalización → Production Ready

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Lote marcado finished | ✅ | transitionBatch → `finished` |
| Pedido preparado | ✅ | → `prepared` |
| Disponible para Delivery | ✅ | `prepared → ready_for_delivery` (`transitionKitchen`) |
| Sale de cola Kitchen / entra cola Delivery | ✅ | `DELIVERY_QUEUE_STATUSES` incluye `ready_for_delivery` |
| Consistencia de estados | ⚠ | Handoff a Delivery es por **espina de pedido**, no auto desde lotes finished |

**Outcome demostrado (actor `kitchen`):**

```text
Production Ready  =  order.status = ready_for_delivery
                     ejecutado desde Kitchen Workspace
```

---

## Recorrido E2E certificado (actor kitchen)

```text
/admin/kitchen
  → ver cola (KJ-01)
  → /admin/production-sheet (KJ-02)
  → /admin/kitchen-execution (KJ-03 lotes)
  → /admin/kitchen detalle: confirmed → in_production → prepared → ready_for_delivery (KJ-03/04)
```

Sin salir de rutas con `kitchen.operate`.  
Sin tocar Identity · Auth · RBAC model · Entry · Delivery · Support · Accounting.

---

## Pregunta maestra

> ¿Puede Kitchen completar todo su trabajo operativo y entregar una producción lista para Delivery sin abandonar su Workspace?

**Sí** (actor `kitchen`) — con observaciones documentadas.

**Gate:** OBSERVATIONS · **Status:** CERTIFIED (con OBSERVATIONS) · **Outcome:** Production Ready
