# Official state machines

**Rule:** never store free-text status for these aggregates. Use the enums below (DB enum or constrained text matching this catalog). Transitions happen in Services — never in React.

Related: ADR soft-delete (Archive) · Ubiquitous Language.

---

## Dish

| State | Meaning |
|-------|---------|
| `draft` | Editable; not offered on menus or production |
| `active` | Available for planning, production, orders, and menus |
| `inactive` | Preserved, but blocked for new operations |
| `archived` | Soft-retired; hidden from new selection |

**Transitions (Services):**

```text
draft → active
active → inactive
inactive → active
draft | active | inactive → archived
archived → inactive | draft   (restore)
```

Hard purge: SaaS Admin only (`purge()`), not a normal state.

> **Note:** Current persistence may still lag the domain model. The domain source of truth for Dish is now `draft | active | inactive | archived`. If the database enum does not yet support `inactive`, implementation must adapt upward to the domain instead of simplifying the domain downward to the current schema.

---

## Order

| State | Meaning |
|-------|---------|
| `draft` | Customer still editing |
| `pending` | Submitted; awaiting confirmation |
| `confirmed` | Accepted by operations |
| `preparing` | In kitchen/production |
| `packed` | Packed for delivery |
| `ready` | Ready for route |
| `out_for_delivery` | On Delivery Route |
| `delivered` | Completed |
| `cancelled` | Cancelled |

> **As-built enum** `order_status`: `draft | confirmed | in_production | delivered | cancelled`. Expand toward the full machine in the Orders module (ADR required). Map: `in_production` ≈ `preparing`.

---

## Support Ticket

| State | Meaning |
|-------|---------|
| `open` | Newly created |
| `in_progress` | Agent working |
| `waiting_customer` | Blocked on customer |
| `resolved` | Fix proposed/done |
| `closed` | Finished |

> Today: `support_notes` without full ticket machine — introduce with Customer Support module.

---

## Production Batch

| State | Meaning |
|-------|---------|
| `planned` | Scheduled |
| `running` | In progress |
| `completed` | Finished |
| `cancelled` | Cancelled |

> Table TBD — define enum when Production module starts.

---

## Weekly Menu

| State | Meaning |
|-------|---------|
| `draft` | Not visible to customers |
| `published` | Live for the week |
| `locked` | No further edits (optional; future) |
| `archived` | Soft-retired |

> As-built: `weekly_menus.status` is free `text` default `draft` — **constrain in Menus module**.

---

## Invoice

| State | As-built `invoice_status` |
|-------|---------------------------|
| `pending` | pending |
| `paid` | paid |
| `overdue` | overdue |
| `void` | void |

---

## Delivery Route

| State | As-built `route_status` |
|-------|-------------------------|
| `planned` | planned |
| `in_progress` | in_progress |
| `completed` | completed |
| `cancelled` | cancelled |

---

## Soft-delete vs status

- **Status** = business lifecycle (draft/active/inactive/…).
- **`deleted_at`** = soft delete / archive marker for data retention.
- Prefer Service methods: `archive()`, `restore()`, `purge()` — never `delete()`.
