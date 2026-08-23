/**
 * Domain definitions for A4.1a Operational Exceptions.
 */

export type OperationalExceptionType =
  | "DELIVERY_NOT_RECEIVED"
  | "INGREDIENT_STOCKOUT"
  | "DISH_RECALLED"
  | "CUSTOMER_SUSPENDED"
  | "COMPANY_SUSPENDED"
  | "MANUAL_INCIDENT";

export type OperationalExceptionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type OperationalExceptionStatus =
  "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "DISMISSED" | "REOPENED";

export type ResolutionType =
  "REDELIVER" | "CREDIT" | "MANUAL_HANDOFF" | "HOLD" | "RELEASE" | "REPLACE";

export type OperationalException = {
  id: string;
  tenantId: string;
  type: OperationalExceptionType;
  severity: OperationalExceptionSeverity;
  status: OperationalExceptionStatus;
  version: number;
  sourceDomain: string;
  sourceEntityType: string;
  sourceEntityId: string;
  orderId?: string | null;
  customerId?: string | null;
  companyId?: string | null;
  ownerUserId?: string | null;
  resolutionType?: ResolutionType | null;
  resolutionPayload?: Record<string, unknown> | null;
  resolutionNotes?: string | null;
  detectedAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

const VALID_TRANSITIONS: Record<OperationalExceptionStatus, OperationalExceptionStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "RESOLVED", "DISMISSED"],
  IN_PROGRESS: ["RESOLVED", "DISMISSED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  DISMISSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"],
};

export function canTransitionExceptionStatus(
  from: OperationalExceptionStatus,
  to: OperationalExceptionStatus,
): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}
