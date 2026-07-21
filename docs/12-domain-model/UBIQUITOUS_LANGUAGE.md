# Ubiquitous Language — YourMeal OS

**Official vocabulary.** Every document, ADR, Service, UI string key, and collaborator must use these terms. Do not invent synonyms in code (`Meal`, `Product`, `Ticket` for support, etc.) without an ADR.

When Cursor or Lovable generate code, they must align with this glossary.

---

## Platform

| Term | Definition |
|------|------------|
| **YourMeal OS** | The multi-tenant SaaS operating system for meal prep, catering, and prepared-food companies. |
| **Tenant** | An isolated company operating inside the platform (e.g. EatClean Tenerife). All business data belongs to a tenant. |
| **User** | An authenticated identity (`auth.users` / `profiles`). A user may belong to one or more tenants via membership. |
| **Role** | A named job function assigned per tenant (`app_role`). Examples: `kitchen`, `company_admin`, `customer`. |
| **Permission / Capability** | An action key (`dishes.read`). Roles grant capabilities. UI and Services check capabilities — never raw role strings in feature code. |
| **Feature Flag** | Controlled rollout switch (beta, plan, tenant). Evaluated via FeatureFlagService. |

---

## Organization

| Term | Definition |
|------|------------|
| **Company** | A B2B client organization *inside* a tenant (corporate meal contracts), not the SaaS tenant itself. |
| **Department** | (1) OS navigation area (Kitchen, Accounting, …). (2) Org unit under a company location. Prefer **Company Department** for (2). |
| **Employee** | A person linked to a Company for billing/meal entitlements (`company_employees`). Distinct from staff **Role**. |
| **Customer** | End consumer of meals (individual or company employee). Uses the customer app (`/app`). |
| **Staff** | Users with operational roles (kitchen, production, admin, …). Use `/admin`. |
| **SaaS Administrator** | Platform operator (`saas_admin`). Manages tenants, licenses, branding, domains. |

---

## Catalog (Module 01 family)

| Term | Definition |
|------|------------|
| **Dish** | A commercializable food product offered by the tenant (e.g. “Chicken Teriyaki”). It is a business unit: plannable, producible, sellable, and manageable through its lifecycle. |
| **Ingredient** | A raw material or purchasable input (e.g. chicken breast, soy sauce). Reusable across dishes. |
| **Recipe** | The composition of a Dish: ordered list of Ingredients with canonical quantities. *Concept name in docs; table today: `dish_ingredients`.* |
| **Recipe Ingredient** | One line of a Recipe: Ingredient + quantity + unit (canonical). Alias of Recipe line / `dish_ingredients` row. |
| **Supplier** | Vendor that supplies Ingredients. |
| **Dish Library** | Module that manages Dishes (and entry to Recipes). |
| **Ingredient Library** | Module that manages Ingredients (and suppliers). |
| **Recipe Builder** | Module/UI that composes Recipes for a Dish. |

---

## Menus & demand

| Term | Definition |
|------|------------|
| **Weekly Menu** | The published offer for a specific calendar week. |
| **Menu Item** / **Menu Slot** | A Dish assigned to a day (or slot) within a Weekly Menu. Table: `weekly_menu_slots`. Prefer **Menu Slot** in schema talk; **Menu Item** in product talk. |
| **Order** | A Customer’s selection of dishes for a period (usually a week). |
| **Order Item** | One line on an Order: Dish + day + quantity + notes. |

---

## Operations

| Term | Definition |
|------|------------|
| **Production Batch** | A production run generated to fulfill Orders for a period. *(Entity defined; table TBD.)* |
| **Kitchen** | Department that executes preparation against Production / Orders. |
| **Purchase Order** | Request to a Supplier for Ingredients. *(Entity defined; table TBD.)* |
| **Inventory Item** | Stock position of an Ingredient (or pack) in the tenant warehouse. Closest table today: `ingredients.stock`. |
| **Delivery Route** | Planned delivery path for a date. Table: `routes`. |
| **Delivery Stop** | One stop on a Delivery Route (usually an Order). Table: `route_stops`. |

---

## Finance & support

| Term | Definition |
|------|------------|
| **Invoice** | Bill issued to a Customer or Company. |
| **Payment** | Settlement against an Invoice. |
| **Support Ticket** | Customer support case. Table today: `support_notes` (evolve toward tickets). |
| **Notification** | Outbound message (email, push, in-app). *(Entity defined; channel TBD.)* |

---

## Cross-cutting verbs

| Term | Definition |
|------|------------|
| **Archive** | Soft-retire a business record (`deleted_at` / archived status). Reversible via **Restore**. |
| **Purge** | Hard remove. **SaaS Admin only**, audited, rare. Never exposed as generic `delete()` in Services. |
| **Activate** | Make an entity operationally available (e.g. Dish → active). |
| **Deactivate** | Keep an entity existing and historical, but unavailable for new operations (e.g. Dish → inactive). |
| **Publish** | Make a Draft entity available where the aggregate uses publication semantics (e.g. Weekly Menu → published). |
| **Confirm** | Customer/ops accepts an Order (state transition). |

---

## Naming rules

1. Code identifiers use the English ubiquitous term: `DishService`, not `MealService`.
2. Database tables may use snake_case plurals (`dishes`, `order_items`) mapping 1:1 to terms above.
3. New synonyms require an ADR + update to this file.
4. Spanish UI copy is localization; domain names in code/docs stay English.
