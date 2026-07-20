# Roadmap — Official v1

```text
FOUNDATION ✅
    ↓
FOUNDATION LOCK 🚧     ← close platform (RBAC, soft-delete, ServiceContext, Repository, domain errors)
    ↓
v0.1.0 FOUNDATION LOCKED
    ↓
Module 01 — Dish Library     (domain → services → repos → CRUD → UI)
    ↓
Ingredient Library
    ↓
Recipe Builder
    ↓
Weekly Menus
    ↓
Customers
    ↓
Orders
    ↓
Production
    ↓
Kitchen
    ↓
Inventory
    ↓
Purchasing
    ↓
Logistics
    ↓
Accounting
    ↓
Customer Support
    ↓
Reports
    ↓
AI                         ← deferred (ADR 0008)
```

## Foundation Lock

See [FOUNDATION_LOCK.md](../05-architecture/FOUNDATION_LOCK.md) and [ADR 0009](../adr/0009-foundation-lock.md).

After lock: **No architectural changes without ADR.**

## Module 01 sequence (when unlocked)

```text
Dish Entity → Ingredient Entity → Recipe Entity
  → Services / Repositories → CRUD → UI
```

Domain first. Screens last.

## Governance

- Architecture SoT: `docs/` + ADRs + Cursor
- Lovable: UI acceleration only
- Capability matrix: `docs/09-security/CAPABILITY_MATRIX.md`
- Ubiquitous language: `docs/12-domain-model/UBIQUITOUS_LANGUAGE.md`
