# CUSTOMER EXPERIENCE 001 · Phase 1

**Status:** ▶ **ACTIVE** — first real Era 2 Experience implementation  
**Parent:** [CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Customer  
**Surface:** `/admin/customer-workspace`  
**Constraint:** Experience **above** existing Facade only — **no** Capability / Facade / Engine / Foundation changes in this phase

```text
Mission
Create the fastest possible customer creation
experience for a food business.

KPI
Time-to-Create Customer < 30 seconds

Software succeeds when it disappears.
```

---

## Scope (Phase 1)

* Type selector: Individual · Company · Company Employee  
* Minimal fields: Name · Phone · Delivery Address  
* Progressive Completion (no billing / tags / notes / allergies / prefs / hierarchy on create)  
* Immediate search (name · phone · company · recent)  
* Post-create actions: Open · Create Order · Call · (WhatsApp / Maps future-ready)  
* Keyboard-first · large touch targets · mobile-first  
* No dead-end screens  

---

## Non-goals (Phase 1)

* Do **not** redesign Customer Capability  
* Do **not** modify Customer Facade  
* Do **not** change Operational Engine / Foundation / Flows  
* Do **not** open Isabella Observation (LAW 001-A)  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 90–180 s (legacy directory / multi-screen alta · estimate) |
| **New workflow** | ≈ 20–30 s (type → name → phone → address → save) |
| **Estimated saving** | ≈ **60–150 s per alta** |
| **Measurement method** | Stopwatch · 5 altas dogfood · then Observation Sprint with Isabella when Experience chain is usable (LAW 001-A) |
| **Mission KPI** | TTC &lt; 30 s |

Estimates until Observation Sprint. Label: **Estimated** — not Evidence.

---

## Definition of Done (Phase 1)

* Customer creation feels effortless on the happy path  
* Operator thinks about the customer — not the software  
* TTC path supports &lt; 30 s (dogfood)  
* No Capability / Facade / Engine diffs in this phase  
* Experience Card + this Phase doc updated  
* Operational Time Saved documented  

---

## Related

* [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md)  
* [ERA2_EXPERIENCE_PROMPT](./ERA2_EXPERIENCE_PROMPT.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
