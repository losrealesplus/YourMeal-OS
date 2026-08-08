# ORDER EXPERIENCE 001 · Phase 1

**Status:** ▶ **IN PROGRESS**  
**Parent:** [ORDER_EXPERIENCE_001](./ORDER_EXPERIENCE_001.md)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Order · Phase **001 Capture**  
**Surface:** `/admin/order-capture`  
**Constraint:** Experience **above** existing Facades only — **no** Capability / Facade / Engine / Foundation changes

```text
Mission
Design the fastest possible order creation
experience for a food business.

The operator creates an operational commitment
while talking to the customer.

Primary KPI
Time-to-Create Order (TTO) < 45 seconds
```

---

## Scope (Phase 1)

* Conversation capture surface (not CRUD, not Capability Demo clone)  
* Search + select customer via `useCustomer` (Customer Experience frozen — reuse)  
* Prefill delivery / restrictions / living profile growth when present  
* Delivery day picker (next operational days)  
* Menu item picks — Experience-layer conversation chips + free label (no Menu Facade yet)  
* Special instructions — free text, always visible, never hidden  
* Confirm → try `useOrder().planWeeklyOrder` (channel `phone`, `targetCustomerId`)  
  * On **UNIMPLEMENTED** staff intake → session **operational commitment** (honest)  
* Next Best Actions after create  
* Empty states: no customer → Customer Workspace · no items → clear CTA  
* Keyboard-first · large touch targets  

---

## Non-goals (Phase 1)

* Do **not** modify Order Capability / Facade / Intake / CAP-008  
* Do **not** modify Operational Engine / Foundation / Flows  
* Do **not** build OCC · Quick Capture · Import · Bulk  
* Do **not** open Menu Experience / Menu Facade  
* Do **not** open Isabella Observation yet (LAW 001-A) — document measurement strategy only  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 90–180 s (legacy multi-screen order / post-call transcription · **Estimated**) |
| **New workflow** | ≈ 25–45 s (search → day → items → notes → confirm while on call · **Estimated**) |
| **Estimated saving** | ≈ **45–135 s per pedido** |
| **Mission KPI** | TTO &lt; 45 s |
| **Measurement method** | Stopwatch · 5 phone-style captures dogfood · then Observation Sprint (LAW 001-A) |
| **Evidence label** | **Estimated** until Observation |

---

## Evidence collection strategy

1. Dogfood: 5 scripted calls (customer exists · known items · one special instruction)  
2. Stopwatch TTO from search focus → “Pedido creado”  
3. Log friction (wrong day · missing dish · UNIMPLEMENTED hop)  
4. Observation Sprint with Isabella only after dogfood path is stable  

---

## Definition of Done (Phase 1)

* Operator can complete the conversation path without leaving the phone call mental model  
* Software never invents durable staff intake when Facade returns UNIMPLEMENTED — honesty  
* Prefill known customer context  
* Special instructions always visible  
* Next Best Actions present  
* No Order Capability / Facade / Engine diffs  
* Experience Card + this Phase doc + OTS filled  
* PR Review Protocol fields present  

---

## Related

* [ORDER_EXPERIENCE_001](./ORDER_EXPERIENCE_001.md)  
* [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md)  
* Capability Demo (separate): `/admin/order-workspace`
