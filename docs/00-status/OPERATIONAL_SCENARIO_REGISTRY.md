# Operational Scenario Registry

**Status:** 🔒 **RESERVED** — not implemented  
**Declared:** 2026-08-06 · with FLOW-002 Engineering Certification  
**Companions:** [OPERATIONAL_BEHAVIOUR_BOARD](./OPERATIONAL_BEHAVIOUR_BOARD.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md) · [OPERATIONAL_JOURNEY_REGISTRY](./OPERATIONAL_JOURNEY_REGISTRY.md)

```text
Capability Registry      → pieces
Operational Flow Registry → collaborations
Operational Behaviour Board → business results
Operational Scenario Registry → (future) full enterprise cycles
```

---

## Intent (do not build yet)

A Scenario may compose several Behaviours / Flows, e.g.:

```text
Scenario
  Weekly Catering Cycle

Behaviours
  BH-002 Plan and Execute Work
  BH-001 Fulfill Weekly Commitment
  BH-003 Record Economic Outcome   ← after Billing

Flows
  FLOW-001
  FLOW-002
  FLOW-003

Capabilities
  Identity · Customers · Orders · Production
  Kitchen · Delivery · Billing
```

Canonical future question:

> ¿Puede un tenant cumplir toda una semana operativa?

That question does **not** belong to a single Capability or Flow.  
It belongs to a Scenario (and later Operational Experiences).

---

## Why reserved

Behaviours (ERA 4) just opened. Scenarios open when at least:

1. FLOW-002 is Engineering Certified (+ prefer Demo)  
2. Billing / FLOW-003 Architecture exists for BH-003  
3. Tenant evidence demands a multi-Behaviour cycle

---

## Rules when it opens

- Scenarios never own business logic.  
- Scenarios compose certified Behaviours / Flows only.  
- Never invent a Scenario to bypass LAW 007 Facades.  
- Journey Registry may remain the UX/composition lens; Scenario is the enterprise-cycle lens.
