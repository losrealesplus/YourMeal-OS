# Experience Manifesto

**Status:** ▶ **ACTIVE** — constitution of how we think every Experience  
**Declared:** 2026-08-07  
**ADR:** [0099](../adr/0099-experience-manifesto-001.md)  
**Companions:** [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md) · [EXPERIENCE LAW 001](../adr/0098-experience-law-001.md) · [ERA2_EXPERIENCE_PROMPT](./ERA2_EXPERIENCE_PROMPT.md) · [CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md)

```text
EXPERIENCE MANIFESTO 001

A great Experience is invisible.

The operator should think about the customer,
not about the software.

The software succeeds when it disappears.
```

---

## Why this exists

We already institutionalized:

* Foundation Laws  
* Product Laws  
* Team Law  
* Tenant Success Laws  
* Experience Law 001  

The Manifesto institutionalizes the **mission of an Experience** — how we think before we write prompts or screens.

```text
Not: feature completeness
Not: CRUD
Not: beautiful dossiers

Yes: operational speed
Yes: invisible software
Yes: seconds returned
```

---

## How every Experience is written

As a **mission**, not a task list.

Example — Customer:

```text
CUSTOMER-EXPERIENCE-001
Mission: Zero Friction Customer Management
KPI: Time-to-Create Customer < 30 seconds
```

Canonical prompt shape: [ERA2_EXPERIENCE_PROMPT](./ERA2_EXPERIENCE_PROMPT.md) · mission block in [CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md).

---

## First-screen rule

The Experience must not open empty.

It opens by asking **one** decisive question that changes the form to only relevant fields.

Customer example:

```text
¿Qué tipo de cliente vas a crear?
○ Particular
○ Empresa
○ Empleado de empresa
```

Choosing an option reduces cognitive load — the operator never interprets fields they do not need.

---

## Progressive Completion

Mandatory under EXPERIENCE LAW 001.

Never require on first create: Preferences · Billing · Allergies · Company Employees · Tags · Operational Notes.

Immediate actions: Create · Search · Open · (future: Call · WhatsApp · Directions).

---

## PR obligation · Operational Time Saved

Every Experience PR must include:

```text
Operational Time Saved

Current workflow
≈ XX seconds

New workflow
≈ XX seconds

Estimated saving
≈ XX seconds

Measurement method
How this will be validated in the Observation Sprint
```

Connects PRODUCT LAW 001 · TENANT SUCCESS LAW 001 · Operational Evidence Loop.  
“This screen is better” is not enough — state **how many seconds it returns**.

See GitHub PR template · [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md).

---

## Acceptance of a great Experience

* The operator never feels blocked  
* Typing · navigation · decisions · mouse travel · repeated work are minimized  
* Creation is demonstrably faster  
* The experience feels natural  
* The operator thinks about the customer — not the software  

---

## Related

* [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)  
* [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)  
* [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md)
