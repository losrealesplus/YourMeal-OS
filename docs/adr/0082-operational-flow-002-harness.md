# ADR 0082 — OPERATIONAL-FLOW-002 Harness

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-FLOW-002 · Phase 2 (Operational Flow Harness)  
**Depends on:** ADR [0081](./0081-operational-flow-002.md) · Delivery [0080](./0080-delivery-engineering-certification.md)  
**Detalle:** `src/flows/flow-002/` · [OPERATIONAL_FLOW_002](../05-architecture/OPERATIONAL_FLOW_002.md) · [OPERATIONAL_BEHAVIOURS](../05-architecture/OPERATIONAL_BEHAVIOURS.md)

## Contexto

FLOW-002 Architecture congeló el **Operational Fulfillment Flow**. Delivery está Engineering Certified. El riesgo de Phase 2 es mover comportamiento de negocio al Flow.

Se mantiene el término **Operational Flow Harness**: orquesta Facades certificadas; no sustituye Capabilities; no posee comportamiento de negocio.

Semántica añadida (no código): **Operational Behaviours** — BH-001 *Fulfill Weekly Commitment* nombra lo que el Flow logra (Confirmation), sin migrar ownership.

```text
Capability owns business behaviour.
Operational Flow owns capability collaboration.
Behaviour names what the Engine achieves.
Business behaviour never migrates from Capability to Flow.
```

## Decisión

1. Implementar `Flow002Harness` + `useFlow002` + Context / Result en `src/flows/flow-002/`.  
2. Orquestar solo: `OrderFacade` → `ProductionFacade` → `KitchenExecutionFacade` → `DeliveryFacade`.  
3. Propagar tenant · operator · evidence (Expected / Observed / Evidence por hop).  
4. API: `runCommitmentToConfirmedDelivery` · `transitionKitchenToDelivery` · `transitionDeliveryToConfirmation`.  
5. El Harness responde *qué transición falló* (`errors[].transition`) — nunca *por qué falló el negocio*.  
6. Termina en **Delivery Confirmation** — nunca Billing.  
7. Declarar [OPERATIONAL_BEHAVIOURS](../05-architecture/OPERATIONAL_BEHAVIOURS.md) con BH-001.  
8. Prohibido: lógica de negocio · repos · Supabase · UI · modificar Capabilities.  
9. Actualizar Flow Registry · Board · Roadmap a madurez **Harness**.

## Consecuencias

- FLOW-002 tiene capa canónica de orquestación sin mega-servicio.  
- Certification (Phase 3) puede assertar hops F01–F12 contra el Harness.  
- Billing / FLOW-003 siguen esperando el ciclo FLOW-002.  
- Behaviours dan gramática multi-tenant sin código nuevo.

## Referencias

- Código: `src/flows/flow-002/Flow002Harness.ts` · `useFlow002.ts`  
- LAW 007 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · [OPERATIONAL_FLOW_REGISTRY](../00-status/OPERATIONAL_FLOW_REGISTRY.md)
