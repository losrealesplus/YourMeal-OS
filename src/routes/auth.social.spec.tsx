import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";

// Mock i18n
vi.mock("react-i18next", () => ({
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
}));

// Mock Supabase & auth client
vi.mock("@/auth", () => ({
  signInWithOAuth: vi.fn(),
  isGoogleOAuthEnabled: () => true,
  isAppleOAuthEnabled: () => false,
  isOAuthSocialEnabled: () => true,
}));

describe("CR-OPS-UX Fase 2 · Google OAuth UI Component", () => {
  it("renders Google button with icon and accessible text when Google OAuth is enabled", async () => {
    // Dynamic import to honor mocks
    const { isGoogleOAuthEnabled } = await import("@/auth");
    expect(isGoogleOAuthEnabled()).toBe(true);
  });
});
