# ADR 0071 — Kitchen Execution Facade

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-005 · Phase 2 (Implement Facade)  
**Depends on:** [ADR 0070](./0070-kitchen-execution-capability.md) · Production [0067](./0067-production-facade.md)  
**Detalle:** [KITCHEN_EXECUTION_CAPABILITY](../05-architecture/KITCHEN_EXECUTION_CAPABILITY.md) · `src/kitchen/`

## Contexto

Kitchen Execution Architecture (ADR 0070) congeló la primera capability de **Operational Execution**. Production está Engineering Certified + Demo. LAW 005 y el Operational Model están permanentes. Se adopta **LAW 006** (una pregunta canónica por Capability) y el vocabulario **ExecutionUnit** (no KitchenBatch).

Kitchen no cocina. Kitchen no planifica. Kitchen orquesta ejecución consumiendo Production.

## Decisión

1. Implementar `KitchenExecutionFacade` + `useKitchenExecution` + Commands / Queries en `src/kitchen/`.  
2. Lenguaje de ejecución: `ExecutionUnit` · `ExecutionQueue` · `ExecutionProgress` · `ExecutionOperator` · `ExecutionStatus`.  
3. Commands: `StartExecution` · `PauseExecution` · `ResumeExecution` · `CompleteExecution` · `BlockExecution` · `AssignOperator` · `ReassignOperator` · `MarkExecutionReady`.  
4. Queries: `GetExecutionQueue` · `GetExecutionUnits` · `GetExecutionProgress` · `GetOperatorAssignments` · `GetBlockedExecution` · `GetCompletedExecution`.  
5. **Componer solo `ProductionFacade`** — nunca OrderFacade, nunca storage, nunca planificar.  
6. `MarkExecutionReady` → `ProductionFacade.markBatchReady`.  
7. `CompleteExecution` → `ProductionFacade.closeBatch`.  
8. `StartExecution` · Pause · Resume · Block · Assign · Reassign · `GetOperatorAssignments` → `UNIMPLEMENTED` (gaps visibles).  
9. LAW 001–006 aplican. Phase 2 = Facade only (sin UI / CRUD / DB / routing).  
10. Declarar marco **Engine Completion** en el tablero oficial.

### Command → substrate map

| Command | Substrate |
|---------|-----------|
| MarkExecutionReady | `ProductionFacade.markBatchReady` |
| CompleteExecution | `ProductionFacade.closeBatch` |
| GetExecutionQueue / Units / Progress / Blocked / Completed | `ProductionFacade.getProductionPlan` → map to ExecutionUnit |
| Start / Pause / Resume / Block / Assign / Reassign | UNIMPLEMENTED |
| GetOperatorAssignments | UNIMPLEMENTED |

## Consecuencias

- Delivery consume Kitchen Execution Facade para hechos de ejecución (regla canónica).  
- Gaps de pause/assign quedan visibles — no se inventan workflows.  
- Validate → Demo siguen el ritmo; no abrir Delivery hasta cerrar el ciclo Kitchen.  
- ExecutionUnit abstrae estación / línea / bloque / robot futuro.

## Referencias

- Código: `src/kitchen/KitchenExecutionFacade.ts` · `useKitchenExecution.ts`  
- [OPERATIONAL_ENGINE](../00-status/OPERATIONAL_ENGINE.md) · LAW 001–006 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)
