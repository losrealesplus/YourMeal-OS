# OPERATIONAL-FLOW-002

**Operational Fulfillment Flow**  
**Order → Production → Kitchen → Delivery → Confirmation**  
**Phase 3 — Engineering Certification**  
**ADR:** [0081](../adr/0081-operational-flow-002.md) · [0082](../adr/0082-operational-flow-002-harness.md) · [0083](../adr/0083-operational-flow-002-engineering-certification.md)  
**Status:** **Engineering Certified**  
**Behaviour:** [BH-001 Fulfill Weekly Commitment](./OPERATIONAL_BEHAVIOURS.md) · [Board](../00-status/OPERATIONAL_BEHAVIOUR_BOARD.md)  
**Phase:** B · Operational Flow Validation · ERA 4 Behaviours  
**Laws:** 001–007 · [FOUNDATION_LOCK](./FOUNDATION_LOCK.md)  
**Registry:** [OPERATIONAL_FLOW_REGISTRY](../00-status/OPERATIONAL_FLOW_REGISTRY.md)  
**Package:** `src/flows/flow-002/` · `Flow002Harness` · `useFlow002`  
**Validation:** [FLOW_002_VALIDATION_REPORT](../10-validation/FLOW_002_VALIDATION_REPORT.md) · 15 PASS · 0 FAIL  
**Depends on:** FLOW-001 Engineering Certified · Delivery Engineering Certified (ADR 0080)

```text
This is NOT a Capability.

It is an Operational Flow.

FLOW validates transitions.
NOT validate Capabilities.

It validates collaboration between certified Capabilities.
It never owns business logic.
```

### Official definitions

```text
Capability
owns business behaviour.

Operational Flow
owns capability collaboration.

Business behaviour never migrates
from Capability to Flow.
```

```text
Capabilities own business logic.
Flows own transitions.
Harnesses orchestrate certified Facades.
```

---

## Purpose

Define the **second canonical Operational Flow** of YourMeal OS.

FLOW-001 certified that a commitment can become executed work.  
FLOW-002 certifies that the same commitment can become a **confirmed delivery** without inventing Outcome (Billing).

> **What is OPERATIONAL-FLOW-002?**

**One canonical answer:**

```text
OPERATIONAL-FLOW-002 (Operational Fulfillment Flow) is the validated path
by which an operational commitment (Order) becomes planned work (Production),
executed work (Kitchen), and confirmed fulfillment (Delivery),
with every stage transition occurring exclusively through certified
Capability Facades — and without entering Billing.
```

**Canonical question:**

```text
¿Puede un compromiso operativo convertirse en una entrega confirmada
sin romper ninguna Foundation Law?
```

```text
Can an operational commitment become a confirmed delivery
without violating any Foundation Law?
```

This does **not** ask whether Orders, Production, Kitchen, or Delivery work.  
Those answers are already Engineering Certified.

It asks whether **the transitions among them** conserve operational meaning through Confirmation.

---

## Flow shape

```text
Identity
   │  (context · who operates)
   ▼
Customer
   │  (demand · who generates)
   ▼
Order
   │  OrderFacade
   ▼
Production
   │  ProductionFacade
   ▼
Kitchen Execution
   │  KitchenExecutionFacade
   ▼
Delivery
   │  DeliveryFacade
   ▼
Delivery Confirmation
```

Core collaboration under validation:

```text
Order → Production → Kitchen → Delivery → Confirmation
```

**The Flow ends at Confirmation.**  
Billing is Outcome. Billing belongs to FLOW-003.

Identity and Customer provide **context** into the chain; they are prerequisites, not the transition under test.

---

## Naming

| Name | Use |
|------|-----|
| **OPERATIONAL-FLOW-002** | Registry / ADR id |
| **Operational Fulfillment Flow** | Human / product name |
| Not “Delivery Flow” | Too narrow — Delivery is one hop, not the whole chain |

```text
Customer Commitment
        ↓
    Planning
        ↓
    Execution
        ↓
   Confirmation
```

Reusable outside EatClean: any tenant with commitments → planned work → executed work → confirmed fulfillment.

---

## What the Flow owns

