# Operational Experience

**Declared:** 2026-08-06 · ADR [0061](../adr/0061-customer-workspace-demo.md)  
**Center of the project (from today):**

```text
YourMeal OS

Platform
        │
Foundation
        │
Operational Capabilities
        │
Operational Experience   ← we are here
        │
Operational Validation
        │
Production
        │
Tenant Success
```

---

## Era Foundation — closed as center

Foundation is **complete as the project focus**.  
We may still touch Foundation. It is no longer the protagonist.

| Layer | Status |
|-------|--------|
| Platform | 100% · frozen |
| Foundation | 100% · engineering-validated |
| Identity | Engineering Certified |
| Customers | Engineering Certified |
| Customer Workspace | Capability Demo (LAW 003) |
| Orders | **Engineering Certified** (ADR 0064) |
| Order Workspace | **Capability Demo** (ADR 0065 · LAW 003 · 004) |
| Production | **Engineering Certified** (ADR 0068) |
| Kitchen / Delivery / Billing | Pending (Kitchen after Production Demo) |

---

## Four assets

```text
Developer Platform
Foundation
Capabilities
Operational Experience   ← fourth asset (declared)
```

**FOUNDATION LAW 004:** Operational Experience consumes Capabilities. UI owns interaction only.

---

## What we measure

Not Pull Requests.

**Capabilities** — maturity + completeness.

```text
Customers
Engineering Certified
```

means more than `PR #318`.

---

## Capability Demo

Before a full module UI, each Capability should have a **minimal screen**:

```text
Facade → UI → Usuario
```

Not pretty. Not final. Enough to prove the method.

Customer Workspace Demo: `/admin/customer-workspace`

---

## Project housekeeping

```text
PROJECT HOUSEKEEPING

☑ Close orphan stacked PRs (code already on main)
☐ Delete merged remote branches (optional)
☑ Sync roadmap / registry (this doc + CAPABILITY_REGISTRY)
☐ Create GitHub milestone “Operational Experience”
```

Orphan drafts (tips already on `main`): close without merging — stacking desync, not a technical defect.

---

## Next conversations

> ¿Cómo ahorramos 20 minutos al equipo de cocina?  
> ¿Cómo reducimos errores al preparar pedidos?  
> ¿Cómo agrupamos mejor las entregas?

Technology stops being the protagonist. **Tenant Success** begins.
