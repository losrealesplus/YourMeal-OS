# Operational Capability Registry

**YourMeal OS · Product control panel**  
**Permanent quartet + board:** [PLATFORM_STATUS](./PLATFORM_STATUS.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md) · this Registry · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md) · **[OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)**  
**Rule:** We track **Capabilities certified**, not “PRs merged”.  
**Methodology:** Observe → Design → Freeze → Facade → **Engineering Certification** → Capability Demo → Field Validation → **Cross-Platform Validation** → Production Ready

```text
Platform → Foundation → Operational Capabilities → Operational Experience
→ Operational Validation → Cross-Platform Validation → Production
```

**Expansion era:** [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) · first module OPERATIONAL-006 Delivery (**Engineering Certified**) · [Language Dictionary](./OPERATIONAL_LANGUAGE_DICTIONARY.md)

**Graph:** [OPERATIONAL_DEPENDENCY_GRAPH](./OPERATIONAL_DEPENDENCY_GRAPH.md) · **Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)

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

### Capability Type = Operational Model layer (LAW 005)

| Type / Layer | Meaning | Examples |
|--------------|---------|----------|
| **Context** | Who is operating · tenant · permissions | Identity |
| **Business Entity** | Demand / master data actors | Customer |
| **Operational Planning** | Commitments and executable work plans | Orders · **Production** |
| **Operational Execution** | Coordinating work in progress | **Kitchen Execution** · Delivery |
| **Operational Outcome** | Settling the work | Billing |

```text
Context → Business Entity → Operational Planning
        → Operational Execution → Operational Outcome
```

**FOUNDATION LAW 005:** one Capability · one layer · cross-layer only via Facade.  
**FOUNDATION LAW 006:** one Capability · one canonical business question.  
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

## Dependency map (Consumida por)

Functional consumers — not import graphs.

| Capability | Tipo | Estado | Consumida por |
|------------|------|--------|---------------|
| Identity | Context | Engineering Certified | Customer · Orders · Production |
| Customer | Business Entity | Engineering Certified + Demo | Orders |
| Orders | Operational Planning | Engineering Certified + Demo | Production |
| Production | Operational Planning | **Engineering Certified + Demo** | Kitchen Execution |
| Kitchen Execution | Operational Execution | **Engineering Certified + Demo** | Delivery |
| Delivery | Operational Execution | **Capability Demo** | Billing |
| Billing | Operational Outcome | **Architecture Freeze** | FLOW-003 · Engine v1.0 |

**Discipline:** Never open two new operational capabilities at once.  
Complete **Architecture → Facade → Validation → Demo** before the next.

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
| **Type** | Operational Planning |
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

First **Operational Planning** commitment Capability — Engineering Certified + Capability Demo.  
Operational Experience officially consumes Order.  
Production · Kitchen · Delivery · Billing must consume `OrderFacade` only for commitment facts.  
Production Capability (ADR 0066) transforms those commitments into executable work.

---

### 004 · Production

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified** |
| **Type** | Operational Planning |
| Completeness | Architecture ✅ · Facade ✅ · Engineering Certification ✅ · **Capability Demo ✅** · Product UI ⏳ · Field ⏳ |
| Consumida por | Kitchen Execution (canonical) |
| Field Validation | Pending ([PRODUCTION_SMOKE_CHECKLIST](../10-validation/PRODUCTION_SMOKE_CHECKLIST.md)) |
| Version | 1.0 |
| ADRs | [0066](../adr/0066-production-capability.md) · [0067](../adr/0067-production-facade.md) · [0068](../adr/0068-production-engineering-certification.md) · [0069](../adr/0069-production-workspace-demo.md) |
| Contract | [PRODUCTION_CAPABILITY](../05-architecture/PRODUCTION_CAPABILITY.md) |
| Facade | `src/production/ProductionFacade.ts` · `useProduction()` · work Commands / Queries |
| Demo | `/admin/production-workspace` — LAW 003 · LAW 004 proof |
| Validation | [PRODUCTION_VALIDATION_REPORT](../10-validation/PRODUCTION_VALIDATION_REPORT.md) · 13 PASS · 4 UNIMPLEMENTED · 0 FAIL |

