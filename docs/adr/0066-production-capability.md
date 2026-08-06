# ADR 0066 — Production Capability

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-004 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [PRODUCTION_CAPABILITY](../05-architecture/PRODUCTION_CAPABILITY.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE](../00-status/OPERATIONAL_ENGINE.md)

## Contexto

Identity, Customers y Orders están Engineering Certified. Customer Workspace y Order Workspace demostraron LAW 003 y LAW 004. El patrón funciona para Context, Business Entity y Operational Process.

Comienza la primera capability de **Operational Execution**: el trabajo físico planificado. Sin definición canónica, Production colapsa en “cocina” o en “lista de pedidos”.

## Decisión

1. Declarar **Production Capability** como OPERATIONAL-004.  
2. Production ≠ cooking ≠ pantalla: es la **planificación operativa** que transforma compromisos (Orders) en trabajo ejecutable.  
3. Pregunta canónica: *¿Qué trabajo debe ejecutarse para cumplir los compromisos operativos?*  
4. Congelar contratos: `ProductionContext`, `ProductionBatch`, `ProductionQueue`, `ProductionSummary`, `ProductionStatus`, `ProductionCapacity`, `ProductionSchedule`, `ProductionError`.  
5. **Production never cooks.** Kitchen Capability owns execution.  
6. Production consume **OrderFacade** only; Kitchen consume Production.  
7. Confirmar Capability Type **Operational Execution** (y Outcome para Billing) en el Registry.  
8. Diseñar para EatClean (día · platos · raciones · batches · capacidad), no un MRP genérico.  
9. Declarar hito futuro **Operational Engine v1.0** cuando Identity→Billing estén certificadas.  
10. Phase 1 = solo arquitectura (sin UI / CRUD / DB / implementación).

## Consecuencias

- Una sola respuesta a: *¿qué es Production en YourMeal OS?*  
- Kitchen / Inventory / Delivery dejan de reinventar “qué hay que hacer hoy”.  
- Facade (Phase 2) compondrá servicios de planning / report existentes sin fork de vocabulario.  
- Lenguaje interno: **certificar Production Capability**, no “desarrollar Producción”.

## Referencias

- ADR [0062](./0062-order-capability.md)–[0065](./0065-order-workspace-demo.md) · EP-002B.1 Production Report  
- [OPERATIONAL_ROADMAP](../00-status/OPERATIONAL_ROADMAP.md) · [OPERATIONAL_EXPERIENCE](../00-status/OPERATIONAL_EXPERIENCE.md)  
- LAW 001–004 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)
