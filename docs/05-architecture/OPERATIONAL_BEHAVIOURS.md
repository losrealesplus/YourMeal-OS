# Operational Behaviours

**Status:** ▶ **ACTIVE** · semantic layer (not code)  
**Declared:** 2026-08-06 · with FLOW-002 Architecture / Harness  
**Companions:** [OPERATIONAL_FLOW_REGISTRY](../00-status/OPERATIONAL_FLOW_REGISTRY.md) · [OPERATIONAL_LANGUAGE_DICTIONARY](../00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md)

```text
Capability  → owns business behaviour (LAW 006 question)
Flow        → owns lawful collaboration (LAW 007)
Behaviour   → names what the system achieves for the business
```

```text
Capabilities are blocks.
Flows are collaboration paths.
Behaviours are outcomes the Engine can express.
```

This document is **semántica**, not implementación.  
It does not add Foundation Laws. It does not own Facades. It does not replace Flows.

---

## Why this layer exists

Until FLOW-002, YourMeal OS certified **pieces** (Capabilities) and then **collaborations** (Flows).

Operators and future tenants still need a third answer:

```text
What does the system achieve?
```

Not “which Facade was called” and not “which folder exists” —  
**what business result the Engine can express.**

```text
Capability  answers: what question does this piece own?
Flow        answers: how do pieces collaborate?
Behaviour   answers: what does the Engine accomplish?
```

---

## Ladder

```text
Capability
    ↓
Flow
    ↓
Behaviour
```

| Layer | Owns | Never owns |
|-------|------|------------|
| **Capability** | One LAW 006 question · Commands / Queries | Flows · UI product screens as logic |
| **Flow** | Transitions · evidence · context preservation | Business algorithms · Billing shortcuts |
| **Behaviour** | Named business achievement · completion signal | Code · storage · Facades |

---

## Behaviour card (fields)

| Field | Meaning |
|-------|---------|
| **Name** | Stable business name |
| **Flow** | Which Operational Flow expresses it |
| **Capabilities** | Certified pieces involved |
| **Completion signal** | Observable end state (not a CRUD flag) |
| **Outcome** | Business meaning when complete |
| **Does not include** | Explicit out-of-scope (e.g. Billing) |

---

## Registry

### BH-001 · Fulfill Weekly Commitment

| Field | Value |
|-------|--------|
| **Name** | Fulfill Weekly Commitment |
| **Flow** | [FLOW-002](./OPERATIONAL_FLOW_002.md) · Operational Fulfillment Flow |
| **Capabilities** | Orders · Production · Kitchen · Delivery |
| **Context** | Identity · Customer |
| **Chain** | Order → Production → Kitchen → Delivery → Confirmation |
| **Completion signal** | **Delivery Confirmation** |
| **Outcome** | Operational Commitment Fulfilled |
| **Does not include** | Billing · Invoice · Payment · GPS navigation |

```text
Behaviour
  Fulfill Weekly Commitment

Capabilities
  Orders
  Production
  Kitchen
  Delivery

Completion Signal
  Confirmation

Outcome
  Operational Commitment Fulfilled
```

Canonical Flow question (unchanged):

> ¿Puede un compromiso operativo convertirse en una entrega confirmada sin romper ninguna Foundation Law?

---

### BH-002 · Plan and Execute Work (supporting)

| Field | Value |
|-------|--------|
| **Name** | Plan and Execute Work |
| **Flow** | [FLOW-001](./OPERATIONAL_FLOW_001.md) |
| **Capabilities** | Orders · Production · Kitchen |
| **Completion signal** | Execution Completed |
| **Outcome** | Operational Work Executed |
| **Does not include** | Delivery · Billing |

FLOW-001 remains a certified collaboration. BH-002 names what it achieves so BH-001 can extend it through Confirmation.

---

### BH-003 · Record Economic Outcome (future)

| Field | Value |
|-------|--------|
| **Name** | Record Economic Outcome |
| **Flow** | FLOW-003 (Pending) |
| **Capabilities** | Delivery (Confirmation fact) · Billing |
| **Completion signal** | Invoice / settlement recorded |
| **Outcome** | Economic Result Recorded |
| **Does not include** | Re-opening Execution · inventing Confirmation |

Billing’s LAW 006 question (draft):

> ¿Qué resultado económico debe registrarse después de que un compromiso operativo ha sido confirmado?

---

## Anti-patterns

| Forbidden | Why |
|-----------|-----|
| Putting business algorithms in a Behaviour doc as if they were code | Behaviours are semantic |
| Naming a Behaviour after a screen (`DeliveryPageDone`) | Screens are Experiences |
| Ending BH-001 at Invoice | Outcome belongs to BH-003 / FLOW-003 |
| Moving Capability logic into Flow because a Behaviour “needs it” | Behaviour never migrates ownership |

---

## Relationship to Experiences

```text
Operational Engine
  Capabilities · Flows · Behaviours
        ↓
Operational Experiences
  Admin · Kitchen · Delivery · Customer
```

Experiences consume Behaviours through Flows / Facades.  
They never invent a parallel “fulfillment” outside BH-001.

---

## Discipline

1. New tenant features must map to an existing Behaviour or declare a new Behaviour before inventing screens.  
2. A Behaviour without a Flow is aspiration — freeze the Flow first.  
3. A Flow without a Behaviour is incomplete semantics — name what it achieves.  
4. Never open Billing Behaviour until Confirmation is a certified completion signal.

---

## Next

```text
BH-001 expressed by FLOW-002 Harness (ADR 0082)
BH-001 certified when FLOW-002 Engineering Certification PASS
BH-003 waits for FLOW-002 cycle + Billing Architecture
```
