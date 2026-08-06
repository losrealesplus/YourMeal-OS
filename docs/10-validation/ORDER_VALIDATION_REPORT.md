# OPERATIONAL-003 · Order Validation Report

**Track:** OPERATIONAL-003 · Phase 3  
**Date:** 2026-08-06  
**ADR:** [0064 — Order Validation](../adr/0064-order-validation.md)  
**Status:** **ENGINEERING CERTIFIED** · Field smoke → operator handoff  
**Depends on:** ADR [0062](../adr/0062-order-capability.md) · [0063](../adr/0063-order-facade.md) · Customers [0060](../adr/0060-customer-validation.md)

---

## Declaration

```text
Order Capability
──────────────────────────────────────
Architecture (ADR 0062)     ✅
Facade (ADR 0063)           ✅
Validation matrix           ✅ ENGINEERING
Capability Demo             ⏳ After certification (Law 003)
Field smoke                 ⏳ Operator checklist
──────────────────────────────────────
First Operational Process Capability — Engineering Certified.
Production · Kitchen · Delivery · Billing consume OrderFacade only.
```

Order is certified for **engineering use**.  
We do **not** invent a device or EatClean field PASS.

Business question answered:

```text
Order = compromiso operativo del tenant para una semana concreta.
```

---

## Validation matrix

| ID | Case | Expected | Observed | Evidence | Verdict |
|----|------|----------|----------|----------|---------|
| V01 | PlanWeeklyOrder | ok · draft · intakeDraft | ok · status=draft | `planWeeklyOrder` | **PASS** |
| V02 | ConfirmOrder | ok · confirmed | ok · OrderService.confirm | `confirmOrder` | **PASS** |
| V03 | ScheduleProduction | ok · in_production | startProduction | `scheduleProduction` | **PASS** |
| V04 | ReadyForKitchen | ok · prepared | completeProduction | `readyForKitchen` | **PASS** |
| V05 | ReadyForDelivery | ok · ready_for_delivery | transitionKitchen | `readyForDelivery` | **PASS** |
| V06 | CompleteDelivery | ready→out→delivered | 2 transitions | `completeDelivery` | **PASS** |
| V07 | CloseOrder | UNIMPLEMENTED intent | code=UNIMPLEMENTED · recoverable | `closeOrder` | **UNIMPLEMENTED** |
| V08 | CancelOrder | UNIMPLEMENTED intent | code=UNIMPLEMENTED | `cancelOrder` | **UNIMPLEMENTED** |
| V09 | Operational Week | ByWeek + Calendar | weekStart · deliveryDays | week queries | **PASS** |
| V10 | Delivery Day | day filters · queues | ByDay · Pending · Ready | day queries | **PASS** |
| V11 | Customer relationship | partyRef · ByCustomer | id=c1 · María | map + query | **PASS** |
| V12 | Identity relationship | AUTH/TENANT errors | PERMISSION_DENIED · TENANT_MISMATCH | resolveContext | **PASS** |
| V13 | Permission checks | caps → canRead/Write/Kitchen/Logistics | read-only staff mapped | capabilityBits | **PASS** |
| V14 | Bootstrap interaction | Identity consume · no Bootstrap own | useIdentity · no BootstrapOrchestrator | source inspection | **PASS** |
| V15 | Facade integrity | execute/query · future UNIMPLEMENTED | Plan ok · DuplicateWeek UNIMPLEMENTED | `execute` / `query` | **PASS** |
| V16 | Service delegation | Intake + Orders + Operations only | spies on process path | injected deps | **PASS** |
| V17 | Foundation Laws 002–004 | Facade-only · process language · no CRUD | index · useOrder · Law docs | static + docs | **PASS** |

**Summary:** PASS **15** · UNIMPLEMENTED **2** (expected) · WARNING **0** · FAIL **0**

Automated runner: `src/order/order-validation.spec.ts` (17 tests green).

---

## Expected UNIMPLEMENTED (honest substrate)

| Item | Follow-up |
|------|-----------|
| V07 CloseOrder | Wire close / billing settle substrate — no invented lifecycle |
| V08 CancelOrder | Pair with intake cancel + audit reason |
| Future: DuplicateWeek · CloneMenus · SplitOrder · MergeOrder | Intent frozen on Facade |

These do **not** block Engineering Certification. They block claiming “complete weekly ops CRM”. Intent is frozen; implementation waits.

---

## Capability Completeness

```text
Architecture ✅ → Facade ✅ → Validation ✅ → Demo ⏳ → Field ⏳ → Production ⏳
```

Orders is **validated** and still **without Product UI**. That is correct: consumable via Facade for Production / Kitchen / Delivery / Billing; Workspace Demo comes next under Law 003.

---

## Smoke checklist (operator)

See [ORDER_SMOKE_CHECKLIST](./ORDER_SMOKE_CHECKLIST.md).

When field steps PASS, append:

```text
Field smoke          ✅
Orders               FIELD VALIDATED
```

---

## Rule unlocked

```text
Production Capability may begin only after Order Validation passes.
```

Order Workspace Demo may now be designed — exclusively on `OrderFacade` / `useOrder()`.

---

## Non-goals (honored)

- No Product UI  
- No routing  
- No feature / CRUD screens  
- No invented Close/Cancel substrate  
