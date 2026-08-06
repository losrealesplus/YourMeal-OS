/**
 * IdentityResult / IdentityError — ADR 0055.
 */

import type { IdentityContext, IdentityState } from "./IdentityContext";

export type IdentityErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_UNAVAILABLE"
  | "SESSION_INVALID"
  | "PROFILE_MISSING"
  | "MEMBERSHIP_PENDING"
  | "MEMBERSHIP_REJECTED"
  | "MEMBERSHIP_SUSPENDED"
  | "TENANT_MISSING"
  | "TENANT_INACTIVE"
  | "ROLE_EMPTY"
  | "CONSISTENCY_FAILED"
  | "UNKNOWN";

export type IdentityError = {
  code: IdentityErrorCode;
  message: string;
  recoverable: boolean;
  evidence?: Record<string, unknown>;
};

export type IdentityResult = {
  ok: boolean;
  state: IdentityState;
  context: IdentityContext;
  errors: IdentityError[];
  correlationId?: string;
};
