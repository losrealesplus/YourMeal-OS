# Operational Roadmap

**Permanent control panel · frozen structure 2026-08-06**  
**Companions:** [PLATFORM_STATUS](./PLATFORM_STATUS.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) · [OPERATIONAL_DEPENDENCY_GRAPH](./OPERATIONAL_DEPENDENCY_GRAPH.md)

---

## Product stack

```text
YourMeal OS
Platform → Foundation → Operational Capabilities
→ Operational Experience → Operational Validation → Production Ready
```

---

## Operational model (not just a roadmap)

```text
Identity → ¿Quién opera?
Customer → ¿Quién genera la demanda?
Orders → ¿Qué prometimos?
Production → ¿Qué trabajo debemos generar?
Kitchen → ¿Qué trabajo estoy ejecutando?
Delivery → ¿Qué trabajo debo entregar?
Billing → ¿Qué trabajo puedo facturar?
```

---

## Layers

```text
Operational Planning
  Orders → Production   ✅ Certified

────────────────────────────

Operational Execution
  Kitchen → Delivery    Pending

────────────────────────────

Operational Outcome
  Billing               Pending
```

---

## Capability Type map

| Capability | Type | Maturity |
|------------|------|----------|
| Identity | Context | Engineering Certified |
| Customers | Business Entity | Engineering Certified + Demo |
| Orders | Operational Process | Engineering Certified + Demo |
| **Production** | **Operational Execution** | **Engineering Certified** |
| Kitchen | Operational Execution | Pending |
| Delivery | Operational Execution | Pending |
| Billing | Operational Outcome | Pending |

---

## Official rhythm (repeat forever)

```text
Architecture
    ↓
Facade
    ↓
Engineering Certification
    ↓
Capability Demo
    ↓
Operational Experience
```

Language: **certify** capabilities — not “develop screens”.

---

## Production track (OPERATIONAL-004)

```text
Architecture (ADR 0066)              ✅
Facade (ADR 0067)                    ✅
Engineering Certification (ADR 0068) ✅
Capability Demo                      ← next
Kitchen Capability                   after Demo (discipline)
```

```text
GenerateProductionPlan → ProductionQueue → ProductionLoad
Production never cooks. Kitchen executes.
```

---

## Near-term sequence

1. ~~Production Engineering Certification~~ ✅ ADR 0068  
2. **Production Workspace Demo**  
3. Kitchen Capability Architecture  
4. Delivery · Billing → [Operational Engine v1.0](./OPERATIONAL_ENGINE.md)

```text
YourMeal OS → Capability → Operational Pattern → Tenant → EatClean
```

---

## Success question

> **¿Qué capacidades operativas están certificadas y cuáles están siendo utilizadas por un negocio real?**
