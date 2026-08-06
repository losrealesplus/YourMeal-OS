# Operational Engine — Official Board

**Frozen:** 2026-08-06 · FLOW-001 Harness · ADR [0075](../adr/0075-operational-flow-001-harness.md)  
**Companions:** [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md) · [OPERATIONAL_JOURNEY_REGISTRY](./OPERATIONAL_JOURNEY_REGISTRY.md) (reserved) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md)

```text
YOURMEAL OS

══════════════════════════════════════════════

Platform / Foundation
██████████████████████████
Stable · LAW 001–007 frozen

══════════════════════════════════════════════

PHASE A · Capability Certification
██████████████████████████
COMPLETE

PHASE B · Operational Flow Validation
████████░░░░░░░░░░░░░░░░░░
FLOW-001 Harness

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
████████░░░░░░░░░░░░
Harness (ADR 0075)

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

```text
FLOW validates transitions.
NOT validate Capabilities.
```

---

## Next

**OPERATIONAL-FLOW-001 Phase 3 — Engineering Certification**
