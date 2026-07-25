/**
 * Auth redirect URLs derived from the current origin + known router paths.
 * Do not hardcode production hosts here — Site URL / allowlist lives in Supabase Dashboard.
 */

/** Dedicated OAuth / PKCE return path (TanStack route `/auth/callback`). */
export const AUTH_CALLBACK_PATH = "/auth/callback" as const;

/** Password recovery path (existing route). */
export const AUTH_RESET_PASSWORD_PATH = "/reset-password" as const;

/** Customer / primary login path. */
export const AUTH_LOGIN_PATH = "/auth" as const;

export function authOrigin(origin?: string): string {
  if (origin) return origin.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return "";
}

export function oauthRedirectTo(origin?: string): string {
  return `${authOrigin(origin)}${AUTH_CALLBACK_PATH}`;
}

export function passwordResetRedirectTo(origin?: string): string {
  return `${authOrigin(origin)}${AUTH_RESET_PASSWORD_PATH}`;
}

export function emailConfirmRedirectTo(origin?: string): string {
  return authOrigin(origin);
}
