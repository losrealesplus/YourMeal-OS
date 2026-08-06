# Operational Engine — Official Board

**Frozen:** 2026-08-06 · Operational Engine **exists** · LAW 005 · ADR [0070](../adr/0070-kitchen-execution-capability.md)  
**Companions:** [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) · [OPERATIONAL_DEPENDENCY_GRAPH](./OPERATIONAL_DEPENDENCY_GRAPH.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md)

```text
YOURMEAL OS

══════════════════════════════════════════════

Platform
██████████████████████████
Stable

Foundation
██████████████████████████
Stable

══════════════════════════════════════════════

Operational Engine

Context
──────────────

Identity
██████████████████████████
Engineering Certified

──────────────────────────────

Business Entity
──────────────

Customers
██████████████████████████
Engineering Certified

Capability Demo
██████████████████████████

──────────────────────────────

Operational Planning
──────────────

Orders
██████████████████████████
Engineering Certified

Capability Demo
██████████████████████████

Production
██████████████████████████
Engineering Certified

Capability Demo
██████████████████████████

──────────────────────────────

Operational Execution
──────────────

Kitchen Execution
████░░░░░░░░░░░░░░░░░░░░░░
Architecture

Delivery
░░░░░░░░░░░░░░░░░░░░░░░░░░

──────────────────────────────

Operational Outcome
──────────────

Billing
░░░░░░░░░░░░░░░░░░░░░░░░░░
```

---

## Declaration

```text
Operational Engine ya existe.

No está completo.
Pero ya existe.
```

Planning (Orders + Production) is consumable.  
Execution begins with Kitchen Execution Architecture (ADR 0070).  
**Operational Engine v1.0** still requires Kitchen · Delivery · Billing Engineering Certified.

---

## Fixed layers (permanent · LAW 005)

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

One Capability · one layer. Cross-layer only via Facade.

---

## Official rhythm

```text
Architecture → Facade → Engineering Certification → Capability Demo
```

One capability cycle at a time.

---

## Next capability

**OPERATIONAL-005 · Kitchen Execution** — Architecture frozen (ADR 0070).  
Facade next. Never plans. Consumes **ProductionFacade** only.
