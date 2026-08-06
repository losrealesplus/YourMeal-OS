# OPERATIONAL-FLOW-001

**Orders → Production → Kitchen**  
**Phase 2 — Operational Flow Harness**  
**ADR:** [0074](../adr/0074-operational-flow-001.md) · [0075](../adr/0075-operational-flow-001-harness.md)  
**Status:** **Harness** (Architecture frozen · Harness implemented)  
**Phase:** B · Operational Flow Validation  
**Laws:** 001–007 · [FOUNDATION_LOCK](./FOUNDATION_LOCK.md)  
**Registry:** [OPERATIONAL_FLOW_REGISTRY](../00-status/OPERATIONAL_FLOW_REGISTRY.md)  
**Package:** `src/flows/flow-001/` · `Flow001Harness` · `useFlow001`

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

Define the **first canonical Operational Flow** of YourMeal OS.

Phase A certified pieces in isolation. FLOW-001 certifies that those pieces **preserve business meaning across transitions**.

> **What is OPERATIONAL-FLOW-001?**

**One canonical answer:**

```text
OPERATIONAL-FLOW-001 is the validated path by which an operational
commitment (Order) becomes planned work (Production) and then
executed work (Kitchen), with every stage transition occurring
exclusively through certified Capability Facades.
```

**Canonical question:**

```text
¿Puede un compromiso operativo convertirse en trabajo ejecutado
sin romper ninguna Foundation Law?
```

```text
Can an operational commitment become executed work
without violating any Foundation Law?
```

This does **not** ask whether Orders works, whether Production works, or whether Kitchen works.  
Those answers are already certified.

It asks whether **the transitions between them** conserve operational meaning.

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
   │
   ▼
Execution Completed
```

Core collaboration under validation:

```text
Order → Production → Kitchen → Execution Completed
```

Identity and Customer provide **context** into the chain; they are prerequisites, not the transition under test.

---

## What the Flow owns

| Owns | Meaning |
|------|---------|
| **Capability transitions** | Explicit handoffs Order→Production→Kitchen |
| **Context preservation** | Tenant · operator · day · commitment identity survive each hop |
| **Operational integrity** | Meaning of “commitment → work → execution” stays coherent |
| **Evidence continuity** | Each transition leaves Expected / Observed / Evidence |
| **Lifecycle consistency** | Status language maps without inventing parallel lifecycles |

## What the Flow never owns

```text
Never business logic.
Never Order CRUD.
Never Production planning algorithms.
Never Kitchen craft / recipes.
Never UI.
Never Delivery.
Never Billing.
```

Business behaviour remains inside Capabilities.  
The Flow only proves they **collaborate lawfully**.

---

## Transition rules (LAW 007)

| From | To | Must consume | Must never |
|------|-----|--------------|------------|
| Order | Production | **OrderFacade** only | Raw order tables · Kitchen shortcuts |
| Production | Kitchen | **ProductionFacade** only | OrderFacade bypass · invent batches from Orders |
| Kitchen | (complete) | KitchenExecutionFacade internals via its own API | Plan work · mutate Orders |

```text
Order
must expose work only through OrderFacade.

Production
must consume only OrderFacade.

Kitchen
must consume only ProductionFacade.

