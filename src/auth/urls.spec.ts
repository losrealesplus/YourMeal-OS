import { describe, expect, it } from "vitest";
import {
  AUTH_CALLBACK_PATH,
  authOrigin,
  emailConfirmRedirectTo,
  oauthRedirectTo,
  passwordResetRedirectTo,
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
    expect(passwordResetRedirectTo("https://example.com/")).toBe(
      "https://example.com/reset-password",
    );
    expect(emailConfirmRedirectTo("https://example.com/")).toBe(
      "https://example.com",
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
