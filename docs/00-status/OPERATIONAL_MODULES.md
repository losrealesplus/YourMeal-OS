# Operational Modules

**Phase:** OPERATIONAL (post Platform + Foundation)  
**Methodology (permanent):** Observe → Design → Freeze → Facade → Validate → UI → Smoke → Release  
**Panel:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) — Maturity + Completeness

**First capability:** [OPERATIONAL-001 Identity](../05-architecture/IDENTITY_CAPABILITY.md) · ADR [0055](../adr/0055-identity-capability.md)–[0057](../adr/0057-identity-validation.md) · [Validation Report](../10-validation/IDENTITY_VALIDATION_REPORT.md)  
**Second:** [OPERATIONAL-002 Customers](../05-architecture/CUSTOMER_CAPABILITY.md) · ADR [0058](../adr/0058-customer-capability.md)–[0060](../adr/0060-customer-validation.md) · [Validation Report](../10-validation/CUSTOMER_VALIDATION_REPORT.md) · **Engineering Certified**

---

## Nomenclature

```text
YourMeal OS
├── Platform              Developer Platform v1.0 (frozen)
├── Foundation            Product Core Foundation (engineering-validated)
└── Operational Modules   Business capabilities (this phase)
```

We do **not** ship “screens”. We ship **capabilities**.

| Avoid | Prefer |
|-------|--------|
| Orders Screen | Order Capability |
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
Completeness: Architecture → Facade → Validation → UI → Field → Production
```

```text
Operational Modules

001 Identity
██████████████████  Engineering Certified (ADR 0057)
                    field smoke ░░ OPPO checklist

002 Customers
██████████████████  Engineering Certified (ADR 0060)
                    UI ░░ next (Law 003) · field smoke ░░

003 Orders
████░░░░░░░░░░░░  Pending · ¿Qué hay que preparar?

004 Production
██░░░░░░░░░░░░░░

005 Kitchen
░░░░░░░░░░░░░░░░

006 Inventory
░░░░░░░░░░░░░░░░

007 Delivery
░░░░░░░░░░░░░░░░

008 Billing
░░░░░░░░░░░░░░░░
```

Each module follows:

```text
Observe → Design → Freeze → Facade → Validate → UI → Smoke → Release
```

EatClean lens: save time and reduce errors in weekly catering ops — not a generic CRM.

---

## Why Identity first

Authentication asks: *who are you?*  
Identity asks: *who / tenant / permissions / workspace / branding / locale / flags / preferences / operational actor?*

Everything else depends on that answer.

## Why Customer second

Customer asks: *who generates demand?* (Demand Party — particular, empresa, gimnasio, partner…)  
Not: *how do we store a client row?*

- **FOUNDATION LAW 002:** one Facade per capability; never expose storage.  
- **FOUNDATION LAW 003:** screens never own business logic.

Next: Customer UI on Facade · then Orders Architecture.
