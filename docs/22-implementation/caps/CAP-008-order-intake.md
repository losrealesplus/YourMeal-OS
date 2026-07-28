# CAP-008 · Order Intake

**Capability:** Order Intake (Unified Order Capture)  
**Level:** L2 (scaffold → Connected)  
**ADR:** [0017](../../adr/0017-order-intake.md)  
**Estado:** Scaffold (App path via Intake) · Tenant wizard **pendiente**

---

## Intent

Convert **purchase intent** from any channel into a valid **Order**.  
Only Order Intake constructs Orders. Orders never creates Orders.

---

## Preconditions

- DICT-075 / DICT-076 Accepted  
- ADR 0017 Accepted  
- CAP-004 Order Programming Connected (builder used internally)

---

## Postconditions (Scaffold — this PR)

- [x] Module `src/modules/order-intake`
- [x] App programming / repeat hooks call `OrderIntakeService` with `channel: "app"`
- [x] Intake audit metadata includes Order Source on create
- [ ] Tenant Surface `+ Nuevo pedido` wizard
- [ ] Staff intake with `targetCustomerId`
- [ ] Persisted origin store (table / intake events)
- [ ] Metrics by channel

---

## Wizard (Tenant Surface — next increment)

1. Channel (required)  
2. Customer (search or create — never order without customer)  
3. Week (published menu)  
4. Same menu selection component as Customer App  
5. Summary → Confirm  

RBAC: Company Admin / Operations Manager only. Kitchen / Delivery never.

---

## Happy Path (Scaffold)

```text
Customer App → OrderIntakeService (channel=app) → OrderService.programDraft* → Order
```

## Happy Path (Target)

```text
Ops "+ Nuevo pedido" → Intake wizard → OrderIntakeService (channel=whatsapp|…) → Order
```

---

## Non-goals

- Pedido Manual button on Orders list  
- Duplicating schedule UI  
- Platform Surface intake  
