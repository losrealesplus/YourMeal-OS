# CUSTOMER EXPERIENCE 001

**Status:** ▶ **ACTIVE** — first Experience Sprint of Era 2  
**Type:** Experience Sprint (build) — **not** Observation Sprint  
**Mission:** **Zero Friction Customer Management**  
**Declared:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · 002 · **EXPERIENCE LAW 001** · **EXPERIENCE MANIFESTO 001** · TENANT SUCCESS LAW 001 · **001-A** · TEAM LAW 001  
**ADR:** [0096](../adr/0096-tenant-success-law-001a.md) · [0098](../adr/0098-experience-law-001.md) · [0099](../adr/0099-experience-manifesto-001.md)  
**Phase 1:** ▶ [CUSTOMER_EXPERIENCE_001_PHASE1](./CUSTOMER_EXPERIENCE_001_PHASE1.md) — Experience above Facade  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md)  
**Manifesto:** [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md)  
**Missions board:** [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)  
**Prompt:** [ERA2_EXPERIENCE_PROMPT](./ERA2_EXPERIENCE_PROMPT.md)  
**Surface:** `/admin/customer-workspace` · `useCustomer()` only (LAW 003)  
**Capability (frozen):** Customer · Engineering Certified — we improve **Experience**, not Architecture

```text
EXPERIENCE MANIFESTO 001

A great Experience is invisible.
The operator should think about the customer,
not about the software.
The software succeeds when it disappears.
```

```text
Mission

Zero Friction Customer Management

Do not think about CRUD.
Think about an operator who has thirty seconds.
```

```text
The question is not:
"How do we manage customers?" / "What fields are missing?"

The question is:
"What is the minimum so the operator can keep working?"
"How do we get an operator to register a customer
in under 30 seconds?"
```

---

## Time-to-Action (TTA) KPIs

We do not measure screens. We measure work.

| KPI | Target |
|-----|--------|
| **Time-to-Create Customer (TTC)** | **&lt; 30 seconds** |
| Time-to-Find Customer | &lt; 10 seconds |
| Time-to-Edit Frequent Data | &lt; 20 seconds |
| Clicks to Create | ≤ 6 |
| Keyboard-only completion | Yes |
| Mouse travel | Minimum |

None of these mention React or Supabase. All mention the job.

---

## Ideal create flow (EXPERIENCE LAW 001)

The screen does **not** open empty. It opens with one question:

```text
¿Qué tipo de cliente vas a crear?
○ Particular
○ Empresa
○ Empleado de empresa
```

Then:

```text
Name → Phone → Delivery Address → Save → Done
```

Target: **&lt; 30 seconds**. Only fields relevant to the chosen type.

Later (Progressive Completion): preferences · allergies · notes · billing · employees · tags.

Do **not** load the operator with a full dossier on first contact.

---

## Why this sprint exists now

TENANT SUCCESS LAW **001-A**: never observe unfinished workflows.  
Isabella Observation waits until the Experience chain is realistically usable.

This sprint **builds** Zero Friction Customer Management so later observation measures real work.

---

## In scope

* Minimal create wizard (Particular / Empresa → name → phone → address → save)  
* Search / find toward &lt; 10s  
* Segment filter (Individual · Company)  
* Progressive Completion — later fields deferred  
* Honest UI for Edit while substrate catches up  
* Facade-only (LAW 003)  

---

## Out of scope

* New Capability · Foundation · Engine reopen  
* Full CRM dossier on create  
* Isabella / Sara Observation  
* Orders · Menus · Accelerators · AI  
* Mixing Observation Sprint into this Experience Sprint  

---

## Definition of Done

Engineering Evidence: Facade-only · LAW 003 · integrity specs.  

TTA Evidence (dogfood / stopwatch):

* TTC toward **&lt; 30s** on the minimal path  
* Clicks to Create ≤ 6 on happy path  
* Keyboard-only path possible  
* Operator does not need a full dossier to continue working  
* Operator thinks about the customer — not the software (Manifesto)  

PR must include **Operational Time Saved** (current ≈ · new ≈ · saving ≈ · Observation Sprint measurement method).

Full tenant Observation evidence waits for LAW 001-A gate.

---

## Related

* [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)  
* [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)  
* [OBSERVATION_FRAMEWORK](../tenant-success/OBSERVATION_FRAMEWORK.md)  
* [CUSTOMER_CAPABILITY](../05-architecture/CUSTOMER_CAPABILITY.md)
