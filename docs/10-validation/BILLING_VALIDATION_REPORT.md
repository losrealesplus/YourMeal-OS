# OPERATIONAL-007 · Billing Engineering Certification Report

**Track:** OPERATIONAL-007 · Phase 3  
**Date:** 2026-08-07  
**ADR:** [0089 — Billing Engineering Certification](../adr/0089-billing-engineering-certification.md)  
**Status:** **ENGINEERING CERTIFIED** · Demo → OPERATIONAL-ENGINE-001  
**Depends on:** ADR [0087](../adr/0087-billing-capability.md) · [0088](../adr/0088-billing-facade.md)

---

## Declaration

```text
Billing Capability
──────────────────────────────────────
Architecture (ADR 0087)     ✅
Facade (ADR 0088)           ✅
Engineering Certification   ✅
Capability Demo             ⏳ Phase 4
OPERATIONAL-ENGINE-001      🔒 After Demo (institutional)
──────────────────────────────────────
Final Operational Outcome Capability — Engineering Certified.
Operational Engine Capability Layer → 100%.
```

Billing is certified for **engineering use**.  
We do **not** invent ERP, payment gateway, tax engine, or field PASS.

Billing **looks backward**. It does not validate Planning or Execution.

```text
Identity   → Who operates?
Customer   → Who creates demand?
Orders     → What was promised?
Production → What work must exist?
Kitchen    → What work was executed?
Delivery   → What commitment left the tenant?
Billing    → What economic outcome can now be produced?
```

Business question answered (LAW 006 · only):

```text
What financial outcome must be produced
from successfully completed operational work?

Billing never creates demand.
Billing never plans.
Billing never executes.
Billing certifies Outcome.
```

---

## Validation matrix

| ID | Case | Expected | Observed | Evidence | Verdict |
|----|------|----------|----------|----------|---------|
| V01 | Identity propagation | AUTH / TENANT errors | PERMISSION_DENIED · TENANT_MISMATCH | `requireSession` | **PASS** |
| V02 | Customer propagation | CustomerFacade touch · customerRef | c1 · touch=1 | `PrepareBilling` | **PASS** |
| V03 | Order reference integrity | delivered → `billing-pending:{id}` | billing-pending:o1 | `searchOrders` | **PASS** |
| V04 | Production reference integrity | ProductionFacade touch · no mutation | touch=1 | `getProductionPlan` | **PASS** |
| V05 | Kitchen completion integrity | Kitchen completed touch | touch=1 | `getCompletedExecution` | **PASS** |
| V06 | Delivery completion integrity | Delivery completed before Outcome | touch=1 · ReadyToBill | `getCompletedDeliveries` | **PASS** |
| V07 | ReadyToBill generation | delivered → ReadyToBill | readyFromFulfillment | mapping | **PASS** |
| V08 | Billing context integrity | tenant · day · refs · permissions | t1 · W32 · canPrepare | `GetBilling` | **PASS** |
| V09 | Outcome state transitions | ReadyToBill + Unpaid outstanding | 42 EUR | pending · payment | **PASS** |
| V10 | Evidence generation | bits · no fake Invoice docs | docs=0 | capability bits | **PASS** |
| V11 | Operational dependency integrity | five Facades composed | all touched | spies | **PASS** |
| V12 | SearchBillings integrity | filter by customer label | Beta | `searchBillings` | **PASS** |
| V13 | IssueInvoice | UNIMPLEMENTED | UNIMPLEMENTED | `issueInvoice` | **UNIMPLEMENTED** |
| V14 | RegisterPayment | UNIMPLEMENTED | UNIMPLEMENTED | `registerPayment` | **UNIMPLEMENTED** |
| V15 | Mark/Cancel/Reopen/GetInvoice | UNIMPLEMENTED | UNIMPLEMENTED×4 | probes | **UNIMPLEMENTED** |
| V16 | GetPaymentStatus (issued) | UNIMPLEMENTED | UNIMPLEMENTED | `getPaymentStatus` | **UNIMPLEMENTED** |
| V17 | Foundation Laws 001–007 | Facade-only · Outcome question | static docs | lock · dict | **PASS** |
| V18 | PRODUCT LAW 001 · Outcome boundary | looks backward · no plan/execute | initiate language | product docs | **PASS** |
| V19 | Capability layer completion | Engine Capability Completion 100% | registry · report | institutional | **PASS** |

**Summary:** PASS **15** · UNIMPLEMENTED **4** (expected) · WARNING **0** · FAIL **0**

Automated runner: `src/billing/billing-validation.spec.ts` (19 tests green).

---

## Expected UNIMPLEMENTED (honest · never simulate financial systems)

| Item | Follow-up |
|------|-----------|
| IssueInvoice | Invoice issuance substrate |
| RegisterPayment / MarkPaymentReceived | Payment recording (not a gateway) |
| CancelInvoice / ReopenBilling | Settlement reopen rules |
| GetInvoice / GetPaymentStatus (issued) | Issued invoice store |
| Payment Gateway · ERP · Accounting · Tax Engine | **Outside Operational Engine** |

These do **not** block Engineering Certification. Intent is frozen; implementation waits.  
**Never simulate** payment gateways, ERP postings, ledgers, or tax engines.

---

## Capability Completeness

```text
Architecture ✅ → Facade ✅ → Engineering Certification ✅ → Demo ⏳ → Field ⏳ → Production Ready ⏳
```

---

## Operational Engine · Capability Layer

```text
Operational Engine
Capability Completion
████████████████████
100%
```

| Layer | Status |
|-------|--------|
| Context (Identity) | Engineering Certified |
| Business Entity (Customer) | Engineering Certified + Demo |
| Operational Planning (Orders · Production) | Engineering Certified + Demo |
| Operational Execution (Kitchen · Delivery) | Engineering Certified + Demo |
| **Operational Outcome (Billing)** | **Engineering Certified** |

Structural Capability map is complete. Remaining for Engine v1.0 Declaration:  
**Billing Capability Demo** → **OPERATIONAL-ENGINE-001** (docs/evidence only).

---

## Smoke checklist (operator)

See [BILLING_SMOKE_CHECKLIST](./BILLING_SMOKE_CHECKLIST.md).

---

## Rule unlocked

```text
Billing Capability Demo may begin (useBilling only).
After Demo → OPERATIONAL-ENGINE-001 institutional declaration.
```

Billing never mutates Orders · Production · Kitchen · Delivery.

---

## Related

- [BILLING_CAPABILITY](../05-architecture/BILLING_CAPABILITY.md) · [BILLING_FACADE](../05-architecture/BILLING_FACADE.md)  
- [OPERATIONAL_ENGINE_001_RESERVED](../00-status/OPERATIONAL_ENGINE_001_RESERVED.md)  
- [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md) · PRODUCT LAW 001
