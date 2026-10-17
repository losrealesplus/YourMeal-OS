import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

// Mock i18n preserving other exports like initReactI18next
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const dict: Record<string, string> = {
          "auth:withGoogle": "Continuar con Google",
          "auth:withApple": "Continuar con Apple",
          "common:or": "o",
        };
        return dict[key] ?? key;
      },
    }),
  };
});

// Mutable feature toggle state for testing
let mockGoogleEnabled = true;
let mockAppleEnabled = false;
let mockSignInResult = { error: null, redirected: true, url: "https://mock.google.auth" };

vi.mock("@/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/auth")>();
  return {
    ...actual,
    signInWithOAuth: vi.fn(async () => mockSignInResult),
    isGoogleOAuthEnabled: () => mockGoogleEnabled,
    isAppleOAuthEnabled: () => mockAppleEnabled,
    isOAuthSocialEnabled: () => mockGoogleEnabled || mockAppleEnabled,
  };
});

describe("CX-01C.5 · SocialAuthButtons UI Component & Integration", () => {
  it("renders null (zero UI exposure) when all OAuth providers are disabled", async () => {
    mockGoogleEnabled = false;
    mockAppleEnabled = false;

    const { SocialAuthButtons } = await import("./auth");
    const html = renderToStaticMarkup(<SocialAuthButtons />);
    expect(html).toBe("");
  });

  it("renders Google button with icon and accessible text when Google OAuth is enabled", async () => {
    mockGoogleEnabled = true;
    mockAppleEnabled = false;

    const { SocialAuthButtons } = await import("./auth");
    const html = renderToStaticMarkup(<SocialAuthButtons />);

    // Separator "o"
    expect(html).toContain(">o<");

    // Google button and text
    expect(html).toContain("Continuar con Google");
    expect(html).toContain('type="button"');

    // Official Google branding SVG present and accessible (hidden from screen reader while text is announced)
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("#4285F4"); // Google blue
    expect(html).toContain("#34A853"); // Google green
    expect(html).toContain("#FBBC05"); // Google yellow
    expect(html).toContain("#EA4335"); // Google red

    // Discrete Warm Premium testing notice
    expect(html).toContain("Acceso con Google en pruebas");

    // Apple button remains absent
    expect(html).not.toContain("Continuar con Apple");
  });

  it("preserves decoupled email/password flow when Google OAuth is active", async () => {
    const { signInWithPassword, resetPasswordForEmail, signUp } = await import("@/auth");
    expect(typeof signInWithPassword).toBe("function");
    expect(typeof resetPasswordForEmail).toBe("function");
    expect(typeof signUp).toBe("function");
  });

  it("ensures administrative routes remain decoupled from consumer social login", async () => {
    // Admin ops entrance is at /auth/admin, completely separate from B2C /auth SocialAuthButtons
    const { homePathForRoles } = await import("@/lib/home-path");
    const adminPath = homePathForRoles(["company_admin"], "eatclean.yourmealos.com");
    expect(adminPath).toBe("/admin");

    const customerPath = homePathForRoles(["customer"], "eatclean.yourmealos.com");
    expect(customerPath).toBe("/app");
  });
});
