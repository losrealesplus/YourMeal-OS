# DELIVERY EXPERIENCE 003 · Zero Friction Delivery Adaptation

**Status:** ▶ **IN PROGRESS**  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/delivery-today` (mode **adapt**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Delivery · Phase **003 Delivery Adaptation**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Delivery Adaptation

The delivery commitment already exists.
The delivery day may change.
The operator adapts operational context
while preserving the original Order.

Primary KPI
Time-to-Adapt-Delivery (TTAD) < 30 seconds

Secondary KPI
Time-to-Resume-Delivery-Day < 5 seconds
```

---

## Context

* Customer · Order · Menu · Production · Kitchen Journeys · **Certified** (Kitchen **Frozen**)  
* DE001 · DE002 · **complete** (surface retained)  
* Delivery Capability · Facade · **frozen**  
* Experience only  
* Routes · maps · navigation · ConfirmDelivery · durable AssignDelivery · **Future**  
* Accelerators · **Reserved**  

---

## Principle

```text
Not: reescribir Order · Customer · inventar ruta · ConfirmDelivery
Yes: adaptar el contexto del día · ver impacto · volver a la jornada
```

```text
Delivery Adaptation
        ↓
(if stop reorder as route needed)
        ↓
Route Preparation (DE005) — registered, not implemented here
```

---

## Adaptation scenarios

Sequence (day queue) · Priority · Day note · Operational instruction ·  
Address clarification (operational ≠ Customer record) · Window note ·  
Temporary issue · Responsibility note (when assignment unsupported)  

**Not adaptation:** reordenar paradas como ruta → **Route Preparation signal** (registered · not applied).

---

## Strict boundary

MUST NOT: modify Order · Customer · Menu · Production · Kitchen ·  
generate route optimization · navigation · ConfirmDelivery ·  
durable driver assignment · new Delivery Capability behaviour.

---

## Impact visibility

Before confirm: what changed · what unchanged · affects day? · escalation?  
Operator never believes Order was silently modified.  
Persistence labeled **session**.

---

## Sequence (hypothesis — Observation may reshape)

```text
001 Today's Delivery Day       ✅
002 Delivery Search            ✅
003 Delivery Adaptation        ▶ THIS
004 Driver / Responsibility
005 Route Preparation          ← not Route Optimization
006 Delivery Completion
↓
Review → Journey Certification → Freeze
```

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 2–10 min (rebuild sheet · reopen Orders · ask · **Estimated**) |
| **New workflow** | ≈ &lt; 30 s adapt + &lt; 5 s resume (**Estimated**) |
| **Estimated saving** | ≈ **90–570 s per adaptation** |
| **Mission KPI** | TTAD &lt; 30 s · resume &lt; 5 s |
| **Measurement** | Stopwatch · 15 adaptations · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

```text
Estimated OTS
      ≠
Measured Time Saved
```

---

## Non-goals

* No Delivery / Order / Customer Capability · Facade  
* No route optimization · maps · navigation · ConfirmDelivery  
* No durable AssignDelivery simulation  
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

Operator adapts a delivery-day variation without rebuilding the workload. Understands what changed and what did not. Order commitment is not silently modified. Route planning is not introduced. Resume day quickly. Software disappears.

---

## Related

* [DELIVERY_EXPERIENCE_002](./DELIVERY_EXPERIENCE_002.md)  
* [DELIVERY_EXPERIENCE_001](./DELIVERY_EXPERIENCE_001.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
