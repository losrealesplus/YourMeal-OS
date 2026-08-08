# ADR 0081 — OPERATIONAL-FLOW-002 (Operational Fulfillment Flow)

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-FLOW-002 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [OPERATIONAL_FLOW_002](../05-architecture/OPERATIONAL_FLOW_002.md) · [OPERATIONAL_FLOW_REGISTRY](../00-status/OPERATIONAL_FLOW_REGISTRY.md)

## Contexto

El Operational Engine ya dispone de Identity · Customers · Orders · Production · Kitchen · Delivery — todos **Engineering Certified**. FLOW-001 certificó compromiso → trabajo ejecutado.

YourMeal OS entra en el segundo flujo de **Phase B — Operational Flow Validation**: demostrar que un compromiso puede convertirse en **entrega confirmada** sin romper Foundation Laws y **sin entrar en Billing**.

FLOW-002 no es una Capability nueva. No inventa metodología: reutiliza Observe → Design → Freeze → Harness → Engineering Certification → Demo.

Nombre humano: **Operational Fulfillment Flow** (no “Delivery Flow”).

## Decisión

1. Declarar **OPERATIONAL-FLOW-002** como el segundo Operational Flow canónico.  
2. Cadena: **Order → Production → Kitchen → Delivery → Confirmation** (Identity · Customer como contexto).  
3. Pregunta canónica: *¿Puede un compromiso operativo convertirse en una entrega confirmada sin romper ninguna Foundation Law?*  
4. El Flow **termina en Delivery Confirmation** — nunca en Invoice.  
5. El Flow posee transiciones · contexto · integridad · evidencia · lifecycle — **nunca** lógica de negocio.  
6. Reglas de transición (LAW 007): Harness consume únicamente `OrderFacade` · `ProductionFacade` · `KitchenExecutionFacade` · `DeliveryFacade`.  
7. Congelar matriz de validación F01–F12 (ejecución en Certification).  
8. Actualizar Flow Registry · Board · Dependency Graph · Roadmap.  
9. Phase 1 = solo arquitectura (sin UI / implementación / Billing / cambios a Capabilities).  
10. Phase 2 Harness preferible tras Delivery Capability Demo y/o FLOW-001 Flow Demo; hard unlock = Delivery Engineering Certified (ya ✅).  
11. FLOW-003 (Billing) no arranca hasta cerrar el ciclo de FLOW-002 (preferible Demo).

## Consecuencias

- Una sola respuesta a: *cómo un compromiso se convierte en entrega confirmada*.  
- Billing queda limpio para LAW 006 Outcome: *¿Qué resultado económico debe registrarse después de que un compromiso operativo ha sido confirmado?*  
- Lenguaje interno: **certificar el flujo de cumplimiento**, no “hacer la pantalla de delivery”.  
- Expected gaps de Delivery (Assign / Start / Routes / Exception / Close) permanecen visibles en Certification — nunca FAIL por honestidad.

## Referencias

- ADR [0074](./0074-operational-flow-001.md)–[0076](./0076-operational-flow-001-engineering-certification.md) · [0078](./0078-delivery-capability.md)–[0080](./0080-delivery-engineering-certification.md)  
- LAW 001–007 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)  
- [OPERATIONAL_LANGUAGE_DICTIONARY](../00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md) · [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md)
