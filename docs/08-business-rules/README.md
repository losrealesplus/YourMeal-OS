# Business rules

**Absolute rule:** never put business rules inside React components. Domain logic lives in Services (`src/services/`).

Architecture ownership: repository docs + Cursor. Lovable may build UI that *calls* Services; it must not invent domain rules.

## Service catalog (as-built)

| Service | Status | Owns |
|---------|--------|------|
| DishService | **Real** (UI unwired) | Dish CRUD, soft delete, status, audit hooks |
| AuditService | **Real** | `audit_log` writes |
| FeatureFlagService | **Real** | Flag evaluation (tenant > global) |
| IngredientService | **Not started** | Ingredients + supplier links (Module: Ingredients) |
| InventoryService | Stub only | Stock adjustments |
| AccountingService | Stub only | Invoices, payments |
| RouteService | Stub only | Routes, stops |
| NotificationService | Stub only | Email/push (future) |
| ProductionService | Stub only | Production planning |
| PurchasingService | Stub only | Purchase needs |
| LocalizationService | **Real** as `src/lib/localization.ts` | Canonical ↔ display |
| PermissionService | **Real** as `src/permissions` (pure module) | Capabilities from roles |

Stubs in `placeholders.ts` must not be treated as shipped APIs. Prefer throwing `unimplemented` or removing exports until implemented (P1).

## UI vs Service

| Allowed in UI | Must be in Service |
|---------------|--------------------|
| Call `DishService.archive` / `softDelete` | Decide if a dish can be archived |
| Render price via `useFmt().currency` | Compute cost from ingredients |
| `useCan("dishes.write")` to hide controls | Define what `dishes.write` means |
| Confirmation dialogs | Soft-delete + audit write |
| Layout / empty states | Tenant isolation checks |

## Soft delete rule

Application flows set `deleted_at`. Services filter `deleted_at IS NULL` by default. Hard DELETE is forbidden by product rule even where RLS still allows it (see database P0).

## Canonical values

Services read/write grams, ml, km, °C, UTC, decimals. Formatting is presentation-only (`useFmt`).

## Dish Library rules (Module 01 — to implement, not yet enforced in UI)

Draft invariants for approval with Module 01:

1. A dish belongs to exactly one tenant.
2. Name required (non-empty after trim).
3. `weight_g`, costs, prices stored canonically (numeric / grams).
4. Soft-delete sets `deleted_at` and typically `status = archived`.
5. Historical `order_items` may keep `dish_id` after soft-delete; UI hides inactive dishes from new selection.
6. Ingredient links (`dish_ingredients`) qty in canonical units.
7. Every create/update/soft-delete writes audit (already in DishService).

## Permissions (capabilities)

Defined in `src/permissions`. UI must use `useCan` / `can()`, not raw role strings.

Relevant to Dish Library:

| Capability | Typical roles |
|------------|---------------|
| `dishes.read` | Staff + related |
| `dishes.write` | company_admin (+ planned kitchen/production as needed) |

**Gap:** capabilities not applied to routes or nav yet (Architecture Review P0/P1).

## Enforcement checklist before Module 01

- [ ] Route gates for `/admin` and `/saas`
- [ ] Soft-delete-only for dishes (no hard DELETE from clients)
- [ ] `ServiceContext` available to UI/server callers
- [ ] Dish screens call DishService only
- [ ] Nav items filtered by capabilities

## Related

- [Architecture Review](../05-architecture/architecture-review.md)
- [ADR 0005 Services](../adr/0005-services-layer.md)
- [ADR 0006 Soft delete & audit](../adr/0006-soft-delete-audit.md)
- [Domain model](../12-domain-model/README.md)
