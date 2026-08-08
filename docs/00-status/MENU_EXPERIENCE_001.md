# MENU EXPERIENCE 001 · Zero Friction Weekly Menu Planning

**Status:** ✅ **COMPLETE** (superseded as active by ME002 · surface retained)  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/menu-planning`  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Menu · Phase **001 Weekly Planning**  
**Lifecycle:** [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md) · [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Weekly Menu Planning

Weekly menus are operational plans.
Start from a known week. Adapt. Publish.

Primary KPI
Time-to-Prepare Weekly Menu (TTWM) < 10 minutes
```

---

## Context

* Customer Journey · Order Journey · **Certified · Frozen**  
* Strategic Freeze · Developer Platform · Foundation · Engine v1.0 · **frozen**  
* No Menu Capability / Menu Facade (does not exist yet)  
* Experience only — working set in session ledger  
* OP-001 `WeeklyMenuService` used as **seed / optional durable publish** only — not redesigned  
* Accelerators (OCC · Bulk · Import · Quick Capture) · **Reserved**  

---

## Principle

```text
Reuse before creation.
Never recreate what already exists.
Every week starts from a known baseline.
```

Menu Experience is **not** CRUD of menus.  
It is preparing **next week’s production offer** without starting from zero.

---

## Primary workflow

```text
Open current week
        ↓
Duplicate previous week
        ↓
Edit only the changes
        ↓
Preview
        ↓
Publish
        ↓
Ready for Orders
```

---

## Sequence (weekly cycle — not CRUD)

```text
001 Weekly Planning         ✅
002 Menu Search             ✅
003 Weekly Adaptation       ▶
004 Dish Library Integration
005 Publish & Preview
↓
Review
↓
Journey Certification
↓
Freeze
```

---

## Honesty

* Working plan lives in session (`ymos.me.week_plan.v1`) until Product opens Menu Facade.  
* Durable seed/publish via existing OP-001 when dish IDs are real catalog UUIDs.  
* Conversation / Experience dish ids → session publish only (never invent catalog rows).  
* Import Pipeline · Bulk edit · Quick Capture remain **Reserved**.  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 45–90 min (rebuild week · copy from memory · chat · **Estimated**) |
| **New workflow** | ≈ 5–10 min (duplicate · adapt · preview · publish · **Estimated**) |
| **Estimated saving** | ≈ **35–80 min per weekly planning cycle** |
| **Mission KPI** | TTWM &lt; 10 min |
| **Measurement** | Stopwatch · 3 weekly cycles dogfood · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Visible information

Week · Days · Active dishes · Macros / allergen hints (when known) · Publication status  

## Quick actions

Duplicate week · Add / replace dish · Disable dish · Preview · Publish  

Future (Reserved): Import menu · Bulk edit  

## Empty state

No weekly menu → **Crear primera semana** (or duplicate previous / open durable).

---

## Non-goals

* No Menu Capability / Facade / Engine  
* No Accelerator implementation  
* No full Dish Library Experience (ME004)  
* No redesign of `/admin/menus` bootstrap CRUD  

---

## Definition of Done

* Operator prepares the week without rebuilding from zero  
* Planning feels natural · software disappears  

---

## Related

* [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md)  
* [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)  
* [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md)  
* [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
