# Era 2 · Product Discovery 001

**Status:** ✅ **RECORDED** — first Product Discovery meeting of Era 2  
**Date:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · **PRODUCT LAW 002** (ADR [0093](../adr/0093-product-law-002.md)) · TENANT SUCCESS LAW 001 · **TEAM LAW 001** (ADR [0094](../adr/0094-team-law-001.md))  
**Sprint:** [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)  
**Playbook:** [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)  
**Backlog:** [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md)

```text
We are not building an ERP from scratch.
We are building the system that adopts
existing work with the least friction possible.
```

---

## Maturity shift recorded

| Before | Now |
|--------|-----|
| “We need an Excel module.” | “Tenants already have information. Our job is to give them solutions.” |

That changes the product: **implantation speed** comes from reusing operational knowledge, not from forcing recreation.

---

## Discovery organized by operational flow

Not by module. By how the business works.

### 1 · Customer

Create and manage customers without thinking about the database.

Recorded:

* Segmentation: Individual · Company · Company Employee  
* Delivery Preferences · Billing Preferences · Food Preferences · Medical Restrictions · Operational Notes  

All of the above exist to **avoid later calls**.

### 2 · Orders

Create orders in under a minute when possible.

Recorded:

* **Order Templates** (preference templates — not merely “recurring orders”)  
  Example: Juan always wants Mon · 2 Poke · 1 Soup · no onion  
* **Quick Repeat:** Repeat last week · Repeat last order · Repeat template  
* **Report Operational Incident** (not “create ticket”) — the system routes to customer service · kitchen · delivery · billing; the user does not choose bureaucracy

### 3 · Menus

Manage full weeks. Largest time savings candidate.

Recorded for the **future** (not Sprint 001 build):

* **Import Pipeline** — one pipeline: Input → Parser → Preview → Validation → Import  
  Formats later: Excel · PDF · CSV · JSON · API — same pipeline  
* **Nutrition Engine** (concept reserved) — the system calculates macros; the tenant does not

### 4 · Production

Answers: *What work must we prepare?* (not *What am I cooking now?*)

Recorded:

* **Preparation Inventory** — production date · expiry · lot · availability · consumption  
* **Production Timeline** — guides the operator (e.g. 08:00 pull chicken → … → 11:00 close lot) — not mere alerts

### 5 · Kitchen

Kitchen does not want to see orders. Kitchen wants **work**.

```text
12 Poke → 5 Salmon → 3 Vegan
Labels → Customer → Allergies → Notes
```

Execute only. Do not navigate the whole system.

### 6 · Delivery

```text
Vehicle · Driver · Route · Stops · Evidence · Completion
```

Route optimization later — not now.

---

## Operational Capture (registered · not Sprint 001)

Formerly “Quick Capture.” Renamed because it captures **intent**, not “orders.”

```text
Juan → find customers → Juan Pérez → Monday → 2 poke
→ resolve menu → no onion → resolve restrictions
→ Adeje → resolve address → Preview → Confirm
```

Asks how the operator thinks. Then translates.  
Optionally store the **conversation** as context (not AI yet — context for a future assistant).

---

## Strategic accelerator (registered · not Sprint 001)

### Operational Import Pipeline

First major Era 2 innovation candidate — not AI.

Always ask:

> What information do you already have so you don’t have to type it again?

Aligned with PRODUCT LAW 001 + PRODUCT LAW 002.

---

## Two backlogs

| Track | Role |
|-------|------|
| **Operational Core** | Makes the business work · stable experiences on existing Capabilities |
| **Operational Accelerators** | Returns time without changing domain |

### Operational Accelerators (registered)

```text
Operational Capture
Operational Import Pipeline
Quick Create
Quick Repeat
Bulk Import
Production Timeline
Preparation Inventory
Order Templates
Smart Suggestions
Operational Command Center (OCC)   ← ACCELERATOR-001 · RESERVED · do not implement
Operational Bulk Operations        ← ACCELERATOR-002 · Registered · ex-CX006 · after Orders
```

They do not change the domain. They accelerate work. That is the essence of Era 2.

**ACCELERATOR-001 · Operational Command Center** (formerly “Universal Command Bar”): strategic maximum priority · **implementation priority none**.  
**ACCELERATOR-002 · Operational Bulk Operations** (formerly CX006): platform-wide · not a Customer Experience · open after Orders show real mass work.  

Detail: [ACCELERATOR_001](./ACCELERATOR_001_OPERATIONAL_COMMAND_CENTER.md) · [ACCELERATOR_002](./ACCELERATOR_002_OPERATIONAL_BULK.md) · Layer: [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md).

---

## Prediction (identity)

> YourMeal OS is the system that best reuses the knowledge the business already has and eliminates repetitive work.

Not: more screens.  
Implantation day one: import reality · work as they already know · finish earlier.

---

## Explicit non-goals this session

Do **not** open now:

* Operational Capture implementation  
* AI  
* Import Pipeline implementation  
* Nutrition Engine  
* Route optimization  
* New Capabilities / Foundation / Engine Construction  

Sprint 001 builds the MVP Isabella can use tomorrow — experiences on the frozen Engine.

---

## Related

* [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)  
* [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md)  
* ADR [0093](../adr/0093-product-law-002.md) · [0094](../adr/0094-team-law-001.md)  
* [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md) · [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)
