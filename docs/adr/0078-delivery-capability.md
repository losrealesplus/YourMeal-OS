# ADR 0078 — Delivery Capability (Architecture Freeze)

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-006 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [OPERATIONAL_EXPANSION](../00-status/OPERATIONAL_EXPANSION.md)

## Contexto

Operational Engine v0.8 está congelado (ADR 0077). Android Field Validation es PASS. Cross-Platform Validation (iPhone) tiene guía oficial pero el PASS de campo aún no. Kitchen Execution es la primera Capability de **Operational Execution** certificada.

Abrir **Delivery** como siguiente Capability de Execution respeta la cadena operativa del negocio: lo que Kitchen completa debe poder entregarse. Billing no puede abrirse antes.

Esta ADR abre **solo Architecture Freeze**. Facade, Demo y FLOW-002 permanecen disciplinados: la implementación no se apresura mientras Cross-Platform Validation sigue abierta; la arquitectura sí puede congelarse para reducir incertidumbre.

## Decisión

1. Declarar **Delivery Capability** como **OPERATIONAL-006**.  
2. Delivery ≠ GPS ≠ facturación ≠ cocina: es la **coordinación logística** que lleva compromisos ejecutables hasta confirmación de entrega.  
3. Pregunta canónica (LAW 006 — una sola):

   > *¿Qué compromisos operativos deben entregarse ahora y cómo confirmamos su ejecución?*

4. Congelar contratos públicos: `DeliveryContext`, `DeliveryAssignment`, `DeliveryRoute`, `DeliveryStop`, `DeliveryConfirmation`, `DeliveryEvidence`, `DeliveryStatus`, `DeliveryException`.  
5. Lifecycle: `Planned` → `Assigned` → `InTransit` → `Delivered` → `Confirmed`.  
6. **Delivery never drives · never cooks · never bills · never replans Production · never mutates Order commitments.**  
7. Delivery consume **KitchenExecutionFacade** (trabajo liberable / completado) y hechos de compromiso vía **OrderFacade** cuando haga falta — solo Facades.  
8. Capability Type / Layer: **Operational Execution** (LAW 005).  
9. Declarar era **Operational Expansion** para módulos posteriores a v0.8; v0.8 sigue siendo el núcleo certificado.  
10. Phase 1 = solo arquitectura (sin UI / CRUD / DB / implementación / FLOW-002 Harness).  
11. Diseño **tenant-agnóstico**: no “el repartidor de EatClean”, sino cualquier tenant con compromisos operativos que deban entregarse.  
12. FLOW-002 Architecture permanece **Pending** hasta Facade Delivery + ciclo FLOW-001 preferido (Demo).

## Consecuencias

- Una sola respuesta a: *¿qué es Delivery en YourMeal OS?*  
- Kitchen / Billing / pantallas dejan de reinventar “qué hay que entregar y cómo se confirma”.  
- Facade (Phase 2) expondrá Assignment / Stop / Confirmation sin vocabulario de navegación GPS.  
- Cross-Platform Validation y IOS-READY siguen como trabajo de campo paralelo — no bloquean Freeze de contratos.  
- Lenguaje interno: **certificar Delivery Capability**, no “hacer módulo de rutas”.

## Referencias

- ADR [0070](./0070-kitchen-execution-capability.md)–[0077](./0077-operational-engine-v08.md)  
- [KITCHEN_EXECUTION_CAPABILITY](../05-architecture/KITCHEN_EXECUTION_CAPABILITY.md) · LAW 001–007 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)  
- [OPERATIONAL_ROADMAP](../00-status/OPERATIONAL_ROADMAP.md) · [OPERATIONAL_EXPANSION](../00-status/OPERATIONAL_EXPANSION.md) · [FIELD_VALIDATION_002_IOS](../10-validation/FIELD_VALIDATION_002_IOS.md)
