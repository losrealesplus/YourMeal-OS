/**
 * Delivery Capability contracts (ADR 0078) — fulfillment coordination, not GPS.
 * @see docs/05-architecture/DELIVERY_CAPABILITY.md
 * LAW 006: ¿Qué compromisos operativos deben entregarse ahora y cómo confirmamos su ejecución?
 */

export type DeliveryStatus =
  | "Planned"
  | "Assigned"
  | "InTransit"
  | "Delivered"
  | "Confirmed";

export type DeliveryErrorCode =
  | "NOT_FOUND"
  | "NOT_READY"
  | "TENANT_MISMATCH"
  | "PERMISSION_DENIED"
  | "INVALID_STATE"
  | "CONFLICT"
  | "UNIMPLEMENTED"
  | "UNKNOWN";

export type DeliveryError = {
  code: DeliveryErrorCode;
  message: string;
  recoverable: boolean;
  evidence?: Record<string, unknown>;
};

export type DeliveryAssignment = {
  id: string;
  tenantId: string;
  /** Order commitment id via OrderFacade */
  commitmentRef: string;
  /** Upstream Kitchen ExecutionUnit id when known */
  executionRef: string | null;
  stopId: string | null;
  routeId: string | null;
  status: DeliveryStatus;
  windowStart: string | null;
  windowEnd: string | null;
  destinationLabel: string;
};

export type DeliveryStop = {
  id: string;
  tenantId: string;
  routeId: string | null;
  sequence: number;
  destinationLabel: string;
  status: DeliveryStatus;
  assignmentIds: string[];
};

export type DeliveryRoute = {
  id: string;
  tenantId: string;
  label: string;
  status: DeliveryStatus;
  stopIds: string[];
  operationalDay: string;
};

export type DeliveryConfirmation = {
  id: string;
  tenantId: string;
  assignmentId: string;
  stopId: string | null;
  confirmedAt: string;
  confirmedBy: string;
  outcome: "success" | "partial" | "failed";
  note: string | null;
};

export type DeliveryEvidence = {
  id: string;
  confirmationId: string;
  kind: "photo" | "signature" | "note" | "other";
  ref: string;
};

export type DeliveryException = {
  id: string;
  tenantId: string;
  assignmentId: string | null;
  stopId: string | null;
  code: string;
  message: string;
  occurredAt: string;
};

export type DeliveryCapabilityBits = {
  canAssign: boolean;
  canConfirm: boolean;
  canViewEvidence: boolean;
};

export type DeliveryContext = {
  tenantId: string;
  operationalDay: string;
  assignments: DeliveryAssignment[];
  routes: DeliveryRoute[];
  stops: DeliveryStop[];
  permissions: DeliveryCapabilityBits;
};

export type DeliveryResult = {
  ok: boolean;
  context: DeliveryContext | null;
  errors: DeliveryError[];
};

export type DeliveryCommandResult = {
  ok: boolean;
  assignmentId: string | null;
  status: DeliveryStatus | null;
  confirmation: DeliveryConfirmation | null;
  context: DeliveryContext | null;
  errors: DeliveryError[];
};
