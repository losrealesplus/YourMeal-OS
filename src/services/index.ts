/**
 * Services barrel — prefer importing from `@/modules/<name>` for new code.
 * @see docs/05-architecture/MODULE_CONVENTION.md
 */

export { AuditService } from "./audit-service";
export { FeatureFlagService } from "./feature-flag-service";
export { DishService } from "@/modules/dish-library/application/dish-service";
export { OrderService } from "@/modules/orders/application/order-service";
export {
  AccountingService,
  InventoryService,
  NotificationService,
  ProductionService,
  PurchasingService,
} from "./placeholders";
export { RouteService, DeliveryService } from "@/modules/delivery";
export {
  createServiceContext,
  type AuditAction,
  type AuditWriteInput,
  type DishCreateInput,
  type DishUpdateInput,
  type ServiceContext,
} from "./types";
