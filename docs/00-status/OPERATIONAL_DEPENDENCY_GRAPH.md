# Operational Dependency Graph

**Permanent · declared 2026-08-06 with ADR [0068](../adr/0068-production-engineering-certification.md)**  
**Companions:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md)

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
              Kitchen
                  │
                  ▼
              Delivery
                  │
                  ▼
               Billing
```

---

## Layers

```text
Operational Planning
  Orders → Production

────────────────────────────

Operational Execution
  Kitchen → Delivery

────────────────────────────

Operational Outcome
  Billing
```

Context (Identity) and Business Entity (Customer) feed Planning.

---

## Node card (fields)

Each capability records:

| Field | Meaning |
|-------|---------|
| **Tipo** | Context · Business Entity · Operational Process · Execution · Outcome |
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
| Orders | Operational Process | Engineering Certified + Demo | Identity · Customer | Production |
| Production | Operational Execution | **Engineering Certified** | Identity · Orders | Kitchen |
| Kitchen | Operational Execution | Pending | Production | Delivery |
| Delivery | Operational Execution | Pending | Kitchen | Billing |
| Billing | Operational Outcome | Pending | Delivery | — |

---

## Questions (one per node)

| Capability | Question |
|------------|----------|
| Identity | ¿Quién opera? |
| Customer | ¿Quién genera la demanda? |
| Orders | ¿Qué prometimos? |
| Production | ¿Qué trabajo debemos generar? |
| Kitchen | ¿Qué trabajo estoy ejecutando? |
| Delivery | ¿Qué trabajo debo entregar? |
| Billing | ¿Qué trabajo puedo facturar? |

---

## Discipline

Never open two new operational capabilities at once.  
Complete **Architecture → Facade → Engineering Certification → Capability Demo** before the next node.
