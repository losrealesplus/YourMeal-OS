# Operational Flow Registry

**YourMeal OS · Phase B control panel**  
**Declared:** 2026-08-06 · ADR [0074](../adr/0074-operational-flow-001.md)  
**Companions:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_CERTIFICATION_PHASES](./OPERATIONAL_CERTIFICATION_PHASES.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)

```text
A Flow is not a Capability.

Capabilities own business behaviour.
Flows own lawful collaboration between Capabilities.
```

**Rule:** We track **Flows certified**, not “integrations shipped”.  
**Method (unchanged):** Observe → Design → Freeze → **Harness** → Engineering Certification → Flow Demo  
**Law:** [FOUNDATION LAW 007](../05-architecture/FOUNDATION_LOCK.md) — Flows never bypass Capabilities / Facades.  
**Naming:** Flow Phase 2 = **Harness** (not Facade) — orchestration only.

```text
Capability owns business behaviour.
Operational Flow owns capability collaboration.
Business behaviour never migrates from Capability to Flow.
```

---

## Maturity (same ladder as Capabilities)

```text
Architecture
    ↓
Harness
    ↓
Engineering Certified
    ↓
Flow Demo
    ↓
Field Validated
    ↓
Production Ready
```

---

## Registry

### FLOW-001 · Orders → Production → Kitchen

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified** |
| **Canonical question** | ¿Puede un compromiso operativo convertirse en trabajo ejecutado sin romper ninguna Foundation Law? |
| **Chain** | Order → Production → Kitchen → Execution Completed |
| **Context** | Identity · Customer |
| **Facades** | OrderFacade · ProductionFacade · KitchenExecutionFacade |
| **Harness** | `src/flows/flow-001/Flow001Harness.ts` · `useFlow001()` |
| **Contract** | [OPERATIONAL_FLOW_001](../05-architecture/OPERATIONAL_FLOW_001.md) |
| **ADR** | [0074](../adr/0074-operational-flow-001.md) · [0075](../adr/0075-operational-flow-001-harness.md) · [0076](../adr/0076-operational-flow-001-engineering-certification.md) |
| **Validation** | [FLOW_001_VALIDATION_REPORT](../10-validation/FLOW_001_VALIDATION_REPORT.md) · 12 PASS · 0 FAIL |
| **Owns** | Transitions · context · integrity · evidence · lifecycle consistency |
| **Never owns** | Business logic · UI · Delivery · Billing |
| **Next** | Flow Demo → Roadmap Review (Delivery gated) |

```text
FLOW-001
████ Architecture
████ Harness
████ Engineering Certified
░░░░ Flow Demo

Order ──Facade──▶ Production ──Facade──▶ Kitchen
         ▲              ▲                    ▲
         └──────── Flow001Harness ───────────┘
```

---

### FLOW-002 · Production → Kitchen → Delivery

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| **Canonical question** | ¿Puede el trabajo ejecutado convertirse en trabajo entregable? |
| **Chain** | Production → Kitchen → Delivery |
| **Notes** | Begins only after FLOW-001 cycle (prefer Demo). Requires Delivery Capability. |

---

### FLOW-003 · Delivery → Billing

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| **Canonical question** | ¿Puede el trabajo entregado convertirse en resultado económico? |
| **Chain** | Delivery → Billing |
| **Notes** | Begins after FLOW-002. Requires Billing Capability. |

---

## Discipline

Never open two new Operational Flows at once.  
Complete **Architecture → Harness → Certification → Demo** for FLOW-001 before FLOW-002 Architecture.

---

## Relationship to Capability Registry

| Capability Registry | Flow Registry | Journey Registry |
|---------------------|---------------|------------------|
| Pieces | Collaborations | (Reserved) compositions of Flows |
| One question per Capability | One question per Flow | Future |
| LAW 001–006-A | LAW 007 (+ all prior) | — |

Journey placeholder: [OPERATIONAL_JOURNEY_REGISTRY](./OPERATIONAL_JOURNEY_REGISTRY.md)
