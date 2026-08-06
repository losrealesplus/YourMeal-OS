# Operational Engine v1.0

**Declared:** 2026-08-06 · with ADR [0066](../adr/0066-production-capability.md)  
**Status:** **Target milestone** — not yet achieved  
**Panel:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md)

---

## Meaning

```text
Operational Engine v1.0
══════════════════════════════════════
YourMeal OS can model a catering operation
end-to-end — from who operates, through demand
and commitment, into executable work, delivery,
and settlement.
```

This is not a release tag of screens.  
It is certification of the **full operational chain**.

---

## Required certifications

| Capability | Type | Required maturity |
|------------|------|-------------------|
| Identity | Context | Engineering Certified |
| Customers | Business Entity | Engineering Certified |
| Orders | Operational Process | Engineering Certified |
| Production | Operational Execution | Engineering Certified |
| Kitchen | Operational Execution | Engineering Certified |
| Delivery | Operational Execution | Engineering Certified |
| Billing | Operational Outcome | Engineering Certified |

Capability Demos (LAW 003 · 004) expected along the path; Field Validation for EatClean seals tenant use.

---

## Progress (2026-08-06)

```text
Identity     ██████████████████████  Engineering Certified
Customers    ██████████████████████  Engineering Certified + Demo
Orders       ██████████████████████  Engineering Certified + Demo
Production   ██████████████████████  Engineering Certified
Kitchen      ░░░░░░░░░░░░░░░░░░░░░░  Pending
Delivery     ░░░░░░░░░░░░░░░░░░░░░░  Pending
Billing      ░░░░░░░░░░░░░░░░░░░░░░  Pending
```

---

## Vision

```text
YourMeal OS
        ↓
Capability
        ↓
Operational Pattern
        ↓
Tenant
        ↓
EatClean   ← first tenant of the pattern, not the product
```

When Operational Engine v1.0 is declared, a second tenant with similar operations should **configure**, not rewrite.

---

## Declaration rule

Only declare **Operational Engine v1.0** when the seven capabilities above are Engineering Certified with FAIL = 0 on their validation matrices.
