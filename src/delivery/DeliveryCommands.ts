/**
 * Delivery Commands — operational fulfillment intents (OPERATIONAL-006 Phase 2).
 * Never CRUD · never GPS · never Billing · never Kitchen cooking.
 */

export type AssignDeliveryCommand = {
  type: "AssignDelivery";
  operationalDay: string;
  commitmentRef: string;
  actorId?: string;
};

export type StartDeliveryCommand = {
  type: "StartDelivery";
  operationalDay: string;
  assignmentId: string;
};

export type ConfirmDeliveryCommand = {
  type: "ConfirmDelivery";
  operationalDay: string;
  assignmentId: string;
  note?: string | null;
};

export type ReportDeliveryExceptionCommand = {
  type: "ReportDeliveryException";
  operationalDay: string;
  assignmentId: string;
  code: string;
  message: string;
};

export type CloseDeliveryCommand = {
  type: "CloseDelivery";
  operationalDay: string;
  assignmentId: string;
};

export type DeliveryCommand =
  | AssignDeliveryCommand
  | StartDeliveryCommand
  | ConfirmDeliveryCommand
  | ReportDeliveryExceptionCommand
  | CloseDeliveryCommand;

export function assignDeliveryCommand(
  input: Omit<AssignDeliveryCommand, "type">,
): AssignDeliveryCommand {
  return { type: "AssignDelivery", ...input };
}

export function startDeliveryCommand(
  input: Omit<StartDeliveryCommand, "type">,
): StartDeliveryCommand {
  return { type: "StartDelivery", ...input };
}

export function confirmDeliveryCommand(
  input: Omit<ConfirmDeliveryCommand, "type">,
): ConfirmDeliveryCommand {
  return { type: "ConfirmDelivery", ...input };
}

export function reportDeliveryExceptionCommand(
  input: Omit<ReportDeliveryExceptionCommand, "type">,
): ReportDeliveryExceptionCommand {
  return { type: "ReportDeliveryException", ...input };
}

export function closeDeliveryCommand(
  input: Omit<CloseDeliveryCommand, "type">,
): CloseDeliveryCommand {
  return { type: "CloseDelivery", ...input };
}
