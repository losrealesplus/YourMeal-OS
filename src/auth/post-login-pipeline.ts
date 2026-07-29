/**
 * FCR-008 · Canonical Post-Login Session
 *
 * After a successful auth API call, `data.session` (when present) is the
 * canonical session for bootstrap + route resolution + navigate.
 * Do NOT immediately re-read via getSession() — that races SIGNED_IN / auth lock
 * (FCR-007). Cold-start hydration may still use getSession / onAuthStateChange.
 *
 * PS-002 · Canonical Session Validation requires this ordered contract,
 * each step exactly once, with no immediate getSession() after login:
 *
 *   LOGIN → LOGIN_OK → CANONICAL_SESSION → BOOTSTRAP_START
 *   → IDENTITY_READY → PROFILE_READY → MEMBERSHIP_READY → ROLE_READY
 *   → HOME_PATH_RESOLVED → NAVIGATE → DASHBOARD_RENDERED
 */
import type { Session, User } from "@supabase/supabase-js";

/** Ordered PS-002 contract (real Supabase auth). */
export const PS002_CANONICAL_STEPS = [
  "LOGIN",
  "LOGIN_OK",
  "CANONICAL_SESSION",
  "BOOTSTRAP_START",
  "IDENTITY_READY",
  "PROFILE_READY",
  "MEMBERSHIP_READY",
  "ROLE_READY",
  "HOME_PATH_RESOLVED",
  "NAVIGATE",
  "DASHBOARD_RENDERED",
] as const;

export type CanonicalPipelineStep = (typeof PS002_CANONICAL_STEPS)[number];

export type PostLoginStep =
  | CanonicalPipelineStep
  | "HOME_PATH" // legacy alias → HOME_PATH_RESOLVED
  | "STOP";

export type AuthSuccessPayload = {
  session?: Session | null;
  user?: User | null;
} | null;

export type PipelineComparisonRow = {
  step: CanonicalPipelineStep;
  expected: true;
  observed: boolean;
};

export type PipelineValidationResult = {
  ok: boolean;
  observed: string[];
  duplicates: string[];
  missing: CanonicalPipelineStep[];
  unexpectedOrder: boolean;
  firstFailure: CanonicalPipelineStep | null;
  table: PipelineComparisonRow[];
};

/** Prefer session.user from the auth response; fall back to top-level user. */
export function canonicalUserIdFromAuthData(
  data: AuthSuccessPayload,
): string | null {
  return data?.session?.user?.id ?? data?.user?.id ?? null;
}

export function hasCanonicalSession(data: AuthSuccessPayload): boolean {
  return Boolean(data?.session?.user?.id);
}

function normalizeStep(step: PostLoginStep | string): string {
  if (step === "HOME_PATH") return "HOME_PATH_RESOLVED";
  return step;
}

type ActivePipeline = {
  id: string;
  mode: "canonical" | "cold";
  steps: string[];
  closed: boolean;
};

let activePipeline: ActivePipeline | null = null;

