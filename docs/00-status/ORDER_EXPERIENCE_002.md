# ORDER EXPERIENCE 002 · Zero Friction Order Search

**Status:** ▶ **IN PROGRESS**  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/order-capture` (Order Experience · Search entry)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Order · Phase **002 Search**  
**Lifecycle:** [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Order Search

The operator remembers people, days or situations.
Never internal IDs.

Primary KPI
Time-to-Find Order (TTFO) < 10 seconds
```

---

## Context

* Strategic Freeze · Developer Platform · Foundation · Engine v1.0 · **frozen**  
* Order Capability · Order Facade · **frozen**  
* Customer Experience · **frozen**  
* OE001 Capture · complete on same surface  
* Experience only — `useOrder()` · `useCustomer()` · no modules / Supabase  

---

## Search criteria (operator language)

* Customer · Organization · Employee  
* Delivery Day · Delivery Area  
* Order Status · Phone · Recent  

Live search while typing — **no Search button**.

Prioritize: recent · exact · frequently accessed · pending delivery.

---

## Order card (identify without opening)

* Customer · Organization (if any)  
* Delivery Day · Area  
* Status · Item count  
* Special instructions indicator  
* Quick actions: Open · Edit · Call · Open Customer  
  (Create Similar · Report Incident → future OE004/005)  

---

## Empty state

No matching order → **Create New Order** · **Open Customer**. Never a dead end.

---

## Honesty

Facade `SearchOrders` returns operational summaries.  
OE001 session **operational commitments** are included in Experience search so phone captures remain findable until staff intake persists.

Area / phone enrichment via `useCustomer` when available — never invent fields.

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 30–60 s (browse lists / filters / IDs · **Estimated**) |
| **New workflow** | ≈ 5–10 s (type → see card · **Estimated**) |
| **Estimated saving** | ≈ **20–50 s per find** |
| **Mission KPI** | TTFO &lt; 10 s |
| **Measurement** | Stopwatch · 10 finds dogfood · Observation Sprint (LAW 001-A) |
| **Evidence label** | **Estimated** until Observation |

---

## Order Experience sequence (official)

```text
001 Capture                 ✅
002 Search                  ▶ THIS
003 Edit
004 Order Templates
005 Operational Incident
↓
Experience Review
↓
Freeze
↓
Menu Experience
```

---

## Non-goals

* No Capability / Facade / Engine changes  
* No OCC · Quick Capture · Bulk · Import  
* No OE003 Edit redesign in this PR  

---

## Definition of Done

* Operator finds any operational commitment in &lt; 10 s on the happy path  
* Searching feels immediate  
* Operator thinks about customer and delivery — never the software  
* Experience Card + OTS + PR Review Protocol fields present  

---

## Related

* [ORDER_EXPERIENCE_001](./ORDER_EXPERIENCE_001.md)  
* [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
