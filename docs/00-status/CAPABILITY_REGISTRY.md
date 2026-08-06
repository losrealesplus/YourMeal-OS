# Operational Capability Registry

**YourMeal OS · Product control panel**  
**Rule:** We track **Capabilities certified**, not “PRs merged”.  
**Methodology:** Observe → Design → Freeze → Facade → Validate → UI → Smoke → Release

```text
Platform → Foundation → Operational Modules → Capabilities → Validation → Product
```

---

## Registry

### 001 · Identity

| Field | Value |
|-------|--------|
| **Status** | **Engineering Certified** |
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
| **Status** | **Observe → Design → Freeze** (this PR) |
| Field Validation | — |
| Version | 0.1 (architecture) |
| ADRs | [0058](../adr/0058-customer-capability.md) |
| Contract | [CUSTOMER_CAPABILITY](../05-architecture/CUSTOMER_CAPABILITY.md) |
| Facade | Not yet |
| Validation | Not yet |

```text
Customers
████░░░░░░░░░░░░░░ Architecture freeze
```

---

### 003 · Orders

| Field | Value |
|-------|--------|
| **Status** | Pending |
| Notes | Depends on Identity + Customers |

---

### 004 · Production

| Field | Value |
|-------|--------|
| **Status** | Pending |

---

### 005 · Kitchen

| Field | Value |
|-------|--------|
| **Status** | Pending |

---

### 006 · Inventory

| Field | Value |
|-------|--------|
| **Status** | Pending |

---

### 007 · Delivery

| Field | Value |
|-------|--------|
| **Status** | Pending |

---

### 008 · Billing

| Field | Value |
|-------|--------|
| **Status** | Pending |

---

### 009 · Analytics

| Field | Value |
|-------|--------|
| **Status** | Pending |

---

### 010 · Administration

| Field | Value |
|-------|--------|
| **Status** | Pending |

---

## Status vocabulary

| Status | Meaning |
|--------|---------|
| Pending | Not started |
| Observe / Design / Freeze | Architecture in progress or frozen |
| Facade | Public API implemented |
| Engineering Certified | Validation matrix PASS (WARNINGs allowed, FAIL = 0) |
| Field Validated | Device/operator smoke PASS |
| Released | In production use for EatClean |

---

## Golden rule

> **¿Hace que EatClean tarde menos en hacer su trabajo?**  
> Sí → entra. No → espera.

Not the best generic CRM — the best flow for a catering company that prep, cooks, and delivers every week.
