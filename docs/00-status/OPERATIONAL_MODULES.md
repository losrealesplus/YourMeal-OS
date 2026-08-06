# Operational Modules

**Phase:** OPERATIONAL EXPERIENCE (post Platform + Foundation)  
**Methodology (permanent):** Observe → Design → Freeze → Facade → Validate → **Capability Demo** → UI → Smoke → Release  
**Panel:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) — Maturity + Completeness  
**Era center:** [OPERATIONAL_EXPERIENCE](./OPERATIONAL_EXPERIENCE.md) → Tenant Success

**First capability:** [OPERATIONAL-001 Identity](../05-architecture/IDENTITY_CAPABILITY.md) · ADR [0055](../adr/0055-identity-capability.md)–[0057](../adr/0057-identity-validation.md) · **Engineering Certified**  
**Second:** [OPERATIONAL-002 Customers](../05-architecture/CUSTOMER_CAPABILITY.md) · ADR [0058](../adr/0058-customer-capability.md)–[0061](../adr/0061-customer-workspace-demo.md) · **Engineering Certified** + Capability Demo

---

## Era map

```text
Platform              ██████████████████  100%
Foundation            ██████████████████  100%  (no longer the center)
Identity              ██████████████████  Engineering Certified
Customers             ██████████████████  Engineering Certified
Customers Workspace   ████░░░░░░░░░░░░░░  Capability Demo
Orders                ░░░░░░░░░░░░░░░░░░  Pending
```

---

## Nomenclature

```text
YourMeal OS
├── Platform              Developer Platform v1.0 (frozen)
├── Foundation            engineering-validated (center closed)
├── Operational Modules   Capabilities (Identity · Customers · …)
└── Operational Experience  Capability Demos → Product UI → Tenant Success
```

We do **not** ship “screens”. We ship **capabilities** — then demos that prove LAW 003.

| Avoid | Prefer |
|-------|--------|
| Orders Screen | Order Capability → Capability Demo → Product UI |
| Kitchen Page | Production / Kitchen Capability |
| Delivery UI | Delivery Capability |

---

## Golden rule

> **¿Hace que EatClean tarde menos en hacer su trabajo?**  
> Sí → entra. No → espera.

---

## Capability Maturity + Completeness

```text
Maturity:     Architecture → Facade → Engineering Certified → Field Validated → Production Ready
Completeness: Architecture → Facade → Validation → Capability Demo → Product UI → Field → Production
```

```text
Operational Modules

001 Identity
██████████████████  Engineering Certified (ADR 0057)

002 Customers
██████████████████  Engineering Certified (ADR 0060)
████ Capability Demo · /admin/customer-workspace (ADR 0061)

003 Orders
░░░░░░░░░░░░░░░░  Pending · ¿Qué hay que preparar?
```

EatClean lens: save time and reduce errors in weekly catering ops — not a generic CRM.

---

## Laws

- **LAW 002:** one Facade per capability; never expose storage.  
- **LAW 003:** screens never own business logic — Customer Workspace Demo proves it.

Next: Orders Architecture · field smoke · Tenant Success conversations.
