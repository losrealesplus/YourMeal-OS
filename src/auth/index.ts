/**
 * YourMeal OS auth layer — Supabase Auth only.
 * UI and features import from `@/auth`, never from Lovable cloud-auth or raw SDK auth calls.
 */

export { getAuthClient } from "./client";
export type { AuthClient } from "./client";

export {
  getSession,
  getUser,
  onAuthStateChange,
  refreshSession,
  signOut,
} from "./session";

export {
  signInWithOAuth,
  toSupabaseOAuthProvider,
} from "./oauth";
export type {
  AppOAuthProvider,
  SignInWithOAuthOptions,
  SignInWithOAuthResult,
} from "./oauth";

export {
  resetPasswordForEmail,
  signInWithOtpPhone,
  signInWithPassword,
  signUp,
  updatePassword,
  verifyOtpSms,
} from "./credentials";

export { handleAuthCallback } from "./callback";
export type { AuthCallbackResult } from "./callback";

export {
  assertCapability,
  assertCapabilityFromContext,
  assertDriverRoute,
  assertSaasRoute,
  assertStaffRoute,
  requireAuthRoles,
  requireAuthenticatedUser,
} from "./guards";

export {
  AUTH_CALLBACK_PATH,
  AUTH_LOGIN_PATH,
  AUTH_RESET_PASSWORD_PATH,
  authOrigin,
  emailConfirmRedirectTo,
  oauthRedirectTo,
  passwordResetRedirectTo,
} from "./urls";
