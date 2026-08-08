# DELIVERY EXPERIENCE 002 · Zero Friction Delivery Search

**Status:** ▶ **IN PROGRESS**  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/delivery-today` (mode **search**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Delivery · Phase **002 Delivery Search**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Delivery Search

The operator remembers the delivery
through operational context.
Never internal IDs.

Search deliveries.
Do not recreate Customer management.
Do not recreate Order management.
Do not turn Search into route planning.

Primary KPI
Time-to-Find-Delivery (TTFD) < 10 seconds
```

---

## Context

* Customer · Order · Menu · Production · Kitchen Journeys · **Certified** (Kitchen **Frozen**)  
* DE001 Today's Delivery Day · **complete** (surface retained)  
* Delivery Capability · Facade · **frozen**  
* Experience only  
* Routes · maps · navigation · ConfirmDelivery · durable AssignDelivery · **Future**  
* Accelerators · **Reserved**  

---

## Principle

```text
Not: Customer Search · Order admin · route planning · navigation
Yes: ¿Dónde está la entrega que debo preparar / revisar en la jornada?
```

Today's Delivery Day remains the primary entry. Search accelerates the day — it is not a second CRM or planner.  
Search does not become Customer search, Order management, route planning, navigation, or delivery confirmation.

---

## Search criteria

Customer · Order · Address · Zone · Delivery window · Status ·  
Driver / responsibility (when available) · Delivery day  

Live search while typing. No Search button. Partial matches.  

Prioritize: Today's deliveries · Ready · Unresolved · Urgent gaps · Recently accessed  

---

## Empty state

No matching deliveries.  
Primary: Return to Today's Deliveries · Review Orders · Review Production Handoff  

---

## Sequence (hypothesis — Observation may reshape)

```text
001 Today's Delivery Day       ✅
002 Delivery Search            ▶ THIS
003 Delivery Adaptation
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
| **Current workflow** | ≈ 30–90 s (scroll day · reopen Orders · ask · **Estimated**) |
| **New workflow** | ≈ 3–10 s (type · see card · open · **Estimated**) |
| **Estimated saving** | ≈ **20–80 s per find** |
| **Mission KPI** | TTFD &lt; 10 s |
| **Measurement** | Stopwatch · 20 finds · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

```text
Estimated OTS
      ≠
Measured Time Saved
```

---

## Non-goals

* No Delivery / Order / Customer Capability · Facade  
* No Customer Search or Order management inside Delivery  
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

The operator finds the correct delivery in under 10 seconds. Search remains delivery-focused. Today's Delivery Day remains the primary operational context. Unavailable substrate stays honest. Software disappears.

---

## Related

* [DELIVERY_EXPERIENCE_001](./DELIVERY_EXPERIENCE_001.md)  
* [KITCHEN_JOURNEY_CERTIFICATION](../tenant-success/KITCHEN_JOURNEY_CERTIFICATION.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
