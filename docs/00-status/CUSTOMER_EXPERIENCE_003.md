# CUSTOMER EXPERIENCE 003

**Status:** ▶ **ACTIVE** — Era 2 Experience Sprint  
**Type:** Experience Sprint (build) — **not** Observation Sprint  
**Mission:** **Zero Friction Customer Edit**  
**Declared:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A · TEAM LAW 001  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Customer · Phase 003  
**Surface:** `/admin/customer-workspace` · `useCustomer()` only (LAW 003)  
**Constraint:** Experience **above** Facade — **no** Capability / Facade / Engine / Foundation changes  

```text
Mission
Zero Friction Customer Edit

The operator should never feel like they are
editing a database record.

They should feel like they are correcting
information so they can continue working.
```

```text
Primary KPI
Time-to-Edit Customer (TTE) < 20 seconds

Secondary KPI
Time-to-Resume Operation < 5 seconds
```

---

## Why Edit now (before Orders)

Natural Isabella loop:

```text
Search → (missing) Create → “el teléfono cambió” → Edit → Create Order
```

If Edit is slow, the whole Experience breaks — even if Create and Search are fast.

---

## Measurable question

> ¿Puedo modificar un cliente frecuente en menos de 20 segundos?

---

## Editing philosophy

* Progressive Completion remains active  
* Edit **only** what is necessary  
* Never force a full dossier review  
* Inline: Click → Edit → Save → Continue  
* Independent sections  

### Frequent sections (this sprint)

| Section | Fields | Mode |
|---------|--------|------|
| Basic | Name · Phone · Email | Inline |
| Delivery | Primary address · area (city) | Inline |
| Notes | Operational notes | Inline |
| Classification | Individual / Company / Employee | Read + Progressive (CX004) |
| Preferences / Allergies | — | Progressive (CX005) |
| Company link | — | Progressive (CX004) |

### Persistence honesty (Experience-only)

`UpdateCustomer` is **declared** on the Facade and returns **UNIMPLEMENTED** (substrate frozen).  

CX003 does **not** open the Facade.  

Corrections are applied as **Experience-layer operational corrections** (session continuity) so Isabella can keep working after a phone change — PRODUCT LAW 001.  

Durable write opens only when Product explicitly lifts the UpdateCustomer substrate — still not Architecture redesign.

---

## Behaviour (shipped)

* Inline edit per section · dirty indicator · confirm before discard  
* Quick actions stay visible: Call · Create Order · Copy phone · (WhatsApp / Maps future)  
* Keyboard-first · large touch targets · focus after save returns to resume  
* No dead-end: after save → resume operation in &lt; 5 s  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current estimated edit** | ≈ 45–90 s (open dossier · find field · save · reorient) |
| **New target** | ≤ 20 s (open → inline → save → continue) |
| **Estimated saving** | ≈ **25–70 s per frequent edit** |
| **Resume** | &lt; 5 s back to Create Order / Call |
| **Validation** | Dogfood stopwatch · Observation later (LAW 001-A) |

Label: **Estimated** until Observation.

---

## Explicit non-goals

* Do **not** modify Customer Facade / Capability / Engine  
* Do **not** open OCC / Quick Capture / Import Pipeline  
* Do **not** open CX004–006 in this PR  
* Do **not** open Orders yet  

---

## Customer Experience sequence

```text
001 Create     ✅
002 Search     ✅
003 Edit       ← active
004 Company Management
005 Progressive Completion
006 Bulk Operations
↓
ORDER EXPERIENCE 001
```

---

## Acceptance

* No Capability changes  
* No Facade changes  
* No Engine changes  
* Experience only  

## Definition of Done

* Frequent customer corrected in &lt; 20 s on the happy path  
* Operator never loses operational context  
* Editing feels immediate · software disappears  

---

## Related

* [CUSTOMER_EXPERIENCE_002](./CUSTOMER_EXPERIENCE_002.md) · [001](./CUSTOMER_EXPERIENCE_001.md)  
* [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md)  
* [ACCELERATOR_001](./ACCELERATOR_001_OPERATIONAL_COMMAND_CENTER.md) — still Reserved  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
