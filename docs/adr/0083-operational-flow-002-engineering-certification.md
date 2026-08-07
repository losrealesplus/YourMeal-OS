# ADR 0083 — OPERATIONAL-FLOW-002 Engineering Certification

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-FLOW-002 · Phase 3 (Engineering Certification)  
**Depends on:** ADR [0081](./0081-operational-flow-002.md) · [0082](./0082-operational-flow-002-harness.md)  
**Detalle:** [FLOW_002_VALIDATION_REPORT](../10-validation/FLOW_002_VALIDATION_REPORT.md)

## Contexto

FLOW-002 Architecture + Harness existen. Delivery está Engineering Certified. Antes de Flow Demo / Billing / FLOW-003, debe **demostrarse** que las transiciones Order→Production→Kitchen→Delivery→Confirmation conservan integridad operativa, contexto, tenant, permisos, evidencia y Laws 001–007 — **sin re-certificar Capabilities**.

Se certifica también el Behaviour semántico **BH-001 Fulfill Weekly Commitment** (completion = Confirmation).

## Decisión

1. Ejecutar matriz automatizada (`flow-002-validation.spec.ts`).  
2. Publicar acta Expected / Observed / Evidence / PASS|UNIMPLEMENTED|WARNING|FAIL.  
3. Declarar FLOW-002 **Engineering Certified** (FAIL = 0).  
4. Declarar BH-001 Engineering Certified vía FLOW-002 en [OPERATIONAL_BEHAVIOUR_BOARD](../00-status/OPERATIONAL_BEHAVIOUR_BOARD.md).  
5. Reservar [OPERATIONAL_SCENARIO_REGISTRY](../00-status/OPERATIONAL_SCENARIO_REGISTRY.md) (Weekly Catering Cycle — no implementar).  
6. Autorizar **Flow Demo** (Phase 4) vía `useFlow002` / Harness only.  
7. FLOW-003 / Billing Architecture quedan gated.  
8. Capability UNIMPLEMENTED en ConfirmDelivery se superficie como `TRANSITION_FAILED` en ConfirmationHop (honestidad del Harness — no inventa business why).  
9. Sin UI · sin Billing · sin modificar Capabilities · sin nuevas Foundation Laws.

## Consecuencias

- Segunda colaboración certificada del Operational Engine.  
- Primera vez que se certifica un **Behaviour** (resultado empresarial).  
- ERA 4 (Operational Behaviours) queda operativa.  
- Scenarios quedan reservados hasta Billing / evidencia tenant.

## Referencias

- `src/flows/flow-002/flow-002-validation.spec.ts`  
- [FLOW_002_SMOKE_CHECKLIST](../10-validation/FLOW_002_SMOKE_CHECKLIST.md)  
- [OPERATIONAL_BEHAVIOURS](../05-architecture/OPERATIONAL_BEHAVIOURS.md) · LAW 001–007
