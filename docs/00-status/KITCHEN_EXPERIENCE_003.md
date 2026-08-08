# KITCHEN EXPERIENCE 003 · Zero Friction Kitchen Execution Adaptation

**Status:** ▶ **IN PROGRESS**  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/kitchen-today` (mode **adapt**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Kitchen · Phase **003 Execution Adaptation**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Kitchen Execution Adaptation

Kitchen adapts execution.
Kitchen does not re-plan.

Primary KPI
Time-to-Adapt-Execution (TTAE) < 30 seconds

Secondary KPI
Time-to-Resume-Execution < 5 seconds
```

---

## Context

* Customer · Order · Menu · Production Journeys · **Certified** (Production **Frozen**)  
* KE001 Today's Work · KE002 Search · **complete**  
* Kitchen Capability · Facade · **frozen**  
* Experience only  
* Start / Pause / Resume / Block / Assign / Notify · **Future**  
* Accelerators · **Reserved**  

---

## Principle

```text
Not: reabrir Production · regenerar plan · inventar Capability
Yes: adaptar el contexto de ejecución local y volver a cocinar
```

```text
Production → ¿Qué trabajo generar?
Handoff    → ¿Qué trabajo transferir?
Kitchen    → ¿Cómo adapto mi ejecución sin replanificar?
```

---

## Adaptation scenarios (local)

* Execution quantity adjustment  
* Execution sequencing  
* Preparation availability  
* Execution note  
* Special execution instruction  
* Temporary execution issue  
* Work priority adjustment  

---

## Strict boundary

Kitchen adaptation **MUST NOT**:

* Change the weekly production plan  
* Generate new production work  
* Change Menu planning  
* Change Order commitments  
* Recalculate Production capacity  
* Create new Capability behaviour  

Session key: `ymos.ke.exec_adapt.v1` — marked **sesión** · not durable ExecutionUnit.

If durable `ExecutionUnit` mutation is required → **record substrate gap** · do not simulate · do not open Capability from Experience.

---

## Impact visibility

Before confirm:

* What changed  
* What remains unchanged  
* Whether the execution item is affected  
* Whether escalation is required  
* Explicit: Production plan **not** modified  

---

## Escalation

When local execution cannot absorb the change: show reason + next action.  
Targets (guidance only): Production · Supervisor · Delivery · Customer Service.  
No new routing substrates. Notify / Block → Future.

---

## Sequence

```text
001 Today's Work               ✅
002 Execution Search           ✅
003 Execution Adaptation       ▶ THIS
004 Labels & Special Info
005 Execution Progress
006 Completion / Handoff
↓
Review → Journey Certification → Freeze
```

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 2–8 min (leave Kitchen · reopen Production · ask · rebuild context · **Estimated**) |
| **New workflow** | ≈ 15–45 s (select · adapt · review impact · confirm · resume · **Estimated**) |
| **Estimated saving** | ≈ **90–420 s per adaptation** (~1.5–7 min) |
| **Mission KPI** | TTAE &lt; 30 s · Resume &lt; 5 s |
| **Measurement** | Stopwatch · 15 adaptations · Escape-to-Production rate · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Substrate gaps (registered · not simulated)

| Gap | Why |
|-----|-----|
| Durable ExecutionUnit quantity / notes / priority | Capability frozen — session overlay only |
| Block / Assign / Notify Supervisor / Notify Production | Future until substrate opens |
| Production plan mutation from Kitchen | Forbidden — escalate to Production Experience |

---

## Non-goals

* No Kitchen / Production / Order Capability · Facade · Engine  
* No Production reopen for plan edits  
* No Start / Pause / Resume / Block / Assign  
* No Accelerators (OCC · Bulk · Quick Capture · Import)  

---

## Definition of Done

A Kitchen operator reacts to an execution-level variation without reconstructing Production, understands what changed and what did not, and resumes execution quickly. Software disappears.

---

## Related

* [KITCHEN_EXPERIENCE_002](./KITCHEN_EXPERIENCE_002.md)  
* [KITCHEN_EXPERIENCE_001](./KITCHEN_EXPERIENCE_001.md)  
* [PRODUCTION_JOURNEY_CERTIFICATION](../tenant-success/PRODUCTION_JOURNEY_CERTIFICATION.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
