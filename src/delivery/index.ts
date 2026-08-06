/**
 * Delivery Capability package — OPERATIONAL-006 Phase 2 (Facade).
 * Public API for Operational Execution logistics. LAW 002 · 003 · 005 · 006.
 */

export type {
  DeliveryStatus,
  DeliveryErrorCode,
  DeliveryError,
  DeliveryAssignment,
  DeliveryStop,
  DeliveryRoute,
  DeliveryConfirmation,
  DeliveryEvidence,
  DeliveryException,
  DeliveryCapabilityBits,
  DeliveryContext,
  DeliveryResult,
  DeliveryCommandResult,
} from "./DeliveryContext";

export type {
  AssignDeliveryCommand,
  StartDeliveryCommand,
  ConfirmDeliveryCommand,
  ReportDeliveryExceptionCommand,
  CloseDeliveryCommand,
  DeliveryCommand,
} from "./DeliveryCommands";

export {
  assignDeliveryCommand,
  startDeliveryCommand,
  confirmDeliveryCommand,
  reportDeliveryExceptionCommand,
  closeDeliveryCommand,
} from "./DeliveryCommands";

export type {
  GetDeliveryContextQuery,
  GetDeliveryAssignmentsQuery,
  GetDeliveryRoutesQuery,
  GetDeliveryStopsQuery,
  GetCompletedDeliveriesQuery,
  DeliveryQuery,
} from "./DeliveryQueries";

export {
  getDeliveryContextQuery,
  getDeliveryAssignmentsQuery,
  getDeliveryRoutesQuery,
  getDeliveryStopsQuery,
  getCompletedDeliveriesQuery,
} from "./DeliveryQueries";

export {
  DeliveryFacade,
  getDeliveryFacade,
  resetDeliveryFacade,
  type DeliveryFacadeDeps,
} from "./DeliveryFacade";

export { useDelivery, type DeliveryFacadeApi } from "./useDelivery";
