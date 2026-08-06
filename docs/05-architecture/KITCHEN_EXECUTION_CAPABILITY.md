# Kitchen Execution Capability

**OPERATIONAL-005 · Phase 4 — Capability Demo**  
**ADR:** [0070](../adr/0070-kitchen-execution-capability.md) · [0071](../adr/0071-kitchen-execution-facade.md) · [0072](../adr/0072-kitchen-execution-engineering-certification.md) · [0073](../adr/0073-kitchen-workspace-demo.md)  
**Status:** **Engineering Certified + Capability Demo** (`/admin/kitchen-workspace`)  
**Depends on:** Production (Engineering Certified + Capability Demo)  
**EatClean lens:** weekly meal prep · coordinate execution units on the production floor  
**Layer / Type:** **Operational Execution** (first of its kind)  
**Maturity:** Architecture → Facade → Engineering Certified → Field Validated → Production Ready  
**Completeness:** Architecture → Facade → Engineering Certification → **Capability Demo** → Product UI → Field → Production  
**Laws:** 001–007 · [FOUNDATION_LOCK](./FOUNDATION_LOCK.md)  
**Package:** `src/kitchen/` · `KitchenExecutionFacade` · `useKitchenExecution`  
**Validation:** [KITCHEN_EXECUTION_VALIDATION_REPORT](../10-validation/KITCHEN_EXECUTION_VALIDATION_REPORT.md) · 12 PASS · 6 UNIMPLEMENTED · 0 FAIL  
**Demo:** `/admin/kitchen-workspace` — LAW 003–006-A · **final isolated Capability Demo**

```text
Kitchen Execution = coordinar · priorizar · confirmar · pausar · reanudar · terminar

Kitchen does NOT cook.
The physical kitchen cooks.
Kitchen OS orchestrates execution.
```

---

## Purpose

Define the **canonical Kitchen Execution Capability** for YourMeal OS.

Kitchen is a **business capability**, not a recipe book and not a timer UI.

> **What is Kitchen Execution inside YourMeal OS?**

**One canonical answer:**

```text
Kitchen Execution is the operational coordination that takes
Production Work and decides what must run now:

execution queue · workstation queues · operator assignment ·
execution unit start / pause / resume / complete · progress · visibility.
```

**Canonical question (LAW 006 — one only):**

```text
¿Qué trabajo debe ejecutarse ahora?
```

```text
What operational work must be executed now?
```

EatClean does not need Kitchen OS to own recipes, ingredients, pans, or ovens.  
EatClean needs Kitchen OS to **orchestrate the floor** so operators execute the plan Production already built.

---

## Critical separation

| Capability | Layer | Owns | Does not own |
|------------|-------|------|--------------|
| **Orders** | Planning | Operational commitment for a week | Execution units |
| **Production** | Planning | Planning · batches · queue · load · schedule · readiness | Start / pause / craft progress |
| **Kitchen Execution** | Execution | Queue orchestration · status · progress · operator · **ExecutionUnit** lifecycle | Recipes · ingredients · replanning Orders · Production batches as plan artifacts |
| **Delivery** | Execution | Routes · POD · logistics | Kitchen queues |
| **Billing** | Outcome | Invoices · settlement | Kitchen state |

```text
Order               →  ¿Qué compromiso existe?
Production          →  ¿Qué trabajo debemos generar?
Kitchen Execution   →  ¿Qué trabajo debe ejecutarse ahora?
Delivery            →  ¿Qué trabajo debe entregarse ahora?
Billing             →  ¿Qué trabajo puede cerrarse y facturarse?
```

If a feature makes Kitchen “plan the day”, it belongs in **Production**.  
If a feature makes Kitchen “choose ingredients / recipes”, it belongs in the **gastronomic domain** — not here.

---

## Kitchen does NOT cook · does NOT own batches

Same discipline as Production:

```text
Production never cooks.     Production plans · owns Batches.
Kitchen never cooks.        Kitchen orchestrates · owns ExecutionUnits.
The physical kitchen cooks.
```

**Why ExecutionUnit (not KitchenBatch)?**

A kitchen does not always execute a full Production batch. It may execute:

* a station  
* a line  
* a block  
* a prep slice  

`ExecutionUnit` stays abstract for a chef, an oven, or a robot years from now.  
Production **Batches** remain planning artifacts. Kitchen maps them into execution units.

