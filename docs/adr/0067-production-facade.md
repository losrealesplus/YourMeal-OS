# ADR 0067 — Production Facade

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-004 · Phase 2 (Implement Facade)  
**Depends on:** [ADR 0066](./0066-production-capability.md) · Orders [0063](./0063-order-facade.md)  
**Detalle:** [PRODUCTION_CAPABILITY](../05-architecture/PRODUCTION_CAPABILITY.md) · `src/production/`

## Contexto

Production Capability congeló la planificación que transforma Orders en trabajo. Orders está Engineering Certified + Demo. Production es la primera **Operational Execution Capability**: el Facade debe hablar **trabajo**, no pedidos.

## Decisión

1. Implementar `ProductionFacade` + `useProduction` + Commands / Queries en `src/production/`.  
2. Lenguaje de trabajo: `GenerateProductionPlan` · `RecalculateLoad` · `MarkBatchReady` · `CloseBatch` — **nunca** GetOrders / UpdateOrder / CreateOrder.  
3. **Componer** `ProductionReportService` · `KitchenExecutionService` · `OrderFacade` (calendar) — sin reescribir planning.  
4. `GenerateProductionBatch` · `AssignBatch` · `RescheduleBatch` · Optimize/Balance/GenerateKitchenQueue → `UNIMPLEMENTED`.  
5. `GetProductionCapacity` → `UNIMPLEMENTED` (no capacity engine yet).  
6. Production **never manipulates Orders directly**; calendar days come from OrderFacade commitments.  
7. Kitchen / Delivery / Billing must consume `ProductionFacade` for planning facts.  
8. Sin UI / CRUD / routing / DB / workflow invention en esta fase.  
9. Añadir columna **Consumida por** al Capability Registry (dependency map).

### Command → substrate map

| Command | Substrate |
|---------|-----------|
| GenerateProductionPlan | `ProductionReportService.buildForDay` |
| RecalculateLoad | re-derive from day board |
| MarkBatchReady | `KitchenExecutionService.transitionBatch(preparing)` |
| CloseBatch | `transitionBatch(finished)` |
| Assign / Reschedule / GenerateBatch | UNIMPLEMENTED |
| GetProductionCalendar | `OrderFacade.getOperationalCalendar` |

## Consecuencias

- Kitchen deja de inventar “qué hay que hacer hoy” desde raw Orders (regla canónica).  
- Gaps de capacity / assign / reschedule quedan visibles.  
- Validate → Demo siguen el patrón; **no abrir Kitchen Capability** hasta cerrar el ciclo Production.

## Referencias

- Código: `src/production/ProductionFacade.ts` · `useProduction.ts`  
- [OPERATIONAL_ENGINE](../00-status/OPERATIONAL_ENGINE.md) · LAW 001–004
