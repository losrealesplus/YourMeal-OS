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

Primary KPI
Time-to-Create Customer < 30 seconds

Software succeeds when it disappears.
```

---

## Scope (Phase 1)

* Type selector: Individual · Company · Company Employee  
* Minimal fields: Name · Phone · Delivery Address  
* Progressive Completion (no billing / tags / notes / allergies / prefs / hierarchy on create)  
* Immediate search (name · phone · company · recent)  
* **Next Best Action** after save: Create Order · Open Customer · Create Another · Back  
* **Creation origin** registered automatically (`customer_workspace` · future: Quick Capture · Import · API · Excel) — never asked to the operator  
* Keyboard-first · large touch targets · mobile-first  
* No dead-end screens  

---

## Non-goals (Phase 1)

* Do **not** redesign Customer Capability  
* Do **not** modify Customer Facade  
* Do **not** change Operational Engine / Foundation / Flows  
* Do **not** open Isabella Observation (LAW 001-A)  

---

## Next Best Action

Isabella does not create customers for their own sake. There is always an intention.

After **Guardar**, the Experience asks once:

```text
Customer Created
What do you want to do next?
○ Create Order
○ Open Customer
○ Create Another Customer
○ Back
```

Not a new screen — one click removed from the next operational step.

---

## Creation origin (silent)

| Origin | Status |
|--------|--------|
| Customer Workspace | Active (this Experience) |
| Quick Capture | Future |
| Import Pipeline | Future |
| API | Future |
| Excel Import | Future |

Evidence for PRODUCT LAW 001 — e.g. “82 % of customers are no longer created manually.”  
Experience-layer ledger today; durable customer-field later without changing the operator’s path.

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 90–180 s (legacy directory / multi-screen alta · estimate) |
| **New workflow** | ≈ 20–30 s (type → name → phone → address → save → NBA) |
| **Estimated saving** | ≈ **60–150 s per alta** |
| **Measurement method** | Stopwatch · 5 altas dogfood · then Observation Sprint with Isabella when Experience chain is usable (LAW 001-A) |
| **Mission KPI** | TTC &lt; 30 s |

Estimates until Observation Sprint. Label: **Estimated** — not Evidence.

---

## Definition of Done (Phase 1)

* Customer creation feels effortless on the happy path  
* Operator thinks about the customer — not the software  
* TTC path supports &lt; 30 s (dogfood)  
* Next Best Action present after create  
* Creation origin recorded silently  
* No Capability / Facade / Engine diffs in this phase  
* Experience Card (Operational KPIs) + this Phase doc updated  
* Operational Time Saved documented  

---

## Next mission (proposed)

```text
CUSTOMER EXPERIENCE 002
Mission
Zero Friction Customer Search
```

Search happens more often than create — larger daily time return.  
Sequence: Create → Search → Edit → Company → Preferences → Bulk → then Orders.

---

## Related

* [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md)  
* [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md)  
* [ERA2_EXPERIENCE_PROMPT](./ERA2_EXPERIENCE_PROMPT.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
