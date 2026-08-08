# CUSTOMER EXPERIENCE 001

**Status:** ▶ **ACTIVE** — first Experience Sprint of Era 2  
**Type:** Experience Sprint (build) — **not** Observation Sprint  
**Declared:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · 002 · TENANT SUCCESS LAW 001 · **001-A** · TEAM LAW 001  
**ADR:** [0096](../adr/0096-tenant-success-law-001a.md)  
**Surface:** `/admin/customer-workspace` · `useCustomer()` only (LAW 003)  
**Capability (frozen):** Customer · Engineering Certified — we improve **Experience**, not Architecture

```text
Objetivo

Reducir el tiempo de alta y gestión de clientes
por debajo de 30 segundos
para las tareas más frecuentes.
```

```text
The question is not:
"How do we manage customers?"

The question is:
"How do we get an operator to register a customer
in under 30 seconds?"
```

---

## Why this sprint exists now

TENANT SUCCESS LAW **001-A**: never observe unfinished workflows.

Isabella Observation waits until Customer · Order · Menu · Production · Kitchen · Delivery are **realistically usable**.  
Observing today would measure missing edit/menu/import — not operational friction.

This sprint **builds** a coherent Customer Experience so later observation measures the real job.

---

## Time objective (visible metric)

| Job | Target |
|-----|--------|
| Alta / gestión frecuente de cliente | **&lt; 30 seconds** |

Future Experience metrics (not this sprint):

| Experience | Target |
|------------|--------|
| Order | &lt; 45 seconds |
| Menu | &lt; 2 minutes |
| Production | &lt; 1 minute |
| Kitchen | &lt; 10 seconds |
| Delivery (route ready) | &lt; 2 minutes |

---

## In scope

* Search / list with segment (Individual · Company · all)  
* Alta empresa (CreateCustomer · provision) via Facade  
* Asegurar cliente de sesión (individual)  
* Ficha legible: estado · canal · email · tags · direcciones/prefs/alérgenos cuando existan  
* Honest UI for Edit / Restore while UNIMPLEMENTED (do not fake)  
* Reduce clicks / screens / doubt on the happy path toward &lt; 30s  

---

## Out of scope

* New Capability · Foundation · Engine reopen  
* Inventing UpdateCustomer substrate without a deliberate Experience decision  
* Isabella / Sara Observation sessions  
* Orders · Menus · Accelerators · Import Pipeline · AI  
* Mixing Observation Sprint into this Experience Sprint  

---

## Definition of Done

Engineering Evidence: Facade-only · LAW 003 · tests for integrity.  

Operational Evidence (internal / dogfood first):

* Frequent alta/gestión path timed toward **&lt; 30s**  
* Operator does not need to “think about the database”  
* Unfinished actions remain visibly unfinished (no false completion)

Full tenant observation evidence waits for LAW 001-A gate (usable workflow chain).

---

## Prompt header (this sprint)

```text
CUSTOMER EXPERIENCE 001

Strategic Freeze is active.
Foundation · Developer Platform · Operational Engine are frozen.
Do not introduce new Capabilities.
Do not modify Foundation Laws.

PRODUCT LAW 001 · 002
TENANT SUCCESS LAW 001 · 001-A
TEAM LAW 001

Question:
How does this help an operator register or manage a customer
in under 30 seconds?

Surface: /admin/customer-workspace · useCustomer() only.
```

---

## Related

* [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)  
* [OBSERVATION_FRAMEWORK](../tenant-success/OBSERVATION_FRAMEWORK.md)  
* [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md)  
* [CUSTOMER_CAPABILITY](../05-architecture/CUSTOMER_CAPABILITY.md)
