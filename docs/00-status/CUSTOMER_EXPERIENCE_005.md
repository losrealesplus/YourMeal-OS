# CUSTOMER EXPERIENCE 005

**Status:** ▶ **ACTIVE** — Era 2 Experience Sprint  
**Type:** Experience Sprint (build) — **not** Observation Sprint  
**Mission:** **Zero Friction Customer Growth**  
**Declared:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · 002 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A · TEAM LAW 001  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Customer · Phase 005  
**Surface:** `/admin/customer-workspace` · `useCustomer()` only (LAW 003)  
**Constraint:** Experience **above** Facade — **no** Capability / Facade / Engine / Foundation changes  

```text
Mission
Zero Friction Customer Growth

Allow customer information
to grow naturally over time.

The operator should never feel forced
to complete unnecessary information.
```

```text
Primary KPI
Time-to-Complete Frequent Customer Information < 30 seconds

Secondary KPI
Time-to-Resume Operation < 5 seconds
```

---

## Living Customer Profile

```text
A customer profile should grow with the relationship,
never before it.
```

The ficha does **not** birth complete. It **evolves**.

| When | What |
|------|------|
| Day 1 | Name · Phone · Address |
| Week 1 | Preferences |
| Month 1 | Allergies / restrictions |
| Quarter | Billing |

Aligned with EXPERIENCE LAW 001 · PRODUCT LAW 001 · PRODUCT LAW 002.

---

## Progressive sections (this sprint)

| Section | Behaviour |
|---------|-----------|
| Preferences | Independent · later OK |
| Food restrictions | Independent · later OK |
| Allergies | Independent · later OK |
| Operational notes | Independent · later OK |
| Billing information | Independent · later OK |
| Company details | Informative · CX004 / Progressive |
| Tags | Independent · later OK |
| Attachments | Future · shown as soon |

Missing information is **informative**. Never blocking.

---

## Visual language

* Show profile completeness as **progress**  
* Never as warning  
* Celebrate completion  
* Never punish incompleteness  

---

## Behaviour (shipped)

* Growth sections on the open customer (individual)  
* Each section: Edit → Save → Resume (&lt; 5 s)  
* Completeness ring / bar — positive tone  
* Experience-layer living profile (session) — Facade `UpdateCustomer` remains UNIMPLEMENTED; no Facade opened  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current** | ≈ 60–120 s (full dossier · forced fields · abandon) |
| **New** | ≤ 30 s per frequent enrichment |
| **Estimated saving** | ≈ **30–90 s** per enrichment moment |
| **Resume** | &lt; 5 s back to operation |
| **Validation** | Dogfood · Observation later (LAW 001-A) |

Label: **Estimated**.

---

## After CX005 — Experience Review (before CX006)

```text
001 Create ✅
002 Search ✅
003 Edit ✅
004 Organization ✅
005 Growth ← this PR
↓
Customer Experience Review   ← mini UX freeze
↓
006 Bulk Operations
↓
ORDER EXPERIENCE
```

Do **not** jump to Bulk immediately. Review the five Experiences as one whole first.

---

## Explicit non-goals

* Do **not** open OCC / Quick Capture / Import / Organization Templates  
* Do **not** modify Facade / Capability / Engine  
* Do **not** open CX006 or Orders in this PR  

---

## Acceptance

* No Capability / Facade / Engine changes  
* Experience only  
* Incomplete profiles never block work  

## Definition of Done

* Profiles evolve naturally  
* Operators never stop because information is incomplete  
* Software encourages completion — never forces it  

---

## Related

* [CUSTOMER_EXPERIENCE_004](./CUSTOMER_EXPERIENCE_004.md) · [003](./CUSTOMER_EXPERIENCE_003.md)  
* [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md)  
* [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md)  
* [ACCELERATOR_001](./ACCELERATOR_001_OPERATIONAL_COMMAND_CENTER.md) — Reserved
