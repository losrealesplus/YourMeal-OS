# DELIVERY EXPERIENCE 004 · Zero Friction Delivery Responsibility

**Status:** ▶ **IN PROGRESS**  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/delivery-today` (mode **responsibility**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Delivery · Phase **004 Delivery Responsibility**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Delivery Responsibility

A delivery is not operationally ready
until responsibility is understood.

Distinguish:
Assigned · Unassigned · Assignment unavailable
Completed · Unknown

Primary KPI
Time-to-Understand-Delivery-Responsibility (TTDR) < 10 seconds

Secondary KPI
Time-to-Identify-Unassigned-Delivery < 10 seconds
```

---

## Context

* Customer · Order · Menu · Production · Kitchen Journeys · **Certified** (Kitchen **Frozen**)  
* DE001–003 · **complete** (surface retained)  
* Delivery Capability · Facade · **frozen**  
* **AssignDelivery** · **UNIMPLEMENTED** on Facade — do not invent  
* Experience only  
* Route Preparation · **NEXT** (not this Experience)  
* Accelerators · **Reserved**  

---

## Principle

```text
Not: inventar conductor · fingir AssignDelivery · construir ruta
Yes: ver responsabilidad · gaps explícitos · preparar Route Preparation
```

```text
Delivery
├── Responsibility visible       ✅
├── Unassigned visible           ✅ (when substrate supports)
├── Assignment substrate         UNIMPLEMENTED
└── Route Preparation             NEXT
```

---

## Responsibility states

| State | When |
|-------|------|
| Assigned | Assignment substrate supports AND responsible person present |
| Unassigned | Assignment substrate supports AND no responsible person |
| Assignment unavailable | AssignDelivery not available — **current Facade reality** |
| Completed | Delivery completed / confirmed |
| Unknown | Cannot conclude from substrate |

Session responsibility notes (DE003) are labeled **sesión** — never durable assignment.

---

## Strict boundary

MUST NOT: invent AssignDelivery · simulate driver · build/optimize routes ·  
reorder stops algorithmically · navigation · ConfirmDelivery ·  
modify Customer / Order from Experience.

---

## Sequence (hypothesis — Observation may reshape)

```text
001 Today's Delivery Day       ✅
002 Delivery Search            ✅
003 Delivery Adaptation        ✅
004 Delivery Responsibility    ▶ THIS
005 Route Preparation          ← NEXT (not Optimization)
006 Delivery Completion
↓
Review → Journey Certification → Freeze
```

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 60–180 s (ask who · unassigned sheet · miss gaps · **Estimated**) |
| **New workflow** | ≈ 3–10 s (open Responsibility · scan states · **Estimated**) |
| **Estimated saving** | ≈ **50–170 s per understanding** |
| **Mission KPI** | TTDR &lt; 10 s · unassigned identify &lt; 10 s |
| **Measurement** | Stopwatch · 15 opens · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

```text
Estimated OTS
      ≠
Measured Time Saved
```

---

## Non-goals

* No Delivery / Order / Customer Capability · Facade changes  
* No invent AssignDelivery  
* No route optimization · maps · navigation · ConfirmDelivery  
* No OCC / Bulk / Import / Quick Capture  

---

## Acceptance

No changes to Delivery Capability.  
No changes to Delivery Facade.  
No changes to Customer / Order / Kitchen / Production Capability or Facade.  
No Operational Engine changes.  
No architecture.  
Experience only.

---

## Definition of Done

Operator immediately understands responsibility status. Unassigned visible when substrate supports. Assignment gaps explicit. No fake driver. Knows whether responsibility is ready for Route Preparation. Software disappears.

---

## Related

* [DELIVERY_EXPERIENCE_003](./DELIVERY_EXPERIENCE_003.md)  
* [DELIVERY_EXPERIENCE_002](./DELIVERY_EXPERIENCE_002.md)  
* [DELIVERY_EXPERIENCE_001](./DELIVERY_EXPERIENCE_001.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
