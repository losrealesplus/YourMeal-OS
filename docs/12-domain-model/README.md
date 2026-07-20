# Domain model

## Heart of the model

**Dish Library** is Module 01 and the heart of YourMeal OS. Everything else references dishes:

```text
Dishes
  ← Ingredients (recipe)
  ← Weekly Menus (slots)
  ← Orders (line items)
  ← Kitchen / Production
  ← Purchasing / Inventory (derived demand)
  ← Accounting (pricing / COGS)
  ← Reports / AI (future)
```

## Official module sequence (v1)

```text
FOUNDATION ✅
DOMAIN MODEL          ← review gate
Dish Library          ← Module 01
Ingredients
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
AI                    ← deferred (ADR 0008)
```

Do not implement later modules before earlier ones without an explicit ADR exception.

## Aggregates (conceptual)

```text
Tenant
  ├── Members / Roles / Feature flags
  ├── Branding / Domains / Locale defaults
  ├── Suppliers
  │     └── Ingredients (stock, cost, allergens)
  ├── Dishes                         ★ Module 01
  │     └── DishIngredients (qty canonical)
  ├── WeeklyMenus → Slots → Dish
  ├── Customers (+ addresses, phones, allergies, prefs)
  ├── Companies / Employees (B2B)
  ├── Orders → OrderItems → Dish
  ├── Routes → Stops → Order
  ├── Invoices / Payments
  ├── Promotions
  └── SupportNotes
```

## Dish (canonical fields)

| Field | Notes |
|-------|-------|
| `tenant_id` | Required |
| `name` | Required |
| `weight_g` | Grams |
| `cost` / `price` | `numeric`; currency from tenant settings |
| `macros` | jsonb |
| `allergens` | `text[]` (as-built; not separate allergen tables) |
| `status` | `draft` \| `active` \| `archived` |
| `deleted_at` | Soft delete |
| `updated_at` | Touch trigger |

## As-built vs Module 01

| Layer | Status |
|-------|--------|
| Tables | Present |
| DishService | Present (create/update/list/get/softDelete + audit) |
| `/admin/dishes` UI | Placeholder only |
| IngredientService | Not started |
| Feature flag `dish_library` | Seeded enabled |
| RBAC on route | Missing (block Module 01 until gated) |

## Invariants (Services enforce)

1. Dish belongs to exactly one tenant.
2. Ingredient quantities on a dish use canonical units.
3. Soft-delete / archive must not break historical order lines (FK retained; selection UI filters active).
4. Prices stored as decimal — never display strings in DB.
5. Mutations audited (who/what/when/old/new/tenant/IP when available).

## Feature boundaries (recommended for Module 01)

Keep domain logic in `src/services/dish-service.ts` (and future `ingredient-service.ts`).  
UI under `/admin/dishes` (and optional `src/features/dishes/components` if the screen grows).  
No `supabase.from('dishes')` in React components.

## Related

- [Architecture Review](../05-architecture/architecture-review.md)
- [Business rules](../08-business-rules/README.md)
- [Database](../06-database/README.md)
- [Roadmap](../roadmap/README.md)
