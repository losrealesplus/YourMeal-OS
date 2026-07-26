import { describe, expect, it } from "vitest";
import {
  AUTH_CALLBACK_PATH,
  AUTH_LOGIN_PATH,
  AUTH_RESET_PASSWORD_PATH,
  authCallbackUrl,
  authOrigin,
  emailConfirmRedirectTo,
  oauthRedirectTo,
  passwordResetRedirectTo,
  safeAuthNextPath,
} from "./urls";
import { toSupabaseOAuthProvider } from "./oauth";

describe("auth urls", () => {
  it("builds oauth callback from origin", () => {
    expect(oauthRedirectTo("http://localhost:5173")).toBe(
      `http://localhost:5173${AUTH_CALLBACK_PATH}`,
    );
  });

  it("strips trailing slash on origin", () => {
    expect(authOrigin("https://example.com/")).toBe("https://example.com");
  });

  it("routes password reset through PKCE callback + next", () => {
    expect(passwordResetRedirectTo("https://example.com/")).toBe(
      `https://example.com${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(AUTH_RESET_PASSWORD_PATH)}`,
    );
  });

  it("routes email confirm through PKCE callback + login next", () => {
    expect(emailConfirmRedirectTo("https://example.com/")).toBe(
      `https://example.com${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(AUTH_LOGIN_PATH)}`,
    );
  });

  it("builds authCallbackUrl without next", () => {
    expect(authCallbackUrl("https://example.com")).toBe(
      `https://example.com${AUTH_CALLBACK_PATH}`,
    );
  });

  it("rejects unsafe next paths", () => {
    expect(safeAuthNextPath("https://evil.example")).toBeNull();
    expect(safeAuthNextPath("//evil.example")).toBeNull();
    expect(safeAuthNextPath("/unknown")).toBeNull();
    expect(safeAuthNextPath(AUTH_RESET_PASSWORD_PATH)).toBe(
      AUTH_RESET_PASSWORD_PATH,
    );
  });
});

describe("oauth provider mapping", () => {
  it("maps microsoft to azure for Supabase", () => {
    expect(toSupabaseOAuthProvider("microsoft")).toBe("azure");
    expect(toSupabaseOAuthProvider("google")).toBe("google");
    expect(toSupabaseOAuthProvider("apple")).toBe("apple");
  });
});
