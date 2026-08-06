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
**Method (unchanged):** Observe → Design → Freeze → Facade → Engineering Certification → Flow Demo  
**Law:** [FOUNDATION LAW 007](../05-architecture/FOUNDATION_LOCK.md) — Flows never bypass Capabilities / Facades.

---

## Maturity (same ladder as Capabilities)

```text
Architecture
    ↓
Facade
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
| **Maturity** | **Architecture** |
| **Canonical question** | ¿Puede un compromiso operativo convertirse en trabajo ejecutado sin romper ninguna Foundation Law? |
| **Chain** | Order → Production → Kitchen → Execution Completed |
| **Context** | Identity · Customer |
| **Facades** | OrderFacade · ProductionFacade · KitchenExecutionFacade |
| **Contract** | [OPERATIONAL_FLOW_001](../05-architecture/OPERATIONAL_FLOW_001.md) |
| **ADR** | [0074](../adr/0074-operational-flow-001.md) |
| **Owns** | Transitions · context · integrity · evidence · lifecycle consistency |
| **Never owns** | Business logic · UI · Delivery · Billing |
| **Next** | Facade / harness (Phase 2) |

```text
FLOW-001
████ Architecture
░░░░ Facade · Certification · Demo

Order ──Facade──▶ Production ──Facade──▶ Kitchen
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
Complete **Architecture → Facade → Certification → Demo** for FLOW-001 before FLOW-002 Architecture.

---

## Relationship to Capability Registry

| Capability Registry | Flow Registry |
|---------------------|---------------|
| Pieces | Collaborations |
| One question per Capability | One question per Flow |
| LAW 001–006-A | LAW 007 (+ all prior) |
