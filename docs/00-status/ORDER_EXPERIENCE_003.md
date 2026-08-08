# ORDER EXPERIENCE 003 · Zero Friction Order Edit

**Status:** ✅ **COMPLETE** — next [OE004 Templates](./ORDER_EXPERIENCE_004.md)  

**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/order-capture` (mode **edit**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Order · Phase **003 Edit**  
**Lifecycle:** [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Order Edit

Correct a live operational commitment —
not a database record.

Primary KPI
Time-to-Edit Order (TTEO) < 20 seconds

Secondary KPI
Time-to-Resume Operation < 5 seconds
```

---

## Context

* Engine · Capability · Facade · Customer Experience · **frozen**  
* OE001 Capture · OE002 Search · **complete**  
* Experience only — `useOrder()` · `useCustomer()`  
* No UpdateOrder on Facade → Experience-layer **operational order edits** (honesty, same pattern as CX003)

---

## Editable (inline)

* Delivery day  
* Item quantities · substitutions (conversation labels)  
* Special instructions · dietary notes  
* Address note (operational — not Capability address rewrite)  

Status transitions: only via existing process intents when Product allows — **not** invented in OE003.

---

## Flow

```text
Search → Open / Edit
    ↓
Inline section edit
    ↓
Save
    ↓
Resume (&lt;5s) — Search · Capture · Customer · Production
```

Context always visible: customer · day · area · status · instructions.

---

## Honesty

No `UpdateOrder` on Order Facade.  
OE003 saves corrections in session (`operational-order-edits`) and updates OE001 session commitments in place.  
When Product opens durable edit substrate, the Experience path stays.

If an order cannot be edited (e.g. cancelled) — explain why + Next Best Action. Never silent failure.

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 40–90 s (reopen · full form · re-type · **Estimated**) |
| **New workflow** | ≈ 10–20 s (inline · save · resume · **Estimated**) |
| **Estimated saving** | ≈ **20–70 s per edit** |
| **Mission KPI** | TTEO &lt; 20 s · Resume &lt; 5 s |
| **Measurement** | Stopwatch · 5 edits dogfood · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Sequence

```text
001 Capture                 ✅
002 Search                  ✅
003 Edit                    ✅ THIS
004 Order Templates         ▶ next
005 Operational Incident
↓
Review · Freeze
```

---

## Non-goals

* No Capability / Facade / Engine changes  
* No Accelerators  
* No OE004 Templates / OE005 Incident implementation  

---

## Definition of Done

* Frequent order corrected in &lt; 20 s  
* Operator never loses operational context  
* Editing feels immediate — software disappears  
* Card + OTS + PR Review Protocol present  

---

## Related

* [ORDER_EXPERIENCE_002](./ORDER_EXPERIENCE_002.md) · [001](./ORDER_EXPERIENCE_001.md)  
* [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
