# Business rules

## Absolute rule

**Never put business rules inside React components.**

Business logic belongs to Services under `src/services/`.

## Service catalog (target)

| Service | Owns |
|---------|------|
| DishService | Dish Library CRUD, status transitions, ingredient links |
| InventoryService | Stock levels, min stock, adjustments |
| AccountingService | Invoices, payments, billing rules |
| RouteService | Routes, stops, delivery status |
| NotificationService | Outbound notifications (future: Resend, push) |
| LocalizationService | Canonical ↔ display (implemented as `src/lib/localization.ts`) |
| ProductionService | Production planning from orders/menus |
| PurchasingService | Purchase needs from recipes + stock |
| AuditService | Write audit_log entries |
| FeatureFlagService | Evaluate flags for tenant/user/plan |
| PermissionService | Capability checks from roles |

## Examples of UI vs Service

| Allowed in UI | Must be in Service |
|---------------|--------------------|
| Call `DishService.archive(id)` | Decide whether a dish can be archived |
| Render price via `useFmt().currency(x)` | Compute dish cost from ingredients |
| Hide nav item if `can("dishes.write")` | Define what `dishes.write` means |
| Show confirmation dialog | Soft-delete + audit write |

## Soft delete rule

Business records are never hard-deleted from application flows. Services set `deleted_at`.

## Canonical values

Services read and write canonical units only. Formatting is presentation-only.