No Capability may bypass another Capability.
No Flow may bypass a Facade.
```

Forbidden:

```text
Orders ──X──▶ Kitchen
Orders ──X──▶ storage used by Kitchen
Production ──X──▶ Order tables
Kitchen ──X──▶ GenerateProductionPlan
```

---

## Business meaning preserved

| Stage | Capability question (LAW 006) | Artifact handed forward |
|-------|-------------------------------|-------------------------|
| Order | ¿Qué prometimos? | Operational commitment (week / day scope) |
| Production | ¿Qué trabajo debemos generar? | ProductionBatch · queue · readiness |
| Kitchen | ¿Qué trabajo debe ejecutarse ahora? | ExecutionUnit · progress · completion |

LAW 006-A: no Capability answers another's question during the flow.

---

## Validation matrix (Architecture freeze · executed in Certification)

| ID | Case | What must hold |
|----|------|----------------|
| F01 | Identity → Order | Operator + tenant context required for commitment reads |
| F02 | Order → Production | Production consumes OrderFacade only for commitment facts |
| F03 | Production → Kitchen | Kitchen consumes ProductionFacade only for work facts |
| F04 | Operational Context | Day / tenant / operator survive Order→Production→Kitchen |
| F05 | Permission propagation | Caps map without inventing cross-capability permissions |
| F06 | Tenant propagation | Tenant mismatch fails at every hop (no silent cross-tenant) |
| F07 | Evidence continuity | Each transition records Expected / Observed / Evidence |
| F08 | Foundation Laws 001–007 | Stack · Facade · screen · layer · question · 006-A · flow |
| F09 | Capability boundaries | No Capability answers another's question (006-A) |
| F10 | Lifecycle consistency | Commitment → Batch → ExecutionUnit status mapping coherent |

Verdict vocabulary (same as Capability Certification):

```text
PASS · WARNING · FAIL · UNIMPLEMENTED (expected)
```

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

No new methodology. No new Foundation Laws in this era (001–007 complete the constitution).

---

## Operational Flow Harness (Phase 2 · ADR 0075)

```text
src/flows/flow-001/
  Flow001Harness.ts
  Flow001Context.ts
  Flow001Result.ts
  useFlow001.ts
```

| Responsibility | Harness |
|----------------|---------|
| Invoke OrderFacade · ProductionFacade · KitchenExecutionFacade | ✅ |
| Propagate tenant · permissions · operator · evidence | ✅ |
| Business logic · replace Facades · repos · Supabase | ❌ |

```text
runCommitmentToExecutedWork(day)
  IdentityGate
  → OrderHop          (OrderFacade.getOrdersByDeliveryDay)
  → ProductionHop     (ProductionFacade.generateProductionPlan)
  → KitchenHop        (KitchenExecutionFacade.getExecutionQueue)
  → ExecutionComplete (MarkExecutionReady + CompleteExecution)
```

---

## Sequence (conceptual)
```text
Operator (Identity)
  → OrderFacade: commitment for week/day
  → ProductionFacade: GenerateProductionPlan / GetProductionQueue
  → KitchenExecutionFacade: GetExecutionQueue
  → MarkExecutionReady / CompleteExecution
  → Execution Completed
```

Each arrow is a **Facade call**. None is a table join across domains.

---

## Relationships to later flows

| Flow | Extends | Adds |
|------|---------|------|
| **FLOW-001** (this) | — | Commitment → executed work |
| **FLOW-002** | Kitchen completion | → Delivery |
| **FLOW-003** | Delivery | → Billing |

FLOW-001 must freeze before FLOW-002 Architecture starts.

---

## Acceptance

### Phase 1 (Architecture) ✅

- [x] Canonical definition: Flow ≠ Capability  
- [x] Canonical question frozen  
- [x] Transition rules · LAW 007  
- [x] Validation matrix designed  
- [x] ADR 0074 · Flow Registry entry  
- [x] Board shows Capabilities + Operational Flows  
- [x] **No UI · no implementation · no Delivery · no Billing**

### Phase 2 (Harness) ✅

- [x] `Flow001Harness` · `useFlow001`  
- [x] Compose OrderFacade → ProductionFacade → KitchenExecutionFacade only  
- [x] Evidence continuity per hop  
- [x] ADR 0075  
- [x] **No UI · no routing · no business logic in Flow**

---

## Definition of Done

```text
There is exactly one canonical definition answering:

"How does an operational commitment become executed work?"

without violating any Foundation Law.

FLOW-001 Harness is the canonical orchestration layer between
Order · Production · Kitchen.
```

---

## Next

```text
OPERATIONAL-FLOW-001 Phase 1  Architecture     ✅ ADR 0074
OPERATIONAL-FLOW-001 Phase 2  Harness          ✅ ADR 0075
OPERATIONAL-FLOW-001 Phase 3  Engineering Certification ← next
OPERATIONAL-FLOW-001 Phase 4  Flow Demo
```
