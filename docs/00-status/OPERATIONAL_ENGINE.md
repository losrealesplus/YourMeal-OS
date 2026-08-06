# Operational Engine

**Declared exists:** 2026-08-06 · with ADR [0070](../adr/0070-kitchen-execution-capability.md)  
**v1.0 status:** **Target milestone** — not yet achieved  
**Panel:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md)

---

## Official declaration

```text
Operational Engine ya existe.

No está completo.
Pero ya existe.

Y eso cambia la historia de YourMeal OS.
```

Until now we modelled:

```text
Quién → Qué → Trabajo (planificado)
```

Now we model:

```text
Ejecución
```

---

## Meaning

```text
Operational Engine
══════════════════════════════════════
YourMeal OS can already model Context,
Business Entity, and Operational Planning
end-to-end — and has frozen the first
Operational Execution capability.

v1.0 completes the chain through Delivery
and Billing certification.
```

This is not a release tag of screens.  
It is the living certification of the **operational chain**.

---

## Required certifications for v1.0

| Capability | Layer | Required maturity |
|------------|-------|-------------------|
| Identity | Context | Engineering Certified |
| Customers | Business Entity | Engineering Certified |
| Orders | Operational Planning | Engineering Certified |
| Production | Operational Planning | Engineering Certified |
| Kitchen Execution | Operational Execution | Engineering Certified |
| Delivery | Operational Execution | Engineering Certified |
| Billing | Operational Outcome | Engineering Certified |

Capability Demos (LAW 003 · 004) expected along the path; Field Validation for EatClean seals tenant use.

---

## Progress (2026-08-06)

```text
Identity           ██████████████████████  Engineering Certified
Customers          ██████████████████████  Engineering Certified + Demo
Orders             ██████████████████████  Engineering Certified + Demo
Production         ██████████████████████  Engineering Certified + Demo
Kitchen Execution  ██████████████████████  Engineering Certified (ADR 0072)
Delivery           ░░░░░░░░░░░░░░░░░░░░░░  Pending
Billing            ░░░░░░░░░░░░░░░░░░░░░░  Pending
```

---

## Engine Completion (framing)

```text
Context                 ████████████████
Business Entity         ████████████████
Operational Planning    ████████████████
Operational Execution   ████████░░░░░░░░  (Kitchen Certified)
Operational Outcome     ░░░░░░░░░░░░░░░░
```

Prefer **Engine Completion** language over a feature roadmap when communicating product status.

After Kitchen Demo → **Operational Flow Validation** (Production → Kitchen → Delivery).

---

## Operational Model (permanent · LAW 005)

```text
Context
        │
        ▼
Business Entity
        │
        ▼
Operational Planning
        │
        ▼
Operational Execution
        │
        ▼
Operational Outcome
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

When Operational Engine **v1.0** is declared, a second tenant with similar operations should **configure**, not rewrite.

---

## Declaration rules

| Declaration | When |
|-------------|------|
| **Operational Engine exists** | Context + Business Entity + Operational Planning are Engineering Certified (✅ now) |
| **Operational Engine v1.0** | All seven capabilities above are Engineering Certified with FAIL = 0 on their validation matrices |
