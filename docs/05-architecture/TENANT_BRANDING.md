# Tenant Branding — Current Model

> **Status:** Accepted · **Scope:** YourMeal OS platform · **Audience:** Product, Architecture, Frontend, Tenant Operations  
> **Related:** [ADR-0014](../adr/0014-customer-application-is-tenant-branded.md) · [Brand Contract](./BRAND_CONTRACT.md) · [OM · Tenant Brand](../17-operational-model/02-core-objects/tenant-brand.md) · [Experience Spec](./TENANT_EXPERIENCE_SPEC.md)

---

## Purpose

Define how a tenant **appears and is recognized** inside YourMeal OS — identity that is **owned by the tenant**, **governed by the platform**, and **consumed by Experience**.

This is **not** a UI style guide for one brand. It is the **current branding model** of the platform.

---

## Evolution (locked)

| Stage | Meaning | Status |
|-------|---------|--------|
| **Hardcoded Brand** | Visual identity embedded in code / theme | Superseded for product path |
| **Tenant-Branded Experience** | Identity applied via Theme / BrandConfig / assets | Accepted (ADR-0014) |
| **Tenant-Managed Branding** | Identity editable by tenant under platform contract + runtime | **Current model** |

`Tenant-Branded` remains the **experience principle**.  
`Tenant-Managed` is the **operating model** for how brand is maintained.

---

## What Tenant Branding Includes

| Layer | Responsibility |
|-------|----------------|
| **Brand identity** | Name, logo, colors, typography, voice cues |
| **Brand assets** | Logos, hero, favicon, media references |
| **BrandConfig** | Structured tokens consumed by Theme / Experience |
| **Brand Continuity** | Same identity across Customer App, Entry, Centro de Operaciones |
| **Brand Recognition** | User can answer “whose product is this?” without reading nav chrome |

What it does **not** include: inventing FOPEBA concepts, changing Core Objects, or bypassing RBAC / Services.

---

## Current Architecture Cycle

```text
Tenant Brand (entity)
        │
        ▼
BrandingService
        │
        ▼
TenantBrandRepository
        │
        ▼
BrandConfig
        │
        ▼
Theme / Experience
        │
        ▼
Customer App · Login / Entry · Centro de Operaciones
```

| Component | Role |
|-----------|------|
| **Tenant Brand** | Persisted brand state for the tenant |
| **BrandingService** | Application service — validates contract, applies updates |
| **TenantBrandRepository** | Persistence boundary for brand data |
| **BrandConfig** | Runtime config object for Theme / Experience |
| **Theme / Experience** | Applies BrandConfig to surfaces |
| **Surfaces** | Customer App, Entry, Operations Center |

**Capability:** `brand.manage` — who may edit tenant brand (see [RBAC](../03-rbac/CAPABILITY_MATRIX.md)).

---

## Brand Continuity Rule

Brand Continuity is **mandatory** for Pilot Ready:

```text
Customer App  ↔  Login / Entry  ↔  Centro de Operaciones
```

Same brand family; no orphan admin chrome; no second product identity.  
See [Brand Continuity Locked](../21-product-materialization/EATCLEAN_BRAND_CONTINUITY_LOCKED.md) and ACT-001 (Experience Baseline Frozen).

---

## Brand Recognition Filter

Before shipping a tenant surface, ask:

> If we remove the navigation chrome, can the user still recognize **whose product** this is?

If not, branding is incomplete for that surface.

---

## Governance Artifacts

| Artifact | Role |
|----------|------|
| [ADR-0014](../adr/0014-customer-application-is-tenant-branded.md) | Architecture decision — Tenant-Branded → Tenant-Managed |
| [Brand Contract](./BRAND_CONTRACT.md) | What tenants may change vs platform-owned |
| [Brand Validation Checklist](./BRAND_VALIDATION_CHECKLIST.md) | Gate before Pilot / release |
| [OM · Tenant Brand](../17-operational-model/02-core-objects/tenant-brand.md) | L3 object — fields, invariants, service boundary |
| [Experience Spec](./TENANT_EXPERIENCE_SPEC.md) | Surfaces + recognition filter |
| EatClean implementation notes | Tenant-specific application — not the platform contract |

---

## Frozen Boundary

**Tenant Branding** (contract + runtime model above) is part of **Foundation of Materialization — Frozen v1**.

Further changes require:

1. Explicit product / architecture decision  
2. Update to Brand Contract and/or ADR-0014  
3. Evidence that Continuity + Recognition still hold  

Cosmetic EatClean tweaks that stay inside Brand Contract do **not** reopen this model.

---

## Related Reading

- [Four Layers](./FOUR_LAYERS.md) — where Materialization sits in the system map  
- [Pilot Execution Guide](../18-operational-validation/PILOT_EXECUTION_GUIDE.md) — next phase: demonstrate, not redesign branding  
