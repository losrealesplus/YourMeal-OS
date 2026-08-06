# Operational Dependency Graph

**Permanent · updated 2026-08-06 with ADR [0070](../adr/0070-kitchen-execution-capability.md) · LAW 005**  
**Companions:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md)

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
               Billing
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
| Delivery | Operational Execution | Pending | Kitchen Execution | Billing |
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
| Delivery | ¿Qué trabajo debe entregarse ahora? |
| Billing | ¿Qué trabajo puede cerrarse y facturarse? |

---

## Discipline

Never open two new operational capabilities at once.  
Complete **Architecture → Facade → Engineering Certification → Capability Demo** before the next node.
