/**
 * AUTH-SESSION-002 · Cold-start timing for `/auth/admin` checkingSession.
 *
 * Measurement only — does not alter Auth, navigation, or timeouts.
 * Emits `console.info("[AUTH-SESSION-002]", phase, detail)` for PS-002-C.
 */

export type AuthSession002Step =
  | "getSession"
  | "ensurePlatformOwnerSession"
  | "loadRoles";

export type AuthSession002Phase = "START" | "END" | "SKIP" | "SUMMARY";

export type AuthSession002Event = {
  phase: AuthSession002Phase;
  step?: AuthSession002Step;
  atMs: number;
  durationMs?: number;
  ok?: boolean;
  error?: string;
  reason?: string;
  lastCompleted: AuthSession002Step | null;
  pending: AuthSession002Step | null;
};

function nowMs(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function emit(
  phase: AuthSession002Phase,
  detail: Record<string, unknown>,
): void {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[AUTH-SESSION-002]", phase, detail);
  }
}

/**
 * Create a cold-mount trace. Call `time()` around each await; `summary()` in finally.
 */
export function createAuthSession002Trace(
  meta: Record<string, unknown> = {},
): {
  time: <T>(step: AuthSession002Step, fn: () => Promise<T>) => Promise<T>;
  skip: (step: AuthSession002Step, reason: string) => void;
  summary: (extra?: Record<string, unknown>) => void;
  getSnapshot: () => {
    lastCompleted: AuthSession002Step | null;
    pending: AuthSession002Step | null;
    events: AuthSession002Event[];
    durationsMs: Partial<Record<AuthSession002Step, number>>;
  };
} {
  const effectStartedAt = Date.now();
  let lastCompleted: AuthSession002Step | null = null;
  let pending: AuthSession002Step | null = null;
  const events: AuthSession002Event[] = [];
  const durationsMs: Partial<Record<AuthSession002Step, number>> = {};

  function push(ev: AuthSession002Event) {
    events.push(ev);
    emit(ev.phase, {
      ...meta,
      source: meta.source ?? "cold_mount",
      step: ev.step,
      atMs: ev.atMs,
      durationMs: ev.durationMs,
      ok: ev.ok,
      error: ev.error,
      reason: ev.reason,
      lastCompleted: ev.lastCompleted,
      pending: ev.pending,
    });
  }

  async function time<T>(
    step: AuthSession002Step,
    fn: () => Promise<T>,
  ): Promise<T> {
    const t0 = nowMs();
    pending = step;
    push({
      phase: "START",
      step,
      atMs: Date.now(),
      lastCompleted,
      pending,
    });
    try {
      const result = await fn();
      const durationMs = Math.round(nowMs() - t0);
      durationsMs[step] = durationMs;
      lastCompleted = step;
      pending = null;
      push({
        phase: "END",
        step,
        atMs: Date.now(),
        durationMs,
        ok: true,
        lastCompleted,
        pending,
      });
      return result;
    } catch (err) {
      const durationMs = Math.round(nowMs() - t0);
      durationsMs[step] = durationMs;
      lastCompleted = step;
      pending = null;
      const error = err instanceof Error ? err.message : String(err);
      push({
        phase: "END",
        step,
        atMs: Date.now(),
        durationMs,
        ok: false,
        error,
        lastCompleted,
        pending,
      });
      throw err;
    }
  }

  function skip(step: AuthSession002Step, reason: string) {
    push({
      phase: "SKIP",
      step,
      atMs: Date.now(),
      reason,
      lastCompleted,
      pending,
    });
  }

  function summary(extra: Record<string, unknown> = {}) {
    emit("SUMMARY", {
      ...meta,
      source: meta.source ?? "cold_mount",
      effectDurationMs: Date.now() - effectStartedAt,
      lastCompleted,
      pending,
      durationsMs: { ...durationsMs },
      skipped: events
        .filter((e) => e.phase === "SKIP")
        .map((e) => ({ step: e.step, reason: e.reason })),
      ...extra,
    });
  }

  function getSnapshot() {
    return {
      lastCompleted,
      pending,
      events: [...events],
      durationsMs: { ...durationsMs },
    };
  }

  return { time, skip, summary, getSnapshot };
}
