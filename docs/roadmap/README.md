# Roadmap oficial v1

```text
Phase 0 Blueprint          ✅
Foundation                 ✅
Foundation Lock            ✅
v0.1.0 FOUNDATION LOCKED   ✅
────────────────────────────────
Module 01 — Dish Library   ← actual
    Dish → Ingredient → Recipe
    → Repositories → Services → Rules → Tests → UI → CRUD
────────────────────────────────
Ingredient Library
Recipe Builder
Weekly Menus
Customers
Orders
Production
Kitchen
Inventory
Purchasing
Logistics
Accounting
Customer Support
Reports
AI                         (diferido — ADR 0008)
```

## Regla desde v0.1.0

La arquitectura es estable. No se rediseña la base: se construye sobre ella. Todo cambio estructural → **nuevo ADR**.

## Mentalidad

| Antes | Ahora |
|-------|--------|
| Infrastructure Driven | **Domain Driven** |
| Pensar en pantallas | Pensar en entidades |
| Pensar en CRUD | Pensar en negocio |

## Relacionado

- [Definition of Done](../00-status/DEFINITION_OF_DONE.md)
- [Estado](../00-status/README.md)
- [Foundation Lock](../05-architecture/FOUNDATION_LOCK.md)
