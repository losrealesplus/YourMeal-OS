# PRODUCTION EXPERIENCE 001 · Zero Friction Production Planning

**Status:** ▶ **IN PROGRESS**  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/production-planning`  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Production · Phase **001 Production Planning**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Production Planning

Production does not receive loose menus.
Production receives a published operational week.
Production transforms that week into work.

Primary KPI
Time-to-Prepare-Production-Plan (TPP) < 10 minutes
```

---

## Context

* Customer · Order Journeys · **Certified · Frozen**  
* Menu Experience 001–005 · **complete** (formal Review → Certification still the Menu close ritual)  
* Production Capability · Production Facade · **frozen** (no changes)  
* Operational Engine v1.0 · **frozen**  
* Experience only  
* Accelerators · **Reserved**  

---

## Principle

```text
MENU
¿Qué vamos a ofrecer?
Semana → Día → Menú → Platos

PRODUCTION
¿Qué tenemos que preparar para cumplirlo?
Semana → Día → Trabajo → Cantidad → Deadline → Kitchen
```

Never reconstruct production by hand from Orders + Menus.  
Never create production from an incomplete / unpublished source.

---

## Primary workflow

```text
Open Published Week
        ↓
Generate Production Plan
        ↓
Review Production Work
        ↓
Group Work
        ↓
Review Load
        ↓
Identify Alerts
        ↓
Confirm Plan
        ↓
Ready for Kitchen
```

---

## Production view

Week · Production date · Required work · Quantity · Dish / Batch · Status · Load · Alerts · Preparation requirements

### Grouping

Production day · Dish · Batch · Preparation · (Future: Station)

### Load

Total work · Daily workload · Dish / batch quantities · Potential overload · Incomplete planning  

Never hide operational pressure.

### Alerts

Missing production data · Insufficient planning · Preparation / cooking deadlines · Defrost · Capacity · Quantity estimated  

Future: ingredient shortage

### Pre-preparations

Base · Sauce · Protein · Defrost · Cutting · Assembly  

Show preparation date · required use date · status

### Kitchen handoff

What · When · How much · For which production day — without reopening Orders.

### Export / print

Print / PDF (browser) · Excel (CSV) · Future: scheduled export  

Executable work documents — not decorative reports.

---

## Sequence (Production — physical work, not CRUD copy)

```text
001 Production Planning        ▶ THIS
002 Production Search
003 Production Adaptation
004 Pre-Preparations
005 Alerts & Deadlines
006 Kitchen Handoff
↓
Review → Journey Certification → Freeze
```

---

## Honesty

* Source = published `WeekPlan` from Menu Experience (session / published_durable)  
* Experience working set: `ymos.pe.production_plan.v1`  
* Quantities estimated from menu coverage until Orders enrich (alert honesty)  
* ProductionFacade / Capability **not changed** — demo workspace remains Capability Demo  
* Empty state → Open Menu Planning  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 25–60 min (rebuild from Orders · menus · spreadsheets · **Estimated**) |
| **New workflow** | ≈ 5–10 min (open published week · generate · review · confirm · **Estimated**) |
| **Estimated saving** | ≈ **15–50 min per weekly cycle** |
| **Mission KPI** | TPP &lt; 10 min |
| **Measurement** | Stopwatch · 5 generate→confirm cycles · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Non-goals

* No Production Capability / Facade / Engine changes  
* No architectural work  
* No OCC · Bulk · Import · Templates · Smart Suggestions  
* No full Kitchen Experience (later)  
* No order-admin surface disguised as Production  

---

## Definition of Done

A published weekly plan becomes executable production work without manual reconstruction.  
Workload · alerts · pre-preparations visible. Kitchen receives a clear handoff. Software disappears.

---

## Related

* [MENU_EXPERIENCE_005](./MENU_EXPERIENCE_005.md)  
* [OPERATIONAL_LIBRARIES](./OPERATIONAL_LIBRARIES.md)  
* [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)  
* [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
