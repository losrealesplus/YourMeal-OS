# ADR 0075 — OPERATIONAL-FLOW-001 Harness

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-FLOW-001 · Phase 2 (Operational Flow Harness)  
**Depends on:** ADR [0074](./0074-operational-flow-001.md)  
**Detalle:** `src/flows/flow-001/` · [OPERATIONAL_FLOW_001](../05-architecture/OPERATIONAL_FLOW_001.md) · [OPERATIONAL_FLOW_REGISTRY](../00-status/OPERATIONAL_FLOW_REGISTRY.md)

## Contexto

FLOW-001 Architecture congeló el primer Operational Flow. Phase A está COMPLETE. El riesgo de llamar “Facade” a la Phase 2 del Flow es confundir orquestación con lógica de negocio.

Se adopta el término **Operational Flow Harness**: orquesta Facades certificadas; no sustituye Capabilities; no posee comportamiento de negocio.

Definiciones oficiales:

```text
Capability owns business behaviour.
Operational Flow owns capability collaboration.
Business behaviour never migrates from Capability to Flow.

Capabilities own business logic.
Flows own transitions.
Harnesses orchestrate certified Facades.
```

Constitution: LAW 001–007 are complete; no new Foundation Laws in this era unless tenant evidence proves insufficiency.

## Decisión

1. Implementar `Flow001Harness` + `useFlow001` + Context / Result en `src/flows/flow-001/`.  
2. Orquestar solo: `OrderFacade` → `ProductionFacade` → `KitchenExecutionFacade`.  
3. Propagar tenant · operator · permissions · evidence (Expected / Observed / Evidence por hop).  
4. API: `runCommitmentToExecutedWork` · `transitionOrderToProduction` · `transitionProductionToKitchen`.  
5. Prohibido: lógica de negocio · repos · Supabase · reemplazar Facades.  
6. Renombrar Phase 2 del ritmo de Flow a **Harness** (no Facade) en docs / Registry / Board.  
7. Reservar concepto futuro **Operational Journey Registry** (no implementar).  
8. Sin UI / routing / Delivery / Billing.

## Consecuencias

- FLOW-001 tiene capa canónica de orquestación sin mega-servicio.  
- Certification (Phase 3) puede assertar hops F01–F10 contra el Harness.  
- Delivery sigue esperando el ciclo FLOW-001.

## Referencias

- Código: `src/flows/flow-001/Flow001Harness.ts` · `useFlow001.ts`  
- LAW 007 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · [OPERATIONAL_JOURNEY_REGISTRY](../00-status/OPERATIONAL_JOURNEY_REGISTRY.md) (reserved)
