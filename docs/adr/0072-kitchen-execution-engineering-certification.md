# ADR 0072 — Kitchen Execution Engineering Certification

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-005 · Phase 3 (Engineering Certification)  
**Depends on:** ADR [0070](./0070-kitchen-execution-capability.md) · [0071](./0071-kitchen-execution-facade.md)  
**Detalle:** [KITCHEN_EXECUTION_VALIDATION_REPORT](../10-validation/KITCHEN_EXECUTION_VALIDATION_REPORT.md)

## Contexto

Kitchen Execution Architecture + Facade existen. Kitchen es la primera **Operational Execution Capability**. Antes de UI / Delivery, debe **demostrarse** (no asumirse): ExecutionQueue · ExecutionUnits · Progress · MarkReady · Complete · Production + Identity · permisos · delegación · Laws 001–006-A · dependency integrity.

Naming: esta fase se llama **Engineering Certification** — mismo acto de evidencia que Identity / Customers / Orders / Production.

A partir de Delivery, la certificación pasará de piezas aisladas a **flujos operativos** (Production → Kitchen → Delivery). Kitchen cierra el patrón aislado.

## Decisión

1. Ejecutar matriz automatizada (`kitchen-validation.spec.ts`).  
2. Tratar Start · Pause · Resume · Assign · Block · GetOperatorAssignments como **UNIMPLEMENTED esperado**.  
3. Publicar acta Expected / Observed / Evidence / PASS|UNIMPLEMENTED|WARNING|FAIL.  
4. Declarar Kitchen Execution **Engineering Certified** (FAIL = 0).  
5. Documentar **FOUNDATION LAW 006-A** (nunca responder la pregunta de otra Capability).  
6. Autorizar Kitchen Capability Demo vía `useKitchenExecution` only.  
7. Delivery Capability may begin only after Kitchen Engineering Certification (prefer Demo first).  
8. Sin Product UI, Delivery, Billing, routing, ni feature work.

## Consecuencias

- Delivery / Billing dependen del lenguaje de ejecución Kitchen (ExecutionUnit).  
- Gaps start/pause/assign siguen visibles.  
- Próximo marco tras Demo: **Operational Flow Validation**.

## Referencias

- `src/kitchen/kitchen-validation.spec.ts`  
- [KITCHEN_EXECUTION_SMOKE_CHECKLIST](../10-validation/KITCHEN_EXECUTION_SMOKE_CHECKLIST.md)  
- [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · Law 001–006-A  
- [OPERATIONAL_ENGINE](../00-status/OPERATIONAL_ENGINE.md)
