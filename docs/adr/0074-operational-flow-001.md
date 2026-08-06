# ADR 0074 — OPERATIONAL-FLOW-001 (Orders → Production → Kitchen)

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-FLOW-001 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [OPERATIONAL_FLOW_001](../05-architecture/OPERATIONAL_FLOW_001.md) · [OPERATIONAL_FLOW_REGISTRY](../00-status/OPERATIONAL_FLOW_REGISTRY.md) · [OPERATIONAL_CERTIFICATION_PHASES](../00-status/OPERATIONAL_CERTIFICATION_PHASES.md)

## Contexto

PHASE A (Capability Certification) está completa: Identity · Customers · Orders · Production · Kitchen están Engineering Certified; Kitchen tiene Capability Demo (ADR 0073). LAW 001–007 están congeladas.

YourMeal OS deja de certificar piezas aisladas y entra en **Phase B — Operational Flow Validation**: demostrar que Capabilities certificadas colaboran como un único sistema sin romper el significado del negocio.

FLOW-001 no es una Capability nueva. No inventa metodología: reutiliza Observe → Design → Freeze → Facade → Engineering Certification → Demo.

## Decisión

1. Declarar **OPERATIONAL-FLOW-001** como el primer Operational Flow canónico.  
2. Cadena: **Orders → Production → Kitchen** (con Identity · Customer como contexto).  
3. Pregunta canónica: *¿Puede un compromiso operativo convertirse en trabajo ejecutado sin romper ninguna Foundation Law?*  
4. El Flow posee transiciones · preservación de contexto · integridad · evidencia · consistencia de lifecycle — **nunca** lógica de negocio.  
5. Reglas de transición (LAW 007): Production solo OrderFacade; Kitchen solo ProductionFacade; ningún bypass.  
6. Congelar matriz de validación F01–F10 (ejecución en Certification).  
7. Crear **Operational Flow Registry** y actualizar el Board con secciones Capabilities + Flows.  
8. Ritmo del Flow = mismo método certificado (no proceso nuevo).  
9. Phase 1 = solo arquitectura (sin UI / implementación / Delivery / Billing).  
10. FLOW-002 / FLOW-003 no arrancan hasta cerrar el ciclo de FLOW-001 (preferible Demo).

## Consecuencias

- Una sola respuesta a: *cómo un compromiso se convierte en trabajo ejecutado*.  
- Delivery no se abre como Capability aislada primero — entra vía FLOW-002.  
- Lenguaje interno: **certificar el flujo**, no “integrar pantallas”.  
- EatClean usará este flujo continuo, no Identity/Orders/Kitchen por separado.

## Referencias

- ADR [0070](./0070-kitchen-execution-capability.md)–[0073](./0073-kitchen-workspace-demo.md)  
- LAW 001–007 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)  
- [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md)
