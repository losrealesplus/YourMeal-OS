# Era 2 · Cursor Prompt Header

**Status:** ▶ **ACTIVE** — mandatory preamble for Era 2 Product Core work  
**Declared:** 2026-08-07  
**Discovery:** [ERA2_PRODUCT_DISCOVERY_001](./ERA2_PRODUCT_DISCOVERY_001.md)  
**Sprint:** [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)

Every Era 2 development prompt for Product Core should start with this header (or an equivalent that preserves every constraint).

---

## Mandatory header

```text
Context

Strategic Freeze is active.

Developer Platform is frozen.

Foundation is frozen.

Operational Engine is frozen.

Do not modify architecture.

Do not introduce new Capabilities.

Do not create new Foundation Laws.

The objective is to improve Tenant Success.

Every implementation must satisfy:

PRODUCT LAW 001
PRODUCT LAW 002
TENANT SUCCESS LAW 001
TEAM LAW 001

Also respect when observing:

TENANT SUCCESS LAW 001-A
Never observe unfinished workflows.

The question is no longer:

"How do we build this?"

The question is:

"How does this save operational time?"
```

Experience Sprints carry a visible time metric (e.g. Customer &lt; 30s).  
Observation Sprints wait until workflows are realistically usable.

---

## Then add the job

```text
Role: Isabella / Kitchen / Delivery / Admin
Job: …
Current duration: …
Friction: …
Desired duration: …
Success: Operational Evidence (Measure Again) …
Epic: Customer | Order | Menu | Production | Kitchen | Delivery (Sprint 001)
```

---

## Inaugural mission

> **We are not going to develop screens.**
>
> **We are going to design better workdays.**

---

## Related

* [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)  
* [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md)  
* ADR [0084](../adr/0084-product-law-001.md) · [0093](../adr/0093-product-law-002.md) · [0092](../adr/0092-tenant-success-law-001.md) · [0094](../adr/0094-team-law-001.md)
