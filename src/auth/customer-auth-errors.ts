/**
 * Classify Customer App `signInWithPassword` failures for human-readable UI.
 *
 * Based on observed Supabase Auth API shapes (e.g. invalid_credentials → 400)
 * and AuthError.message / .code / .status. Does not invent distinctions the
 * backend does not safely expose (no "account does not exist" vs wrong password).
 */

export type CustomerAuthErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limit"
  | "network"
  | "unexpected";

export type ClassifiedCustomerAuthError = {
  kind: CustomerAuthErrorKind;
  /** i18n key under namespace `auth` */
  messageKey: string;
};

const MESSAGE_KEYS: Record<CustomerAuthErrorKind, string> = {
  invalid_credentials: "signInInvalidCredentials",
  email_not_confirmed: "signInEmailNotConfirmed",
  rate_limit: "signInRateLimit",
  network: "signInNetwork",
  unexpected: "signInUnexpected",
};

function readAuthFields(error: unknown): {
  message: string;
  code: string;
  status: number | null;
} {
  if (!error || typeof error !== "object") {
    return { message: String(error ?? ""), code: "", status: null };
  }
  const e = error as {
    message?: unknown;
    code?: unknown;
    status?: unknown;
  };
  const message = String(e.message ?? "");
  const code = String(e.code ?? "").toLowerCase();
  const status =
    typeof e.status === "number"
      ? e.status
      : Number.isFinite(Number(e.status))
        ? Number(e.status)
        : null;
  return { message, code, status };
}

export function classifyCustomerAuthError(
  error: unknown,
): ClassifiedCustomerAuthError {
  const { message, code, status } = readAuthFields(error);
  const text = `${code} ${message}`.toLowerCase();

  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network request failed") ||
    text.includes("fetch failed") ||
    text.includes("timeout") ||
    text.includes("timed out") ||
    text.includes("aborterror") ||
    text.includes("offline")
  ) {
    return { kind: "network", messageKey: MESSAGE_KEYS.network };
  }

  if (
    code === "email_not_confirmed" ||
    text.includes("email not confirmed") ||
    text.includes("email_not_confirmed") ||
    text.includes("confirm your email")
  ) {
    return {
      kind: "email_not_confirmed",
      messageKey: MESSAGE_KEYS.email_not_confirmed,
    };
  }

  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    code === "too_many_requests" ||
    status === 429 ||
    text.includes("rate limit") ||
    text.includes("too many requests") ||
    text.includes("over_request_rate_limit")
  ) {
    return { kind: "rate_limit", messageKey: MESSAGE_KEYS.rate_limit };
  }

  if (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    status === 400 ||
    text.includes("invalid login") ||
    text.includes("invalid credentials") ||
    text.includes("invalid_credentials") ||
    text.includes("wrong password") ||
    text.includes("user not found")
  ) {
    return {
      kind: "invalid_credentials",
      messageKey: MESSAGE_KEYS.invalid_credentials,
    };
  }

  return { kind: "unexpected", messageKey: MESSAGE_KEYS.unexpected };
}
