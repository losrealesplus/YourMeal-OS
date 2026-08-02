/**
 * FLOW-01 · DeliveryAssignment (Spec freeze — composition for v1).
 * In-process for FLOW01-003 certification; maps to route_stops later.
 */

export type DeliveryAssignment = {
  id: string;
  tenantId: string;
  orderId: string;
  status: "ASSIGNED";
};

const STORE = new Map<string, DeliveryAssignment>();

function key(tenantId: string, orderId: string): string {
  return `${tenantId}:${orderId}`;
}

export function assignDeliveryOrder(input: {
  tenantId: string;
  orderId: string;
}): DeliveryAssignment {
  const k = key(input.tenantId, input.orderId);
  const existing = STORE.get(k);
  if (existing) return existing;

  const assignment: DeliveryAssignment = {
    id: `asgn-${input.orderId}`,
    tenantId: input.tenantId,
    orderId: input.orderId,
    status: "ASSIGNED",
  };
  STORE.set(k, assignment);
  return assignment;
}

export function getDeliveryAssignment(
  tenantId: string,
  orderId: string,
): DeliveryAssignment | null {
  return STORE.get(key(tenantId, orderId)) ?? null;
}

/** @internal vitest */
export function __resetDeliveryAssignmentsForTests(): void {
  STORE.clear();
}
