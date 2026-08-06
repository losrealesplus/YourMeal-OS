# Operational Certification Phases

**Permanent · declared with ADR [0073](../adr/0073-kitchen-workspace-demo.md)**  
**Companions:** [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) LAW 007

```text
PHASE A
Capability Certification
████████████████████
Identity → Customers → Orders → Production → Kitchen
(Architecture → Facade → Certification → Demo)

↓

PHASE B
Operational Flow Validation
████░░░░░░░░░░░░░░░
OPERATIONAL-FLOW-001  Orders → Production → Kitchen
OPERATIONAL-FLOW-002  Production → Kitchen → Delivery
OPERATIONAL-FLOW-003  Delivery → Billing

↓

PHASE C
Real Tenant Validation
░░░░░░░░░░░░░░░░░░░
EatClean field / OPPO / daily operations
```

---

## Phase A — complete through Kitchen Demo

Individual capabilities certified in isolation. Pattern proven. No longer needs re-demonstration.

## Phase B — begins after Kitchen Demo

Validate **chains**, not pieces. LAW 007: every stage transition via certified Facades.

| Flow | Chain | Canonical question |
|------|-------|--------------------|
| **001** | Orders → Production → Kitchen | ¿Puede un compromiso operativo convertirse en trabajo ejecutado sin romper ninguna ley? |
| **002** | Production → Kitchen → Delivery | ¿Puede el trabajo ejecutado convertirse en trabajo entregable? |
| **003** | Delivery → Billing | ¿Puede el trabajo entregado convertirse en resultado económico? |

## Phase C — EatClean as first tenant of the pattern

Field validation of the full operational engine in real daily work.
