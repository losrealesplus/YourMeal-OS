# ADR 0089 — Billing Engineering Certification

## Estado

**Accepted** — 2026-08-07  
**Track:** OPERATIONAL-007 · Phase 3 (Engineering Certification)  
**Depends on:** ADR [0087](./0087-billing-capability.md) · [0088](./0088-billing-facade.md) · PRODUCT LAW 001 [0084](./0084-product-law-001.md)  
**Detalle:** [BILLING_VALIDATION_REPORT](../10-validation/BILLING_VALIDATION_REPORT.md)

## Contexto

Billing Architecture + Facade existen. Billing es la Capability final de **Operational Outcome**. A diferencia de certificaciones anteriores, Billing **no mira hacia delante**: certifica que el trabajo realizado por el tenant **ya** puede producir un resultado económico.

Debe demostrarse (no asumirse): Identity · Customer · Order · Production · Kitchen · Delivery integrity hacia atrás · ReadyToBill · BillingContext · Outcome states · Evidence bits · dependency compose · Laws 001–007 · PRODUCT LAW 001.

IssueInvoice · RegisterPayment · payment gateway · ERP · accounting · tax permanecen **EXPECTED GAP** — nunca simulados.

## Decisión

1. Ejecutar matriz automatizada (`billing-validation.spec.ts`) orientada a **Outcome**.  
2. Tratar IssueInvoice · RegisterPayment · Mark/Cancel/Reopen · GetInvoice · GetPaymentStatus(issued) como **UNIMPLEMENTED esperado**.  
3. Publicar acta Expected / Observed / Evidence / PASS|UNIMPLEMENTED|WARNING|FAIL.  
4. Declarar Billing **Engineering Certified** (FAIL = 0).  
5. Declarar **Operational Engine Capability Layer = 100%** en Capability Registry.  
6. Autorizar Billing Capability Demo vía `useBilling` only (Phase 4).  
7. Tras Demo, abrir **OPERATIONAL-ENGINE-001** (declaración institucional · docs/evidencia only).  
8. Sin UI, Demo, payment gateway, ERP, accounting logic, ni cambios de infraestructura en esta fase.

## Consecuencias

- Todas las Capabilities del Engine (Identity→Billing) quedan Engineering Certified en el mapa estructural.  
- Gaps financieros externos siguen visibles.  
- El siguiente cierre de Engine es Demo + ceremonia OPERATIONAL-ENGINE-001 — no más Capabilities de Engine v1.0.  
- PRODUCT LAW 001 gobierna el foco posterior: minutos devueltos al tenant.

## Referencias

- `src/billing/billing-validation.spec.ts`  
- [BILLING_SMOKE_CHECKLIST](../10-validation/BILLING_SMOKE_CHECKLIST.md)  
- [OPERATIONAL_ENGINE_001_RESERVED](../00-status/OPERATIONAL_ENGINE_001_RESERVED.md)  
- [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)