| Owns | Meaning |
|------|---------|
| **Capability transitions** | Explicit handoffs Order→Production→Kitchen→Delivery→Confirmation |
| **Context preservation** | Tenant · operator · day · commitment identity survive each hop |
| **Operational integrity** | Meaning of “commitment → work → execution → confirmation” stays coherent |
| **Evidence continuity** | Each transition leaves Expected / Observed / Evidence |
| **Lifecycle consistency** | Status language maps without inventing parallel lifecycles |

## What the Flow never owns

```text
Never business logic.
Never Order CRUD.
Never Production planning algorithms.
Never Kitchen craft / recipes.
Never Delivery GPS / driving.
Never UI.
Never Billing / invoices.
Never Marketplace modules.
```

Business behaviour remains inside Capabilities.  
The Flow only proves they **collaborate lawfully**.

---

## Transition rules (LAW 007)

| From | To | Must consume | Must never |
|------|-----|--------------|------------|
| Order | Production | **OrderFacade** only | Raw order tables · Kitchen / Delivery shortcuts |
| Production | Kitchen | **ProductionFacade** only | OrderFacade bypass · invent batches from Orders |
| Kitchen | Delivery | **KitchenExecutionFacade** (+ OrderFacade commitment facts via Delivery) | Mutate Production · invent routes from Kitchen |
| Delivery | Confirmation | **DeliveryFacade** only | Billing · GPS as source of truth · Order table writes outside Facade |

```text
OrderFacade
ProductionFacade
KitchenExecutionFacade
DeliveryFacade

The Harness consumes these four — only these four.
No Capability may bypass another Capability.
No Flow may bypass a Facade.
No Flow may own business behaviour.
```

Forbidden:

```text
Orders ──X──▶ Delivery (bypass Kitchen)
Orders ──X──▶ Billing
Kitchen ──X──▶ Billing
Delivery ──X──▶ calculateInvoice / prepareMeals / assignKitchen
Flow ──X──▶ Supabase / repositories / UI state as business owner
```

---

## Business meaning preserved

| Stage | Capability question (LAW 006) | Artifact handed forward |
|-------|-------------------------------|-------------------------|
| Order | ¿Qué compromiso existe? | Operational commitment (week / day scope) |
| Production | ¿Qué trabajo debe generarse? | ProductionBatch · queue · readiness |
| Kitchen | ¿Qué trabajo debe ejecutarse ahora? | ExecutionUnit · progress · completion |
| Delivery | ¿Qué compromisos deben entregarse ahora y cómo confirmamos? | Assignment · Stop · Confirmation |
| *(end)* | — | **Delivery Confirmation** (not Invoice) |

LAW 006-A: no Capability answers another's question during the flow.  
Especially: Delivery never drives / cooks / bills.

---

## Validation matrix (Architecture freeze · executed in Certification)

| ID | Case | What must hold |
|----|------|----------------|
| F01 | Order → Production | Production consumes OrderFacade only for commitment facts |
| F02 | Production → Kitchen | Kitchen consumes ProductionFacade only for work facts |
| F03 | Kitchen → Delivery | Delivery consumes KitchenExecutionFacade + OrderFacade (commitment) only |
| F04 | Delivery → Confirmation | Confirmation via DeliveryFacade only (e.g. ConfirmDelivery) |
| F05 | Operational Context | Day / tenant / operator / commitment id survive full chain |
| F06 | Permission propagation | Caps map without inventing cross-capability permissions |
| F07 | Tenant propagation | Tenant mismatch fails at every hop (no silent cross-tenant) |
| F08 | Evidence continuity | Each hop records Expected / Observed / Evidence |
| F09 | Foundation Laws 001–007 | Stack · Facade · screen · layer · question · 006-A · flow |
| F10 | Capability boundaries | No Capability answers another's question (006-A) |
| F11 | Lifecycle consistency | Commitment → Batch → ExecutionUnit → Assignment → Confirmation coherent |
| F12 | No Billing boundary | Flow stops at Confirmation · no BillingFacade · no invoice language |

Verdict vocabulary (same as Capability Certification):

```text
PASS · WARNING · FAIL · UNIMPLEMENTED (expected)
```

