# ADR 0060 — Customer Validation

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-002 · Phase 3 (Validation)  
**Depends on:** ADR [0058](./0058-customer-capability.md) · [0059](./0059-customer-facade.md)  
**Detalle:** [CUSTOMER_VALIDATION_REPORT](../10-validation/CUSTOMER_VALIDATION_REPORT.md)

## Contexto

Customer Architecture + Facade existen. Customer es la primera Operational Capability **escribible**. Antes de UI, debe **demostrarse** (no asumirse): commands, queries, Identity, permisos, delegación, Law 002.

## Decisión

1. Ejecutar matriz automatizada (`customer-validation.spec.ts`) — Create/Archive/Search/Get/List/Company/Delivery/Identity/Permissions/Bootstrap/Facade/Delegation/Law.  
2. Tratar `UpdateCustomer` / `RestoreCustomer` como **UNIMPLEMENTED esperado** (intención congelada, sin inventar CRM).  
3. Publicar acta con Expected / Observed / Evidence / PASS|UNIMPLEMENTED|WARNING|FAIL.  
4. Declarar Customers **Engineering Certified** (14 PASS · 2 UNIMPLEMENTED · 0 FAIL).  
5. Introducir **Capability Completeness** (Architecture → Facade → Validation → UI → Field → Production) junto a Maturity.  
6. Declarar **FOUNDATION LAW 003**: screens never own business logic.  
7. Autorizar UI Customer exclusivamente vía `CustomerFacade` / `useCustomer`.  
8. Sin Product UI, routing, ni feature work en esta fase.

## Consecuencias

- Orders / Delivery / Billing pueden depender del lenguaje Customer (Demand Party).  
- Pantallas de Clientes son sustituibles; la Capability no.  
- Gaps Update/Restore/addresses siguen visibles hasta substrate.

## Referencias

- `src/customer/customer-validation.spec.ts`  
- [CUSTOMER_SMOKE_CHECKLIST](../10-validation/CUSTOMER_SMOKE_CHECKLIST.md)  
- [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · Law 002 · Law 003
