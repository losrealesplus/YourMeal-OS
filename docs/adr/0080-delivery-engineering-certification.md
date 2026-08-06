# ADR 0080 — Delivery Engineering Certification

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-006 · Phase 3 (Engineering Certification)  
**Depends on:** ADR [0078](./0078-delivery-capability.md) · [0079](./0079-delivery-facade.md)  
**Detalle:** [DELIVERY_VALIDATION_REPORT](../10-validation/DELIVERY_VALIDATION_REPORT.md)

## Contexto

Delivery Architecture + Facade existen. Delivery es la segunda **Operational Execution Capability**. Antes de UI / FLOW-002 / Billing, debe **demostrarse** (no asumirse): Context · Assignments · Stops · ConfirmDelivery · Completed · Order + Kitchen integration · Identity · permisos · delegación · Laws 001–006-A · dependency integrity.

Naming: esta fase se llama **Engineering Certification** — mismo acto de evidencia que Identity / Customers / Orders / Production / Kitchen.

ConfirmDelivery es el único comando compuesto hoy. Assign · Start · Exception · Close · Routes permanecen como **EXPECTED GAP**.

## Decisión

1. Ejecutar matriz automatizada (`delivery-validation.spec.ts`).  
2. Tratar Assign · Start · ReportException · Close · GetDeliveryRoutes como **UNIMPLEMENTED esperado**.  
3. Publicar acta Expected / Observed / Evidence / PASS|UNIMPLEMENTED|WARNING|FAIL.  
4. Declarar Delivery **Engineering Certified** (FAIL = 0).  
5. Autorizar Delivery Capability Demo vía `useDelivery` only (Phase 4).  
6. FLOW-002 may begin only after Delivery Engineering Certification (prefer Demo first).  
7. Sin Product UI, FLOW-002 Harness, Billing, ni feature work.

## Consecuencias

- FLOW-002 puede orquestar Facades sobre una Capability certificada.  
- Gaps assign/start/routes siguen visibles.  
- Billing sigue esperando Outcome Architecture tras Delivery Demo preferido.  
- Diccionario operativo refuerza LAW 006 para Delivery.

## Referencias

- `src/delivery/delivery-validation.spec.ts`  
- [DELIVERY_SMOKE_CHECKLIST](../10-validation/DELIVERY_SMOKE_CHECKLIST.md)  
- [OPERATIONAL_LANGUAGE_DICTIONARY](../00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md)  
- [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · Law 001–006-A
