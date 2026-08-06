/**
 * Order Capability package — OPERATIONAL-003 Phase 2 (Facade).
 * Public API for Operational Process Modules. LAW 002 · 003 · 004.
 */

export type {
  OrderWeek,
  OrderDeliverySlot,
  OrderStatus,
  OrderBillingFacet,
  OrderErrorCode,
  OrderError,
  OrderLineSummary,
  OrderSummary,
  OrderDetails,
  OrderContext,
  OrderResult,
  OrderCommandResult,
} from "./OrderContext";

export type {
  PlanWeeklyOrderCommand,
  ConfirmOrderCommand,
  ScheduleProductionCommand,
  ReadyForKitchenCommand,
  ReadyForDeliveryCommand,
  CompleteDeliveryCommand,
  CloseOrderCommand,
  CancelOrderCommand,
  OrderCommand,
} from "./OrderCommands";

export {
  planWeeklyOrderCommand,
  confirmOrderCommand,
  scheduleProductionCommand,
  readyForKitchenCommand,
  readyForDeliveryCommand,
  completeDeliveryCommand,
  closeOrderCommand,
  cancelOrderCommand,
} from "./OrderCommands";

export type {
  GetOrderQuery,
  SearchOrdersQuery,
  GetOrdersByWeekQuery,
  GetKitchenQueueQuery,
  OrderQuery,
} from "./OrderQueries";

export {
  getOrderQuery,
  searchOrdersQuery,
  getOrdersByWeekQuery,
  getKitchenQueueQuery,
  getOrdersPendingProductionQuery,
  getOrdersReadyForDeliveryQuery,
  getOperationalCalendarQuery,
} from "./OrderQueries";

export {
  OrderFacade,
  getOrderFacade,
  resetOrderFacade,
  type OrderFacadeDeps,
} from "./OrderFacade";

export { useOrder, type OrderFacadeApi } from "./useOrder";
