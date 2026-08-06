# Operational Behaviour Board

**ERA 4 · Operational Behaviours**  
**Declared:** 2026-08-06 · with FLOW-002 Harness / Certification  
**Contract:** [OPERATIONAL_BEHAVIOURS](../05-architecture/OPERATIONAL_BEHAVIOURS.md)  
**Companions:** [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)

```text
Capability  → what the system can do
Flow        → how Capabilities collaborate
Behaviour   → what operational result the business obtains
Scenario    → (reserved) full enterprise cycle
```

**Rule:** We track **Behaviours certified**, not “screens shipped”.  
**Method:** same ladder as Flows — Architecture → Harness → Engineering Certification → Demo → Field → Production.

---

## Board

```text
══════════════════════════════════════════════

YOURMEAL OS · Operational Behaviours

══════════════════════════════════════════════

BH-001
Fulfill Weekly Commitment
████████████████████░░░░░░
Engineering Certified (via FLOW-002)

BH-002
Plan and Execute Work
████████████████████░░░░░░
Engineering Certified (via FLOW-001)

BH-003
Record Economic Outcome
░░░░░░░░░░░░░░░░░░░░░░░░░░
Pending (FLOW-003 · Billing)

══════════════════════════════════════════════
```

---

### BH-001 · Fulfill Weekly Commitment

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified** (FLOW-002 Phase 3) |
| **Flow** | FLOW-002 · Operational Fulfillment |
| **Capabilities** | Orders · Production · Kitchen · Delivery |
| **Completion signal** | Delivery Confirmation |
| **Outcome** | Operational Commitment Fulfilled |
| **Never includes** | Billing · Invoice · GPS |
| **ADRs** | [0081](../adr/0081-operational-flow-002.md) · [0082](../adr/0082-operational-flow-002-harness.md) · [0083](../adr/0083-operational-flow-002-engineering-certification.md) |
| **Validation** | [FLOW_002_VALIDATION_REPORT](../10-validation/FLOW_002_VALIDATION_REPORT.md) |

```text
Architecture ✅ → Harness ✅ → Engineering Certification ✅ → Demo ⏳ → Field ⏳ → Production ⏳
```

---

### BH-002 · Plan and Execute Work

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified** (FLOW-001) |
| **Flow** | FLOW-001 |
| **Completion signal** | Execution Completed |
| **Outcome** | Operational Work Executed |
| **Validation** | [FLOW_001_VALIDATION_REPORT](../10-validation/FLOW_001_VALIDATION_REPORT.md) |

---

### BH-003 · Record Economic Outcome

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| **Flow** | FLOW-003 (gated) |
| **Completion signal** | Invoice / settlement |
| **Notes** | After FLOW-002 Demo preferido · Billing Architecture |

---

## Discipline

1. A Behaviour without a Flow is aspiration.  
2. Certifying a Flow certifies its primary Behaviour (BH-001 ↔ FLOW-002).  
3. Never open BH-003 until Confirmation is a certified completion signal.  
4. Scenarios compose Behaviours — see [OPERATIONAL_SCENARIO_REGISTRY](./OPERATIONAL_SCENARIO_REGISTRY.md) (reserved).
