# ORDER EXPERIENCE 005 · Zero Friction Operational Incident

**Status:** ✅ **COMPLETE** — Review · Journey Certification · Freeze ([ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md))  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/order-capture` (mode **incident**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Order · Phase **005 Incident**  
**Lifecycle:** [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Operational Incident

Record the exception. Route it. Keep moving.

Primary KPI
Time-to-Record Operational Incident (TTRI) < 30 seconds

Secondary KPI
Time-to-Route Incident < 10 seconds
```

---

## Context

* Engine · Capability · Facade · **frozen**  
* OE001–004 · **complete**  
* Experience only — session incident ledger (honesty)  
* Orders **creates** the incident; Kitchen · Delivery · CS · Billing may resolve it  
* OCC remains **Reserved** — “Open Command Center” is a future CTA only  

---

## Principle

```text
Not every order follows the happy path.
Orders does not solve every domain.
Orders records the exception and routes it.
```

---

## Types → suggested route

| Type | Suggested route |
|------|-----------------|
| Customer change · Clarification | Customer service |
| Kitchen · Allergy · Missing · Late prep | Kitchen |
| Delivery · Address | Delivery |
| Billing | Future |
| Supervisor | Future |

Operator can override route before confirm.

---

## Flow

```text
Order (Search / Edit)
    ↓
Report incident
    ↓
Classify · note · priority
    ↓
Route (&lt;10s)
    ↓
Next Best Action (never dead end)
```

---

## Honesty

No Incident Capability / Facade.  
Session ledger until Product opens durable substrate.  
Never invent Kitchen/Delivery writes — route is Experience classification + CTA links.

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 60–180 s (chat · sticky · rediscover · **Estimated**) |
| **New workflow** | ≈ 15–30 s (classify · note · route · **Estimated**) |
| **Estimated saving** | ≈ **30–150 s per incident** |
| **Mission KPI** | TTRI &lt; 30 s · Route &lt; 10 s |
| **Measurement** | Stopwatch · 5 incidents dogfood · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Sequence

```text
001 Capture                 ✅
002 Search                  ✅
003 Edit                    ✅
004 Order Templates         ✅
005 Operational Incident    ✅
↓
Experience Review           ✅
↓
Journey Certification       ✅
↓
Freeze                      ✅
↓
Menu Experience             ← NEXT
```

---

## Non-goals

* No Capability / Facade / Engine  
* No OCC / Capture / Bulk / Import  
* No full Kitchen/Delivery resolution UI  

---

## Definition of Done

* Incident recorded and routed without breaking the flow  
* Operator never stranded  
* Software disappears  

---

## Related

* [ORDER_EXPERIENCE_004](./ORDER_EXPERIENCE_004.md)  
* [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
