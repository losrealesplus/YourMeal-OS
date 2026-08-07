# Billing Capability

**OPERATIONAL-007 · Phase 2 — Facade · Phase 3 Certification next**  
**ADR:** [0087](../adr/0087-billing-capability.md) · [0088](../adr/0088-billing-facade.md)  
**Status:** **Facade** · Certification ⏳ · Demo ⏳  
**Product Direction:** [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md) · PRODUCT LAW 001  
**Role in Engine:** **Final Capability** — closes Operational Engine structural chain  
**Depends on:** Identity · Customer · Orders · Production · Kitchen Execution · **Delivery** (all Architecture+; Delivery Demo ✅)  
**Provides toward:** FLOW-003 · **OPERATIONAL-ENGINE-001** (v1.0 Declaration) · Tenant Success  
**Tenant lens:** any meal-prep / catering tenant that must settle completed operational work financially  
**EatClean lens:** weekly catering cycle → invoice / payment outcome after fulfillment  
**Layer / Type:** **Operational Outcome** (sole Outcome capability in Engine v1.0)  
**Maturity:** Architecture → **Facade** → Engineering Certified → Capability Demo → Field → Production Ready  
**Completeness:** Architecture ✅ · **Facade ✅** · Engineering Certification ⏳ · Capability Demo ⏳ · Product UI ⏳ · Field ⏳  
**Laws:** 001–007 · PRODUCT LAW 001 · [FOUNDATION_LOCK](./FOUNDATION_LOCK.md)  
**Package:** `src/billing/` · `BillingFacade` · `useBilling` · [BILLING_FACADE](./BILLING_FACADE.md)  
**Dictionary:** [OPERATIONAL_LANGUAGE_DICTIONARY](../00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md)

```text
Billing = prepare · invoice · credit · record payment · evidence financial outcome

Billing is NOT accounting software.
Billing is NOT an ERP · ledger · tax engine · bank.

Billing records and manages the financial outcome
of successfully completed operational commitments.

Billing never creates demand.
Billing never plans work.
Billing never executes work.
Billing never modifies Orders · Production · Kitchen · Delivery.
```

---

## Why this Capability is different

Until now, each Capability was designed as a node in the chain.

**Billing is designed as the last node.**

```text
Identity → Customer → Orders → Production → Kitchen → Delivery → Billing
                                                              ↑
                                                    Operational Engine ends
                                                    at Operational Outcome
```

Every naming decision reinforces: **Operational Engine ends with Outcome.**  
No architectural expansion beyond Billing for Engine v1.0.

After Billing reaches Capability Demo (and FLOW-003 as required), the project issues:

```text
OPERATIONAL-ENGINE-001
Operational Engine v1.0 Declaration
```

That declaration is a **separate institutional milestone** — not “another feature PR”.

---

## Purpose

Define the **canonical Billing Capability** for YourMeal OS.

Billing is a **business capability**, not an accounting product.

> **What is Billing inside YourMeal OS?**

**One canonical answer:**

```text
Billing is the Operational Outcome Capability:
successfully completed operational work
must produce a managed financial outcome
(invoice · credit · payment status · billing evidence).
```

**Canonical question (LAW 006 — one only):**

```text
What financial outcome must be produced
from successfully completed operational work?
```

```text
¿Qué resultado financiero debe producirse
a partir del trabajo operativo completado con éxito?
```

```text
Delivery → What must leave the tenant, and did it arrive?
Billing  → What financial outcome follows that completed work?
```

**Avoid domain nouns:** Accounting · ERP · Ledger · Tax Engine · Bank (external systems).

---

## Critical separation

| Capability | Layer | Owns | Does not own |
|------------|-------|------|--------------|
| **Orders** | Planning | Operational commitment | Invoices |
| **Production** | Planning | Batches · readiness | Settlement |
| **Kitchen Execution** | Execution | Floor execution | Prices / invoices |
| **Delivery** | Execution | Transfer of responsibility · confirmation | Invoices · payments |
| **Billing** | **Outcome** | Invoice · Credit Note · Payment Status · Billing Evidence · Financial Outcome | Mutating upstream operational state |

```text
Order               →  ¿Qué compromiso existe?
Production          →  ¿Qué trabajo debemos generar?
Kitchen Execution   →  ¿Qué trabajo debe ejecutarse ahora?
Delivery            →  ¿Qué compromisos deben salir y cómo se confirma?
Billing             →  ¿Qué resultado financiero debe producirse del trabajo completado?
```

**FOUNDATION LAW 006-A:** Billing never answers Delivery’s, Kitchen’s, or Production’s question.

