/**
 * HOME-PATH-002 · Evidence-only helpers for the ROLE_READY → HOME_PATH_RESOLVED gap.
 *
 * Does not change Auth, navigation, or resolvePostAdminLoginPath.
 * Captures structured FCR-008 payloads from Playwright console args
 * (jsonValue) because msg.text() often collapses objects to JSHandle@object.
 */
import { normalizeFcr008Step } from "./canonical-pipeline.mjs";

/**
 * @typedef {{
 *   step: string,
 *   detail: Record<string, unknown>,
 *   atMs: number,
 *   text: string,
 * }} Fcr008Event
 */

/**
 * Read Playwright ConsoleMessage args as JSON-serializable values.
 * @param {{ args: () => { jsonValue: () => Promise<unknown> }[], text: () => string }} msg
 * @returns {Promise<unknown[]>}
 */
export async function readPlaywrightConsoleArgs(msg) {
  const out = [];
  for (const arg of msg.args()) {
    try {
      out.push(await arg.jsonValue());
    } catch {
      out.push(undefined);
    }
  }
  return out;
}

/**
 * Parse one FCR-008 console emission into { step, detail }.
 * Preferred shape from logPostLoginStep:
 *   console.info("[FCR-008]", stepName, detailObject)
 *
 * @param {unknown[]} args
 * @param {string} [textFallback]
 * @param {number} [atMs]
 * @returns {Fcr008Event | null}
 */
export function parseFcr008Args(args, textFallback = "", atMs = Date.now()) {
  const list = Array.isArray(args) ? args : [];
  let step = null;
  /** @type {Record<string, unknown>} */
  let detail = {};

  if (typeof list[0] === "string" && String(list[0]).includes("[FCR-008]")) {
    if (typeof list[1] === "string") {
      step = normalizeFcr008Step(list[1]);
    }
    if (list[2] && typeof list[2] === "object" && !Array.isArray(list[2])) {
      detail = /** @type {Record<string, unknown>} */ (list[2]);
    }
  } else if (typeof list[0] === "string") {
    const m = String(list[0]).match(/\[FCR-008\]\s+([A-Z0-9_]+)/);
    if (m) step = normalizeFcr008Step(m[1]);
    if (list[1] && typeof list[1] === "object" && !Array.isArray(list[1])) {
      detail = /** @type {Record<string, unknown>} */ (list[1]);
    }
  }

  if (!step && textFallback) {
    const m = String(textFallback).match(/\[FCR-008\]\s+([A-Z0-9_]+)/);
    if (m) step = normalizeFcr008Step(m[1]);
  }

  if (!step) return null;
  return {
    step,
    detail,
    atMs,
    text: textFallback || `[FCR-008] ${step}`,
  };
}

/**
 * Last event for a step (pipeline may emit each once; take last defensively).
 * @param {readonly Fcr008Event[]} events
 * @param {string} step
 */
export function lastFcr008Event(events, step) {
  let found = null;
  for (const ev of events) {
    if (ev.step === step) found = ev;
  }
  return found;
}

/**
 * Summarize ROLE_READY / MEMBERSHIP_READY / STOP for HOME-PATH gap diagnosis.
 * @param {readonly Fcr008Event[]} events
 */
