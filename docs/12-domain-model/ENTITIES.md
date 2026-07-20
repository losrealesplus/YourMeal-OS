# Domain entity catalog

All principal entities are **defined** here. Implementation follows the official roadmap. Empty tables may already exist in Postgres from foundation foresight — that does not mean the module is shipped.

See also: [Ubiquitous Language](./UBIQUITOUS_LANGUAGE.md) · [State machines](./STATE_MACHINES.md)

| Entity | Ubiquitous term | Persistence today | Module |
|--------|-----------------|-------------------|--------|
| Tenant | Tenant | `tenants` | Platform |
| User | User | `profiles` + `auth.users` | Platform |
| Role | Role | `user_roles` + `app_role` | Platform |
| Permission | Capability | `src/permissions` (code) | Platform |
| Company | Company | `companies` | Customers / B2B |
| Department | Company Department | `company_departments` | Customers / B2B |
| Customer | Customer | `customers` | Customers |
| Employee | Employee | `company_employees` | Customers / B2B |
| Dish | Dish | `dishes` | Dish Library |
| Ingredient | Ingredient | `ingredients` | Ingredient Library |
| RecipeIngredient | Recipe Ingredient | `dish_ingredients` | Recipe Builder |
| Recipe | Recipe | *(aggregate over dish_ingredients)* | Recipe Builder |
| WeeklyMenu | Weekly Menu | `weekly_menus` | Weekly Menus |
| MenuItem | Menu Slot / Menu Item | `weekly_menu_slots` | Weekly Menus |
| Order | Order | `orders` | Orders |
| OrderItem | Order Item | `order_items` | Orders |
| ProductionBatch | Production Batch | **TBD** | Production |
| PurchaseOrder | Purchase Order | **TBD** | Purchasing |
| InventoryItem | Inventory Item | partial via `ingredients.stock` | Inventory |
| Supplier | Supplier | `suppliers` | Ingredient Library |
| DeliveryRoute | Delivery Route | `routes` | Logistics |
| DeliveryStop | Delivery Stop | `route_stops` | Logistics |
| Invoice | Invoice | `invoices` | Accounting |
| Payment | Payment | `payments` | Accounting |
| SupportTicket | Support Ticket | partial `support_notes` | Customer Support |
| Notification | Notification | **TBD** | Notifications |

## Module 01 family (adjusted roadmap)

```text
Dish Library        → Dish entity + DishService + repositories
Ingredient Library  → Ingredient + Supplier
Recipe Builder      → Recipe / RecipeIngredient linking Dish ↔ Ingredient
```

Three distinct concepts: commercial Dish, reusable Ingredient, Recipe composition.
