import type { Provider } from "@supabase/supabase-js";
import { getAuthClient } from "./client";
import { oauthRedirectTo } from "./urls";

/** Providers exposed by YourMeal OS UI / auth layer. */
export type AppOAuthProvider = "google" | "apple" | "microsoft";

export type SignInWithOAuthOptions = {
  /** Absolute redirect URL. Defaults to `{origin}/auth/callback`. */
  redirectTo?: string;
  /** When true, returns the authorize URL without navigating (tests / custom UI). */
  skipBrowserRedirect?: boolean;
  queryParams?: Record<string, string>;
};

export type SignInWithOAuthResult = {
  error: Error | null;
  redirected: boolean;
  url: string | null;
};

/** Map app provider names to Supabase GoTrue provider ids. */
export function toSupabaseOAuthProvider(provider: AppOAuthProvider): Provider {
  if (provider === "microsoft") return "azure";
  return provider;
}

/**
 * Start native Supabase OAuth (PKCE). Replaces Lovable `/~oauth/initiate` broker.
 */
export async function signInWithOAuth(
  provider: AppOAuthProvider,
  opts: SignInWithOAuthOptions = {},
): Promise<SignInWithOAuthResult> {
  const redirectTo = opts.redirectTo ?? oauthRedirectTo();
  const { data, error } = await getAuthClient().auth.signInWithOAuth({
    provider: toSupabaseOAuthProvider(provider),
    options: {
      redirectTo,
      skipBrowserRedirect: opts.skipBrowserRedirect ?? false,
      queryParams: opts.queryParams,
    },
  });

  if (error) {
    return { error, redirected: false, url: data?.url ?? null };
  }

  // Default SDK behaviour navigates the browser to `data.url`.
  const redirected = !opts.skipBrowserRedirect;
  return { error: null, redirected, url: data.url };
}
