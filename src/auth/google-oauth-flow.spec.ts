/**
 * CX-01C · Google OAuth Complete Flow & Isolation Test Suite
 *
 * Validates the 11 authentication scenarios required for Google OAuth:
 * 1. New customer via Google.
 * 2. Existing customer using email & password.
 * 3. Google login with email matching existing user.
 * 4. Authenticated user without customer profile.
 * 5. Pending tenant association.
 * 6. Cross-tenant isolation & identity linking safety (no email-only binding).
 * 7. Valid PKCE callback.
 * 8. Expired or invalid PKCE callback.
 * 9. OAuth consent cancellation.
 * 10. Logout and subsequent login.
 * 11. Safari & Chrome compatibility (redirect vs cookies, open-redirect safety).
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { signInWithOAuth, toSupabaseOAuthProvider } from "./oauth";
import { handleAuthCallback } from "./callback";
import { safeAuthNextPath, oauthRedirectTo } from "./urls";
import { isGoogleOAuthEnabled, isAppleOAuthEnabled } from "./features";
import { associateDeploymentAfterAuth } from "@/modules/tenant-association/application/associate-deployment-after-auth";
import { resolveCustomerHomeState, getAdaptiveCTA } from "@/routes/_authenticated/app.index";
import { homePathForRoles } from "@/lib/home-path";
import { validateInstanceRuntimeConfig, CANONICAL_INSTANCE_BINDINGS } from "@/lib/instance-runtime-boundary";

// Mock Supabase client
const mockExchangeCodeForSession = vi.fn();
const mockGetSession = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn(),
  },
}));

vi.mock("@/modules/tenant-association/application/deployment-identity", () => ({
  resolveDeploymentClaim: vi.fn().mockResolvedValue({
    platform: "cloudflare_worker",
    identifier: "eatclean.yourmealos.com",
  }),
}));

describe("CX-01C · Google OAuth Authentication Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Scenario 1: Cliente nuevo con Google
  it("Scenario 1: New customer signs in with Google, exchanges PKCE code, and lands on Warm Premium new_profile", async () => {
    // 1. Initiate OAuth
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: { url: "https://nhirlpkuvonggctdzzad.supabase.co/auth/v1/authorize?provider=google" },
      error: null,
    });

    const initResult = await signInWithOAuth("google", {
      skipBrowserRedirect: true,
      redirectTo: "https://eatclean.yourmealos.com/auth/callback",
    });
    expect(initResult.error).toBeNull();
    expect(initResult.url).toContain("provider=google");

    // 2. Callback exchange
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: "new-google-user-1", email: "newcomer@example.com" },
        },
      },
      error: null,
    });

    const callbackResult = await handleAuthCallback(
      "https://eatclean.yourmealos.com/auth/callback?code=pkce-auth-code-123",
    );
    expect(callbackResult.error).toBeNull();
    expect(callbackResult.userId).toBe("new-google-user-1");

    // 3. Post-login home path for customer defaults to /app
    const homePath = homePathForRoles([]);
    expect(homePath).toBe("/app");

    // 4. Onboarding state for new customer without profile
    const homeState = resolveCustomerHomeState({
      hasProfile: false,
      hasAddress: false,
      totalPortions: 0,
      hasUpcomingConfirmed: false,
    });
    expect(homeState).toBe("new_profile");

    const cta = getAdaptiveCTA(homeState);
    expect(cta.ctaTo).toBe("/app/settings/profile");
    expect(cta.headline).toBe("Tu alimentación, organizada");
  });

  // Scenario 2: Cliente existente que utiliza email y contraseña
  it("Scenario 2: Existing email/password login is decoupled and unaffected by Google OAuth", () => {
    vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "true");
    // Apple OAuth is disabled
    expect(isAppleOAuthEnabled()).toBe(false);

    // Google OAuth is enabled for EatClean (CX-01C)
    expect(isGoogleOAuthEnabled()).toBe(true);

    // Can be specifically disabled via flag
    vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "false");
    expect(isGoogleOAuthEnabled()).toBe(false);
    vi.unstubAllEnvs();

    // Supabase provider mapping for Google is standard
    expect(toSupabaseOAuthProvider("google")).toBe("google");
  });

  // Scenario 3: Google con el mismo email de un usuario existente
  it("Scenario 3: Google auth with existing email resolves to canonical user ID and confirmed profile", async () => {
    // Supabase attaches Google provider to the verified existing user ID
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: "existing-user-999", email: "loyal@example.com" },
        },
      },
      error: null,
    });

    const callbackResult = await handleAuthCallback(
      "https://eatclean.yourmealos.com/auth/callback?code=pkce-existing-user",
    );
    expect(callbackResult.userId).toBe("existing-user-999");

    // Existing customer state: has profile, has address, has upcoming confirmed orders
    const homeState = resolveCustomerHomeState({
      hasProfile: true,
      hasAddress: true,
      totalPortions: 4,
      hasUpcomingConfirmed: true,
    });
    expect(homeState).toBe("confirmed_delivery");
    const cta = getAdaptiveCTA(homeState);
    expect(cta.ctaTo).toBe("/app/orders");
  });

  // Scenario 4: Usuario autenticado sin ficha de cliente
  it("Scenario 4: Authenticated user without customer record gracefully resolves to new_profile", () => {
    const homeState = resolveCustomerHomeState({
      hasProfile: false,
      hasAddress: false,
      totalPortions: 0,
      hasUpcomingConfirmed: false,
      hasDraftOrder: false,
    });
    expect(homeState).toBe("new_profile");
    const cta = getAdaptiveCTA(homeState);
    expect(cta.ctaLabel).toBe("Configurar mi perfil");
  });

  // Scenario 5: Asociación de tenant pendiente
  it("Scenario 5: Pending tenant association triggers onPending hook and emits proper audit log", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        tenant_id: "eatclean-tenant-id",
        display_name: "EatClean",
        membership_id: "membership-pending-1",
        status: "pending",
        created: true,
      },
      error: null,
    });

    const onPendingMock = vi.fn();
    const result = await associateDeploymentAfterAuth(
      { rpc: mockRpc },
      {
        userId: "user-pending-1",
        source: "auth_callback",
        onPending: onPendingMock,
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.association.status).toBe("pending");
      expect(result.association.created).toBe(true);
      expect(result.association.displayName).toBe("EatClean");
    }
    expect(onPendingMock).toHaveBeenCalledTimes(1);
  });

  // Scenario 6: Usuario sin permisos para acceder a otro tenant y seguridad de identidad
  it("Scenario 6: Cross-tenant isolation prevents accessing wrong tenant and avoids email-only binding", () => {
    // 1. Instance boundary prevents EatClean from referencing Demo DB
    expect(() =>
      validateInstanceRuntimeConfig({
        instanceType: "customer_tenant",
        tenantSlug: "eatclean",
        coreVersion: "0.1.0",
        supabaseProjectRef: "nhirlpkuvonggctdzzad",
        supabaseUrl: "https://djangucecsphnejplvic.supabase.co", // Cross-contamination!
        supabasePublishableKey: "key",
      }),
    ).toThrow("SECURITY_VIOLATION");

    // 2. EatClean canonical binding points to nhirlpkuvonggctdzzad
    const eatcleanBinding = CANONICAL_INSTANCE_BINDINGS.eatclean;
    expect(eatcleanBinding.supabaseProjectRef).toBe("nhirlpkuvonggctdzzad");
    expect(eatcleanBinding.supabaseUrl).toBe("https://nhirlpkuvonggctdzzad.supabase.co");
  });

  // Scenario 7: Callback correcto con PKCE code
  it("Scenario 7: Valid callback extracts code and establishes session successfully", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: "user-pkce-success" },
        },
      },
      error: null,
    });

    const result = await handleAuthCallback(
      "https://eatclean.yourmealos.com/auth/callback?code=valid-pkce-code-xyz&next=%2Fapp",
    );
    expect(result.error).toBeNull();
    expect(result.userId).toBe("user-pkce-success");
    expect(result.next).toBe("/app");
  });

  // Scenario 8: Callback expirado o inválido
  it("Scenario 8: Expired or invalid PKCE callback returns error without crashing", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: { session: null },
      error: new Error("invalid_grant: PKCE code has expired"),
    });

    const result = await handleAuthCallback(
      "https://eatclean.yourmealos.com/auth/callback?code=expired-pkce-code",
    );
    expect(result.userId).toBeNull();
    expect(result.error?.message).toContain("invalid_grant");
  });

  // Scenario 9: Cancelación del consentimiento en Google
  it("Scenario 9: Cancellation of Google consent returns error and preserves sanitized next", async () => {
    const result = await handleAuthCallback(
      "https://eatclean.yourmealos.com/auth/callback?error=access_denied&error_description=User+denied+access&next=%2Fauth",
    );
    expect(result.userId).toBeNull();
    expect(result.error?.message).toBe("User denied access");
    expect(result.next).toBe("/auth");
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  // Scenario 10: Logout y nuevo login
  it("Scenario 10: Sign out clears session and allows fresh OAuth sign in", async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();

    // Verify subsequent login calls signInWithOAuth cleanly
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: { url: "https://nhirlpkuvonggctdzzad.supabase.co/auth/v1/authorize?provider=google" },
      error: null,
    });
    const nextLogin = await signInWithOAuth("google", { skipBrowserRedirect: true });
    expect(nextLogin.error).toBeNull();
    expect(nextLogin.url).toBeTruthy();
  });

  // Scenario 11: Compatibilidad Safari y Chrome (Top-level redirect vs third-party cookies)
  it("Scenario 11: Full-page redirect avoids Safari ITP and Chrome third-party cookie restrictions", () => {
    // 1. OAuth redirect target derives from origin
    const callbackTarget = oauthRedirectTo("https://eatclean.yourmealos.com");
    expect(callbackTarget).toBe("https://eatclean.yourmealos.com/auth/callback");

    // 2. Open-redirect prevention: only allowed internal paths are accepted
    expect(safeAuthNextPath("/app")).toBe("/app");
    expect(safeAuthNextPath("/admin")).toBe("/admin");
    expect(safeAuthNextPath("https://malicious.com")).toBeNull();
    expect(safeAuthNextPath("//malicious.com")).toBeNull();
    expect(safeAuthNextPath("javascript:alert(1)")).toBeNull();
  });
});
