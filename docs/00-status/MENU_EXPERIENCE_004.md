# MENU EXPERIENCE 004 · Zero Friction Dish Library Integration

**Status:** ✅ **COMPLETE** (superseded as active by ME005 · surface retained)  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/menu-planning` (Planning · Adaptation · Dish Library picker)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Menu · Phase **004 Dish Library**  
**Libraries:** [OPERATIONAL_LIBRARIES](./OPERATIONAL_LIBRARIES.md)  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Dish Library Integration

The Dish Library is the operational memory of the tenant.
Weekly planning consumes the library.
It never recreates it.

Primary KPI
Time-to-Find-and-Insert Dish (TTFID) < 15 seconds

Secondary KPI
Time-to-Replace Dish < 20 seconds
```

---

## Context

* Customer · Order Journeys · **Certified · Frozen**  
* ME001–003 · **complete**  
* Menu Capability · Dish Library Capability · **frozen** (no changes)  
* Experience only  
* Accelerators · **Reserved** · Planning Templates · **Candidate**  

---

## Principle

```text
Not: ¿Cómo creo un plato?
Yes: ¿Cómo encuentro y reutilizo el plato correcto para esta semana?
```

Dish Library ≠ dish CRUD screen.  
It is the **master culinary catalog** consumed inside weekly planning.

---

## Primary workflow

```text
Planning Week
        ↓
Select Day
        ↓
Open Dish Library
        ↓
Search Dish
        ↓
Preview
        ↓
Insert / Replace
        ↓
Continue Planning
```

---

## Search & preview

Live search on name · tags · allergen hints.  
Rank: available · recently/frequently used · macros/allergen completeness.

Preview at a glance: name · tags · macros · allergens · availability · last used.  
Decide without leaving planning.

---

## Quick actions

Insert · Replace current · Preview context · Open dish (bootstrap) · Duplicate dish (future)

Empty: **Crear plato** · **Volver a planificación**

---

## Sequence

```text
001 Weekly Planning          ✅
002 Menu Search              ✅
003 Weekly Adaptation        ✅
004 Dish Library Integration ✅
005 Publish & Preview        ▶ next
↓
Review → Journey Certification → Freeze
```

---

## Honesty

* Reads existing `DishService.list` (bootstrap) — no Dish Capability changes  
* Usage frequency tracked in session (`ymos.me.dish_usage.v1`)  
* Conversation chips remain fallback when library empty  
* Create Dish links to `/admin/dishes` bootstrap — not reinvented here  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 45–120 s (scroll chips · reopen dishes · retype · **Estimated**) |
| **New workflow** | ≈ 8–15 s (search · preview · insert · **Estimated**) |
| **Estimated saving** | ≈ **30–105 s per insert/replace** |
| **Mission KPI** | TTFID &lt; 15 s · Replace &lt; 20 s |
| **Measurement** | Stopwatch · 10 inserts · 5 replaces · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Non-goals

* No Dish Library Capability / Menu Capability / Engine  
* No full dish admin redesign  
* No Import / Bulk / OCC / Planning Templates implementation  

---

## Definition of Done

Planner finds, previews, and inserts any existing dish into the weekly plan without interrupting planning.

---

## Related

* [OPERATIONAL_LIBRARIES](./OPERATIONAL_LIBRARIES.md)  
* [MENU_EXPERIENCE_003](./MENU_EXPERIENCE_003.md)  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
