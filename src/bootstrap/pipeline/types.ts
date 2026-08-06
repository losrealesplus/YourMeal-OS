/**
 * PRODUCT-CORE-002 · Bootstrap Pipeline public types (ADR 0050).
 * Executable contract — do not reorder stages without a superseding ADR.
 */

export type BootstrapStageId =
  | "app_launch"
  | "environment"
  | "services"
  | "authentication"
  | "session"
  | "tenant"
  | "branding"
  | "navigation"
  | "ready";

export type BootstrapStatus =
  | "pending"
  | "running"
  | "ok"
  | "degraded"
  | "auth_required"
  | "failed"
  | "ready";

export type BootstrapErrorCode =
  | "ENV_INVALID"
  | "SERVICE_INIT_FAILED"
  | "AUTH_UNAVAILABLE"
  | "SESSION_INVALID"
  | "MEMBERSHIP_PENDING"
  | "MEMBERSHIP_MISSING"
  | "TENANT_INACTIVE"
  | "TENANT_MISSING"
  | "NAVIGATION_UNRESOLVED"
  | "UNKNOWN";

export type BootstrapError = {
  code: BootstrapErrorCode;
  stage: BootstrapStageId;
  message: string;
  recoverable: boolean;
  evidence?: Record<string, unknown>;
};

export type BootstrapStageStatus =
  | "ok"
  | "degraded"
  | "failed"
  | "auth_required"
  | "skipped";

export type BootstrapStageResult = {
  stage: BootstrapStageId;
  status: BootstrapStageStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: BootstrapError;
  notes?: string[];
  evidence?: Record<string, unknown>;
};

export type BootstrapRunMode = "cold" | "canonical_login" | "bootstrap_mode";

export type BootstrapResult = {
  id: string;
  status: BootstrapStatus;
  currentStage: BootstrapStageId;
  stages: BootstrapStageResult[];
  tenantId?: string | null;
  homePath?: string | null;
  brandProvenance?: "static" | "remote" | "fallback";
  mode: BootstrapRunMode;
  errors: BootstrapError[];
  readyAt?: string;
};

export type BootstrapStageOutcome = {
  status: BootstrapStageStatus;
  notes?: string[];
  evidence?: Record<string, unknown>;
  error?: BootstrapError;
  /** Optional context enrichment written by the stage. */
  patch?: Partial<{
    hasSession: boolean;
    userId: string | null;
    tenantId: string | null;
    homePath: string | null;
    brandProvenance: "static" | "remote" | "fallback";
  }>;
};