export function buildHomePathGapEvidence(events) {
  const roleReady = lastFcr008Event(events, "ROLE_READY");
  const membershipReady = lastFcr008Event(events, "MEMBERSHIP_READY");
  const homePath = lastFcr008Event(events, "HOME_PATH_RESOLVED");
  const stop = lastFcr008Event(events, "STOP");

  const roleDetail = roleReady?.detail ?? {};
  const membershipDetail = membershipReady?.detail ?? {};
  const stopDetail = stop?.detail ?? {};

  const roles = Array.isArray(roleDetail.roles)
    ? [...roleDetail.roles]
    : roleDetail.roles !== undefined
      ? [roleDetail.roles]
      : [];

  const roleCount =
    typeof membershipDetail.roleCount === "number"
      ? membershipDetail.roleCount
      : typeof roleDetail.roleCount === "number"
        ? roleDetail.roleCount
        : Array.isArray(roleDetail.roles)
          ? roleDetail.roles.length
          : null;

  const stopReason =
    typeof stopDetail.reason === "string" ? stopDetail.reason : null;

  const notStaff = stopReason === "not_staff";

  return {
    role_ready: roleReady
      ? {
          userId: roleDetail.userId ?? null,
          roles,
          roleCount,
          membership: roleDetail.membership ?? membershipDetail.membership ?? null,
          tenant:
            roleDetail.tenant ??
            roleDetail.tenantId ??
            membershipDetail.tenant ??
            membershipDetail.tenantId ??
            null,
          raw: roleDetail,
        }
      : null,
    membership_ready: membershipReady
      ? {
          userId: membershipDetail.userId ?? null,
          roleCount:
            typeof membershipDetail.roleCount === "number"
              ? membershipDetail.roleCount
              : null,
          raw: membershipDetail,
        }
      : null,
    stop: stop
      ? {
          reason: stopReason,
          message:
            typeof stopDetail.message === "string" ? stopDetail.message : null,
          status:
            typeof stopDetail.status === "string" ? stopDetail.status : null,
          userId: stopDetail.userId ?? null,
          route: stopDetail.route ?? null,
          raw: stopDetail,
        }
      : null,
    home_path_resolved: homePath
      ? {
          path: homePath.detail.path ?? null,
          raw: homePath.detail,
        }
      : null,
    diagnosis: {
      gap:
        Boolean(roleReady) && !homePath
          ? "ROLE_READY_WITHOUT_HOME_PATH_RESOLVED"
          : homePath
            ? "HOME_PATH_RESOLVED_OBSERVED"
            : "ROLE_READY_NOT_OBSERVED",
      stop_reason: stopReason,
      is_not_staff: notStaff,
      roles_at_role_ready: roles,
      note: notStaff
        ? "STOP reason is not_staff — hasStaffAccess(roles) failed; HOME_PATH_RESOLVED is intentionally not emitted on /auth/admin."
        : stopReason
          ? `STOP reason is "${stopReason}" (not not_staff). Inspect stop.raw / role_ready.raw.`
          : roleReady && !homePath
            ? "ROLE_READY observed without HOME_PATH_RESOLVED and without STOP — capture incomplete or unexpected path."
            : "No HOME-PATH gap diagnosis applicable.",
    },
  };
}

/**
 * Human-readable block for FAIL console output.
 * @param {ReturnType<typeof buildHomePathGapEvidence>} gap
 */
export function formatHomePathGapReport(gap) {
  const lines = [
    "HOME-PATH-002 · ROLE_READY → HOME_PATH_RESOLVED evidence",
    "",
    `Gap: ${gap.diagnosis.gap}`,
    `STOP reason: ${gap.diagnosis.stop_reason ?? "(none)"}`,
    `is_not_staff: ${gap.diagnosis.is_not_staff}`,
    `roles_at_role_ready: ${JSON.stringify(gap.diagnosis.roles_at_role_ready)}`,
  ];
  if (gap.role_ready) {
    lines.push(
      "",
      "ROLE_READY payload:",
      `  userId: ${gap.role_ready.userId ?? "(null)"}`,
      `  roles: ${JSON.stringify(gap.role_ready.roles)}`,
      `  roleCount: ${gap.role_ready.roleCount ?? "(null)"}`,
      `  membership: ${JSON.stringify(gap.role_ready.membership)}`,
      `  tenant: ${JSON.stringify(gap.role_ready.tenant)}`,
    );
  } else {
    lines.push("", "ROLE_READY payload: (not observed)");
  }
  if (gap.stop) {
    lines.push(
      "",
      "STOP payload:",
      `  reason: ${gap.stop.reason ?? "(null)"}`,
      `  message: ${gap.stop.message ?? "(null)"}`,
      `  status: ${gap.stop.status ?? "(null)"}`,
      `  userId: ${gap.stop.userId ?? "(null)"}`,
      `  route: ${gap.stop.route ?? "(null)"}`,
    );
  } else {
    lines.push("", "STOP payload: (not observed)");
  }
  if (gap.diagnosis.is_not_staff) {
    lines.push(
      "",
      "Conclusion: not_staff confirmed.",
      `User roles were: ${JSON.stringify(gap.diagnosis.roles_at_role_ready)}`,
      "Next: assign a staff role (company_admin / operations_manager / kitchen / delivery / saas_admin) — do not change Auth navigation yet.",
    );
  }
  lines.push("", `Note: ${gap.diagnosis.note}`);
  return lines.join("\n");
}
