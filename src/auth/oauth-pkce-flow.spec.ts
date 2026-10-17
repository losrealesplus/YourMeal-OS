import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isGoogleOAuthEnabled, isAppleOAuthEnabled } from "./features";
import { oauthRedirectTo } from "./urls";

describe("CR-UX-CLIENT-02 · Google OAuth & PKCE Flow Specification", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.VITE_AUTH_GOOGLE_ENABLED;
    delete process.env.VITE_AUTH_OAUTH_SOCIAL_ENABLED;
    delete process.env.VITE_AUTH_APPLE_ENABLED;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("TC-AUTH-01: resolves Google OAuth feature flag correctly across env configurations", () => {
    // Default / unset -> true
    expect(isGoogleOAuthEnabled()).toBe(true);

    // Explicitly false
    process.env.VITE_AUTH_GOOGLE_ENABLED = "false";
    expect(isGoogleOAuthEnabled()).toBe(false);

    // Enabled via VITE_AUTH_GOOGLE_ENABLED
    process.env.VITE_AUTH_GOOGLE_ENABLED = "true";
    expect(isGoogleOAuthEnabled()).toBe(true);

    // Enabled via legacy VITE_AUTH_OAUTH_SOCIAL_ENABLED
    delete process.env.VITE_AUTH_GOOGLE_ENABLED;
    process.env.VITE_AUTH_OAUTH_SOCIAL_ENABLED = "true";
    expect(isGoogleOAuthEnabled()).toBe(true);
  });

  it("TC-AUTH-02: generates correct PKCE callback redirect URI based on origin", () => {
    const redirectUrl = oauthRedirectTo("https://eatclean.yourmealos.com");
    expect(redirectUrl).toBe("https://eatclean.yourmealos.com/auth/callback");

    const stagingRedirectUrl = oauthRedirectTo("https://eatclean-staging.yourmealos.com");
    expect(stagingRedirectUrl).toBe("https://eatclean-staging.yourmealos.com/auth/callback");

    const localRedirectUrl = oauthRedirectTo("http://localhost:5173");
    expect(localRedirectUrl).toBe("http://localhost:5173/auth/callback");
  });

  it("TC-AUTH-03: verifies Apple OAuth remains explicitly controlled", () => {
    expect(isAppleOAuthEnabled()).toBe(false);

    process.env.VITE_AUTH_APPLE_ENABLED = "true";
    expect(isAppleOAuthEnabled()).toBe(true);
  });
});
