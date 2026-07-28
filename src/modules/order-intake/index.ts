export { OrderIntakeService } from "./application/order-intake-service";
export type {
  OrderIntakeDraftCommand,
  OrderIntakeOrigin,
} from "./domain/intake-command";
export {
  ORDER_SOURCE_CHANNELS,
  CUSTOMER_SELF_CHANNELS,
  STAFF_INTAKE_CHANNELS,
  isOrderSourceChannel,
} from "./domain/order-source";
export type { OrderSourceChannel } from "./domain/order-source";