If a feature makes Billing “confirm delivery”, it belongs in **Delivery**.  
If a feature makes Billing “replan production”, it belongs in **Production**.  
If a feature makes Billing “post to the general ledger”, it belongs **outside** YourMeal OS.

---

## Naming (ubiquitous language)

| Term | Meaning |
|------|---------|
| **Billing** | Operational Outcome capability |
| **Invoice** | Primary BillingDocument asserting amounts owed for completed work |
| **Invoice Line** | Line linking (optionally) commitment / fulfillment refs to amounts |
| **Credit Note** | BillingDocument adjusting a prior Invoice |
| **Payment** | Recorded settlement against an Invoice (status facet — not a bank API) |
| **Payment Status** | Unpaid · PartiallyPaid · Paid · Failed · Waived · Refunded |
| **Billing Evidence** | Notes / refs supporting the financial outcome |
| **Financial Outcome** | Aggregate meaning of settlement for a period / day |
| **Billing Status** | Document lifecycle (Pending → … → Paid / Cancelled) |
| **BillingContext** | Canonical read model for a tenant scope |
| **InvoiceReference** | Opaque handle to an Invoice |

**Do not confuse:**

| Concept | Question |
|---------|----------|
| Order Status | ¿Dónde está el compromiso? |
| Delivery Status | ¿Dónde está la transferencia? |
| **Billing Status** | ¿Dónde está el cierre económico? |
| ERP posting | Outside Operational Engine |

---

## Lifecycle (frozen)

```text
Pending
  ↓
ReadyToBill
  ↓
Invoiced
  ↓
PartiallyPaid
  ↓
Paid

or Cancelled (from Pending / ReadyToBill / Invoiced when business rules allow)
```

Contract: `BillingStatus` in `src/billing/contracts/BillingStatus.ts`.

---

## Public contracts (Architecture Freeze)

```text
src/billing/contracts/
  BillingContext.ts
  BillingSummary.ts
  BillingStatus.ts
  BillingDocument.ts
  InvoiceReference.ts
  PaymentStatus.ts
  BillingResult.ts
```

Barrel: `src/billing/index.ts` (types only).

**No** Commands · Queries · Facade · Services · Repositories · UI · database in this phase.

---

## Dependencies (Facades only — future Phase 2)

```text
Identity
  ↓
Customer
  ↓
Orders
  ↓
Production
  ↓
Kitchen Execution
  ↓
Delivery
  ↓
Billing
```

Billing **never** consumes infrastructure directly.  
Billing **never** accesses repositories or Supabase.  
Billing composes certified Facades only (when Facade phase opens).

---

## Canonical business rules

1. Billing never modifies Orders.  
2. Billing never modifies Production.  
3. Billing never modifies Kitchen Execution.  
4. Billing never modifies Delivery.  
5. Billing represents the **financial outcome** of successfully completed work.  
6. ReadyToBill requires upstream fulfillment facts (Delivery confirmation / completed commitments) — never invents completion.  
7. PRODUCT LAW 001: Billing Product Core features must demonstrably reduce tenant settlement time / errors.

---

## Phase plan (do not skip)

| Phase | Output | Status |
|-------|--------|--------|
| **1 · Architecture Freeze** | This document · ADR 0087 · contracts · Registry | ✅ |
| **2 · Facade** | `BillingFacade` · Commands / Queries · `useBilling` · ADR 0088 | ✅ |
| 3 · Engineering Certification | Validation matrix · ADR | ⏳ |
| 4 · Capability Demo | `/admin/billing-workspace` · `useBilling` only | ⏳ |
| **OPERATIONAL-ENGINE-001** | Engine v1.0 Declaration (docs only · institutional ceremony) | ⏳ After Billing Demo (+ FLOW-003 as required) |

---

## Explicit non-goals (Phase 1)

- No Facade / Commands / Queries / Services / Repositories  
- No UI / CRUD / database migrations  
- No ERP · tax · bank integrations  
- No Inventory · Procurement · Analytics expansion  
- No Delivery / Kitchen / Orders code changes  
- No premature **Engine v1.0 COMPLETE** claim (that is OPERATIONAL-ENGINE-001)

---

## Definition of Done (Phase 1)

```text
Billing answers exactly one business question.
Billing respects all Foundation Laws.
Billing completes the Operational Capability chain (structurally).
Operational Engine reaches structural completion of the capability map.
```

Structural completion ≠ Engine v1.0 Declaration.  
Declaration waits for Facade → Certification → Demo (and FLOW-003 as required).

---

## Method

```text
Observe → Design → Freeze → Facade → Engineering Certification → Capability Demo
```

Same discipline. Final Capability. No expansion beyond Outcome.