function newPipelineId(): string {
  return `pl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Start a post-login trace. Canonical mode is required for PS-002 real auth.
 * Cold start (existing storage session) uses mode "cold" and is not PS-002.
 */
export function beginPostLoginPipeline(
  mode: "canonical" | "cold" = "canonical",
  detail?: Record<string, unknown>,
): string {
  activePipeline = {
    id: newPipelineId(),
    mode,
    steps: [],
    closed: false,
  };
  if (mode === "canonical") {
    logPostLoginStep("LOGIN", { pipelineId: activePipeline.id, ...detail });
  }
  return activePipeline.id;
}

export function getActivePostLoginPipeline(): ActivePipeline | null {
  return activePipeline;
}

export function isCanonicalPostLoginActive(): boolean {
  return Boolean(activePipeline && !activePipeline.closed && activePipeline.mode === "canonical");
}

/**
 * Emit a readiness / bootstrap milestone only while a canonical pipeline is active.
 * Avoids spam from cold-start resolveHomePath / index redirects.
 */
export function emitCanonicalReady(
  step: CanonicalPipelineStep,
  detail?: Record<string, unknown>,
): void {
  if (!isCanonicalPostLoginActive()) return;
  logPostLoginStep(step, detail);
}

/**
 * Structured pipeline trace — last emitted step is the furthest progress.
 * Visible in browser / Playwright console as `[FCR-008]`.
 */
export function logPostLoginStep(
  step: PostLoginStep | string,
  detail?: Record<string, unknown>,
): void {
  const normalized = normalizeStep(step);
  if (activePipeline && !activePipeline.closed) {
    activePipeline.steps.push(normalized);
  }
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FCR-008]", normalized, {
      ...(detail ?? {}),
      ...(activePipeline
        ? { pipelineId: activePipeline.id, mode: activePipeline.mode }
        : {}),
    });
  }
  if (
    normalized === "DASHBOARD_RENDERED" ||
    normalized === "STOP"
  ) {
    if (activePipeline) activePipeline.closed = true;
  }
}

export function stopPostLogin(
  reason: string,
  detail?: Record<string, unknown>,
): void {
  logPostLoginStep("STOP", { reason, ...detail });
}

/** Snapshot observed steps for the active (or just-closed) pipeline. */
export function getObservedPipelineSteps(): string[] {
  return activePipeline ? [...activePipeline.steps] : [];
}

/**
 * Validate PS-002 contract: every canonical step exactly once, in order.
 * Extra non-canonical steps (e.g. STOP) fail the gate.
 */
export function validateCanonicalPipeline(
  observed: readonly string[],
): PipelineValidationResult {
  const counts = new Map<string, number>();
  for (const s of observed) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const table: PipelineComparisonRow[] = PS002_CANONICAL_STEPS.map((step) => ({
    step,
    expected: true as const,
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missing = PS002_CANONICAL_STEPS.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );

  const filtered = observed.filter((s) =>
    (PS002_CANONICAL_STEPS as readonly string[]).includes(s),
  );
  let unexpectedOrder = false;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== PS002_CANONICAL_STEPS[i]) {
      unexpectedOrder = true;
      break;
    }
  }

  const extras = observed.filter(
    (s) => !(PS002_CANONICAL_STEPS as readonly string[]).includes(s),
  );

  const firstFailure: CanonicalPipelineStep | null =
    missing[0] ??
    (duplicates.length ? (duplicates[0] as CanonicalPipelineStep) : null) ??
    (unexpectedOrder
      ? ((filtered.find((s, i) => s !== PS002_CANONICAL_STEPS[i]) ??
          null) as CanonicalPipelineStep | null)
      : null);

  const ok =
    missing.length === 0 &&
    duplicates.length === 0 &&
    !unexpectedOrder &&
    extras.length === 0 &&
    observed.length === PS002_CANONICAL_STEPS.length;

  return {
    ok,
    observed: [...observed],
    duplicates,
    missing,
    unexpectedOrder,
    firstFailure: ok ? null : (missing[0] ?? firstFailure),
    table,
  };
}

/** Markdown-friendly expected vs observed table for failure diagnosis. */
export function formatPipelineComparisonTable(
  result: PipelineValidationResult,
): string {
  const lines = [
    "| Paso | Esperado | Observado |",
    "| ---- | -------- | --------- |",
    ...result.table.map(
      (row) =>
        `| ${row.step.padEnd(20)} | ✅ | ${row.observed ? "✅" : "⛔"} |`,
    ),
  ];
  if (result.firstFailure) {
    lines.push("", `First failure / blocked at: **${result.firstFailure}**`);
  }
  if (result.duplicates.length) {
    lines.push(`Duplicates: ${result.duplicates.join(", ")}`);
  }
  return lines.join("\n");
}

/** Test helper — clear singleton between unit tests. */
export function __resetPostLoginPipelineForTests(): void {
  activePipeline = null;
}
