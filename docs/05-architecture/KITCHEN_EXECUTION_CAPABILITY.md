# Kitchen Execution Capability

**OPERATIONAL-005 · Phase 1 — Observe → Design → Freeze**  
**ADR:** [0070](../adr/0070-kitchen-execution-capability.md)  
**Status:** **Architecture** (frozen)  
**Depends on:** Production (Engineering Certified + Capability Demo)  
**EatClean lens:** weekly meal prep · coordinate batch execution on the production floor  
**Layer / Type:** **Operational Execution** (first of its kind)  
**Maturity:** Architecture → Facade → Engineering Certified → Field Validated → Production Ready  
**Completeness:** Architecture → Facade → Engineering Certification → Capability Demo → Product UI → Field → Production  
**Laws:** 001–005 · [FOUNDATION_LOCK](./FOUNDATION_LOCK.md)

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
batch start / pause / resume / complete · progress · visibility.
```

**Canonical question:**

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
| **Orders** | Planning | Operational commitment for a week | Batches / execution |
| **Production** | Planning | Planning · batches · queue · load · schedule · readiness | Start / pause / craft progress |
| **Kitchen Execution** | Execution | Queue orchestration · status · progress · operator · batch lifecycle | Recipes · ingredients · replanning Orders |
| **Delivery** | Execution | Routes · POD · logistics | Kitchen queues |
| **Billing** | Outcome | Invoices · settlement | Kitchen state |

```text
Order               →  ¿Qué compromiso existe?
Production          →  ¿Qué trabajo debemos generar?
Kitchen Execution   →  ¿Qué trabajo debe ejecutarse ahora?
Delivery            →  ¿Qué hay que entregar?
Billing             →  ¿Qué hay que cobrar?
```

If a feature makes Kitchen “plan the day”, it belongs in **Production**.  
If a feature makes Kitchen “choose ingredients / recipes”, it belongs in the **gastronomic domain** — not here.

---

## Kitchen does NOT cook

Same discipline as Production:

```text
Production never cooks.     Production plans.
Kitchen never cooks.        Kitchen orchestrates.
The physical kitchen cooks.
```

| Kitchen owns | Kitchen never owns |
|--------------|--------------------|
| Execution Queue | Recipes |
| Workstation Queue | Ingredients |
| Execution Status | Pans / ovens / tools |
| Execution Progress | Gastronomic craft steps |
| Batch Start / Pause / Resume / Complete | Replanning Orders |
| Operator Assignment | Generating Production batches |
| Operational visibility | Mutating Order commitments |

---

## Responsibilities

Kitchen owns:

| Concept | Meaning |
|---------|---------|
| **Execution Queue** | Ordered work ready to run now (from Production readiness) |
| **Workstation Queue** | Work sliced by station / line |
| **Execution Status** | Lifecycle of each batch under execution |
| **Execution Progress** | How far a batch has advanced operationally |
| **Batch Start** | Accept work into IN_PROGRESS |
| **Batch Pause** | Hold work without completing |
| **Batch Resume** | Continue paused work |
| **Batch Complete** | Mark work COMPLETED for downstream |
| **Operator Assignment** | Who is responsible for this execution unit |
| **Operational visibility** | Floor-readable view of what runs now |

---

## Relationships

### Consumes

```text
ProductionFacade only
```

Kitchen never reads Order tables, never invents batches from raw Orders, never bypasses Production readiness.

### Provides

```text
DeliveryCapability  (downstream: completed / releasable work)
```

### Never

```text
Never plans work.
Never modifies Orders.
Never generates Production.
```

Protected by **FOUNDATION LAW 005**.

```text
        Identity
           │
        Customers
           │
         Orders
           │
       Production  ←── Planning
           │
           │  ProductionFacade
           ▼
   Kitchen Execution  ←── Execution (this capability)
           │
        Delivery
           │
        Billing
```

---

## Contracts (frozen · Phase 1)

| Contract | Role |
|----------|------|
| **KitchenContext** | Tenant · operator · permissions · active day / shift scope |
| **KitchenQueue** | Prioritized execution queue for “now” |
| **KitchenBatch** | One executable unit consumed from Production |
| **KitchenExecution** | Active orchestration record (who · where · status) |
| **KitchenStatus** | Lifecycle enum projection |
| **KitchenOperator** | Assigned operator identity for a batch / station |
| **KitchenProgress** | Progress signals (not recipe steps) |
| **KitchenError** | Domain errors (blocked · unauthorized · not ready · conflict) |

### Sketch (architecture only — not implemented)

```ts
type KitchenStatus =
  | "READY"
  | "IN_PROGRESS"
  | "PAUSED"
  | "BLOCKED"
  | "COMPLETED";

interface KitchenContext {
  tenantId: string;
  operatorId: string;
  capabilities: string[];
  day: string; // operational day
}

interface KitchenBatch {
  id: string;
  productionBatchId: string; // from ProductionFacade
  workstationId?: string;
  status: KitchenStatus;
  assignedOperatorId?: string;
}

interface KitchenQueue {
  day: string;
  items: KitchenBatch[];
}

interface KitchenExecution {
  batchId: string;
  status: KitchenStatus;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  blockedReason?: string;
}

