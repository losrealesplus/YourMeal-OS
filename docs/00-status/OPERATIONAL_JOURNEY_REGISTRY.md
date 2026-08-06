# Operational Journey Registry

**Status:** 🔒 **RESERVED** — not implemented  
**Declared:** 2026-08-06 · with ADR [0075](../adr/0075-operational-flow-001-harness.md)  
**Companions:** [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md)

```text
Capability Registry     → pieces
Operational Flow Registry → collaborations
Operational Journey Registry → (future) compositions of Flows
```

---

## Intent (do not build yet)

A Journey may compose several Flows, e.g.:

```text
Weekly Catering Journey

FLOW-001  Orders → Production → Kitchen
    ↓
FLOW-002  Production → Kitchen → Delivery
    ↓
FLOW-003  Delivery → Billing
```

---

## Why reserved

EatClean will eventually live a continuous journey, not isolated flows.  
The third registry appears when tenant reality demands it — not before.

---

## Rules when it opens

- Journeys never own business logic (same as Flows).  
- Journeys compose certified Flows only (LAW 007).  
- No Journey Architecture until FLOW-001–003 prove the Flow pattern.  
- No new Foundation Law required to open this registry.

---

## Current action

**None.** Keep this file as a placeholder so the concept is not reinvented later.
