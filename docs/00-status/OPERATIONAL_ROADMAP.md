# Operational Roadmap

**Permanent control panel · frozen structure 2026-08-06**  
**Companions:** [PLATFORM_STATUS](./PLATFORM_STATUS.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md)

---

## Product stack (current drawing)

```text
YourMeal OS

Platform
        │
Foundation
        │
Operational Capabilities
        │
Operational Experience
        │
Operational Validation
        │
Production (execution layer · then Kitchen · Delivery · Billing)
```

We no longer draw Developer Platform → Product Core → EatClean as the main spine.  
Those exist. The spine is **capabilities that a real business uses**.

---

## Capability Type map

| Capability | Type | Maturity |
|------------|------|----------|
| Identity | Context | Engineering Certified |
| Customers | Business Entity | Engineering Certified + Demo |
| Orders | Operational Process | Engineering Certified + Demo |
| **Production** | **Operational Execution** | **Architecture (ADR 0066)** |
| Kitchen | Operational Execution | Pending |
| Delivery | Operational Execution | Pending |
| Billing | Operational Outcome | Pending |

---

## Orders track (pattern certified)

```text
Order Architecture → Facade → Validate → Workspace Demo
✅ Engineering Certified + Operational Experience consumes Order
```

---

## Production track (OPERATIONAL-004)

```text
Production Architecture (ADR 0066)   ✅ Freeze
        ↓
Production Facade
        ↓
Production Validation
        ↓
Production Workspace Demo
        ↓
Kitchen Capability Architecture
```

```text
Production = planificación que transforma Orders en trabajo ejecutable.
Production never cooks.
Kitchen executes.
```

Canonical question: **¿Qué trabajo debe ejecutarse para cumplir los compromisos operativos?**

Language: **certify Production Capability** — not “develop Production”.

---

## Operational Engine v1.0 (named milestone)

See [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md).

Declared when Identity · Customers · Orders · Production · Kitchen · Delivery · Billing are Engineering Certified.

That is when YourMeal OS models a catering operation **end to end**.

---

## Success question

> **¿Qué capacidades operativas están certificadas y cuáles están siendo utilizadas por un negocio real?**

---

## Near-term sequence

1. ~~Order Workspace Demo~~ ✅ ADR 0065  
2. ~~Production Capability Architecture~~ ✅ ADR 0066  
3. **Production Facade** (OPERATIONAL-004 Phase 2)  
4. Kitchen Capability Architecture (execution)  
5. Delivery · Billing  
6. Field Validation (EatClean as first tenant of the pattern)

```text
YourMeal OS → Capability → Operational Pattern → Tenant → EatClean
```

EatClean is the first consumer — not the product.

Detail panel: [OPERATIONAL_MODULES](./OPERATIONAL_MODULES.md) · [OPERATIONAL_EXPERIENCE](./OPERATIONAL_EXPERIENCE.md)
