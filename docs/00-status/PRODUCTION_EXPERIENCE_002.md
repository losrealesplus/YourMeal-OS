# PRODUCTION EXPERIENCE 002 · Zero Friction Production Search

**Status:** ✅ **COMPLETE** (superseded as active by PE003 · surface retained)  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/production-planning` (mode **search**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Production · Phase **002 Production Search**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Production Search

The operator remembers days,
loads, batches, alerts and preparation needs.

Never internal IDs.
Never technical identifiers.

Primary KPI
Time-to-Find-Production-Work (TTFPW) < 10 seconds
```

---

## Context

* Customer · Order · Menu Journeys · **Certified**  
* PE001 · **complete**  
* Production Capability · Facade · Engine · **frozen**  
* Experience only  
* Accelerators · **Reserved**  

---

## Principle

```text
Not: buscar pedidos o platos del catálogo
Yes: ¿Dónde está el bloque de producción correcto esta semana?
```

Search operates on **executable production work**, not Order admin lists.

---

## Search criteria

Week · Day · Production block · Dish · Batch · Preparation type · Load state · Alert status · Deadline · Status

### Behaviour

* Live search while typing — no Search button  
* Partial matches · date fragments · dish names · batch labels · alert filters  
* Prioritize: current week · high load · pending alerts · recently edited  

---

## Production card

Week · Day · Work summary · Quantity · Load · Deadline · Alert status · Preparation requirements  

Identify the block without opening it.

---

## Quick actions

Open Production Work · Review Alerts · Open Kitchen Handoff · Print · Export  

Future: Generate Plan Again  

---

## Empty state

No matching production work.  

Primary: **Open Production Planning** · **Open Menu Planning**

---

## Sequence

```text
001 Production Planning        ✅
002 Production Search          ✅
003 Production Adaptation      ▶ next
004 Pre-Preparations
005 Alerts & Deadlines
006 Kitchen Handoff
↓
Review → Journey Certification → Freeze
```

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 30–90 s (scroll days · reopen sheets · guess batch · **Estimated**) |
| **New workflow** | ≈ 3–10 s (type · see card · open · **Estimated**) |
| **Estimated saving** | ≈ **20–80 s per find** |
| **Mission KPI** | TTFPW &lt; 10 s |
| **Measurement** | Stopwatch · 15 finds · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Non-goals

* No Production Capability / Facade / Engine  
* No OCC · Bulk · Import · Templates · Smart Suggestions  
* No Order search disguised as Production  

---

## Definition of Done

Operator locates the correct production work in under 10 seconds.  
Searching feels immediate. Planning continuity preserved. Software disappears.

---

## Related

* [PRODUCTION_EXPERIENCE_001](./PRODUCTION_EXPERIENCE_001.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
