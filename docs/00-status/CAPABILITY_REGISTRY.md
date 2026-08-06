# Operational Capability Registry

**YourMeal OS · Product control panel**  
**Rule:** We track **Capabilities certified**, not “PRs merged”.  
**Methodology:** Observe → Design → Freeze → Facade → Validate → UI → Smoke → Release

```text
Platform → Foundation → Operational Modules → Capabilities → Validation → Product
```

---

## Capability Maturity

Not every capability is equally advanced. Track maturity, not % complete:

```text
Architecture
    ↓
Facade
    ↓
Engineering Certified
    ↓
Field Validated
    ↓
Production Ready
```

| Maturity | Meaning |
|----------|---------|
| Pending | Not started |
| Architecture | Observe → Design → Freeze complete (contracts locked) |
| Facade | Public business API implemented; storage never exposed |
| Engineering Certified | Validation matrix PASS (WARNINGs allowed, FAIL = 0) |
| Field Validated | Device / operator smoke PASS |
| Production Ready | In production use for EatClean |

---

## Registry

### 001 · Identity

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified** |
| Field Validation | Pending (OPPO checklist) |
| Version | 1.0 |
| ADRs | [0055](../adr/0055-identity-capability.md) · [0056](../adr/0056-identity-facade.md) · [0057](../adr/0057-identity-validation.md) |
| Contract | [IDENTITY_CAPABILITY](../05-architecture/IDENTITY_CAPABILITY.md) |
| Facade | `src/identity/IdentityFacade.ts` · `useIdentity()` |
| Validation | [IDENTITY_VALIDATION_REPORT](../10-validation/IDENTITY_VALIDATION_REPORT.md) · 14 PASS · 2 WARNING · 0 FAIL |

```text
Identity
██████████████████ Engineering Certified
░░░░ Field Validation
```

---

### 002 · Customers

| Field | Value |
|-------|--------|
| **Maturity** | **Facade** |
| Field Validation | — |
| Version | 0.2 (facade) |
| ADRs | [0058](../adr/0058-customer-capability.md) · [0059](../adr/0059-customer-facade.md) |
| Contract | [CUSTOMER_CAPABILITY](../05-architecture/CUSTOMER_CAPABILITY.md) |
| Facade | `src/customer/CustomerFacade.ts` · `useCustomer()` · Commands / Queries |
| Validation | Not yet |

```text
Customers
████████░░░░░░░░░░ Facade
                    next: Validate
```

Business question: **¿Quién genera la demanda?** (Demand Party — not “cliente CRUD”)

---

### 003 · Orders

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| Notes | Depends on Identity + Customers · question: ¿Qué hay que preparar? |

---

### 004 · Production

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| Notes | ¿Qué hay que cocinar? |

---

### 005 · Kitchen

| Field | Value |
|-------|--------|
| **Maturity** | Pending |

---

### 006 · Inventory

| Field | Value |
|-------|--------|
| **Maturity** | Pending |

---

### 007 · Delivery

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| Notes | ¿Qué hay que entregar? |

---

### 008 · Billing

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| Notes | ¿Qué hay que cobrar? |

---

### 009 · Analytics

| Field | Value |
|-------|--------|
| **Maturity** | Pending |

---

### 010 · Administration

| Field | Value |
|-------|--------|
| **Maturity** | Pending |

---

## Golden rule

> **¿Hace que EatClean tarde menos en hacer su trabajo?**  
> Sí → entra. No → espera.

Not the best generic CRM — the best flow for a catering company that prep, cooks, and delivers every week.

## Language of the business

| Capability | Question |
|------------|----------|
| Identity | ¿Quién está operando? |
| Customer | ¿Quién genera la demanda? |
| Orders | ¿Qué hay que preparar? |
| Production | ¿Qué hay que cocinar? |
| Delivery | ¿Qué hay que entregar? |
| Billing | ¿Qué hay que cobrar? |

Screens will change. These questions are the product core.