interface KitchenOperator {
  id: string;
  displayName: string;
  stationIds: string[];
}

interface KitchenProgress {
  batchId: string;
  percent?: number; // operational, not culinary
  lastEventAt: string;
}

type KitchenError =
  | { code: "NOT_READY"; message: string }
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "CONFLICT"; message: string }
  | { code: "BLOCKED"; message: string };
```

---

## Lifecycle

```text
READY
  → IN_PROGRESS
  → PAUSED
  → IN_PROGRESS
  → COMPLETED

READY | IN_PROGRESS | PAUSED
  → BLOCKED
  → IN_PROGRESS | PAUSED | READY   (after unblock)
```

### State machine

```text
                  start
  READY ──────────────────▶ IN_PROGRESS
    ▲                            │
    │                     pause  │  resume
    │                            ▼
    │                         PAUSED
    │                            │
    │         unblock            │ complete
    │◀──────── BLOCKED ◀─────────┤
    │              ▲             │
    │              │ block       ▼
    └──────────────┴──────── COMPLETED
```

| Status | Meaning |
|--------|---------|
| **READY** | Production released work; Kitchen may start |
| **IN_PROGRESS** | Operator actively executing |
| **PAUSED** | Intentionally held; not failed |
| **BLOCKED** | Cannot proceed (ops reason); needs visibility |
| **COMPLETED** | Finished; visible to Delivery |

---

## Sequence diagrams

### Pull execution queue (now)

```text
Operator → KitchenFacade: GetExecutionQueue(day)
KitchenFacade → ProductionFacade: GetProductionQueue / readiness
ProductionFacade → KitchenFacade: released batches
KitchenFacade → Operator: KitchenQueue (READY items)
```

### Start → pause → resume → complete

```text
Op → Kitchen: StartBatch(batchId)
Kitchen → validates READY + Production still released
Kitchen → IN_PROGRESS + KitchenExecution

Op → Kitchen: PauseBatch(batchId)
Kitchen → PAUSED

Op → Kitchen: ResumeBatch(batchId)
Kitchen → IN_PROGRESS

Op → Kitchen: CompleteBatch(batchId)
Kitchen → COMPLETED
Note: Delivery may consume completion facts later
```

### Forbidden paths

```text
Kitchen ──X──▶ OrderFacade (mutate)
Kitchen ──X──▶ invent ProductionBatch
Kitchen ──X──▶ “plan tomorrow’s load”
```

---

## Permission model (architecture)

| Permission (illustrative) | Who | Allows |
|---------------------------|-----|--------|
| `kitchen.queue.read` | Ops / Kitchen | See execution queue |
| `kitchen.batch.start` | Kitchen | Start READY → IN_PROGRESS |
| `kitchen.batch.pause` | Kitchen | Pause / resume |
| `kitchen.batch.complete` | Kitchen | Complete |
| `kitchen.batch.block` | Lead | Mark BLOCKED / unblock |
| `kitchen.operator.assign` | Lead | Assign operators |
| `kitchen.operate` | Kitchen role | Bundle for floor operation |

Exact keys freeze at Facade phase; Architecture only names the model.

---

## Extension points (Future — not Phase 1)

| Extension | Notes |
|-----------|-------|
| Real-time kitchen screens | Consumers of KitchenFacade |
| Kitchen displays | Read-only Operational Experience |
| IoT devices | Signal progress / blockers via Facade |
| Barcode / QR batches | Identify KitchenBatch · never redefine plan |
| AI workload balancing | Suggest priority — never invent Production |

---

## Language (internal)

| Use | Avoid |
|-----|-------|
| StartBatch · PauseBatch · ResumeBatch · CompleteBatch | CookDish · Stir · Bake |
| GetExecutionQueue · AssignOperator | GetOrders · UpdateOrder · GeneratePlan |
| KitchenStatus · KitchenProgress | RecipeStep · IngredientList |

---

## Acceptance (Phase 1)

- [x] Canonical definition: Kitchen orchestrates execution; does not cook / plan  
- [x] Canonical question: *¿Qué trabajo debe ejecutarse ahora?*  
- [x] Responsibilities · lifecycle · state machine  
- [x] Contracts (`KitchenContext`, `KitchenQueue`, `KitchenBatch`, `KitchenExecution`, `KitchenStatus`, `KitchenOperator`, `KitchenProgress`, `KitchenError`)  
- [x] Sequence diagrams · permission model · relationships  
- [x] Consumes **ProductionFacade** only · LAW 005  
- [x] ADR 0070 · Capability Registry update  
- [x] **No UI · no CRUD · no DB changes · no implementation**

---

## Definition of Done (Architecture)

```text
Kitchen answers one question only:
"What work should the kitchen execute now?"

Kitchen consumes only ProductionFacade.
```

---

## Next

```text
OPERATIONAL-005 Phase 1  Architecture              ✅ ADR 0070
OPERATIONAL-005 Phase 2  Facade                    ← next
OPERATIONAL-005 Phase 3  Engineering Certification
OPERATIONAL-005 Phase 4  Capability Demo
```

**Operational Engine exists.**  
**Operational Engine v1.0** still requires Kitchen Execution · Delivery · Billing certified.
