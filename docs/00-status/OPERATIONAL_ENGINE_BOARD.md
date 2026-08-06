# Operational Engine — Official Board

**Frozen:** 2026-08-06 · with ADR [0069](../adr/0069-production-workspace-demo.md)  
**Companions:** [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) · [OPERATIONAL_DEPENDENCY_GRAPH](./OPERATIONAL_DEPENDENCY_GRAPH.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md)

```text
═══════════════════════════════════════════════
YOURMEAL OS
Operational Engine Roadmap
═══════════════════════════════════════════════

Platform
██████████████████████████
100%

Foundation
██████████████████████████
100%

───────────────────────────────────────────────

Context

Identity
██████████████████████████
Engineering Certified

───────────────────────────────────────────────

Business Entity

Customers
██████████████████████████
Engineering Certified

───────────────────────────────────────────────

Operational Planning

Orders
██████████████████████████
Engineering Certified + Demo

Production
██████████████████████████
Engineering Certified + Demo

───────────────────────────────────────────────

Operational Execution

Kitchen Execution
░░░░░░░░░░░░░░░░░░░░░░░░░

Delivery
░░░░░░░░░░░░░░░░░░░░░░░░░

───────────────────────────────────────────────

Operational Outcome

Billing
░░░░░░░░░░░░░░░░░░░░░░░░░
```

---

## Fixed layers (permanent)

Every new capability **must** declare its layer before Architecture starts:

```text
Context
    ↓
Business Entity
    ↓
Operational Planning
    ↓
Operational Execution
    ↓
Operational Outcome
```

No hybrid modules (planning+execution, execution+billing).

---

## Official rhythm

```text
Architecture → Facade → Engineering Certification → Capability Demo
```

One capability cycle at a time.

---

## Next capability

**OPERATIONAL-005 · Kitchen Execution** — executes Production plans. Never replans Orders.