Expected UNIMPLEMENTED in Certification may include Delivery substrate gaps already declared (Assign / Start / Routes / Exception / Close) — never silently filled.

---

## Method rhythm (unchanged)

Same certified method — applied to a Flow, not a Capability:

```text
Observe → Design → Freeze
    ↓
Operational Flow Harness   ← not a business Facade
    ↓
Engineering Certification
    ↓
Flow Demo
```

**Naming:** Phase 2 is **Harness**, not Facade — so the Flow is never mistaken for owning business logic.

No new methodology. No new Foundation Laws (001–007 remain the constitution).

---

## Operational Flow Harness (Phase 2 · ADR 0082)

```text
src/flows/flow-002/
  Flow002Harness.ts
  Flow002Context.ts
  Flow002Result.ts
  useFlow002.ts
```

| Responsibility | Harness |
|----------------|---------|
| Invoke OrderFacade · ProductionFacade · KitchenExecutionFacade · DeliveryFacade | ✅ |
| Propagate tenant · permissions · operator · evidence | ✅ |
| Report which transition failed (`errors[].transition`) | ✅ |
| Business logic · replace Facades · repos · Supabase · Billing | ❌ |

```text
runCommitmentToConfirmedDelivery(day)
  IdentityGate
  → OrderHop          (OrderFacade.getOrdersByDeliveryDay)
  → ProductionHop     (ProductionFacade.generateProductionPlan)
  → KitchenHop        (KitchenExecutionFacade.getExecutionQueue)
  → ExecutionComplete (MarkExecutionReady + CompleteExecution)
  → DeliveryHop       (DeliveryFacade.getDeliveryContext)
  → ConfirmationHop   (DeliveryFacade.confirmDelivery)
  → Confirmed
```

---

## Relationships to sibling flows

| Flow | Extends | Ends at |
|------|---------|---------|
| **FLOW-001** | — | Execution Completed |
| **FLOW-002** (this) | Full Planning + Execution chain | **Delivery Confirmation** |
| **FLOW-003** | Confirmation | Billing / Outcome |

```text
FLOW-001 answers: commitment → executed work
FLOW-002 answers: commitment → confirmed delivery
FLOW-003 answers: confirmation → economic outcome
```

---

## Acceptance

### Phase 1 (Architecture) ✅ (this PR)

- [x] Canonical definition: Flow ≠ Capability  
- [x] Name: **Operational Fulfillment Flow**  
- [x] Canonical question frozen  
- [x] Chain ends at Confirmation — **no Billing**  
- [x] Transition rules · LAW 007 · four Facades only  
- [x] Validation matrix designed (F01–F12)  
- [x] ADR 0081 · Flow Registry entry  
- [x] Board / Roadmap / Dependency Graph updated  
- [x] **No UI · no implementation · no Capability mutations · no Billing**

### Phase 2 (Harness) ✅

- [x] `Flow002Harness` · `useFlow002`  
- [x] Compose four Facades only  
- [x] Evidence continuity per hop  
- [x] ADR 0082  
- [x] Behaviour BH-001 named (semantic)  
- [x] **No UI · no business logic in Flow**

### Phase 3 (Engineering Certification) ✅

- [x] Validation matrix F01–F15 · FAIL = 0  
- [x] Capability UNIMPLEMENTED surfaced as TRANSITION_FAILED at hop  
- [x] ADR 0083 · report · smoke checklist  
- [x] BH-001 certified on Behaviour Board  
- [x] Scenarios reserved  
- [x] **No UI · no Billing**

---

## Definition of Done (Phase 3)

```text
FLOW-002 is Engineering Certified.
BH-001 Fulfill Weekly Commitment is Engineering Certified.
FLOW validates transitions — never individual Capabilities.
Billing / FLOW-003 / Scenarios remain gated or reserved.
```

---

## Next

```text
OPERATIONAL-FLOW-002 Phase 1  Architecture              ✅ ADR 0081
OPERATIONAL-FLOW-002 Phase 2  Harness                   ✅ ADR 0082
OPERATIONAL-FLOW-002 Phase 3  Engineering Certification ✅ ADR 0083
OPERATIONAL-FLOW-002 Phase 4  Flow Demo                 ← next
```
