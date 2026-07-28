# Delivery Journey · DJ-01 → DJ-06

**Epic:** EP-OPS-003 · Delivery Journey Certification  
**Metodología:** FROZEN — [acta](../../../../00-status/EP_OPS_003_METHODOLOGY_FROZEN.md)  
**Workspace:** `/admin/delivery` (+ `/admin/routes*` bajo `logistics.operate`)  
**Actor certificado:** `delivery` / `logistics` (cap `logistics.operate`)  
**Input (continuidad):** **Production Ready** (Kitchen CERTIFIED · OBSERVATIONS)  
**Outcome:** **Orders Delivered**  
**Fecha pasada:** 2026-07-28  

```text
Kitchen Outcome: Production Ready  (= ready_for_delivery)
        ↓
DJ-01 … DJ-06  (Delivery Workspace / Ops logistics)
        ↓
Outcome: Orders Delivered  (= delivered)
```

No se re-certifica Kitchen. Delivery **consume** Production Ready.

---

## Continuidad Input

| Contrato | Evidencia |
|----------|-----------|
| Kitchen deja pedidos en `ready_for_delivery` | Kitchen KJ-04 · `transitionKitchen` |
| Delivery lista esos pedidos | `OperationsService.listDeliveryOrders` · `DELIVERY_QUEUE_STATUSES` |

---

## DJ-01 · Pedidos preparados

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Ve cola Production Ready | ✅ | `/admin/delivery` · statuses `ready_for_delivery \| out_for_delivery \| delivery_issue` |
| Empty state honesto | ✅ | Sin mocks · banner bootstrap si demand=0 |
| No reabre Kitchen | ✅ | Solo lectura de pedidos ya handoff |

**Ruta:** `src/routes/_authenticated/admin.delivery.tsx`  
**Servicio:** `src/modules/operations/application/operations-service.ts`

---

## DJ-02 · Asignación

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Pedido → stop/ruta | ✅ | `/admin/routes/stops` · `RouteService.addStop` (candidatos `ready_for_delivery`) |
| Conductor → ruta | ⚠ | `RouteService.setDriver` existe · **sin UI** que lo invoque |
| Desde landing Delivery | ⚠ | Landing no asigna; hub Routes sí (misma cap) |

**Obs:** OBS-D-01 · OBS-D-02

---

## DJ-03 · Ruta

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Crear / gestionar ruta | ✅ | `/admin/routes` · `planned → in_progress → completed` |
| Nav Routes | ⚠ | FF `admin_module_routes` (default OFF) oculta nav; URL directa OK con cap |
| Optimización GPS | — | Fuera de alcance (documentado producto) |

**Obs:** OBS-D-01 (dual surface landing vs hub)

---

## DJ-04 · Entrega

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| `ready_for_delivery → out_for_delivery` | ✅ | `transitionDelivery` · landing y hub |
| Espina hasta terminal | ✅ | `out_for_delivery → delivered \| delivery_issue` |
| Attempt path | ✅ | `/admin/routes/attempt` · `DeliveryService.recordAttempt` |

**Dominio:** `operational-status.ts` · `DELIVERY_TRANSITIONS`  
**Tests:** `operational-status.spec.ts` PASS

---

## DJ-05 · Confirmación

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Confirmar entregado | ✅ | transition / recordAttempt → `delivered` |
| Incidencia + nota | ✅ | `delivery_issue` + retry |
| Audit intento | ✅ | `delivery_attempt` audit |
| Stop stamp vs order | ⚠ | `markStopDelivered` puede desync stop↔order si se usa solo stops | 

**Obs:** OBS-D-03

---

## DJ-06 · Cierre

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Pedido terminal `delivered` | ✅ | Sale de cola Delivery |
| Ruta `completed` | ✅ | Hub routes |
| Ritual day-close | ⚠ | No existe cierre de jornada dedicado | 

**Outcome demostrado (actor logistics):**

```text
Orders Delivered  =  order.status = delivered
                     ejecutado desde superficies Delivery/Ops
                     sin abandonar logistics.operate / sin Kitchen
```

---

## Recorrido E2E mínimo certificado

```text
Input: ready_for_delivery (Production Ready)
  → /admin/delivery
  → out_for_delivery → delivered
Outcome: Orders Delivered
```

Camino ampliado (asignación/ruta): mismas caps vía `/admin/routes*`.

**Actor `driver` / `/driver`:** placeholder — **no** actor de este Gate (OBS-D-04).

---

## Pregunta maestra

> ¿Puede Delivery, partiendo de Production Ready, completar el reparto y producir Orders Delivered sin abandonar su Workspace?

**Sí** (actor `delivery` / `logistics`) — con observaciones documentadas.

**Gate:** OBSERVATIONS · **Status:** CERTIFIED · **Outcome:** Orders Delivered
