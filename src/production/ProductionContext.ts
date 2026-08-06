/**
 * Production Capability contracts (ADR 0066) — planning work, not cooking.
 * @see docs/05-architecture/PRODUCTION_CAPABILITY.md
 */

export type ProductionScope = {
  dayDate: string;
  weekStart?: string;
  station?: string | null;
};

export type ProductionStatus =
  | "draft"
  | "planned"
  | "ready_for_kitchen"
  | "in_execution"
  | "completed"
  | "closed"
  | "cancelled";

export type ProductionBatchStatus =
  | "queued"
  | "released"
  | "in_progress"
  | "done"
  | "blocked"
  | "cancelled";

export type ProductionErrorCode =
  | "NOT_FOUND"
  | "TENANT_MISMATCH"
  | "PERMISSION_DENIED"
  | "INVALID_STATE"
  | "ORDER_NOT_READY"
  | "CAPACITY_EXCEEDED"
  | "EMPTY_SCOPE"
  | "UNIMPLEMENTED"
  | "UNKNOWN";

export type ProductionError = {
  code: ProductionErrorCode;
  message: string;
  recoverable: boolean;
  evidence?: Record<string, unknown>;
};

export type ProductionCapacity = {
  scope: ProductionScope;
  maxPortions?: number | null;
  maxPrepMinutes?: number | null;
  maxBatches?: number | null;
};

export type ProductionLoad = {
  scope: ProductionScope;
  portionCount: number;
  batchCount: number;
  estimatedPrepMinutes?: number | null;
  customLineCount: number;
};

export type ProductionSchedule = {
  scope: ProductionScope;
  windows: Array<{
    label: string;
    startsAt?: string | null;
    endsAt?: string | null;
    batchIds: string[];
  }>;
};

export type ProductionBatch = {
  id: string;
  scope: ProductionScope;
  dishId: string;
  dishName: string;
  portionCount: number;
  status: ProductionBatchStatus;
  orderIds: string[];
  constraints: {
    allergens: string[];
    modifications: string[];
    isCustom: boolean;
  };
  readiness: {
    releasedToKitchen: boolean;
    blockedReason?: string | null;
  };
};

export type ProductionSummary = {
  id: string;
  scope: ProductionScope;
  status: ProductionStatus;
  load: ProductionLoad;
  batchCount: number;
  readiness: boolean;
  tenantId: string;
};

export type ProductionQueue = {
  scope: ProductionScope;
  batches: ProductionBatch[];
};

export type ProductionCapabilityBits = {
  canRead: boolean;
  canPlan: boolean;
  canRelease: boolean;
  canViewKitchen: boolean;
};

export type ProductionContext = {
  summary: ProductionSummary;
  queue: ProductionQueue;
  capacity: ProductionCapacity | null;
  schedule: ProductionSchedule | null;
  permissions: ProductionCapabilityBits;
  sourceOrders: {
    orderIds: string[];
    weekStart?: string;
  };
};

export type ProductionResult = {
  ok: boolean;
  context: ProductionContext | null;
  errors: ProductionError[];
};

export type ProductionCommandResult = {
  ok: boolean;
  planId: string | null;
  batchId: string | null;
  status: ProductionStatus | ProductionBatchStatus | null;
  context: ProductionContext | null;
  load: ProductionLoad | null;
  errors: ProductionError[];
};
