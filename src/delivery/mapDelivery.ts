/**
 * INTERNAL — map Order commitment facts → Delivery assignments.
 * Delivery never invents work from Kitchen cooking or Billing.
 */

import type { OrderError, OrderStatus, OrderSummary } from "@/order/OrderContext";
import type {
  DeliveryAssignment,
  DeliveryCapabilityBits,
  DeliveryCommandResult,
  DeliveryConfirmation,
  DeliveryContext,
  DeliveryError,
  DeliveryErrorCode,
  DeliveryResult,
  DeliveryStatus,
  DeliveryStop,
} from "./DeliveryContext";
import type { DeliveryRuntimeIdentity } from "./deliveryServiceContext";

export function assignmentIdForCommitment(commitmentRef: string): string {
  return `assignment:${commitmentRef}`;
}

export function commitmentRefFromAssignmentId(
  assignmentId: string,
): string | null {
  const m = /^assignment:(.+)$/.exec(assignmentId);
  return m?.[1] ?? null;
}

export function mapOrderStatusToDelivery(status: OrderStatus): DeliveryStatus {
  switch (status) {
    case "ready_for_delivery":
      return "Planned";
    case "out_for_delivery":
      return "InTransit";
    case "delivered":
      return "Confirmed";
    case "delivery_issue":
      return "Assigned";
    default:
      return "Planned";
  }
}

export function mapSummaryToAssignment(
  summary: OrderSummary,
): DeliveryAssignment {
  return {
    id: assignmentIdForCommitment(summary.id),
    tenantId: summary.tenantId,
    commitmentRef: summary.id,
    executionRef: null,
    stopId: `stop:${summary.id}`,
    routeId: null,
    status: mapOrderStatusToDelivery(summary.status),
    windowStart: null,
    windowEnd: null,
    destinationLabel: summary.partyRef.displayName || summary.id,
  };
}

export function stopsFromAssignments(
  tenantId: string,
  assignments: DeliveryAssignment[],
): DeliveryStop[] {
  return assignments.map((a, index) => ({
    id: a.stopId ?? `stop:${a.commitmentRef}`,
    tenantId,
    routeId: a.routeId,
    sequence: index + 1,
    destinationLabel: a.destinationLabel,
    status: a.status,
    assignmentIds: [a.id],
  }));
}

export function deliveryCapabilityBitsFromIdentity(
  identity: DeliveryRuntimeIdentity,
): DeliveryCapabilityBits {
  const caps = new Set(identity.permissions.capabilities);
  const logistics = caps.has("logistics.operate");
  return {
    canAssign: logistics || caps.has("orders.write"),
    canConfirm: logistics || caps.has("orders.write"),
    canViewEvidence: logistics || caps.has("orders.read"),
  };
}

export function buildDeliveryContext(
  tenantId: string,
  operationalDay: string,
  summaries: OrderSummary[],
  identity: DeliveryRuntimeIdentity,
): DeliveryContext {
  const assignments = summaries.map(mapSummaryToAssignment);
  return {
    tenantId,
    operationalDay,
    assignments,
    routes: [],
    stops: stopsFromAssignments(tenantId, assignments),
    permissions: deliveryCapabilityBitsFromIdentity(identity),
  };
}

export function mapOrderError(err: OrderError): DeliveryError {
  return {
    code: orderCodeToDelivery(err.code),
    message: err.message,
    recoverable: err.recoverable,
    evidence: err.evidence,
  };
}

function orderCodeToDelivery(code: OrderError["code"]): DeliveryErrorCode {
  switch (code) {
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "TENANT_MISMATCH":
      return "TENANT_MISMATCH";
    case "PERMISSION_DENIED":
      return "PERMISSION_DENIED";
    case "INVALID_STATE":
      return "INVALID_STATE";
    case "UNIMPLEMENTED":
      return "UNIMPLEMENTED";
    default:
      return "UNKNOWN";
  }
}

export function unimplementedError(
  intent: string,
  evidence?: Record<string, unknown>,
): DeliveryError {
  return {
    code: "UNIMPLEMENTED",
    message: `${intent} is not implemented yet (Delivery Facade · compose gap)`,
    recoverable: true,
    evidence: { intent, ...evidence },
  };
}

export function requireSession(
  identity: DeliveryRuntimeIdentity,
): DeliveryError | null {
  if (!identity.session.present || !identity.session.userId) {
    return {
      code: "PERMISSION_DENIED",
      message: "Authenticated session required for Delivery operations",
      recoverable: true,
    };
  }
  if (!identity.tenant?.id) {
    return {
      code: "TENANT_MISMATCH",
      message: "Tenant required for Delivery operations",
      recoverable: true,
    };
  }
  return null;
}

export function failCommand(
  errors: DeliveryError[],
  assignmentId: string | null = null,
  status: DeliveryStatus | null = null,
): DeliveryCommandResult {
  return {
    ok: false,
    assignmentId,
    status,
    confirmation: null,
    context: null,
    errors,
  };
}

export function okCommand(input: {
  assignmentId: string;
  status: DeliveryStatus;
  confirmation: DeliveryConfirmation | null;
  context: DeliveryContext;
}): DeliveryCommandResult {
  return {
    ok: true,
    assignmentId: input.assignmentId,
    status: input.status,
    confirmation: input.confirmation,
    context: input.context,
    errors: [],
  };
}

export function failResult(errors: DeliveryError[]): DeliveryResult {
  return { ok: false, context: null, errors };
}

export function okResult(context: DeliveryContext): DeliveryResult {
  return { ok: true, context, errors: [] };
}
