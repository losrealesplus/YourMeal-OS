import type { ProgramOrderItemInput } from "@/modules/orders";
import type { OrderSourceChannel } from "./order-source";

/**
 * Purchase intent → Order Intake command.
 * UI never calls OrderService directly for new capture (ADR 0017).
 */
export type OrderIntakeDraftCommand = {
  /** Mandatory Order Source (DICT-076). */
  channel: OrderSourceChannel;
  /**
   * Required for staff intake (order on behalf of a customer).
   * Omit for customer self-service (`channel: "app"`).
   */
  targetCustomerId?: string;
  weekStart: string;
  items: ProgramOrderItemInput[];
  /** Order notes (visible on the order). */
  notes?: string | null;
  /** Intake-only notes (origin context) — audit / future origin store. */
  intakeNotes?: string | null;
};

export type OrderIntakeOrigin = {
  channel: OrderSourceChannel;
  createdByUserId: string;
  createdByRoles: string[];
  createdAt: string;
  targetCustomerId: string | null;
  intakeNotes: string | null;
};
