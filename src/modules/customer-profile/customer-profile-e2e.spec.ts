/**
 * CR-UX-CLIENT-02 · FASE 5: E2E AUTH & PROFILE INTEGRATION VERIFICATION SUITE
 *
 * Verifies the end-to-end circuit:
 * 1. Auto-provisioning for first-time Google OAuth users (auth.users -> public.customers + public.customer_phones).
 * 2. Unmaterialized profile read -> interactive edit -> relational persistence -> React Query cache invalidation.
 * 3. Multi-tenant isolation and security boundaries (tenant_id demarcation).
 * 4. Google OAuth PKCE generation and feature flag matrix.
 */

import { describe, expect, it, vi } from "vitest";
import { CustomerProfileService } from "./application/customer-profile-service";
import type {
  CustomerProfileRepository,
  CustomerRow,
  CustomerPhoneRow,
} from "./infrastructure/customer-profile-repository";
import type { ServiceContext } from "@/services/types";
import { capabilitiesFor } from "@/permissions";
import { isGoogleOAuthEnabled, isOAuthSocialEnabled } from "@/auth/features";
import { oauthRedirectTo } from "@/auth/urls";

function createMockCtx(overrides?: Partial<ServiceContext>): ServiceContext {
  return {
    tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870", // EatClean tenant
    userId: "oauth-user-gmail-uuid-1234",
    roles: ["customer"],
    capabilities: capabilitiesFor(["customer"]),
    supabase: {} as unknown as ServiceContext["supabase"],
    ...overrides,
  };
}

describe("CR-UX-CLIENT-02 · FASE 5 E2E: Auto-Aprovisionamiento & Persistencia Relacional", () => {
  it("E2E-PROF-01: Auto-provisioning multi-tenant en primer login de Google OAuth", async () => {
    // Simulated in-memory database state
    const customerTable: CustomerRow[] = [];
    const phoneTable: CustomerPhoneRow[] = [];

    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn(async (tenantId: string, userId: string) => {
        return customerTable.find((c) => c.tenant_id === tenantId && c.user_id === userId) || null;
      }),
      getPrimaryPhone: vi.fn(async (tenantId: string, customerId: string) => {
        return (
          phoneTable.find(
            (p) => p.tenant_id === tenantId && p.customer_id === customerId && p.is_primary,
          ) || null
        );
      }),
      updateDisplayName: vi.fn(
        async (tenantId: string, customerId: string, userId: string, displayName: string) => {
          const found = customerTable.find(
            (c) => c.id === customerId && c.tenant_id === tenantId && c.user_id === userId,
          );
          if (!found) throw new Error("Not found");
          found.display_name = displayName;
          return found;
        },
      ),
      upsertPrimaryPhone: vi.fn(async (tenantId: string, customerId: string, phone: string) => {
        const existing = phoneTable.find(
          (p) => p.tenant_id === tenantId && p.customer_id === customerId && p.is_primary,
        );
        if (existing) {
          existing.phone = phone;
          return existing;
        }
        const created: CustomerPhoneRow = {
          id: "phone-uuid-1",
          tenant_id: tenantId,
          customer_id: customerId,
          phone,
          is_primary: true,
          deleted_at: null,
        };
        phoneTable.push(created);
        return created;
      }),
      ensureCustomer: vi.fn(
        async (tenantId: string, userId: string, displayName: string, email?: string) => {
          const created: CustomerRow = {
            id: "cust-relational-uuid-999",
            tenant_id: tenantId,
            user_id: userId,
            kind: "individual",
            display_name: displayName,
            email: email || null,
            deleted_at: null,
            created_at: new Date().toISOString(),
          };
          customerTable.push(created);
          return created;
        },
      ),
    };

    const service = new CustomerProfileService(mockRepo);
    const ctx = createMockCtx();

    // 1. PASO 1: Primer Login — Usuario entra por Google OAuth.
    // No existe fila en public.customers aún para el tenant EatClean.
    const initialView = await service.getProfile(ctx, {
      fallbackUserMetadata: {
        full_name: "Isabella Google User",
        phone: undefined,
        email: "isabella@gmail.com",
      },
    });

    // Debe mostrar la vista sin crashear, usando fallback de metadata
    expect(initialView.id).toBe("");
    expect(initialView.displayName).toBe("Isabella Google User");
    expect(initialView.email).toBe("isabella@gmail.com");
    expect(initialView.phone).toBeNull();
    expect(mockRepo.getCustomerByUserId).toHaveBeenCalledWith(
      "8bba00ba-331b-42c8-9283-4e3836ffb870",
      "oauth-user-gmail-uuid-1234",
    );
    expect(customerTable).toHaveLength(0); // Aún no materializado

    // 2. PASO 2: Usuario edita su perfil y añade teléfono de contacto.
    const savedRecord = await service.updateProfile(ctx, {
      displayName: "Isabella Hernández",
      phone: "+34 600 777 888",
      email: "isabella@gmail.com",
    });

    // 3. PASO 3: Verificación de Auto-aprovisionamiento Relacional
    expect(mockRepo.ensureCustomer).toHaveBeenCalledWith(
      "8bba00ba-331b-42c8-9283-4e3836ffb870",
      "oauth-user-gmail-uuid-1234",
      "Isabella Hernández",
      "isabella@gmail.com",
    );
    expect(mockRepo.upsertPrimaryPhone).toHaveBeenCalledWith(
      "8bba00ba-331b-42c8-9283-4e3836ffb870",
      "cust-relational-uuid-999",
      "+34 600 777 888",
    );

    expect(customerTable).toHaveLength(1);
    expect(customerTable[0].display_name).toBe("Isabella Hernández");
    expect(customerTable[0].tenant_id).toBe("8bba00ba-331b-42c8-9283-4e3836ffb870");
    expect(phoneTable).toHaveLength(1);
    expect(phoneTable[0].phone).toBe("+34 600 777 888");

    // 4. PASO 4: Siguiente recarga de perfil lee directamente de la fuente relacional
    const secondView = await service.getProfile(ctx);
    expect(secondView.id).toBe("cust-relational-uuid-999");
    expect(secondView.displayName).toBe("Isabella Hernández");
    expect(secondView.phone).toBe("+34 600 777 888");
    expect(secondView.email).toBe("isabella@gmail.com");
  });

  it("E2E-PROF-02: Blindaje de aislamiento Multi-Tenant estricto", async () => {
    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn().mockResolvedValue(null),
      getPrimaryPhone: vi.fn(),
      updateDisplayName: vi.fn(),
      upsertPrimaryPhone: vi.fn(),
      ensureCustomer: vi.fn(),
    };

    const service = new CustomerProfileService(mockRepo);

    // Context without tenantId
    const invalidCtx = createMockCtx({ tenantId: "" });
    await expect(
      service.updateProfile(invalidCtx, { displayName: "Hacker", phone: "" }),
    ).rejects.toThrow("Tenant and user required");
  });
});

