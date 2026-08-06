# ADR 0062 — Order Capability

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-003 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [ORDER_CAPABILITY](../05-architecture/ORDER_CAPABILITY.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md)

## Contexto

Identity y Customers están Engineering Certified. Customer Workspace demostró LAW 003. Comienza **Operational Experience**. Falta la primera capability de **proceso**: el compromiso operativo semanal que conecta producción, cocina, reparto y facturación.

Order Intake (ADR 0017) ya separa captura de cumplimiento. Falta la definición canónica de **qué es un Order** en YourMeal OS.

## Decisión

1. Declarar **Order Capability** como OPERATIONAL-003.  
2. Order ≠ ecommerce cart ≠ pantalla: es el **compromiso operativo** del tenant para una semana concreta.  
3. Congelar contratos: `OrderContext`, `OrderSummary`, `OrderDetails`, `OrderStatus`, `OrderWeek`, `OrderDeliverySlot`, `OrderError`, vocabulario de lifecycle.  
4. Respetar ADR 0017: **solo Order Intake construye Orders**; Order Capability posee el ciclo de vida tras Build.  
5. Separar `demand_channel` · Order Source · Order Status · Billing facet.  
6. Depender de Identity + Customer para actor, party y delivery location.  
7. Diseñar para EatClean (semana · menú · alérgenos · prep · entrega), no un checkout genérico.  
8. Phase 1 = solo arquitectura (sin UI / CRUD / DB / implementación).  
9. Declarar **FOUNDATION LAW 004**: Operational Experience consumes Capabilities; UI owns interaction only.

## Consecuencias

- Una sola respuesta a: *¿qué es un Order en YourMeal OS?*  
- Production / Kitchen / Delivery / Billing consumirán este lenguaje.  
- Facade (Phase 2) compondrá Intake + servicios de order existentes sin fork de vocabulario.

## Referencias

- ADR [0015](./0015-b2b-b2c-customer-model.md) · [0016](./0016-party-model-demand-actors.md) · [0017](./0017-order-intake.md) · [0058](./0058-customer-capability.md)–[0061](./0061-customer-workspace-demo.md)  
- [OPERATIONAL_EXPERIENCE](../00-status/OPERATIONAL_EXPERIENCE.md) · DICT-041/042/075/076
