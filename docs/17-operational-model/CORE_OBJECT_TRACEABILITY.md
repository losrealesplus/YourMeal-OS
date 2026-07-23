# Core Object Traceability — OM ↔ Implementation

**Status:** Living · **Knowledge Lifetime:** Contract (mapa) / se actualiza con Gates  
**Related:** [ADR 0015](../adr/0015-b2b-b2c-customer-model.md) · [ADR 0016](../adr/0016-party-model-demand-actors.md) · [ORR](../00-status/ORR_B2B_B2C_PARTY.md)

Trazabilidad explícita entre el **Operational Model (Party language)** y la **implementación física** del piloto.  
Cuando se apruebe convergencia a `parties`, el impacto se localiza aquí.

---

## Language rule

| Layer | Uses |
|-------|------|
| Operational Model · Dictionary · Capabilities · CJ / OJ · ADRs | **Party** (+ Individual Customer · Company · Membership) |
| Database · TypeScript modules (until Gate) | `customers` · `companies` · foresight names |
| Product UI copy | Particular / Empresa / Empleado (no “Customer” ambiguo) |

---

## Traceability matrix

| Core Object (OM) | Implementación actual | Estado |
|------------------|----------------------|--------|
| **Party** (umbrella) | `customers` + `companies` (semántico ADR 0016) | Semantic only — no `parties` table |
| **Individual Customer** | `customers` (person row) | ADR 0015 · Connected |
| **Company** (Company Account) | `companies` (+ `company_code`) | ADR 0015 · Connected · **provisioned by Tenant staff** |
| **Site** | `company_locations` | ADR 0015 · Connected |
| **Organizational Unit** | `company_departments` | ADR 0015 · Connected |
| **Employee Membership** | `company_employees` | ADR 0015 · Connected |
| **Delivery Group** | `delivery_groups` | ADR 0015 · Connected |
| **Order** | `orders` (+ B2B FKs · `demand_channel`) | CAP-004/006 · Connected |
| **Organization / Tenant** | `tenants` | Foundation · Connected |
| **Consumer** (role) | Individual Customer without Membership | UL actors |
| **Beneficiary** (role) | Individual Customer + Membership | UL actors |

---

## Commercial vs self-service

| Event | Who | Surface |
|-------|-----|---------|
| Create Company Account | EatClean staff (`company.manage`) | `/admin/companies` |
| Join as Employee | Person with Company Code (and/or Invite) | `/app/onboarding/employee` |
| B2C onboarding | Person | `/app/onboarding` → Particular |
| Public “register company” | — | **Removed** (not an operational event for Customer App) |

---

## Future physical convergence (Gate only)

```text
parties
├── party_kind (individual | organization)
├── party_contacts / party_addresses
├── individual ↔ user_id
└── company ↔ company_code · fiscal…
      └── memberships → individual_party + site + OU
```

Update this matrix when that Model Change is Gate-approved.

---

## Related code

| Concern | Path |
|---------|------|
| Service | `src/modules/company-account/` |
| Migration | `supabase/migrations/20260723183000_b2b_b2c_customer_model.sql` |
| Admin provision | `src/routes/_authenticated/admin.companies.tsx` |
| Employee join | `src/routes/_authenticated/app.onboarding.employee.tsx` |
