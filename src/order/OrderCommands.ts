/**
 * Order Commands — operational process intents (OPERATIONAL-003 Phase 2).
 * Not CRUD. EatClean weekly commitment language.
 */

export type PlanWeeklyOrderCommand = {
  type: "PlanWeeklyOrder";
  weekStart: string;
  channel?: "app" | "admin" | "whatsapp" | "phone" | "in_person" | "api" | "csv_import" | "other";
  items: Array<{ dishId: string; dayDate: string; qty: number }>;
  notes?: string | null;
  targetCustomerId?: string;
};

export type ConfirmOrderCommand = {
  type: "ConfirmOrder";
  orderId: string;
};

export type ScheduleProductionCommand = {
  type: "ScheduleProduction";
  orderId: string;
};

export type ReadyForKitchenCommand = {
  type: "ReadyForKitchen";
  orderId: string;
};

export type ReadyForDeliveryCommand = {
  type: "ReadyForDelivery";
  orderId: string;
};

export type CompleteDeliveryCommand = {
  type: "CompleteDelivery";
  orderId: string;
};

export type CloseOrderCommand = {
  type: "CloseOrder";
  orderId: string;
};

export type CancelOrderCommand = {
  type: "CancelOrder";
  orderId: string;
  reason?: string;
};

/** Future process intents — frozen names, substrate later. */
export type DuplicateWeekCommand = {
  type: "DuplicateWeek";
  sourceWeekStart: string;
  targetWeekStart: string;
};

export type CloneMenusCommand = {
  type: "CloneMenus";
  sourceWeekStart: string;
  targetWeekStart: string;
};

export type SplitOrderCommand = {
  type: "SplitOrder";
  orderId: string;
};

export type MergeOrderCommand = {
  type: "MergeOrder";
  sourceOrderId: string;
  targetOrderId: string;
};

export type OrderCommand =
  | PlanWeeklyOrderCommand
  | ConfirmOrderCommand
  | ScheduleProductionCommand
  | ReadyForKitchenCommand
  | ReadyForDeliveryCommand
  | CompleteDeliveryCommand
  | CloseOrderCommand
  | CancelOrderCommand
  | DuplicateWeekCommand
  | CloneMenusCommand
  | SplitOrderCommand
  | MergeOrderCommand;

export function planWeeklyOrderCommand(
  input: Omit<PlanWeeklyOrderCommand, "type">,
): PlanWeeklyOrderCommand {
  return { type: "PlanWeeklyOrder", ...input };
}

export function confirmOrderCommand(
  input: Omit<ConfirmOrderCommand, "type">,
): ConfirmOrderCommand {
  return { type: "ConfirmOrder", ...input };
}

export function scheduleProductionCommand(
  input: Omit<ScheduleProductionCommand, "type">,
): ScheduleProductionCommand {
  return { type: "ScheduleProduction", ...input };
}

export function readyForKitchenCommand(
  input: Omit<ReadyForKitchenCommand, "type">,
): ReadyForKitchenCommand {
  return { type: "ReadyForKitchen", ...input };
}

export function readyForDeliveryCommand(
  input: Omit<ReadyForDeliveryCommand, "type">,
): ReadyForDeliveryCommand {
  return { type: "ReadyForDelivery", ...input };
}

export function completeDeliveryCommand(
  input: Omit<CompleteDeliveryCommand, "type">,
): CompleteDeliveryCommand {
  return { type: "CompleteDelivery", ...input };
}

export function closeOrderCommand(
  input: Omit<CloseOrderCommand, "type">,
): CloseOrderCommand {
  return { type: "CloseOrder", ...input };
}

export function cancelOrderCommand(
  input: Omit<CancelOrderCommand, "type">,
): CancelOrderCommand {
  return { type: "CancelOrder", ...input };
}