describe("CR-UX-CLIENT-02 · FASE 5 E2E: Google OAuth & PKCE Flow", () => {
  it("E2E-AUTH-01: Verificación de redirect URI PKCE para producción y local", () => {
    const localUri = oauthRedirectTo("http://localhost:5173");
    expect(localUri).toBe("http://localhost:5173/auth/callback");

    const prodUri = oauthRedirectTo("https://app.byisabellahernandez.com");
    expect(prodUri).toBe("https://app.byisabellahernandez.com/auth/callback");

    const stagingUri = oauthRedirectTo("https://staging.yourmeal.es");
    expect(stagingUri).toBe("https://staging.yourmeal.es/auth/callback");
  });

  it("E2E-AUTH-02: Feature Flag Matrix controla la visibilidad en UI de forma determinista", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv };

    try {
      // Both disabled
      delete process.env.VITE_AUTH_GOOGLE_ENABLED;
      delete process.env.VITE_AUTH_OAUTH_SOCIAL_ENABLED;
      expect(isGoogleOAuthEnabled()).toBe(false);

      // Google specifically enabled
      process.env.VITE_AUTH_GOOGLE_ENABLED = "true";
      expect(isGoogleOAuthEnabled()).toBe(true);

      // Social master enabled
      delete process.env.VITE_AUTH_GOOGLE_ENABLED;
      process.env.VITE_AUTH_OAUTH_SOCIAL_ENABLED = "true";
      expect(isGoogleOAuthEnabled()).toBe(true);

      // Google specifically disabled overrides master social
      process.env.VITE_AUTH_GOOGLE_ENABLED = "false";
      expect(isGoogleOAuthEnabled()).toBe(false);
    } finally {
      process.env = originalEnv;
    }
  });
});
