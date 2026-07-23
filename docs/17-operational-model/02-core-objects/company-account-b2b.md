# Company Account · Site · Organizational Unit · Delivery Group

**Status:** Accepted · **ADR:** [0015](../../adr/0015-b2b-b2c-customer-model.md)  
**Knowledge Lifetime:** Contract (structural Core correction)

Structural correction before EatClean pilot: separate **B2C Consumer** from **B2B Company Account** demand without breaking CJ-001.

## Hierarchy

```text
Organization (Tenant)
        ↓
├── Consumer (B2C · customers.kind = individual, no membership)
└── Company Account (companies + company_code)
        ↓
        Site (company_locations)
        ↓
        Organizational Unit (company_departments — label configurable)
        ↓
        Employee Membership (company_employees → Beneficiary)
        ↓
        Order + Delivery Group
```

## Product terms ↔ DB

| Product | Table |
|---------|-------|
| Company Account | `companies` |
| Company Code | `companies.company_code` (unique per tenant, immutable) |
| Site | `company_locations` |
| Organizational Unit | `company_departments` |
| Employee Membership | `company_employees` |
| Delivery Group | `delivery_groups` |

## Order answers

| Question | Field |
|----------|-------|
| ¿Quién pidió? | `orders.customer_id` |
| ¿Particular o empresa? | `orders.demand_channel` |
| ¿Qué empresa / sede / unidad? | `company_id` · `site_id` · `organizational_unit_id` |
| ¿Grupo de entrega? | `delivery_group_id` |

## Capabilities

`company.manage` · `site.manage` · `organization.manage` · `employee.manage`  
Portal admins: `company_employees.is_admin = true` (scoped). Tenant `company_admin` / `saas_admin` oversee.

## Out of scope

Smart routes · advanced invoicing · ERP · multi-empresa cross-tenant.
