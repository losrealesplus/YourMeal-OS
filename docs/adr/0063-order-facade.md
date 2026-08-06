# ADR 0063 — Order Facade

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-003 · Phase 2 (Implement Facade)  
**Depends on:** [ADR 0062](./0062-order-capability.md) · Intake [0017](./0017-order-intake.md)  
**Detalle:** [ORDER_CAPABILITY](../05-architecture/ORDER_CAPABILITY.md) · `src/order/`

## Contexto

Order Capability congeló el compromiso operativo semanal. Customer Workspace demostró LAW 003. Order es la primera **Operational Process Capability**: el Facade debe hablar procesos EatClean, no CRUD.

## Decisión

1. Implementar `OrderFacade` + `useOrder` + Commands / Queries en `src/order/`.  
2. Lenguaje de proceso: `PlanWeeklyOrder` · `ConfirmOrder` · `ScheduleProduction` · `ReadyForKitchen` · `ReadyForDelivery` · `CompleteDelivery` · `CloseOrder` · `CancelOrder`.  
3. **Componer** `OrderIntakeService` · `OrderService` · `OperationsService` — sin reescribir workflows.  
4. Queries: Get / Search / ByWeek / ByCustomer / ByDeliveryDay / PendingProduction / ReadyForDelivery / KitchenQueue / OperationalCalendar.  
5. `CloseOrder` · `CancelOrder` · DuplicateWeek/Clone/Split/Merge → `UNIMPLEMENTED` (intención congelada).  
6. UI nunca importa Supabase / repos (LAW 002–004).  
7. Introducir **Capability Type** en el Registry (Context · Business Entity · Operational Process · Execution · Outcome).

### Process → substrate map

| Command | Substrate |
|---------|-----------|
| PlanWeeklyOrder | `OrderIntakeService.intakeDraft` |
| ConfirmOrder | `OrderService.confirm` |
| ScheduleProduction | `OperationsService.startProduction` |
| ReadyForKitchen | `OperationsService.completeProduction` |
| ReadyForDelivery | `transitionKitchen(ready_for_delivery)` |
| CompleteDelivery | `transitionDelivery` (out → delivered) |
| CloseOrder / CancelOrder | UNIMPLEMENTED |

## Consecuencias

- Production / Kitchen / Delivery / Billing screens consumen solo `OrderFacade`.  
- Gaps de cancel/close quedan visibles.  
- Capability Demo (Order Workspace) puede venir tras Validate.

## Referencias

- Código: `src/order/OrderFacade.ts` · `OrderCommands.ts` · `OrderQueries.ts` · `useOrder.ts`  
- [GITHUB_HOUSEKEEPING](../00-status/GITHUB_HOUSEKEEPING.md)
