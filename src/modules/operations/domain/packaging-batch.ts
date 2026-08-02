/**
 * FLOW-01 · PackagingBatch lifecycle (Spec freeze).
 * CREATED → IN_PROGRESS → READY → CLOSED
 *
 * FLOW01-002 persists in-process for certification; DB table follows later.
 */

export type PackagingBatchStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "READY"
  | "CLOSED";

export type PackagingBatch = {
  id: string;
  tenantId: string;
  orderId: string;
  status: PackagingBatchStatus;
};

const STORE = new Map<string, PackagingBatch>();

function key(tenantId: string, orderId: string): string {
  return `${tenantId}:${orderId}`;
}

export function nextPackagingStatuses(
  from: PackagingBatchStatus,
): PackagingBatchStatus[] {
  switch (from) {
    case "CREATED":
      return ["IN_PROGRESS"];
    case "IN_PROGRESS":
      return ["READY"];
    case "READY":
      return ["CLOSED"];
    case "CLOSED":
      return [];
    default:
      return [];
  }
}

/** Spec startPackaging: open batch at IN_PROGRESS (via CREATED). */
export function startPackagingBatch(input: {
  tenantId: string;
  orderId: string;
}): PackagingBatch {
  const k = key(input.tenantId, input.orderId);
  const existing = STORE.get(k);
  if (existing) {
    if (existing.status === "CLOSED") {
      throw new Error("PackagingBatch already CLOSED");
    }
    if (existing.status === "CREATED") {
      existing.status = "IN_PROGRESS";
      return existing;
    }
    return existing;
  }

  const batch: PackagingBatch = {
    id: `pkg-${input.orderId}`,
    tenantId: input.tenantId,
    orderId: input.orderId,
    status: "CREATED",
  };
  batch.status = "IN_PROGRESS";
  STORE.set(k, batch);
  return batch;
}

export function getPackagingBatch(
  tenantId: string,
  orderId: string,
): PackagingBatch | null {
  return STORE.get(key(tenantId, orderId)) ?? null;
}

/**
 * Spec completePackaging: IN_PROGRESS → READY → CLOSED (atomic handoff close).
 */
export function completePackagingBatch(input: {
  tenantId: string;
  orderId: string;
}): PackagingBatch {
  const batch = STORE.get(key(input.tenantId, input.orderId));
  if (!batch) {
    throw new Error("PackagingBatch not found");
  }
  if (batch.status === "CLOSED") {
    return batch;
  }
  if (batch.status === "IN_PROGRESS") {
    batch.status = "READY";
  }
  if (batch.status === "READY") {
    batch.status = "CLOSED";
  }
  if (batch.status !== "CLOSED") {
    throw new Error(`Cannot complete PackagingBatch from ${batch.status}`);
  }
  return batch;
}

/** @internal vitest */
export function __resetPackagingBatchesForTests(): void {
  STORE.clear();
}
