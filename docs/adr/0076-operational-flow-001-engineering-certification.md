# ADR 0076 — OPERATIONAL-FLOW-001 Engineering Certification

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-FLOW-001 · Phase 3 (Engineering Certification)  
**Depends on:** ADR [0074](./0074-operational-flow-001.md) · [0075](./0075-operational-flow-001-harness.md)  
**Detalle:** [FLOW_001_VALIDATION_REPORT](../10-validation/FLOW_001_VALIDATION_REPORT.md)

## Contexto

FLOW-001 Architecture + Harness existen. Phase A (Capabilities) está COMPLETE. Antes de Flow Demo / Android / Delivery, debe **demostrarse** que las transiciones Order→Production→Kitchen conservan integridad operativa, contexto, tenant, permisos, evidencia y Laws 001–007 — **sin re-certificar Capabilities**.

Se congela el gate estratégico: **no se abre Delivery** hasta FLOW-001 Demo · Roadmap Review · Android · OPPO · iPhone.

## Decisión

1. Ejecutar matriz automatizada (`flow-001-validation.spec.ts`).  
2. Publicar acta Expected / Observed / Evidence / PASS|UNIMPLEMENTED|WARNING|FAIL.  
3. Declarar FLOW-001 **Engineering Certified** (FAIL = 0).  
4. Autorizar **Flow Demo** (Phase 4) vía `useFlow001` / Harness only.  
5. Declarar **Roadmap Review** (Operational Engine Review · v0.8) como hito obligatorio tras Demo.  
6. Congelar: Delivery / FLOW-002 no arrancan hasta completar Demo · Review · Android · OPPO · iPhone.  
7. Sin UI · sin Delivery · sin Billing · sin nuevas Foundation Laws.

## Consecuencias

- Primera colaboración certificada del Operational Engine.  
- El siguiente valor de producto es experiencia móvil (OPPO/iPhone), no más arquitectura de Delivery.  
- FLOW-002 queda explícitamente gated.

## Referencias

- `src/flows/flow-001/flow-001-validation.spec.ts`  
- [FLOW_001_SMOKE_CHECKLIST](../10-validation/FLOW_001_SMOKE_CHECKLIST.md)  
- [OPERATIONAL_FLOW_REGISTRY](../00-status/OPERATIONAL_FLOW_REGISTRY.md) · LAW 001–007  
- [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md)
