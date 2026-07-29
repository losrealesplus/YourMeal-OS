/**
 * FCR-008 · Canonical Post-Login Session
 *
 * After a successful auth API call, `data.session` (when present) is the
 * canonical session for bootstrap + route resolution + navigate.
 * Do NOT immediately re-read via getSession() — that races SIGNED_IN / auth lock
 * (FCR-007). Cold-start hydration may still use getSession / onAuthStateChange.
 */
import type { Session, User } from "@supabase/supabase-js";

export type PostLoginStep =
  | "LOGIN_OK"
  | "CANONICAL_SESSION"
  | "BOOTSTRAP_START"
  | "HOME_PATH"
  | "NAVIGATE"
  | "STOP";

export type AuthSuccessPayload = {
  session?: Session | null;
  user?: User | null;
} | null;

/** Prefer session.user from the auth response; fall back to top-level user. */
export function canonicalUserIdFromAuthData(
  data: AuthSuccessPayload,
): string | null {
  return data?.session?.user?.id ?? data?.user?.id ?? null;
}

export function hasCanonicalSession(data: AuthSuccessPayload): boolean {
  return Boolean(data?.session?.user?.id);
}

/**
 * Structured pipeline trace — last emitted step is the furthest progress.
 * Visible in browser / Playwright console as `[FCR-008]`.
 */
export function logPostLoginStep(
  step: PostLoginStep | string,
  detail?: Record<string, unknown>,
): void {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FCR-008]", step, detail ?? {});
  }
}

export function stopPostLogin(
  reason: string,
  detail?: Record<string, unknown>,
): void {
  logPostLoginStep("STOP", { reason, ...detail });
}