```text
Production
██████████████████ Engineering Certified
████ Capability Demo (Workspace)
░░░░ Product UI · Field Validation
Question: ¿Qué trabajo debe ejecutarse para
          cumplir los compromisos operativos?

Production = planificación que transforma Orders
             en trabajo ejecutable.
Production never cooks. Kitchen executes.
```

**Operational Planning** (Orders + Production) is **fully consumable** · LAW 005.  
**Kitchen Execution** Engineering Certified + Capability Demo (ADR 0072 · 0073).  
**Phase A complete through Kitchen.** Next: OPERATIONAL-FLOW-001.

---

### 005 · Kitchen Execution

| Field | Value |
|-------|--------|
| **Maturity** | **Engineering Certified + Demo** |
| **Type** | Operational Execution |
| Completeness | Architecture ✅ · Facade ✅ · Engineering Certification ✅ · **Capability Demo ✅** · Product UI ⏳ · Field ⏳ |
| Consumida por | Delivery (canonical) · OPERATIONAL-FLOW-001 |
| Depends on | ProductionFacade only |
| Field Validation | Pending ([KITCHEN_EXECUTION_SMOKE_CHECKLIST](../10-validation/KITCHEN_EXECUTION_SMOKE_CHECKLIST.md)) |
| Version | 1.0 |
| ADRs | [0070](../adr/0070-kitchen-execution-capability.md) · [0071](../adr/0071-kitchen-execution-facade.md) · [0072](../adr/0072-kitchen-execution-engineering-certification.md) · [0073](../adr/0073-kitchen-workspace-demo.md) |
| Contract | [KITCHEN_EXECUTION_CAPABILITY](../05-architecture/KITCHEN_EXECUTION_CAPABILITY.md) |
| Facade | `src/kitchen/KitchenExecutionFacade.ts` · `useKitchenExecution()` · ExecutionUnit Commands / Queries |
| Demo | `/admin/kitchen-workspace` — LAW 003–006-A proof · **final isolated Capability Demo** |
| Validation | [KITCHEN_EXECUTION_VALIDATION_REPORT](../10-validation/KITCHEN_EXECUTION_VALIDATION_REPORT.md) · 12 PASS · 6 UNIMPLEMENTED · 0 FAIL |
| Notes | ¿Qué trabajo debe ejecutarse ahora? · ExecutionUnit · LAW 006-A · LAW 007 unlocks flows |

```text
Kitchen Execution
██████████████████ Engineering Certified
████ Capability Demo (Workspace)
░░░░ Product UI · Field Validation

Kitchen = coordinar · priorizar · confirmar
          · pausar · reanudar · terminar
ExecutionUnit · never KitchenBatch
Final isolated Capability Demo before Phase B.
```

First **Operational Execution** Capability — Engineering Certified + Demo.  
**Phase A complete.** FLOW-001 Engineering Certified.  
**Expansion:** OPERATIONAL-006 Delivery · **Engineering Certified** (ADR 0078 · 0079 · 0080).

---

### 006 · Delivery

| Field | Value |
|-------|--------|
| **Maturity** | **Capability Demo** |
| **Type** | Operational Execution |
| Completeness | Architecture ✅ · Facade ✅ · Engineering Certification ✅ · **Capability Demo ✅** · Product UI ⏳ · Field ⏳ |
| Consumida por | Billing (canonical) · FLOW-002 |
| Depends on | OrderFacade · KitchenExecutionFacade |
| Version | 1.0 |
| ADRs | [0078](../adr/0078-delivery-capability.md) · [0079](../adr/0079-delivery-facade.md) · [0080](../adr/0080-delivery-engineering-certification.md) · [0085](../adr/0085-delivery-engine-v1-alignment.md) · [0086](../adr/0086-delivery-workspace-demo.md) |
| Contract | [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md) · [DELIVERY_WORKSPACE](../05-architecture/DELIVERY_WORKSPACE.md) |
| Facade | `src/delivery/DeliveryFacade.ts` · `useDelivery()` · Commands / Queries |
| Validation | [DELIVERY_VALIDATION_REPORT](../10-validation/DELIVERY_VALIDATION_REPORT.md) · 13 PASS · 5 UNIMPLEMENTED · 0 FAIL |
| Demo | `/admin/delivery-workspace` — LAW 003 · 006 · 007 · PRODUCT LAW 001 |
| Notes | ConfirmDelivery composed · Assign/Start/Exception/Close/Routes EXPECTED GAP (honest in Demo) |

