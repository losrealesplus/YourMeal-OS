/**
 * AUTH-SESSION-002 · Parse cold-mount timing console events (PS-002-C evidence).
 * Does not change Auth behavior — aggregation only.
 */

/**
 * @typedef {{
 *   phase: string,
 *   detail: Record<string, unknown>,
 *   atMs: number,
 *   text: string,
 * }} AuthSession002ConsoleEvent
 */

/**
 * @param {unknown[]} args
 * @param {string} [textFallback]
 * @param {number} [atMs]
 * @returns {AuthSession002ConsoleEvent | null}
 */
export function parseAuthSession002Args(args, textFallback = "", atMs = Date.now()) {
  const list = Array.isArray(args) ? args : [];
  let phase = null;
  /** @type {Record<string, unknown>} */
  let detail = {};

  if (
    typeof list[0] === "string" &&
    String(list[0]).includes("[AUTH-SESSION-002]")
  ) {
    if (typeof list[1] === "string") phase = list[1];
    if (list[2] && typeof list[2] === "object" && !Array.isArray(list[2])) {
      detail = /** @type {Record<string, unknown>} */ (list[2]);
    }
  }

  if (!phase && textFallback.includes("[AUTH-SESSION-002]")) {
    const m = String(textFallback).match(
      /\[AUTH-SESSION-002\]\s+(START|END|SKIP|SUMMARY)/,
    );
    if (m) phase = m[1];
  }

  if (!phase) return null;
  return { phase, detail, atMs, text: textFallback };
}

/**
 * Build a compact diagnosis from ordered AUTH-SESSION-002 events.
 * If a START has no matching END, that step is `pending`.
 *
 * @param {readonly AuthSession002ConsoleEvent[]} events
 */
export function buildAuthSession002Evidence(events) {
  /** @type {Partial<Record<string, number>>} */
  const durationsMs = {};
  /** @type {string[]} */
  const completed = [];
  /** @type {{ step: string, reason?: string }[]} */
  const skipped = [];
  let lastCompleted = null;
  let pending = null;
  let summary = null;

  for (const ev of events) {
    const step =
      typeof ev.detail.step === "string" ? ev.detail.step : null;

    if (ev.phase === "START" && step) {
      pending = step;
    } else if (ev.phase === "END" && step) {
      if (typeof ev.detail.durationMs === "number") {
        durationsMs[step] = ev.detail.durationMs;
      }
      completed.push(step);
      lastCompleted = step;
      pending = null;
    } else if (ev.phase === "SKIP" && step) {
      skipped.push({
        step,
        reason:
          typeof ev.detail.reason === "string" ? ev.detail.reason : undefined,
      });
    } else if (ev.phase === "SUMMARY") {
      summary = ev.detail;
      if (typeof ev.detail.lastCompleted === "string") {
        lastCompleted = ev.detail.lastCompleted;
      }
      if (ev.detail.pending === null) pending = null;
      else if (typeof ev.detail.pending === "string") {
        pending = ev.detail.pending;
      }
      if (
        ev.detail.durationsMs &&
        typeof ev.detail.durationsMs === "object"
      ) {
        Object.assign(
          durationsMs,
          /** @type {Record<string, number>} */ (ev.detail.durationsMs),
        );
      }
    }
  }

  return {
    events: events.map((e) => ({
      phase: e.phase,
      detail: e.detail,
      atMs: e.atMs,
    })),
    durationsMs,
    completed,
    skipped,
    lastCompleted,
    pending,
    summary,
    diagnosis: {
      hung_step: pending,
      last_completed_before_hang: pending ? lastCompleted : null,
      note: pending
        ? `Cold-start await still pending: ${pending}. Last completed: ${lastCompleted ?? "(none)"}.`
        : summary
          ? "Cold-start effect reached SUMMARY (all started awaits settled or were skipped)."
          : events.length === 0
            ? "No AUTH-SESSION-002 events captured (page may not have hydrated the cold effect)."
            : "Events observed without SUMMARY — effect may still be running or was cancelled.",
    },
  };
}

/**
 * @param {ReturnType<typeof buildAuthSession002Evidence>} evidence
 */
export function formatAuthSession002Report(evidence) {
  const lines = [
    "AUTH-SESSION-002 · cold-start checkingSession timings",
    "",
    `pending: ${evidence.pending ?? "(none)"}`,
    `lastCompleted: ${evidence.lastCompleted ?? "(none)"}`,
    `durationsMs: ${JSON.stringify(evidence.durationsMs)}`,
    `skipped: ${JSON.stringify(evidence.skipped)}`,
    "",
    evidence.diagnosis.note,
  ];
  return lines.join("\n");
}
