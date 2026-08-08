# MENU EXPERIENCE 005 · Zero Friction Publish & Preview

**Status:** ✅ **COMPLETE** (Menu phases 001–005 done · formal Review next · Production Experience active)  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/menu-planning` (mode **publish** · preview step in Planning)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Menu · Phase **005 Publish & Preview**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Publish & Preview

Planning does not end when the week exists.
It ends when the week is reviewed,
validated and published.

Primary KPI
Time-to-Review-and-Publish-Weekly-Menu (TTRP) < 5 minutes
```

---

## Context

* Customer · Order Journeys · **Certified · Frozen**  
* ME001–004 · **complete**  
* Menu Capability · Dish Library Capability · **frozen**  
* Experience only  
* Accelerators · **Reserved** · Planning Templates · **Candidate**  

---

## Principle

```text
Not only: ¿Puedo planificar?
Yes: ¿Puedo revisar la semana, validarla y publicarla sin perder control?
```

After publish, the week is ready for **Orders** and **Production** —  
an operational week, not a loose “menu” entity.

---

## Primary workflow

```text
Open weekly plan
        ↓
Preview week
        ↓
Review by day
        ↓
Check publication readiness
        ↓
Fix issues
        ↓
Publish
        ↓
Ready for Orders and Production
```

---

## Preview scope

* Week overview  
* Day-level breakdown  
* Menu / dish coverage  
* Macros status · Allergen status  
* Publication status  
* Missing items · operational gaps  

---

## Validation rules

Warn on missing days · incomplete coverage · incomplete dish data · allergen gaps · macro gaps · unpublished changes.

```text
Do not block without reason.
Be honest.
```

Only hard block: empty week (nothing to publish).

---

## Quick actions

Preview · Fix issue · Duplicate day · Replace dish · Publish  

Future: Schedule publish · Rollback last publish  

---

## Sequence

```text
001 Weekly Planning          ✅
002 Menu Search              ✅
003 Weekly Adaptation        ✅
004 Dish Library Integration ✅
005 Publish & Preview        ✅
↓
Review → Journey Certification → Freeze
↓
Production Experience ▶ [PRODUCTION_EXPERIENCE_001](./PRODUCTION_EXPERIENCE_001.md)
```

---

## Honesty

* Uses session week plan + existing `WeeklyMenuService.publish` when durable dishes  
* Readiness is Experience-layer (`week-readiness`) — not a new Capability  
* Session-only dishes → publish session with honesty  
* Schedule / Rollback → Future (not implemented)  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 15–40 min (scroll days · reopen menus · guess gaps · republish · **Estimated**) |
| **New workflow** | ≈ 2–5 min (overview · readiness · fix · publish · **Estimated**) |
| **Estimated saving** | ≈ **10–35 min per weekly cycle** |
| **Mission KPI** | TTRP &lt; 5 min |
| **Measurement** | Stopwatch · 5 full review→publish cycles · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Non-goals

* No Menu Capability / Facade / Engine changes  
* No Operational Engine changes  
* No Schedule publish / Rollback implementation  
* No OCC · Bulk · Import · Planning Templates  

---

## Definition of Done

The operator can review and publish a weekly menu with confidence and clarity.  
The week is ready for Orders and Production.  
The software disappears.

---

## Related

* [MENU_EXPERIENCE_004](./MENU_EXPERIENCE_004.md)  
* [OPERATIONAL_LIBRARIES](./OPERATIONAL_LIBRARIES.md)  
* [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
