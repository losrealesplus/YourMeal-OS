# Operational Dependency Graph

**Permanent · updated 2026-08-06 with ADR [0081](../adr/0081-operational-flow-002.md) · LAW 005 · LAW 007**  
**Companions:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md) · [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md)

---

## Graph

```text
Identity
   │
   ├──────────────┐
   ▼              ▼
Customer       Orders
                  │
                  ▼
             Production
                  │
                  ▼
         Kitchen Execution
                  │
                  ▼
              Delivery
                  │
                  ▼
          Confirmation  ← FLOW-002 ends here
                  │
                  ▼
               Billing  ← FLOW-003 / Outcome
```

---

## Operational Flows (LAW 007)

```text
FLOW-001  Order → Production → Kitchen → Execution Completed
          (Engineering Certified)

FLOW-002  Order → Production → Kitchen → Delivery → Confirmation
          (Architecture · Operational Fulfillment Flow)

FLOW-003  Confirmation → Billing
          (Pending)
```

---

## Layers (LAW 005)

```text
Context
  Identity

Business Entity
  Customer

────────────────────────────

Operational Planning
  Orders → Production

────────────────────────────

Operational Execution
  Kitchen Execution → Delivery

────────────────────────────

Operational Outcome
  Billing
```

One Capability · one layer · cross-layer only via Facade.

---

## Node card (fields)

Each capability records:

| Field | Meaning |
|-------|---------|
| **Tipo** | Context · Business Entity · Operational Planning · Operational Execution · Operational Outcome |
| **Estado / Madurez** | Pending → Architecture → Facade → Engineering Certified → … |
| **Certificación** | Validation report link when certified |
| **Dependencias** | What it consumes |
| **Consumidores** | Who consumes it (Consumida por) |

---

## Current nodes (2026-08-06)

| Capability | Tipo | Estado | Dependencias | Consumida por |
|------------|------|--------|--------------|---------------|
| Identity | Context | Engineering Certified | — | Customer · Orders · Production |
| Customer | Business Entity | Engineering Certified + Demo | Identity | Orders |
| Orders | Operational Planning | Engineering Certified + Demo | Identity · Customer | Production |
| Production | Operational Planning | **Engineering Certified + Demo** | Identity · Orders | Kitchen Execution |
| Kitchen Execution | Operational Execution | **Engineering Certified + Demo** | ProductionFacade only | Delivery |
| Delivery | Operational Execution | **Engineering Certified** | OrderFacade · KitchenExecutionFacade | Billing |
| Billing | Operational Outcome | Pending | Delivery | — |

---

## Questions (one per node)

| Capability | Question |
|------------|----------|
| Identity | ¿Quién opera? |
| Customer | ¿Quién genera la demanda? |
| Orders | ¿Qué prometimos? |
| Production | ¿Qué trabajo debemos generar? |
| Kitchen Execution | ¿Qué trabajo debe ejecutarse ahora? |
| Delivery | ¿Qué compromisos operativos deben entregarse ahora y cómo confirmamos su ejecución? |
| Billing | ¿Qué trabajo puede cerrarse y facturarse? |

---

## Discipline

Never open two new operational capabilities at once.  
Complete **Architecture → Facade → Engineering Certification → Capability Demo** before the next node.