| Kitchen owns | Kitchen never owns |
|--------------|--------------------|
| Execution Queue | Recipes |
| Workstation Queue | Ingredients |
| Execution Status | Pans / ovens / tools |
| Execution Progress | Gastronomic craft steps |
| ExecutionUnit Start / Pause / Resume / Complete | Replanning Orders |
| Operator Assignment | Generating Production batches |
| Operational visibility | Mutating Order commitments |

---

## Responsibilities

Kitchen owns:

| Concept | Meaning |
|---------|---------|
| **Execution Queue** | Ordered work ready to run now (from Production readiness) |
| **Workstation Queue** | Work sliced by station / line |
| **Execution Status** | Lifecycle of each ExecutionUnit |
| **Execution Progress** | How far a unit has advanced operationally |
| **Start / Pause / Resume / Complete** | ExecutionUnit lifecycle |
| **Operator Assignment** | Who is responsible for this execution unit |
| **Operational visibility** | Floor-readable view of what runs now |

---

## Relationships

### Consumes

```text
ProductionFacade only
```

Kitchen never reads Order tables, never invents work from raw Orders, never bypasses Production readiness.

### Provides

```text
DeliveryCapability  (downstream: completed / releasable work)
```

### Never

```text
Never plans work.
Never modifies Orders.
Never generates Production.
Never touches storage (Facade composes ProductionFacade only).
```

Protected by **FOUNDATION LAW 005** · **LAW 006**.

---

## Contracts (frozen)

| Contract | Role |
|----------|------|
| **KitchenContext** | Tenant · permissions · day scope · queue |
| **ExecutionQueue** | Prioritized execution queue for “now” |
| **ExecutionUnit** | One executable unit (not a Production Batch) |
| **ExecutionStatus** | Lifecycle enum |
| **ExecutionOperator** | Assigned operator identity |
| **ExecutionProgress** | Progress signals (not recipe steps) |
| **KitchenError** | Domain errors |

### Lifecycle

```text
READY → IN_PROGRESS → PAUSED → IN_PROGRESS → COMPLETED
      ↘ BLOCKED ↗
```

---

## Facade (Phase 2 · ADR 0071)

```text
src/kitchen/
  KitchenExecutionFacade.ts
  useKitchenExecution.ts
  KitchenCommands.ts
  KitchenQueries.ts
  KitchenContext.ts
```

| Intent | Substrate |
|--------|-----------|
| MarkExecutionReady | ProductionFacade.markBatchReady |
| CompleteExecution | ProductionFacade.closeBatch |
| GetExecutionQueue / Units / Progress / Blocked / Completed | ProductionFacade.getProductionPlan → ExecutionUnit |
| Start / Pause / Resume / Block / Assign / Reassign | UNIMPLEMENTED |
| GetOperatorAssignments | UNIMPLEMENTED |

---

## Acceptance

### Phase 1 (Architecture) ✅

- [x] Canonical definition · LAW 006 question  
- [x] Contracts · lifecycle · sequences  
- [x] ADR 0070 · no UI / CRUD / DB  

### Phase 2 (Facade) ✅

- [x] `KitchenExecutionFacade` + `useKitchenExecution`  
- [x] ExecutionUnit language  
- [x] Compose ProductionFacade only  
- [x] ADR 0071 · unit tests  
- [x] **No UI · no CRUD · no DB · no routing**

### Phase 3 (Engineering Certification) ✅

- [x] Validation matrix · Expected / Observed / Evidence  
- [x] ADR 0072 · report · smoke checklist  
- [x] LAW 006-A documented  
- [x] FAIL = 0  
- [x] **No Product UI · no Delivery · no Billing**

### Phase 4 (Capability Demo) ✅

- [x] `/admin/kitchen-workspace` · `useKitchenExecution()` only  
- [x] LAW 003–006-A demonstrated  
- [x] ADR 0073 · final isolated Capability Demo  
- [x] LAW 007 · Phase A/B/C roadmap frozen  
- [x] **No Delivery · no Billing · no production execution engine**

---

## Definition of Done

```text
Kitchen answers one question only:
"What work should the kitchen execute now?"

Kitchen consumes only ProductionFacade.
KitchenExecutionFacade is the canonical execution API.
Kitchen Execution is Engineering Certified + Demo.
Phase A complete through Kitchen.
```

---

## Next

```text
OPERATIONAL-005 Phase 1–4          ✅ CLOSED
OPERATIONAL-FLOW-001               ← next
  Orders → Production → Kitchen
```

**Operational Flow Validation (Phase B)** begins. Delivery is not opened as an isolated Capability Demo first.
