# ADR 0088 — Billing Facade

## Estado

**Accepted** — 2026-08-07  
**Track:** OPERATIONAL-007 · Phase 2 (Implement Facade)  
**Depends on:** [ADR 0087](./0087-billing-capability.md) · Delivery [0079](./0079-delivery-facade.md)–[0086](./0086-delivery-workspace-demo.md) · PRODUCT LAW 001 [0084](./0084-product-law-001.md)  
**Detalle:** [BILLING_FACADE](../05-architecture/BILLING_FACADE.md) · [BILLING_CAPABILITY](../05-architecture/BILLING_CAPABILITY.md) · `src/billing/`

## Contexto

Billing Architecture (ADR 0087) congeló la Capability final de **Operational Outcome**. Delivery está Capability Demo. Billing **no inicia** el ciclo operativo: **certifica** que el trabajo completado produce un resultado financiero gestionable.

## Decisión

1. Implementar `BillingFacade` + `useBilling` + `commands/` + `queries/` en `src/billing/`.  
2. Lenguaje: Billing Outcome · Invoice · Invoice Reference · Payment Status · Outstanding Amount · Settlement · Billing Evidence.  
3. Commands: `PrepareBilling` · `IssueInvoice` · `CancelInvoice` · `RegisterPayment` · `MarkPaymentReceived` · `ReopenBilling`.  
4. Queries: `GetBilling` · `ListBillings` · `SearchBillings` · `GetInvoice` · `GetPaymentStatus` · `ListPendingBilling`.  
5. **Componer** Order · Delivery · Customer · Production · Kitchen Facades — nunca storage, nunca ERP, nunca payment gateway.  
6. `PrepareBilling` / pending queries → Delivery completed + Order `delivered` → `ReadyToBill` summaries (pasivo).  
7. `IssueInvoice` · `CancelInvoice` · payments · `ReopenBilling` · `GetInvoice` → **UNIMPLEMENTED** (gaps visibles).  
8. `GetPaymentStatus` sobre refs `billing-pending:*` → Unpaid; invoices emitidas → UNIMPLEMENTED.  
9. LAW 002–004 · 006 · 007 · PRODUCT LAW 001. Phase 2 = Facade only (sin UI / Demo / Validation / ERP).  
10. Actualizar Capability Registry a madurez **Facade**.

### Command / Query → substrate map

| Intent | Substrate |
|--------|-----------|
| PrepareBilling / GetBilling / List* / Search / ListPending | `DeliveryFacade.getCompletedDeliveries` + `OrderFacade.searchOrders(delivered)` (+ Customer/Production/Kitchen touch) |
| GetPaymentStatus (`billing-pending:*`) | Derived Unpaid / ReadyToBill |
| Issue / Cancel / RegisterPayment / MarkPaymentReceived / Reopen / GetInvoice | UNIMPLEMENTED |

## Consecuencias

- Operational Experience puede consumir Billing vía `useBilling()` en Phase 4 Demo.  
- Gaps de emisión/pago quedan visibles — no se inventa contabilidad.  
- Engine queda a **Certification → Demo → OPERATIONAL-ENGINE-001**.  
- Delivery permanece cerrado.

## Referencias

- Código: `src/billing/BillingFacade.ts` · `useBilling.ts` · `commands/` · `queries/`  
- [OPERATIONAL_ENGINE_001_RESERVED](../00-status/OPERATIONAL_ENGINE_001_RESERVED.md) · [OPERATIONAL_LANGUAGE_DICTIONARY](../00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md)
