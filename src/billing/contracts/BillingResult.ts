/**
 * BillingResult — command/query envelope (Architecture Freeze shapes only).
 * No Facade yet — these types freeze the Outcome API surface for Phase 2+.
 */

import type { BillingContext } from "./BillingContext";
import type { BillingStatus } from "./BillingStatus";
import type { InvoiceReference } from "./InvoiceReference";

export type BillingErrorCode =
  | "NOT_FOUND"
  | "NOT_READY"
  | "TENANT_MISMATCH"
  | "PERMISSION_DENIED"
  | "INVALID_STATE"
  | "CONFLICT"
  | "UNIMPLEMENTED"
  | "UNKNOWN";

export type BillingError = {
  code: BillingErrorCode;
  message: string;
  recoverable: boolean;
  evidence?: Record<string, unknown>;
};

export type BillingResult = {
  ok: boolean;
  context: BillingContext | null;
  errors: BillingError[];
};

export type BillingCommandResult = {
  ok: boolean;
  invoiceRef: InvoiceReference | null;
  status: BillingStatus | null;
  context: BillingContext | null;
  errors: BillingError[];
};
