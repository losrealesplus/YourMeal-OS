# ADR 0017 — Order Intake (Unified Order Capture)

**Status:** Accepted  
**Date:** 2026-07-28  
**Deciders:** Product · Architecture · FOPEBA  
**Related:** [ADR 0005 Services](./0005-services-layer.md) · [ADR 0015 B2B/B2C](./0015-b2b-b2c-customer-model.md) · CAP-004 · CAP-008 · [DICT-075](../99-reference/PROJECT_DICTIONARY.md)

---

## Context

Not every order will enter through the Customer App. EatClean (and future tenants) receive demand via WhatsApp, phone, in person, admin, imports, and later APIs / marketplaces.

If each channel becomes a separate “Nuevo pedido / Pedido manual / Pedido CSV…” button on Orders, the Tenant Surface accumulates exceptions and **Orders** absorbs capture logic that does not belong to fulfillment.

`demand_channel` (ADR 0015) is **B2B vs B2C demand mode** — not sales/intake channel. A second concept is required.

---

## Decision

### 1. Bounded context: Order Intake

```text
Order Intake
  responsibility: convert purchase intent → valid Order
  then: hand off to Orders (fulfillment lifecycle)
```

**Orders never creates Orders.** Every purchase intent enters **Order Intake**; only Intake constructs an Order.

```text
App | WhatsApp | Phone | In person | Admin | CSV | API
                        │
                        ▼
               Order Intake Engine
                        │
            validate · resolve customer · resolve week
            build order · record origin trace
                        │
                        ▼
                     Orders
```

Kitchen / Delivery / Production **do not care** about intake channel.

### 2. Order Source (mandatory on intake)

Intake always records **Order Source** (channel), separate from Order core fields:

| Channel | Meaning |
|---------|---------|
| `app` | Customer Application |
| `whatsapp` | WhatsApp |
| `phone` | Teléfono |
| `in_person` | Presencial |
| `admin` | Administración (Company Admin capture) |
| `api` | API externa |
| `csv_import` | Importación |
| `other` | Otro |

Origin metadata (channel, createdBy user/role, createdAt, notes) lives in an **intake / audit trace** — not twenty columns on `orders`.

### 3. Surface placement

- **Tenant Surface** operational action: `+ Nuevo pedido` (Ops / Intake) — **not** buried inside Orders CRUD.
- Customer Surface continues to call the **same** Intake engine with `channel = app`.
- Kitchen / Delivery: **never** create orders via Intake.
- SaaS / Platform: no Tenant Intake UI (support impersonation is a future explicit rule).

### 4. Who may intake

| Actor | Channels allowed |
|-------|------------------|
| Customer (self) | `app` only |
| Company Admin / Operations Manager | staff channels (`whatsapp`, `phone`, `in_person`, `admin`, …) for a **resolved customer** |
| Kitchen / Delivery / Accounting | none |

### 5. Implementation sequence (no big-bang UI)

1. **This ADR + DICT + module scaffold** — App path routed through Intake (`channel=app`).
2. **CAP-008** — Tenant Surface wizard + staff `targetCustomerId` + persisted origin store.
3. Later connectors (WhatsApp API, CSV, TPV) speak only to Intake — **Orders unchanged**.

---

## Consequences

### Positive

- Single entry for all channels; Orders stays a clean fulfillment aggregate.
- Business metrics: % WhatsApp vs App vs phone.
- Audit: “created by Company Admin · channel WhatsApp · customer María” — never looks like the customer self-ordered when they did not.
- Future connectors without Orders rewrites.

### Negative / constraints

- Existing `OrderService.programDraft*` becomes an **internal builder** invoked by Intake (UI must not call it for new capture).
- Staff-on-behalf requires explicit `targetCustomerId` (not yet in CAP-004 happy path) — CAP-008.
- Persisted `order_origins` / intake events table is CAP-008 (until then: audit payload + in-process contract).

### Out of scope (this ADR)

- Wizard UI, WhatsApp Business API, CSV importer, marketplace connectors.
- Changing RBAC matrix beyond documenting who may intake (Identity Freeze: no role redesign).

---

## Compliance

| Rule | |
|------|--|
| ADR 0005 | Intake is a Service / module; UI is thin |
| ADR 0013 | Knowledge (DICT + ADR) before materialization |
| ADR 0015 | `demand_channel` ≠ Order Source |
| FCR | Does not block Pasada 2; Intake is product knowledge for post-surface fixes / next EP |
