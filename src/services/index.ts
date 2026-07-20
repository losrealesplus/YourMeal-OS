/**
 * Services barrel — prefer importing from `@/modules/<name>` for new code.
 * @see docs/05-architecture/MODULE_CONVENTION.md
 */

export { AuditService } from "./audit-service";
export { FeatureFlagService } from "./feature-flag-service";
export { DishService } from "@/modules/dish-library/application/dish-service";
export {
  AccountingService,
  InventoryService,
  NotificationService,
  ProductionService,
  PurchasingService,
  RouteService,
} from "./placeholders";
export {
  createServiceContext,
  type AuditAction,
  type AuditWriteInput,
  type DishCreateInput,
  type DishUpdateInput,
  type ServiceContext,
} from "./types";
