# Billing Facade

**OPERATIONAL-007 · Phase 2**  
**ADR:** [0088](../adr/0088-billing-facade.md) · Architecture [0087](../adr/0087-billing-capability.md)  
**Status:** **Engineering Certified** · Demo ⏳  
**Package:** `src/billing/` · `BillingFacade` · `useBilling()`  
**Capability:** `accounting.operate` (prepare may use `orders.read`)  
**Validation:** [BILLING_VALIDATION_REPORT](../10-validation/BILLING_VALIDATION_REPORT.md) · ADR [0089](../adr/0089-billing-engineering-certification.md)

```text
Operational Experience / Flows
        ↓
useBilling()
        ↓
BillingFacade
        ↓
OrderFacade · DeliveryFacade · CustomerFacade
ProductionFacade · KitchenExecutionFacade
```

Never: UI → Supabase · Repositories · ERP · Bank · Tax engine.

---

## Nature of this Facade

```text
Billing does not initiate anything.
Billing certifies that the operational cycle finished correctly.
```

It is the most **passive** Capability in the Engine — and the one that **closes** the cycle.

```text
Identity → … → Delivery → Billing (Outcome)
```

---

## Public API

### Commands (business intentions — never CRUD)

| Command | Honesty |
|---------|---------|
| PrepareBilling | Composed — ReadyToBill from completed fulfillment |
| IssueInvoice | **UNIMPLEMENTED** |
| CancelInvoice | **UNIMPLEMENTED** |
| RegisterPayment | **UNIMPLEMENTED** |
| MarkPaymentReceived | **UNIMPLEMENTED** |
| ReopenBilling | **UNIMPLEMENTED** |

### Queries

| Query | Honesty |
|-------|---------|
| GetBilling | Composed |
| ListBillings | Composed |
| SearchBillings | Composed |
| ListPendingBilling | Composed |
| GetPaymentStatus (`billing-pending:*`) | Derived Unpaid |
| GetPaymentStatus (issued invoice) | **UNIMPLEMENTED** |
| GetInvoice | **UNIMPLEMENTED** |

---

## Operational language

Use: Billing Outcome · Invoice · Invoice Reference · Payment Status · Outstanding Amount · Settlement · Billing Evidence  

Avoid: `save` · `update` · `delete` · accounting · ERP · ledger · bank.

---

## Laws

| Law | How |
|-----|-----|
| LAW 002 | UI consumes Facade only |
| LAW 003 | Facade owns no invented business rules beyond mapping completed work → Outcome |
| LAW 004 | Operational Experience will consume this Facade |
| LAW 006 | One question — financial outcome of completed work |
| LAW 007 | Flows must not bypass Billing for settlement |
| PRODUCT LAW 001 | Canonical settlement API reduces duplicated invoice/payment handling |

---

## Operational Impact

Every tenant needs **one** canonical way to consume financial outcomes.

- No duplicated integrations  
- No duplicated invoice logic  
- No duplicated payment state handling  

---

## Explicit non-goals (Phase 2)

- No UI · Demo · Validation suite beyond Facade specs  
- No ERP · payment gateway · tax engine · bank rails  
- No database migrations  
- No Delivery / Orders mutation  

---

## Next

```text
Engineering Certification → Capability Demo → OPERATIONAL-ENGINE-001
```
