# Operational Roadmap

**Permanent control panel · updated 2026-08-06 with ADR [0073](../adr/0073-kitchen-workspace-demo.md)**  
**Companions:** [OPERATIONAL_CERTIFICATION_PHASES](./OPERATIONAL_CERTIFICATION_PHASES.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md)

---

## Certification phases (project language)

```text
PHASE A · Capability Certification
████████████████████
COMPLETE

↓

PHASE B · Operational Flow Validation
████████░░░░░░░░░░░
FLOW-001 Harness ✅ · Certification next

↓

PHASE C · Real Tenant Validation
░░░░░░░░░░░░░░░░░░░
```

Full detail: [OPERATIONAL_CERTIFICATION_PHASES](./OPERATIONAL_CERTIFICATION_PHASES.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)

---

## Operational Grammar (LAW 006)

```text
Identity → ¿Quién opera?
Customer → ¿Quién genera la demanda?
Orders → ¿Qué prometimos?
Production → ¿Qué trabajo debemos generar?
Kitchen → ¿Qué trabajo debe ejecutarse ahora?
Delivery → ¿Qué trabajo debe entregarse ahora?
Billing → ¿Qué trabajo puede cerrarse y facturarse?
```

---

## Layers

```text
Operational Planning
  Orders → Production   ✅ Certified + Demo

────────────────────────────

Operational Execution
  Kitchen Execution     ✅ Certified + Demo (final isolated)
  Delivery              Pending (via FLOW-002)

────────────────────────────

Operational Outcome
  Billing               Pending (via FLOW-003)
```

---

## Capability Type map (LAW 005)

| Capability | Layer / Type | Maturity |
|------------|--------------|----------|
| Identity | Context | Engineering Certified |
| Customers | Business Entity | Engineering Certified + Demo |
| Orders | Operational Planning | Engineering Certified + Demo |
| Production | Operational Planning | Engineering Certified + Demo |
| **Kitchen Execution** | **Operational Execution** | **Engineering Certified + Demo** |
| Delivery | Operational Execution | Pending |
| Billing | Operational Outcome | Pending |

---

## Kitchen Execution track (OPERATIONAL-005) · CLOSED

```text
Architecture (ADR 0070)              ✅
Facade (ADR 0071)                    ✅
Engineering Certification (ADR 0072) ✅
Capability Demo (ADR 0073)           ✅ /admin/kitchen-workspace
```

**Phase A complete through Kitchen.** Pattern no longer needs re-demonstration.

---

## Phase B · Operational Flows (LAW 007)

| Flow | Chain | Status | Question |
|------|-------|--------|----------|
| **OPERATIONAL-FLOW-001** | Orders → Production → Kitchen | **Harness** (ADR 0075) | ¿Puede un compromiso convertirse en trabajo ejecutado sin romper leyes? |
| **OPERATIONAL-FLOW-002** | Production → Kitchen → Delivery | Pending | ¿Puede el trabajo ejecutado convertirse en entregable? |
| **OPERATIONAL-FLOW-003** | Delivery → Billing | Pending | ¿Puede lo entregado convertirse en resultado económico? |

Every transition via certified Facades only — never bypass.

### FLOW-001 track

```text
Architecture (ADR 0074)              ✅
Harness (ADR 0075)                   ✅ src/flows/flow-001/
Engineering Certification            ← next
Flow Demo
```

Contract: [OPERATIONAL_FLOW_001](../05-architecture/OPERATIONAL_FLOW_001.md)

---

## Near-term sequence

1. ~~OPERATIONAL-FLOW-001 Architecture~~ ✅ ADR 0074  
2. ~~OPERATIONAL-FLOW-001 Harness~~ ✅ ADR 0075  
3. **OPERATIONAL-FLOW-001 Engineering Certification**  
4. FLOW-001 Demo → FLOW-002 / Delivery  

Official board: [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)

```text
YourMeal OS → Capability → Flow → Operational Pattern → Tenant → EatClean
```

---

## Success question

> **¿Qué capacidades están certificadas y qué flujos operativos colaboran sin romper las Foundation Laws?**