```text
Delivery
████ Architecture
████ Facade
████ Engineering Certified
████ Capability Demo (Workspace)
░░░░ Product UI · Field

Question: ¿Qué compromisos operativos deben entregarse ahora
          y cómo confirmamos su ejecución?

Delivery = asignar · rutear · confirmar · evidenciar · exceptuar
never drives · never cooks · never bills
= controlled transfer of responsibility
```

Second **Operational Execution** Capability — Engineering Certified + Capability Demo.  
**Next Engine block:** Billing Facade → Certification → Demo → **OPERATIONAL-ENGINE-001**.  
Delivery is **closed** — do not reopen Architecture / Facade / Demo.

---

### 007 · Billing

| Field | Value |
|-------|--------|
| **Maturity** | **Architecture Freeze** |
| **Type** | Operational Outcome |
| Completeness | **Architecture ✅** · Facade ⏳ · Engineering Certification ⏳ · Capability Demo ⏳ · Product UI ⏳ · Field ⏳ |
| Consumida por | FLOW-003 · OPERATIONAL-ENGINE-001 |
| Depends on | Identity · Customer · Orders · Production · Kitchen · Delivery (Facades only) |
| Version | 0.1 (contracts) |
| ADRs | [0087](../adr/0087-billing-capability.md) |
| Contract | [BILLING_CAPABILITY](../05-architecture/BILLING_CAPABILITY.md) · `src/billing/contracts/` |
| Notes | **Final Engine Capability** · closes Outcome layer · never ERP/ledger/bank |

```text
Billing
████ Architecture Freeze
░░░░ Facade · Certification · Demo · Field

Question: What financial outcome must be produced
          from successfully completed operational work?

Billing = prepare · invoice · credit · payment status · evidence
never creates demand · never plans · never executes
= Operational Outcome (Engine ends here)
```

Final **Operational Outcome** Capability — Architecture Frozen.  
**Next:** Billing Facade → Certification → Demo → **OPERATIONAL-ENGINE-001** (v1.0 Declaration).  
See [OPERATIONAL_ENGINE_001_RESERVED](./OPERATIONAL_ENGINE_001_RESERVED.md).

---

### 008 · Inventory

| Field | Value |
|-------|--------|
| **Maturity** | Pending |

---

### 009 · Procurement

| Field | Value |
|-------|--------|
| **Maturity** | Pending |

---

### 010 · Analytics

| Field | Value |
|-------|--------|
| **Maturity** | Pending |

---

### 011 · Administration

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
| Kitchen Execution | ¿Qué trabajo debe ejecutarse ahora? |
| Delivery | ¿Qué compromisos operativos deben entregarse ahora y cómo confirmamos su ejecución? |
| Billing | ¿Qué resultado financiero debe producirse del trabajo operativo completado? |

Screens will change. These questions are the product core (**LAW 006**).

**Exists / v0.8:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) — Identity→Kitchen + FLOW-001 certified.  
**Expansion:** [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) — Delivery Engineering Certified → Demo → …  
**Language:** [OPERATIONAL_LANGUAGE_DICTIONARY](./OPERATIONAL_LANGUAGE_DICTIONARY.md) — LAW 006 questions.  
**Flows:** [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md) — FLOW-001 + FLOW-002 Engineering Certified.  
**Behaviours:** [OPERATIONAL_BEHAVIOUR_BOARD](./OPERATIONAL_BEHAVIOUR_BOARD.md) — BH-001 Certified.  
**Scenarios:** [OPERATIONAL_SCENARIO_REGISTRY](./OPERATIONAL_SCENARIO_REGISTRY.md) — RESERVED.  
**Review:** [OPERATIONAL_ENGINE_REVIEW](./OPERATIONAL_ENGINE_REVIEW.md).  
**Phases:** [OPERATIONAL_CERTIFICATION_PHASES](./OPERATIONAL_CERTIFICATION_PHASES.md).  
**Engine Completion:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md).  
**Milestone v1.0:** [OPERATIONAL_ENGINE_001_RESERVED](./OPERATIONAL_ENGINE_001_RESERVED.md) — Identity→Billing complete + flows certified · institutional declaration.
