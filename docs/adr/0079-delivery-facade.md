# ADR 0079 — Delivery Facade

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-006 · Phase 2 (Implement Facade)  
**Depends on:** [ADR 0078](./0078-delivery-capability.md) · Kitchen [0071](./0071-kitchen-execution-facade.md) · Order [0063](./0063-order-facade.md)  
**Detalle:** [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md) · `src/delivery/`

## Contexto

Delivery Architecture (ADR 0078) congeló la segunda capability de **Operational Execution**. Kitchen y Orders están Engineering Certified + Demo. Se adopta el patrón institucional Facade-over-Facade.

Delivery no conduce. Delivery no cocina. Delivery no factura. Delivery orquesta cumplimiento consumiendo Facades.

## Decisión

1. Implementar `DeliveryFacade` + `useDelivery` + Commands / Queries en `src/delivery/`.  
2. Lenguaje: `DeliveryAssignment` · `DeliveryRoute` · `DeliveryStop` · `DeliveryConfirmation` · `DeliveryStatus` · `DeliveryContext`.  
3. Commands: `AssignDelivery` · `StartDelivery` · `ConfirmDelivery` · `ReportDeliveryException` · `CloseDelivery`.  
4. Queries: `GetDeliveryContext` · `GetDeliveryAssignments` · `GetDeliveryRoutes` · `GetDeliveryStops` · `GetCompletedDeliveries`.  
5. **Componer `OrderFacade` + `KitchenExecutionFacade`** — nunca storage, nunca GPS, nunca Billing, nunca ProductionFacade directo.  
6. `ConfirmDelivery` → `OrderFacade.completeDelivery`.  
7. Queue / context / stops / completed → `OrderFacade.getOrdersReadyForDelivery` / `searchOrders` (+ Kitchen completed touch).  
8. `AssignDelivery` · `StartDelivery` · `ReportDeliveryException` · `CloseDelivery` · `GetDeliveryRoutes` → `UNIMPLEMENTED` (gaps visibles).  
9. LAW 001–007 aplican. Phase 2 = Facade only (sin UI / CRUD / DB / FLOW-002).  
10. Actualizar Capability Registry a madurez **Facade**.

### Command → substrate map

| Command / Query | Substrate |
|-----------------|-----------|
| ConfirmDelivery | `OrderFacade.completeDelivery` |
| GetDeliveryContext / Assignments / Stops | `OrderFacade.getOrdersReadyForDelivery` → map Assignment |
| GetCompletedDeliveries | `OrderFacade.searchOrders(delivered)` + `KitchenExecutionFacade.getCompletedExecution` |
| Assign / Start / Exception / Close / GetDeliveryRoutes | UNIMPLEMENTED |

## Consecuencias

- FLOW-002 puede diseñarse sobre `DeliveryFacade` cuando se abra Harness.  
- Gaps de assign/start/routes quedan visibles — no se inventan workflows.  
- Billing sigue esperando Delivery Certification + Demo preferidos.  
- Diccionario de lenguaje operativo refuerza LAW 006.

## Referencias

- Código: `src/delivery/DeliveryFacade.ts` · `useDelivery.ts`  
- [OPERATIONAL_EXPANSION](../00-status/OPERATIONAL_EXPANSION.md) · [OPERATIONAL_LANGUAGE_DICTIONARY](../00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md) · LAW 001–007
