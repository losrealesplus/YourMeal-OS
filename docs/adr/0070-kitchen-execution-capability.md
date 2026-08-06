# ADR 0070 — Kitchen Execution Capability

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-005 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [KITCHEN_EXECUTION_CAPABILITY](../05-architecture/KITCHEN_EXECUTION_CAPABILITY.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE](../00-status/OPERATIONAL_ENGINE.md) · [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md)

## Contexto

Identity, Customers, Orders y Production están Engineering Certified. Capability Demos probaron LAW 003 y LAW 004. Operational Planning (Orders + Production) es consumible.

Se declara oficialmente que el **Operational Engine ya existe** (incompleto). Empieza la primera capability de **Operational Execution**: Kitchen Execution.

Sin definición canónica, Kitchen colapsa en “recetas”, “ingredientes” o “pantalla de cocina”. Igual que Production planifica y no cocina, Kitchen **orquesta** y no cocina.

Además se congela el **Operational Model** permanente y **FOUNDATION LAW 005**: una Capability pertenece a exactamente una capa; cruce de capas solo vía Facade. Production se reclasifica formalmente como **Operational Planning** (no Execution).

## Decisión

1. Declarar **Kitchen Execution Capability** como OPERATIONAL-005.  
2. Kitchen ≠ cooking ≠ planning ≠ pantalla: es la **coordinación operativa** que ejecuta Production Work.  
3. Pregunta canónica: *¿Qué trabajo debe ejecutarse ahora?*  
4. Congelar contratos: `KitchenContext`, `KitchenQueue`, `KitchenBatch`, `KitchenExecution`, `KitchenStatus`, `KitchenOperator`, `KitchenProgress`, `KitchenError`.  
5. Lifecycle: `READY` · `IN_PROGRESS` · `PAUSED` · `BLOCKED` · `COMPLETED`.  
6. **Kitchen never cooks / never plans / never modifies Orders / never generates Production.**  
7. Kitchen consume **ProductionFacade** only; provides toward Delivery.  
8. Capability Type / Layer: **Operational Execution**.  
9. Declarar **Operational Engine exists**; v1.0 sigue requiriendo Kitchen · Delivery · Billing certificados.  
10. Adoptar **FOUNDATION LAW 005** y el Operational Model permanente en Foundation Lock / Status.  
11. Reclasificar Production (y Orders) bajo capa **Operational Planning** en Registry / Board / Graph.  
12. Phase 1 = solo arquitectura (sin UI / CRUD / DB / implementación).

## Consecuencias

- Una sola respuesta a: *¿qué es Kitchen Execution en YourMeal OS?*  
- Delivery / pantallas / IoT dejan de reinventar “qué hay que hacer ahora en cocina”.  
- Facade (Phase 2) expondrá lenguaje de ejecución (`StartBatch`, `PauseBatch`, …) sin vocabulario gastronómico.  
- LAW 005 protege el crecimiento multi-tenant: Execution no planifica; Planning no factura.  
- Lenguaje interno: **certificar Kitchen Execution Capability**, no “desarrollar cocina”.

## Referencias

- ADR [0066](./0066-production-capability.md)–[0069](./0069-production-workspace-demo.md)  
- [PRODUCTION_CAPABILITY](../05-architecture/PRODUCTION_CAPABILITY.md) · LAW 001–005 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)  
- [OPERATIONAL_ROADMAP](../00-status/OPERATIONAL_ROADMAP.md) · [GITHUB_HOUSEKEEPING](../00-status/GITHUB_HOUSEKEEPING.md)
