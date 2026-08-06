# ADR 0064 — Order Validation

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-003 · Phase 3 (Validation)  
**Depends on:** ADR [0062](./0062-order-capability.md) · [0063](./0063-order-facade.md)  
**Detalle:** [ORDER_VALIDATION_REPORT](../10-validation/ORDER_VALIDATION_REPORT.md)

## Contexto

Order Architecture + Facade existen. Order es la primera **Operational Process Capability**. Antes de UI / Production Capability, debe **demostrarse** (no asumirse): process commands, week/day queries, Customer + Identity, permisos, delegación, Laws 002–004.

## Decisión

1. Ejecutar matriz automatizada (`order-validation.spec.ts`) — process path Plan→Complete + Week/Day + Customer/Identity + Laws.  
2. Tratar `CloseOrder` / `CancelOrder` (y DuplicateWeek/Clone/Split/Merge) como **UNIMPLEMENTED esperado**.  
3. Publicar acta con Expected / Observed / Evidence / PASS|UNIMPLEMENTED|WARNING|FAIL.  
4. Declarar Orders **Engineering Certified** (15 PASS · 2 UNIMPLEMENTED · 0 FAIL).  
5. Autorizar Order Workspace Demo exclusivamente vía `OrderFacade` / `useOrder`.  
6. Autorizar inicio de **Production Capability** solo tras esta validación.  
7. Congelar panel de estado permanente: `PLATFORM_STATUS` · `FOUNDATION_STATUS` · `CAPABILITY_REGISTRY` · `OPERATIONAL_ROADMAP`.  
8. Sin Product UI, routing, ni feature work en esta fase.

## Consecuencias

- Production / Kitchen / Delivery / Billing dependen del lenguaje de proceso Order.  
- Pantallas de pedidos son sustituibles; la Capability no.  
- Gaps Close/Cancel/Duplicate siguen visibles hasta substrate.

## Referencias

- `src/order/order-validation.spec.ts`  
- [ORDER_SMOKE_CHECKLIST](../10-validation/ORDER_SMOKE_CHECKLIST.md)  
- [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · Law 002 · 003 · 004  
- [OPERATIONAL_ROADMAP](../00-status/OPERATIONAL_ROADMAP.md)
