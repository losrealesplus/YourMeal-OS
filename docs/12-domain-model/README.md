# Domain model

## Heart of the model

**Dish Library** is the first real module. Everything references dishes:

Menus → Orders → Kitchen → Production → Purchasing → Inventory → Accounting → Reports → (future) AI

## Core aggregates (conceptual)

```text
Tenant
  ├── Members / Roles
  ├── Branding / Domains / Locale defaults
  ├── Suppliers
  │     └── Ingredients (stock, cost, allergens)
  ├── Dishes
  │     └── DishIngredients (qty canonical)
  ├── WeeklyMenus
  │     └── Slots → Dish
  ├── Customers
  │     └── Addresses, phones, allergies, preferences
  ├── Companies / Employees (B2B)
  ├── Orders → OrderItems → Dish
  ├── Routes → Stops → Order
  ├── Invoices / Payments
  ├── Promotions
  └── SupportNotes
```

## Dish (canonical)

| Field | Notes |
|-------|-------|
| `weight_g` | grams |
| `cost` / `price` | decimal; currency from tenant settings |
| `macros` | jsonb |
| `allergens` | text[] |
| `status` | draft / active / archived |
| `deleted_at` | soft delete |

## Invariants (enforced in Services)

- Dish belongs to exactly one tenant.
- Ingredient quantities on a dish use canonical units.
- Archiving / soft-deleting a dish must not break historical order lines (references remain; UI hides inactive).
- Prices stored as decimal; never float display strings in DB.
