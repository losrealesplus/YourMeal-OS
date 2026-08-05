/**
 * Doctor Check contract — independent diagnostic units.
 * Doctor Engine never hard-codes checks; they self-register.
 * DEVELOPER-PLATFORM-004
 */

import type { RuntimePlatform, RuntimeSeverity } from "../runtime-core";

/** Outcome of a single check run. */
export type DoctorCheckStatus =
  | "pass"
  | "warning"
  | "fail"
  | "info"
  | "skip";

/**
 * Capability buckets (Doctor groups results by these).
 * Checks declare a capability; Engine does not own the list forever —
 * unknown capabilities still group correctly by string id.
 */
export type DoctorCapabilityId =
  | "assets"
  | "branding"
  | "runtime"
  | "android"
  | "ios"
  | "network"
  | "supabase"
  | "storage"
  | "session"
  | "performance"
  | "security"
  | "developer"
  | (string & {});

export type DoctorCheckResult = {
  status: DoctorCheckStatus;
  /** Human-readable summary for Host UI / CLI. */
  message: string;
  /** Structured payload for FOPEBA evidence. */
  payload?: unknown;
  /** Actionable next steps when not pass. */
  recommendations?: string[];
  /** Override default severity for evidence. */
  severity?: RuntimeSeverity;
};

export type DoctorCheckContext = {
  platform: RuntimePlatform;
  /** ISO timestamp when the Doctor run started. */
  runAt: string;
  /** Optional abort for long runs (future). */
  signal?: AbortSignal;
};

/**
 * Independent check unit.
 * `run()` must not throw — catch internally and return fail.
 */
export type DoctorCheck = {
  id: string;
  name: string;
  /** Capability group (Assets, Branding, Runtime, …). */
  capability: DoctorCapabilityId;
  description?: string;
  /**
   * Default severity when the check fails.
   * Warnings may still return status "warning".
   */
  severity: RuntimeSeverity;
  /** Platforms where this check applies (omit = all). */
  supports?: RuntimePlatform[];
  /** Soft checks never pull Health Score below a floor (future). */
  soft?: boolean;
  run: (
    ctx: DoctorCheckContext,
  ) => DoctorCheckResult | Promise<DoctorCheckResult>;
};
