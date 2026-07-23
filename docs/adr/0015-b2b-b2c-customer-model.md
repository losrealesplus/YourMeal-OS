# ADR 0015 — B2B / B2C Customer Model Separation

**Status:** Accepted  
**Date:** 2026-07-23  
**Deciders:** Product · Architecture · FOPEBA  
**Supersedes:** — (structural correction of Customer demand model)  
**Related:** [OM Actors](../17-operational-model/01-ubiquitous-language/actors.md) · [level-1-core](../17-operational-model/02-core-objects/level-1-core.md) · CAP-004

---

## Context

Pre-pilot Functional Completeness Review showed that all demand followed one registration/order path. Operationally EatClean serves two distinct demand modes:

| Mode | Who pays / contracts | Who receives | Logistics |
|------|----------------------|--------------|-----------|
| **B2C** | Consumer (particular) | Same person | Individual delivery |
| **B2B** | Company Account (empresa) | Beneficiary (empleado) | Grouped by Site / Organizational Unit |

Keeping a single undifferentiated Customer flow would force data migrations after the pilot and diverge from the Operational Model (Consumer · Company Account · Beneficiary).

This ADR is a **structural correction** of the Core demand model — not a product scope expansion. Excluded: smart routing, advanced invoicing, ERP, multi-empresa cross-tenant.

---

## Decision

### 1. Hierarchy (Tenant-scoped)

```text
Organization (Tenant · EatClean)
        ↓
Demand actors
├── Consumer          (B2C · CustomerType = individual)
└── Company Account   (B2B · Company)
        ↓
        Site
        ↓
        Organizational Unit  (tenant-labeled: Departamento | Área | Planta | …)
        ↓
        Employee Membership → Beneficiary (person CustomerType = individual)
        ↓
        Order (+ Delivery Group)
```

### 2. Language mapping (FOPEBA ↔ product)

| Product / DB | OM term |
|--------------|---------|
| CustomerType `individual` | Consumer **or** Beneficiary (person who orders) |
| Company | Company Account |
| Site | physical sede (evolves `company_locations`) |
| Organizational Unit | configurable unit (evolves `company_departments`; **not** hardcoded “Departamento”) |
| Employee Membership | Beneficiary ↔ Company Account link (evolves `company_employees`) |
| Delivery Group | minimum logistics aggregation key |

Bare `Customer` remains ambiguous in UL; in code/DB the `customers` table is the **person demand identity**. Company Account is **not** a row in `customers`.

### 3. CustomerType

Exactly one per person row:

- `individual` — places personal orders (B2C Consumer **or** B2B Beneficiary via membership)
- Legacy `company_employee` remains readable; new writes use `individual` + membership

Company Account is the `companies` entity, not a CustomerType value on the person.

### 4. Company Code

On Company create, platform generates a **tenant-unique, non-editable** `company_code` (e.g. `EC-4821`). Employees join by validating this code.

### 5. Order must answer

Every Order stores (nullable when B2C):

- `customer_id` (who ordered)
- `demand_channel` (`individual` \| `company`)
- `company_id`, `site_id`, `organizational_unit_id`
- `delivery_group_id`
- optional `delivery_address_id`

B2C CJ-001 path unchanged: channel `individual`, company fields null.

### 6. Capabilities

| Capability | Who |
|------------|-----|
| `company.manage` | Tenant `company_admin` / `saas_admin` · Company Account portal admins (`membership.is_admin`) |
| `site.manage` | same |
| `organization.manage` | Organizational Units |
| `employee.manage` | memberships / invitations |

Tenant role `company_admin` = **Organization (EatClean) admin**, not “any B2B company”. Portal admins are scoped by membership.

### 7. Preserve CJ-001

Individual consumers keep: auth → menu → schedule → summary → confirm.  
Provisioning ensures a `customers` row + tenant membership exists for individuals before `programDraft`.

---

## Consequences

### Positive

- OM fidelity for B2B before pilot data accumulates  
- Avoids post-pilot Customer migrations  
- Clear Delivery Group hook for future logistics (out of scope here)

### Negative / trade-offs

- Evolves foresight tables (`companies`, `company_locations`, …) instead of greenfield rename (aliases in app layer)  
- Company portal is minimal v1 (no smart invites email pipeline)  
- `company_admin` role name remains historically Tenant-centric

### Follow-ups (explicitly out of this ADR)

- Intelligent routes / route optimization  
- Advanced invoicing / ERP  
- Cross-tenant multi-empresa  

---

## Compliance

Implementation must:

1. Not break CAP-004 / CAP-006 for individuals  
2. Generate unique `company_code` per tenant  
3. Allow employee join via code → Site → Organizational Unit  
4. Stamp Order B2B context from active membership  
5. Stay multi-tenant (all tables `tenant_id` + RLS)
