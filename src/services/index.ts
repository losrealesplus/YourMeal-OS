/**
 * Services layer — business logic lives here, never in React components.
 *
 * @see docs/adr/0005-services-layer.md
 * @see docs/08-business-rules/README.md
 */

export { AuditService } from "./audit-service";
export { FeatureFlagService } from "./feature-flag-service";
export { DishService } from "./dish-service";
export {
  AccountingService,
  InventoryService,
  NotificationService,
  ProductionService,
  PurchasingService,
  RouteService,
} from "./placeholders";
export type {
  AuditAction,
  AuditWriteInput,
  DishCreateInput,
  DishUpdateInput,
  ServiceContext,
} from "./types";
