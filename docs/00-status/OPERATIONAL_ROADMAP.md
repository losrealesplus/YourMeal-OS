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
| **Production** | **Operational Execution** | **Facade (ADR 0067)** |
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
Production Architecture (ADR 0066)   ✅
        ↓
Production Facade (ADR 0067)         ✅ Work language
        ↓
Production Validation                ← next
        ↓
Production Workspace Demo
        ↓
Kitchen Capability Architecture      (only after Production cycle)
```

```text
GenerateProductionPlan · GetProductionQueue · ProductionLoad
— never GetOrders / UpdateOrder / CreateOrder
```

```text
Production never cooks.
Kitchen executes.
```

**Discipline:** Never open two new operational capabilities at once.

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
3. ~~Production Facade~~ ✅ ADR 0067  
4. **Production Validation** (OPERATIONAL-004 Phase 3)  
5. Production Workspace Demo  
6. Kitchen Capability Architecture (execution)  
7. Delivery · Billing → [Operational Engine v1.0](./OPERATIONAL_ENGINE.md)

```text
YourMeal OS → Capability → Operational Pattern → Tenant → EatClean
```

EatClean is the first consumer — not the product.

Detail panel: [OPERATIONAL_MODULES](./OPERATIONAL_MODULES.md) · [OPERATIONAL_EXPERIENCE](./OPERATIONAL_EXPERIENCE.md)
