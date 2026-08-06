# Operational Certification Phases

**Permanent · Operational Engine v0.8 · FLOW-001 Certified · ADR [0077](../adr/0077-operational-engine-v08.md)**  
**Companions:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)

```text
PHASE A
Capability Certification
████████████████████
COMPLETE
Identity → Customers → Orders → Production → Kitchen

↓

PHASE B
Operational Flow Validation
████████░░░░░░░░░░░
OPERATIONAL-FLOW-001  Engineering Certified ✅ (ADR 0076) · Demo next
OPERATIONAL-FLOW-002  GATED
OPERATIONAL-FLOW-003  GATED

↓

PHASE C
Real Tenant Validation
░░░░░░░░░░░░░░░░░░░
EatClean field / OPPO / daily operations
```

---

## Phase A — COMPLETE

Individual capabilities certified in isolation. Pattern proven. Era of isolated Capability Certification is closed.

## Phase B — in progress

Validate **chains**, not pieces. LAW 007: every stage transition via certified Facades.  
Registry: [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)

| Flow | Chain | Status | Canonical question |
|------|-------|--------|--------------------|
| **001** | Orders → Production → Kitchen | **Engineering Certified** | ¿Puede un compromiso operativo convertirse en trabajo ejecutado sin romper ninguna Foundation Law? |
| **002** | Production → Kitchen → Delivery | **GATED** | ¿Puede el trabajo ejecutado convertirse en trabajo entregable? |
| **003** | Delivery → Billing | **GATED** | ¿Puede el trabajo entregado convertirse en resultado económico? |

Flow method (unchanged from Capability rhythm):

```text
Observe → Design → Freeze → Harness → Engineering Certification → Flow Demo
```

Constitution stable: **no new Foundation Laws** unless tenant evidence proves insufficiency (001–007 complete).

**Era:** Validation — [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md).

## Phase C — EatClean as first tenant of the pattern

Field validation of the full operational engine in real daily work.
