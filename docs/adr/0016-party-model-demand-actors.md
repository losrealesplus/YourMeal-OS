# ADR 0016 — Party Model for Demand Actors (Evaluation & Decision)

**Status:** Accepted  
**Date:** 2026-07-23  
**Deciders:** Product · Architecture · FOPEBA  
**Related:** [ADR 0015](./0015-b2b-b2c-customer-model.md) · [OM Actors](../17-operational-model/01-ubiquitous-language/actors.md) · [Company Account B2B](../17-operational-model/02-core-objects/company-account-b2b.md)  
**Pilot impact:** Semantic / documentation now · **no** physical table rewrite before EatClean Pilot Ready

---

## Context

ADR 0015 separated B2C and B2B demand correctly:

```text
Consumer (particular)  ≠  Company Account (empresa)  ≠  Beneficiary (empleado)
```

A further recommendation (pre-consolidation) is to adopt the **Party Model** used in many ERP/CRM systems:

```text
Party
 │
 ├── Individual Customer
 └── Company
       └── Employees (Memberships)
```

Rationale for evaluating **now**: YourMeal OS targets multi-tenant SaaS with complex B2B structures. Once pilot data consolidates under an ambiguous `Customer` root, a Party refactor becomes a costly migration. Evaluating before Pilot Ready avoids locking the wrong umbrella concept.

Constraints:

- EatClean pilot must not wait on a full schema rewrite  
- CJ-001 Individual path must remain stable  
- FOPEBA: this is a **structural language/Core alignment**, not a product expansion

---

## Options considered

| Option | Meaning | Pros | Cons |
|--------|---------|------|------|
| **A. Ignore Party** | Keep only ADR 0015 terms | Minimal docs | `Customer` ambiguity returns; shared contact/address logic will duplicate |
| **B. Full Party schema now** | New `parties` table; Individual/Company as subtypes; migrate `customers`/`companies` | Clean ERP shape | High risk pre-pilot; blocks EP; large RLS/RPC churn |
| **C. Party as semantic umbrella now; physical convergence later** | OM + Dictionary + code comments adopt Party; ADR 0015 tables remain physical source until post-pilot Gate | Zero pilot breakage; locks the *right* concept early | Temporary dual naming (OM Party vs DB `customers`/`companies`) |

---

## Decision

**Choose C.**

### 1. Canonical hierarchy (Ubiquitous Language)

```text
Party                         ← umbrella Core concept (demand party)
 │
 ├── Individual Customer      ← person who orders (Consumer and/or Beneficiary role)
 └── Company                  ← Company Account (B2B contracting entity)
       └── Employees
             └── Memberships  ← Site · Organizational Unit · optional internal location
```

| Party subtype | OM / ADR 0015 | Places Order? | Pays? |
|---------------|---------------|:-------------:|:-----:|
| **Individual Customer** | Consumer and/or Beneficiary | Yes | Often (B2C) / sometimes (B2B employee_pays) |
| **Company** | Company Account | Rarely as entity | Yes (B2B) |
| **Membership** | Employee Membership | — | Links Individual → Company structure |

### 2. What “Party” shares (future physical benefit)

Without forcing a table today, the model **acknowledges** shared facets:

- Contact channels (email, phone)  
- Addresses (fiscal vs delivery)  
- Tenant scoping · soft-delete · audit  

Individual and Company **behave differently** (onboarding, Company Code, Delivery Group, invoicing) but should not duplicate those facets forever.

### 3. Physical model (until post-pilot Gate)

| Logical Party | Physical (ADR 0015) |
|---------------|---------------------|
| Individual Customer | `customers` (person row) |
| Company | `companies` |
| Membership | `company_employees` (+ Site / OU) |

**No** `parties` table in this PR.  
**No** rename of `customers` → `parties` before pilot evidence.

### 4. Naming rules (immediate)

| Prefer | Avoid |
|--------|-------|
| Party (when speaking of the umbrella) | Bare `Customer` without subtype |
| Individual Customer | “Cliente” genérico |
| Company / Company Account | Confusing Company with Organization (Tenant) |
| Membership / Employee Membership | “company_employee” in product copy |

Code/DB may keep foresight table names; product + OM use Party language.

### 5. When to physically converge

Open a **Model Change** only after Gate, if FOV/pilot shows:

- duplicated address/contact logic across Individual and Company, **or**  
- need for Party-level relationships (e.g. one Party many roles, holding companies, multi-site billing parties)

Target shape (post-Gate, not now):

```text
parties (id, tenant_id, party_kind: individual|organization, …)
  ├── party_contacts / party_addresses
  ├── individual_profiles → user_id
  └── company_accounts → company_code, fiscal…
        └── memberships → individual_party_id + site + OU
```

---

## Consequences

### Positive

- Locks the right long-term SaaS concept **before** pilot data hardens  
- Keeps ADR 0015 implementation and EatClean pilot unblocked  
- Aligns FOPEBA actors under one umbrella without inventing new evidence types  

### Negative / trade-offs

- Temporary dual vocabulary (Party in docs · `customers`/`companies` in DB)  
- Developers must read ADR 0015 + 0016 together  

### Explicit non-goals (this ADR)

- Rewriting migrations of ADR 0015  
- Changing Order FKs to `party_id` before Gate  
- ERP-grade Party roles graph  

---

## Compliance checklist

1. New OM/docs use **Party → Individual Customer | Company → Memberships**  
2. ADR 0015 remains the **physical** pilot contract  
3. Pilot Ready / cero humo **does not** depend on a `parties` table  
4. Any future `parties` migration requires Gate + Model Change, not intuition  

---

## Summary for Pilot Ready

> **Adopt Party as the language of the Core. Ship ADR 0015 as the schema of the pilot. Converge physically only with evidence.**
