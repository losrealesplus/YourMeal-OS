# ORDER EXPERIENCE 001 · Zero Friction Order Capture

**Status:** ▶ **IN PROGRESS** — Phase 1  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/order-capture`  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Order  
**Phase detail:** [ORDER_EXPERIENCE_001_PHASE1](./ORDER_EXPERIENCE_001_PHASE1.md)  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Order Capture

Think in conversations — not CRUD.

Primary KPI
Time-to-Create Order (TTO) < 45 seconds

Software succeeds when it disappears
during the phone call.
```

---

## Context

* Strategic Freeze · Developer Platform · Foundation · Operational Engine v1.0 · **frozen**  
* Order Capability · Order Facade · **frozen** (no changes in this mission)  
* Customer Experience · **frozen** (reuse via `useCustomer` only)  
* Experience only — LAW 003: `useOrder()` · `useCustomer()` · never modules / Supabase  
* No Capability / Facade / Engine changes in this mission  


---

## Primary workflow (conversation)

```text
Customer already exists
        ↓
Search Customer
        ↓
Select Customer
        ↓
Select Delivery Day
        ↓
Select Menu Items
        ↓
Special Instructions   (always visible)
        ↓
Confirm
        ↓
Order Created
        ↓
Next Best Actions
```

Target: **under 45 seconds** while speaking with the customer.

---

## Experience principles

* Never ask for information already known  
* Prefill: customer · addresses · preferences · restrictions · organization  
* Minimal typing · clicks · scrolling  
* Keyboard-first · immediate feedback · conversation speed  
* No dead ends (no customer → Create Customer · no menu → clear message)  

---

## Honesty (Experience layer)

Staff `PlanWeeklyOrder` with `targetCustomerId` returns **UNIMPLEMENTED** (CAP-008 Staff Intake not Connected).

Phase 1 keeps the **conversation path** working via an Experience-layer **operational commitment** ledger (session) when the Facade cannot persist staff-for-customer intake — same honesty pattern as CX003 corrections / CX005 living profile.

When Product opens staff intake substrate, the Experience path stays; only the persistence hop changes.

Menu catalog has **no Menu Facade** yet. Phase 1 uses Experience-layer **conversation picks** (labels + local ids) until Menu Experience ships. Not a second catalog database.

---

## Next Best Actions (after create)

* Generar producción (link / future Production Experience)  
* Continuar con otro pedido  
* Abrir cliente  
* Editar pedido (Capability Demo / future)  

---

## Accelerators (protected — not built here)

* OCC · Quick Capture · Import Pipeline · Bulk (ACC-002)  

Future: `⌘K` → Juan → 2 poke → sin cebolla → lunes → Enter. Terrain only.

---

## Related

* [ORDER_EXPERIENCE_001_PHASE1](./ORDER_EXPERIENCE_001_PHASE1.md)  
* [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md)  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
