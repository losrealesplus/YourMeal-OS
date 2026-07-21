# Ubiquitous Language — YourMeal OS

**Vocabulario oficial.** Todo documento, ADR, Service, clave de UI y colaborador debe usar estos términos. No inventar sinónimos en código (`Meal`, `Product`, etc.) sin ADR.

Cuando Cursor o Lovable generen código, deben alinearse con este glosario.

**Actores:** ver [ACTORS.md](./ACTORS.md) — fuente de verdad. Queda prohibido usar «Cliente» sin contexto explícito.

**Código:** inglés · **Docs:** español (ADR 0010)

---

## Actores (resumen)

| Actor (ES) | Código (EN) | Definición breve |
|------------|-------------|------------------|
| **Organización** | `Organization` / `Tenant` | Quien contrata YourMeal OS. Es el Tenant. |
| **Administrador** | `Administrator` | Configura y administra la Organización. |
| **Empleado** | `Employee` (staff) | Opera el día a día (cocina, producción, reparto…). |
| **Consumidor** | `Consumer` | Persona que compra directamente a la Organización. |
| **Cuenta Empresa** | `CompanyAccount` / `Company` | Entidad que contrata servicio para un colectivo. |
| **Beneficiario** | `Beneficiary` | Recibe el servicio contratado por una Cuenta Empresa. |

Detalle, relaciones y reglas: [ACTORS.md](./ACTORS.md).

---

## Platform

| Term | Definition |
|------|------------|
| **YourMeal OS** | The multi-tenant SaaS operating system for meal prep, catering, and prepared-food companies. |
| **Tenant** | Isolated **Organization** operating inside the platform (e.g. EatClean Tenerife). All business data belongs to a tenant. Alias of **Organización**. |
| **User** | An authenticated identity (`auth.users` / `profiles`). A user may play different **actor** roles in different contexts. |
| **Role** | A named job function assigned per tenant (`app_role`). Maps to actor capabilities (Administrator, Employee, …). |
| **Permission / Capability** | An action key (`dishes.read`). Roles grant capabilities. UI and Services check capabilities — never raw role strings in feature code. |
| **Feature Flag** | Controlled rollout switch (beta, plan, tenant). Evaluated via FeatureFlagService. |
| **SaaS Administrator** | Platform operator (`saas_admin`). Manages tenants, licenses, branding, domains. Distinct from Organization **Administrator**. |

---

## Organization & demand actors

| Term | Definition |
|------|------------|
| **Organization** | See **Organización** in [ACTORS.md](./ACTORS.md). SaaS customer of YourMeal OS = Tenant. |
| **Administrator** | Internal user who configures the Organization. |
| **Employee** | Internal operational user of the Organization (kitchen, production, driver, support…). Not a revenue buyer. |
| **Consumer** | Person who purchases products/services directly from the Organization. Prefer over legacy `Customer`. |
| **Company Account** | Collective contracting party (company, school, hotel, gym, NGO, …). May be payer only. Table: `companies`. |
| **Beneficiary** | Person who receives service contracted by a Company Account. Closest table today: `company_employees`. |
| **Department** | (1) OS navigation area (Kitchen, Accounting, …). (2) Org unit under a company location. Prefer **Company Department** for (2). |

### Deprecated ambiguous terms

Do **not** use without explicit actor context: Cliente, Cliente final, Usuario cliente, Empresa cliente, Cliente empresa, Particular, Empresa pagadora, or bare `Customer` in new domain docs.

---

## Catalog (Module 01 family)

| Term | Definition |
|------|------------|
| **Dish** | A commercializable food product offered by the Organization (e.g. “Chicken Teriyaki”). It is a business unit: plannable, producible, sellable, and manageable through its lifecycle. |
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
| **Order** | A Consumer’s or Beneficiary’s selection of dishes for a period (usually a week). |
| **Order Item** | One line on an Order: Dish + day + quantity + notes. |

---

## Operations

| Term | Definition |
|------|------------|
| **Production Batch** | A production run generated to fulfill Orders for a period. *(Entity defined; table TBD.)* |
| **Kitchen** | Department that executes preparation against Production / Orders. |
| **Purchase Order** | Request to a Supplier for Ingredients. *(Entity defined; table TBD.)* |
| **Inventory Item** | Stock position of an Ingredient (or pack) in the Organization warehouse. Closest table today: `ingredients.stock`. |
| **Delivery Route** | Planned delivery path for a date. Table: `routes`. |
| **Delivery Stop** | One stop on a Delivery Route (usually an Order). Table: `route_stops`. |

---

## Finance & support

| Term | Definition |
|------|------------|
| **Invoice** | Bill issued to a Consumer or Company Account. |
| **Payment** | Settlement against an Invoice. |
| **Support Ticket** | Support case opened by/for a Consumer or Beneficiary. Table today: `support_notes` (evolve toward tickets). |
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
| **Confirm** | Consumer/ops accepts an Order (state transition). |

---

## Naming rules

1. Code identifiers use the English ubiquitous term: `DishService`, `Consumer`, `CompanyAccount` — not inventados.
2. Database tables may use snake_case plurals (`dishes`, `order_items`) mapping 1:1 to terms above.
3. New synonyms require an ADR + update to this file **and** [ACTORS.md](./ACTORS.md) when they are actors.
4. Spanish UI copy is localization; domain names in code stay English; domain docs use Spanish actor names.
5. Never write bare «Cliente» in domain docs — choose Organización, Consumidor, Cuenta Empresa or Beneficiario.
