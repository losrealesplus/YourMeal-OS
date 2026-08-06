# Operational Capability Registry

**YourMeal OS · Product control panel**  
**Permanent quartet:** [PLATFORM_STATUS](./PLATFORM_STATUS.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md) · this Registry · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md)  
**Rule:** We track **Capabilities certified**, not “PRs merged”.  
**Methodology:** Observe → Design → Freeze → Facade → Validate → Capability Demo → Operational Experience → Field → Production

```text
Platform → Foundation → Operational Capabilities → Operational Experience
→ Operational Validation → Production
```

---

## Two dimensions

### Capability Maturity (certification depth)

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

### Capability Completeness (consumability)

```text
Architecture
    ↓
Facade
    ↓
Validation
    ↓
UI (Capability Demo → Product UI)
    ↓
Field Validation
    ↓
Production
```

A capability can be perfectly designed and validated **without UI**.  
A **Capability Demo** proves LAW 003 before the definitive product screen.

### Capability Type (product taxonomy)

| Type | Meaning | Examples |
|------|---------|----------|
| **Context** | Who is operating · tenant · permissions | Identity |
| **Business Entity** | Demand / master data actors | Customer |
| **Operational Process** | Weekly commitments that cross the org | Orders |
| **Operational Execution** | Planning and doing the physical work | **Production** · Kitchen · Delivery |
| **Operational Outcome** | Settling the work | Billing |

```text
Context → Business Entity → Operational Process
        → Operational Execution → Operational Outcome
```

This taxonomy is the **business map**, not only a software label.

| Maturity | Meaning |
|----------|---------|
| Pending | Not started |
| Architecture | Observe → Design → Freeze complete (contracts locked) |
| Facade | Public business API implemented; storage never exposed |
| Engineering Certified | Validation matrix PASS (WARNINGs / expected UNIMPLEMENTED allowed, FAIL = 0) |
| Field Validated | Device / operator smoke PASS |
| Production Ready | In production use for EatClean |

---

## Registry

### 001 · Identity

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified** |
| **Type** | Context |
| Completeness | Validation ✅ · UI (shells observe) · Field ⏳ |
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
Question: ¿Quién está operando?
```

---

### 002 · Customers

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified** |
| **Type** | Business Entity |
| Completeness | Architecture ✅ · Facade ✅ · Validation ✅ · **Capability Demo ✅** · Product UI ⏳ · Field ⏳ |
| Field Validation | Pending ([CUSTOMER_SMOKE_CHECKLIST](../10-validation/CUSTOMER_SMOKE_CHECKLIST.md)) |
| Version | 1.0 |
| ADRs | [0058](../adr/0058-customer-capability.md) · [0059](../adr/0059-customer-facade.md) · [0060](../adr/0060-customer-validation.md) · [0061](../adr/0061-customer-workspace-demo.md) |
| Contract | [CUSTOMER_CAPABILITY](../05-architecture/CUSTOMER_CAPABILITY.md) |
| Facade | `src/customer/CustomerFacade.ts` · `useCustomer()` · Commands / Queries |
| Demo | `/admin/customer-workspace` — LAW 003 proof |
| Validation | [CUSTOMER_VALIDATION_REPORT](../10-validation/CUSTOMER_VALIDATION_REPORT.md) · 14 PASS · 2 UNIMPLEMENTED · 0 FAIL |

```text
Customers
██████████████████ Engineering Certified
████ Capability Demo (Workspace)
░░░░ Product UI · Field Validation
Question: ¿Quién genera la demanda?
```

First **writable** Operational Capability. Method certified via Capability Demo.

---

### 003 · Orders

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified** |
| **Type** | Operational Process |
| Completeness | Architecture ✅ · Facade ✅ · Validation ✅ · **Capability Demo ✅** · Product UI ⏳ · Field ⏳ |
| Field Validation | Pending ([ORDER_SMOKE_CHECKLIST](../10-validation/ORDER_SMOKE_CHECKLIST.md)) |
| Version | 1.0 |
| ADRs | [0062](../adr/0062-order-capability.md) · [0063](../adr/0063-order-facade.md) · [0064](../adr/0064-order-validation.md) · [0065](../adr/0065-order-workspace-demo.md) · Intake [0017](../adr/0017-order-intake.md) |
| Contract | [ORDER_CAPABILITY](../05-architecture/ORDER_CAPABILITY.md) |
| Facade | `src/order/OrderFacade.ts` · `useOrder()` · process Commands / Queries |
| Demo | `/admin/order-workspace` — LAW 003 · LAW 004 proof |
| Validation | [ORDER_VALIDATION_REPORT](../10-validation/ORDER_VALIDATION_REPORT.md) · 15 PASS · 2 UNIMPLEMENTED · 0 FAIL |

```text
Orders
██████████████████ Engineering Certified
████ Capability Demo (Workspace)
░░░░ Product UI · Field Validation
Question: ¿Qué compromiso operativo ha adquirido
          la empresa para una semana concreta?

Order = compromiso operativo del tenant para una semana concreta.
```

First **Operational Process** Capability — Engineering Certified + Capability Demo.  
Operational Experience officially consumes Order.  
Production · Kitchen · Delivery · Billing must consume `OrderFacade` only for commitment facts.  
Production Capability (ADR 0066) transforms those commitments into executable work.  
**Production Architecture frozen — Facade next.**


---

### 004 · Production

| Field | Value |
|-------|--------|
| **Maturity** | **Architecture** |
| **Type** | Operational Execution |
| Completeness | Architecture ✅ · Facade ⏳ · Validation ⏳ · Demo ⏳ |
| Field Validation | — |
| Version | 0.1 (architecture) |
| ADRs | [0066](../adr/0066-production-capability.md) |
| Contract | [PRODUCTION_CAPABILITY](../05-architecture/PRODUCTION_CAPABILITY.md) |
| Facade | Not yet |
| Validation | Not yet |

```text
Production
████░░░░░░░░░░░░░░ Architecture
                    next: Facade
Question: ¿Qué trabajo debe ejecutarse para
          cumplir los compromisos operativos?

Production = planificación que transforma Orders
             en trabajo ejecutable.
Production never cooks. Kitchen executes.
```

First **Operational Execution** Capability. Planning — not cooking.  
Consumes `OrderFacade` only. Kitchen consumes Production.


---

### 005 · Kitchen

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| **Type** | Operational Execution |
| Notes | ¿Qué se está ejecutando ahora? · Consumes Production · never replans Orders |

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
| **Type** | Operational Execution |
| Notes | ¿Qué hay que entregar? |

---

### 008 · Billing

| Field | Value |
|-------|--------|
| **Maturity** | Pending |
| **Type** | Operational Outcome |
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

## Language of the business

| Capability | Question |
|------------|----------|
| Identity | ¿Quién está operando? |
| Customer | ¿Quién genera la demanda? |
| Orders | ¿Qué compromiso operativo tiene el tenant esta semana? |
| Production | ¿Qué trabajo debe ejecutarse para cumplir los compromisos? |
| Kitchen | ¿Qué se está ejecutando ahora en cocina? |
| Delivery | ¿Qué hay que entregar? |
| Billing | ¿Qué hay que cobrar? |

Screens will change. These questions are the product core.

**Milestone:** [Operational Engine v1.0](./OPERATIONAL_ENGINE.md) — full chain Identity→Billing certified.
