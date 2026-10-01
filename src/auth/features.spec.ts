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

describe("isGoogleOAuthEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("inherits from VITE_AUTH_OAUTH_SOCIAL_ENABLED when unset", async () => {
    vi.stubEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED", "true");
    const { isGoogleOAuthEnabled } = await import("./features");
    expect(isGoogleOAuthEnabled()).toBe(true);
  });

  it("can be enabled specifically via VITE_AUTH_GOOGLE_ENABLED", async () => {
    vi.stubEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED", "false");
    vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "true");
    const { isGoogleOAuthEnabled } = await import("./features");
    expect(isGoogleOAuthEnabled()).toBe(true);
  });

  it("can be disabled specifically even if social is true", async () => {
    vi.stubEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED", "true");
    vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "false");
    const { isGoogleOAuthEnabled } = await import("./features");
    expect(isGoogleOAuthEnabled()).toBe(false);
  });
});

describe("isAppleOAuthEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("inherits from VITE_AUTH_OAUTH_SOCIAL_ENABLED when unset", async () => {
    vi.stubEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED", "true");
    const { isAppleOAuthEnabled } = await import("./features");
    expect(isAppleOAuthEnabled()).toBe(true);
  });

  it("can be enabled specifically via VITE_AUTH_APPLE_ENABLED", async () => {
    vi.stubEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED", "false");
    vi.stubEnv("VITE_AUTH_APPLE_ENABLED", "true");
    const { isAppleOAuthEnabled } = await import("./features");
    expect(isAppleOAuthEnabled()).toBe(true);
  });
});

describe("isPhoneAuthEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to false when unset", async () => {
    vi.stubEnv("VITE_AUTH_PHONE_ENABLED", "");
    const { isPhoneAuthEnabled } = await import("./features");
    expect(isPhoneAuthEnabled()).toBe(false);
  });

  it("enables when VITE_AUTH_PHONE_ENABLED=true", async () => {
    vi.stubEnv("VITE_AUTH_PHONE_ENABLED", "true");
    const { isPhoneAuthEnabled } = await import("./features");
    expect(isPhoneAuthEnabled()).toBe(true);
  });
});
