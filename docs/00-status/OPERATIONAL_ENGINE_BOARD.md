# Operational Engine — Official Board

**Frozen:** 2026-08-06 · Phase A COMPLETE · FLOW-001 Architecture · ADR [0074](../adr/0074-operational-flow-001.md)  
**Companions:** [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md) · [OPERATIONAL_CERTIFICATION_PHASES](./OPERATIONAL_CERTIFICATION_PHASES.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md)

```text
YOURMEAL OS

══════════════════════════════════════════════

Platform / Foundation
██████████████████████████
Stable

══════════════════════════════════════════════

PHASE A · Capability Certification
██████████████████████████
COMPLETE

PHASE B · Operational Flow Validation
████░░░░░░░░░░░░░░░░░░░░░░
FLOW-001 Architecture

PHASE C · Real Tenant Validation
░░░░░░░░░░░░░░░░░░░░░░░░░░
```

---

## Capabilities

```text
────────────────────
Identity
████████████████████
Engineering Certified

Customers
████████████████████
Engineering Certified + Demo

Orders
████████████████████
Engineering Certified + Demo

Production
████████████████████
Engineering Certified + Demo

Kitchen Execution
████████████████████
Engineering Certified + Demo

Delivery
░░░░░░░░░░░░░░░░░░░░
Pending (FLOW-002)

Billing
░░░░░░░░░░░░░░░░░░░░
Pending (FLOW-003)
────────────────────
```

---

## Operational Flows

```text
────────────────────
FLOW-001
Orders
    ↓
Production
    ↓
Kitchen
████░░░░░░░░░░░░░░░░
Architecture (ADR 0074)

FLOW-002
Production
    ↓
Kitchen
    ↓
Delivery
░░░░░░░░░░░░░░░░░░░░

FLOW-003
Delivery
    ↓
Billing
░░░░░░░░░░░░░░░░░░░░
────────────────────
```

Two perspectives, one engine:

* **Capabilities** — certified pieces  
* **Flows** — certified collaborations  

---

## FLOW-001 question

```text
¿Puede un compromiso operativo convertirse en trabajo
ejecutado sin romper ninguna Foundation Law?
```

---

## Next

**OPERATIONAL-FLOW-001 Phase 2** — Facade / harness (same method rhythm).  
No Delivery Capability Architecture until FLOW-001 cycle prefers Demo.
