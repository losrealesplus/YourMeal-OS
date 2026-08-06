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
  Kitchen Execution     ✅ Facade (ADR 0071)
  Delivery              Pending

────────────────────────────

Operational Outcome
  Billing               Pending
```

**Operational Engine exists** (incomplete). LAW 005 protects layer boundaries.

---

## Capability Type map (LAW 005)

| Capability | Layer / Type | Maturity |
|------------|--------------|----------|
| Identity | Context | Engineering Certified |
| Customers | Business Entity | Engineering Certified + Demo |
| Orders | Operational Planning | Engineering Certified + Demo |
| **Production** | **Operational Planning** | **Engineering Certified + Demo** |
| **Kitchen Execution** | **Operational Execution** | **Facade** (ADR 0071) |
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

## Kitchen Execution track (OPERATIONAL-005)

```text
Architecture (ADR 0070)              ✅
Facade (ADR 0071)                    ✅ src/kitchen/
Engineering Certification            ← next
Capability Demo
```

**Operational Engine exists.** Engine Completion = Execution + Outcome.  
**LAW 006** · ExecutionUnit language · ProductionFacade only.

---

## Near-term sequence

1. ~~Production Engineering Certification~~ ✅ ADR 0068  
2. ~~Production Workspace Demo~~ ✅ ADR 0069  
3. ~~Kitchen Execution Capability Architecture~~ ✅ ADR 0070  
4. ~~Kitchen Execution Facade~~ ✅ ADR 0071  
5. **Kitchen Execution Engineering Certification** (OPERATIONAL-005 Phase 3)  
6. Delivery · Billing → [Operational Engine v1.0](./OPERATIONAL_ENGINE.md)

Official board: [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)

```text
YourMeal OS → Capability → Operational Pattern → Tenant → EatClean
```

---

## Success question

> **¿Qué capacidades operativas están certificadas y cuáles están siendo utilizadas por un negocio real?**
