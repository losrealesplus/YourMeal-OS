# CAP-008 · Order Intake

**Capability:** Order Intake (Unified Order Capture)  
**Level:** L2 (scaffold → Connected)  
**ADR:** [0017](../../adr/0017-order-intake.md)  
**Estado:** Scaffold (App path via Intake) · Tenant wizard **pendiente** · **sin prisa**

---

## Intent

Convert **purchase intent** from any channel into a valid **Order**, then **Emit**.  
Only Order Intake constructs Orders. Orders never creates Orders.

Pipeline (ADR 0017):

```text
Intent → Normalize → Validate → Resolve → Build → Emit
```

Intake is an **event producer** after Build — not an order manager.

---

## Preconditions

- DICT-075 / DICT-076 Accepted  
- ADR 0017 Accepted  
- CAP-004 Order Programming Connected (builder used internally at **Build**)

---

## Postconditions (Scaffold — this PR)

- [x] Module `src/modules/order-intake`
- [x] App programming / repeat hooks call `OrderIntakeService` with `channel: "app"`
- [x] Intake audit metadata includes Order Source on create
- [ ] Normalize adapters for non-App channels
- [ ] Tenant Surface `+ Nuevo pedido` wizard
- [ ] Staff intake with `targetCustomerId`
- [ ] Persisted origin store (table / intake events)
- [ ] Emit: domain `Order Created` for Kitchen / Billing / Analytics / Notifications
- [ ] Metrics by channel

---

## Wizard (Tenant Surface — when ready)

**No prisa.** The asset is the engine; the wizard is one adapter.

Staff must feel they are **registering an order**, not filling a form.

| Paso | Lenguaje operacional (sí) | Evitar |
|------|---------------------------|--------|
| 1 | **¿Quién hace el pedido?** (+ canal de origen) | «Cliente» / formulario abstracto |
| 2 | **¿Para qué semana?** | Label seco «Semana» |
| 3 | **¿Qué quiere recibir?** (mismo componente menú que App) | «Productos» / lista ERP |
| 4 | **Confirmar pedido** | «Resumen» genérico |

RBAC: Company Admin / Operations Manager only. Kitchen / Delivery never.

Never order without a resolved customer.

---

## Happy Path (Scaffold)

```text
Customer App → OrderIntakeService (channel=app) → Build (OrderService) → Order
```

## Happy Path (Target)

```text
Ops "+ Nuevo pedido" → Wizard adapter → Intake (Normalize…Build) → Emit → Order
```

---

## Non-goals (now)

- Pedido Manual button on Orders list  
- Duplicating schedule UI  
- Platform Surface intake  
- Incomplete-intent / Draft Intake states (annotated in ADR 0017 §7 only)  
