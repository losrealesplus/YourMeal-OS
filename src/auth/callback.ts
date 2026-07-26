import { getAuthClient } from "./client";
import { getSession } from "./session";

export type AuthCallbackResult = {
  userId: string | null;
  error: Error | null;
};

function readOAuthErrorFromUrl(url: URL): Error | null {
  const err =
    url.searchParams.get("error_description") ||
    url.searchParams.get("error") ||
    null;
  if (!err) return null;
  return new Error(err);
}

/**
 * Complete OAuth / magic-link return on `/auth/callback`.
 * Prefer explicit PKCE code exchange; fall back to session already detected by the SDK.
 */
export async function handleAuthCallback(
  href: string = typeof window !== "undefined" ? window.location.href : "",
): Promise<AuthCallbackResult> {
  if (!href) {
    return { userId: null, error: new Error("Missing callback URL") };
  }

  const url = new URL(href);
  const oauthError = readOAuthErrorFromUrl(url);
  if (oauthError) {
    return { userId: null, error: oauthError };
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { data, error } =
      await getAuthClient().auth.exchangeCodeForSession(code);
    if (error) {
      return { userId: null, error };
    }
    return { userId: data.session?.user?.id ?? null, error: null };
  }

  // Implicit / already-persisted session (detectSessionInUrl / prior exchange).
  const { data, error } = await getSession();
  if (error) {
    return { userId: null, error };
  }
  const userId = data.session?.user?.id ?? null;
  if (!userId) {
    return {
      userId: null,
      error: new Error("No session after auth callback"),
    };
  }
  return { userId, error: null };
}
