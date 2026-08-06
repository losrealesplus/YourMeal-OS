# Operational Roadmap

**Permanent control panel · frozen structure 2026-08-06**  
**Companions:** [PLATFORM_STATUS](./PLATFORM_STATUS.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md)

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
Production
```

We no longer draw Developer Platform → Product Core → EatClean as the main spine.  
Those exist. The spine is **capabilities that a real business uses**.

---

## Capability Type map

| Capability | Type | Maturity |
|------------|------|----------|
| Identity | Context | Engineering Certified |
| Customers | Business Entity | Engineering Certified + Demo |
| **Orders** | **Operational Process** | **Engineering Certified** |
| Production | Operational Execution | Pending (authorized to start) |
| Kitchen | Operational Execution | Pending |
| Delivery | Operational Execution | Pending |
| Billing | Operational Outcome | Pending |

---

## Orders track (pattern certified)

```text
Order Architecture (ADR 0062)
        ↓
Order Facade (ADR 0063)
        ↓
Order Validation (ADR 0064)     ✅ Engineering Certified
        ↓
Order Workspace Demo            ← next
        ↓
Engineering Certified + Demo
        ↓
Production Capability
```

Same pattern as Identity and Customers. Consistency is an advantage.

---

## After Orders

**Production** is not an admin process.  
It is the first capability that models the **physical work** of the company:

- lots  
- preparation  
- kitchen states  
- timing  
- planning  

Then YourMeal OS stops being “order software” and becomes **the operating system of an organized kitchen**.

---

## Success question

> **¿Qué capacidades operativas están certificadas y cuáles están siendo utilizadas por un negocio real?**

---

## Near-term sequence

1. Order Workspace Demo (LAW 003 proof for process Capability)  
2. Production Capability Architecture  
3. Kitchen · Delivery · Billing (consume OrderFacade only)  
4. Field Validation (EatClean)  
5. Production Ready

Detail panel: [OPERATIONAL_MODULES](./OPERATIONAL_MODULES.md) · [OPERATIONAL_EXPERIENCE](./OPERATIONAL_EXPERIENCE.md)
