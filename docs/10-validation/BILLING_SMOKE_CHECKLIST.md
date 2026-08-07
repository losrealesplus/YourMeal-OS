# Billing Smoke Checklist

**OPERATIONAL-007 Phase 3 · Engineering Certification**  
**Companion:** [BILLING_VALIDATION_REPORT](./BILLING_VALIDATION_REPORT.md)

Use after Engineering Certification, when Billing Workspace Demo exists.  
Until then: engineering matrix is enough to start Demo under Law 002–007 · PRODUCT LAW 001.

Billing looks **backward** — Outcome only.

```text
[ ] S1 Staff with accounting.operate (or orders.read prepare) can PrepareBilling / GetBilling for a day
[ ] S2 Context returns ReadyToBill summaries — not Order CRUD · not ERP invoices
[ ] S3 ListPendingBilling only reflects delivered / completed fulfillment work
[ ] S4 Customer label / customerRef propagate from completed commitments
[ ] S5 GetPaymentStatus on billing-pending:* shows Unpaid honestly
[ ] S6 IssueInvoice / RegisterPayment / GetInvoice show UNIMPLEMENTED — never fake ERP/gateway
[ ] S7 Missing session / tenant → Facade errors (not raw Supabase)
[ ] S8 UI imports only useBilling / BillingFacade (Law 002 · 003 · 004)
[ ] S9 Billing never asks “what should we cook?” or “what should we deliver?” (Law 006-A)
[ ] S10 Billing never creates demand — only certifies economic outcome of completed work

Operator: ____________
Date: ____________
Device: OPPO / Web / Other: ____________
Result: PASS / FAIL
Notes:
```
