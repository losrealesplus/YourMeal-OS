import { afterEach, describe, expect, it, vi } from "vitest";

describe("isOAuthSocialEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to false when unset", async () => {
    vi.stubEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED", "");
    const { isOAuthSocialEnabled } = await import("./features");
    expect(isOAuthSocialEnabled()).toBe(false);
  });

  it("enables when VITE_AUTH_OAUTH_SOCIAL_ENABLED=true", async () => {
    vi.stubEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED", "true");
    const { isOAuthSocialEnabled } = await import("./features");
    expect(isOAuthSocialEnabled()).toBe(true);
  });

  it("disables when VITE_AUTH_OAUTH_SOCIAL_ENABLED=false", async () => {
    vi.stubEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED", "false");
    const { isOAuthSocialEnabled } = await import("./features");
    expect(isOAuthSocialEnabled()).toBe(false);
  });
});
