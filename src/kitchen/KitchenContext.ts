/**
 * Kitchen Execution Capability contracts (ADR 0070) — orchestration, not cooking.
 * Business language: ExecutionUnit (not KitchenBatch).
 * @see docs/05-architecture/KITCHEN_EXECUTION_CAPABILITY.md
 * LAW 006: answers exactly one question — ¿Qué trabajo debe ejecutarse ahora?
 */

export type ExecutionStatus =
  | "READY"
  | "IN_PROGRESS"
  | "PAUSED"
  | "BLOCKED"
  | "COMPLETED";

export type KitchenErrorCode =
  | "NOT_FOUND"
  | "NOT_READY"
  | "TENANT_MISMATCH"
  | "PERMISSION_DENIED"
  | "INVALID_STATE"
  | "CONFLICT"
  | "BLOCKED"
  | "UNIMPLEMENTED"
  | "UNKNOWN";

export type KitchenError = {
  code: KitchenErrorCode;
  message: string;
  recoverable: boolean;
  evidence?: Record<string, unknown>;
};

/** One executable work slice — station, line, block, or prep — never a Production plan. */
export type ExecutionUnit = {
  id: string;
  /** Originating Production batch id (planning artifact). */
  productionBatchId: string;
  dayDate: string;
  dishId: string;
  label: string;
  portionCount: number;
  status: ExecutionStatus;
  workstationId?: string | null;
  assignedOperatorId?: string | null;
  blockedReason?: string | null;
};

export type ExecutionQueue = {
  dayDate: string;
  units: ExecutionUnit[];
};

export type ExecutionOperator = {
  id: string;
  displayName: string;
  stationIds: string[];
};

export type ExecutionProgress = {
  unitId: string;
  status: ExecutionStatus;
  /** Operational progress only — never recipe steps. */
  percent?: number | null;
  lastEventAt?: string | null;
};

export type KitchenCapabilityBits = {
  canReadQueue: boolean;
  canOperate: boolean;
  canAssign: boolean;
  canBlock: boolean;
};

export type KitchenContext = {
  tenantId: string;
  dayDate: string;
  queue: ExecutionQueue;
  permissions: KitchenCapabilityBits;
};

export type KitchenResult = {
  ok: boolean;
  context: KitchenContext | null;
  errors: KitchenError[];
};

export type KitchenCommandResult = {
  ok: boolean;
  unitId: string | null;
  status: ExecutionStatus | null;
  context: KitchenContext | null;
  progress: ExecutionProgress | null;
  errors: KitchenError[];
};
