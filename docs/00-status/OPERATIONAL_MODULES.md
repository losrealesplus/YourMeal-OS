# Operational Modules

**Phase:** OPERATIONAL (post Platform + Foundation)  
**Methodology (permanent):** Observe → Design → Freeze → Implement → Validate  
**First capability:** [OPERATIONAL-001 Identity](../05-architecture/IDENTITY_CAPABILITY.md) · ADR [0055](../adr/0055-identity-capability.md)–[0057](../adr/0057-identity-validation.md) · [Validation Report](../10-validation/IDENTITY_VALIDATION_REPORT.md)

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

```text
Operational Modules

001 Identity
██████████████████  engineering certified (ADR 0057)
                    field smoke ░░ OPPO checklist

002 Customers
████░░░░░░░░░░░░░░ Architecture freeze (ADR 0058)
                    next: Facade

003 Orders
░░░░░░░░░░░░░░░░

004 Production
░░░░░░░░░░░░░░░░

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
