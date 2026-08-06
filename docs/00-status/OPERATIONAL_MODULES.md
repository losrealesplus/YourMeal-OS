# Operational Modules

**Phase:** OPERATIONAL EXPERIENCE (post Platform + Foundation)  
**Methodology (permanent):** Observe → Design → Freeze → Facade → Validate → **Capability Demo** → UI → Smoke → Release  
**Panel:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) — Maturity + Completeness  
**Era center:** [OPERATIONAL_EXPERIENCE](./OPERATIONAL_EXPERIENCE.md) → Tenant Success

**Certified:** Identity · Customers (+ Workspace Demo)  
**In architecture:** [Orders](../05-architecture/ORDER_CAPABILITY.md) · ADR [0062](../adr/0062-order-capability.md)

---

## Era map

```text
Platform              ██████████████████  100%
Foundation            ██████████████████  100%  (center closed)
Identity              ██████████████████  Engineering Certified
Customers             ██████████████████  Engineering Certified
Customers Workspace   ████░░░░░░░░░░░░░░  Capability Demo (method certified)
Orders                ████░░░░░░░░░░░░░░  Architecture freeze
Production            ░░░░░░░░░░░░░░░░░░  Pending
```

Four assets:

```text
Developer Platform · Foundation · Capabilities · Operational Experience
```

---

## Nomenclature

```text
YourMeal OS
├── Platform
├── Foundation              (no longer the center)
├── Operational Modules     Capabilities
└── Operational Experience  Demos → Product UI → Tenant Success
```

| Avoid | Prefer |
|-------|--------|
| Orders Screen | Order Capability |
| ecommerce Order | Weekly operational commitment |
| Kitchen Page | Production / Kitchen Capability |

---

## Golden rule

> **¿Hace que EatClean tarde menos en hacer su trabajo?**  
> Sí → entra. No → espera.

---

## Language of the business

| Capability | Question |
|------------|----------|
| Identity | ¿Quién está operando? |
| Customer | ¿Quién genera la demanda? |
| **Orders** | **¿Qué compromiso operativo hay esta semana?** |
| Production | ¿Qué hay que cocinar? |
| Delivery | ¿Qué hay que entregar? |
| Billing | ¿Qué hay que cobrar? |

Orders is the first **process** Capability — it crosses kitchen, routes, and invoices.

---

## Laws

- **LAW 002:** one Facade per capability; never expose storage.  
- **LAW 003:** screens never own business logic.  
- **LAW 004:** Operational Experience consumes Capabilities; UI owns interaction only.

Next: Order Facade · then Capability Demo · Production Architecture.
