# Operational Modules

**Phase:** OPERATIONAL (post Platform + Foundation)  
**Methodology (permanent):** Observe → Design → Freeze → Implement → Validate  
**First capability:** [OPERATIONAL-001 Identity](../05-architecture/IDENTITY_CAPABILITY.md) · ADR [0055](../adr/0055-identity-capability.md)

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

## Roadmap

| ID | Capability | Status |
|----|------------|--------|
| **001** | Identity | ▶ Architecture freeze (this PR) |
| 002 | Customers | ⏳ |
| 003 | Orders | ⏳ |
| 004 | Production | ⏳ |
| 005 | Kitchen | ⏳ |
| 006 | Inventory | ⏳ |
| 007 | Delivery | ⏳ |
| 008 | Billing | ⏳ |
| 009 | Analytics | ⏳ |
| 010 | Administration | ⏳ |

Each capability gets: ADR · contract · states · lifecycle · tests · smoke — **before** UI.

---

## Why Identity first

Authentication asks: *who are you?*  
Identity asks: *who / tenant / permissions / workspace / branding / locale / flags / preferences / operational actor?*

Everything else depends on that answer.
