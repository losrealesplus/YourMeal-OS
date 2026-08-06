# ADR 0068 — Production Engineering Certification

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-004 · Phase 3 (Engineering Certification)  
**Depends on:** ADR [0066](./0066-production-capability.md) · [0067](./0067-production-facade.md)  
**Detalle:** [PRODUCTION_VALIDATION_REPORT](../10-validation/PRODUCTION_VALIDATION_REPORT.md)

## Contexto

Production Architecture + Facade existen. Production es la primera **Operational Execution Capability**. Antes de UI / Kitchen, debe **demostrarse** (no asumirse): work commands, load/queue, Order + Identity, permisos, delegación, Laws 001–004, dependency integrity.

Naming: esta fase se llama **Engineering Certification** (no solo “Validate”) — mismo acto de evidencia que Identity / Customers / Orders.

## Decisión

1. Ejecutar matriz automatizada (`production-validation.spec.ts`).  
2. Tratar GenerateProductionBatch · Capacity · Assign · Reschedule como **UNIMPLEMENTED esperado**.  
3. Publicar acta Expected / Observed / Evidence / PASS|UNIMPLEMENTED|WARNING|FAIL.  
4. Declarar Production **Engineering Certified** (13 PASS · 4 UNIMPLEMENTED · 0 FAIL).  
5. Documentar **FOUNDATION LAW 001** en FOUNDATION_LOCK (stack Capability→UI).  
6. Publicar [OPERATIONAL_DEPENDENCY_GRAPH](../00-status/OPERATIONAL_DEPENDENCY_GRAPH.md).  
7. Autorizar Production Workspace Demo vía `useProduction` only.  
8. Kitchen Capability may begin only after this certification (prefer Demo first — one cycle).  
9. Sin Product UI, Kitchen, Delivery, Billing, routing, ni feature work.

## Consecuencias

- Kitchen / Delivery / Billing dependen del lenguaje de trabajo Production.  
- Gaps capacity/assign/reschedule siguen visibles.  
- Roadmap reorganizado: Operational Planning · Execution · Outcome.

## Referencias

- `src/production/production-validation.spec.ts`  
- [PRODUCTION_SMOKE_CHECKLIST](../10-validation/PRODUCTION_SMOKE_CHECKLIST.md)  
- [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · Law 001–004  
- [OPERATIONAL_ENGINE](../00-status/OPERATIONAL_ENGINE.md)
