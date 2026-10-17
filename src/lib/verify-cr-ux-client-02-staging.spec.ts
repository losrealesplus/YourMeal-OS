import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { oauthRedirectTo } from "@/auth/urls";
import { isGoogleOAuthEnabled, isOAuthSocialEnabled } from "@/auth/features";
import { CustomerProfileService } from "@/modules/customer-profile/application/customer-profile-service";
import type {
  CustomerProfileRepository,
  CustomerRow,
  CustomerPhoneRow,
} from "@/modules/customer-profile/infrastructure/customer-profile-repository";
import type { ServiceContext } from "@/services/types";
import { capabilitiesFor } from "@/permissions";
import { EU_ALLERGENS } from "@/types/dietary";
import { buildKitchenProductionSheet } from "@/modules/operations/domain/production-kitchen-engine";

describe("CR-UX-CLIENT-02 · Staging Functional & Integration Validation Suite", () => {
  const stagingTenantId = "tenant-eatclean-staging-uuid";

  it("1. Staging Zero-Production Isolation Check", () => {
    const wranglerStagingPath = resolve(
      process.cwd(),
      "instances/yourmeal-eatclean/wrangler.staging.json",
    );
    const content = readFileSync(wranglerStagingPath, "utf-8");
    const config = JSON.parse(content);

    const supabaseUrl = config.vars.SUPABASE_URL || config.vars.VITE_SUPABASE_URL;
    expect(supabaseUrl).toBeDefined();
    // Staging must NEVER point to production Supabase project (nhirlpkuvonggctdzzad)
    expect(supabaseUrl).not.toContain("nhirlpkuvonggctdzzad");
  });

  it("2. GAP-AUTH-01: Staging PKCE Redirect & Domain Routing", () => {
    const stagingOrigins = [
      "https://eatclean-staging.yourmealos.com",
      "https://staging.yourmeal.es",
    ];

    for (const origin of stagingOrigins) {
      const redirectUri = oauthRedirectTo(origin);
      expect(redirectUri).toBe(`${origin}/auth/callback`);
      expect(redirectUri).toContain("/auth/callback");
    }
  });

  it("3. GAP-AUTH-01: Staging Feature Flag Enforcement", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv };

    try {
      // By default in staging, Google OAuth is enabled
      delete process.env.VITE_AUTH_GOOGLE_ENABLED;
      delete process.env.VITE_AUTH_OAUTH_SOCIAL_ENABLED;
      expect(isGoogleOAuthEnabled()).toBe(true);

      // Explicit disable shuts down UI button
      process.env.VITE_AUTH_GOOGLE_ENABLED = "false";
      expect(isGoogleOAuthEnabled()).toBe(false);
    } finally {
      process.env = originalEnv;
    }
  });

  it("4. GAP-PROF-01: Staging Auto-Provisioning in First-Time Google OAuth Login", async () => {
    const stagingCustomers: CustomerRow[] = [];
    const stagingPhones: CustomerPhoneRow[] = [];

    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn(async (tenantId: string, userId: string) => {
        return (
          stagingCustomers.find((c) => c.tenant_id === tenantId && c.user_id === userId) || null
        );
      }),
      getPrimaryPhone: vi.fn(async (tenantId: string, customerId: string) => {
        return (
          stagingPhones.find(
            (p) => p.tenant_id === tenantId && p.customer_id === customerId && p.is_primary,
          ) || null
        );
      }),
      updateDisplayName: vi.fn(
        async (tenantId: string, customerId: string, userId: string, displayName: string) => {
          const found = stagingCustomers.find(
            (c) => c.id === customerId && c.tenant_id === tenantId && c.user_id === userId,
          );
          if (!found) throw new Error("Not found");
          found.display_name = displayName;
          return found;
        },
      ),
      upsertPrimaryPhone: vi.fn(async (tenantId: string, customerId: string, phone: string) => {
        const created: CustomerPhoneRow = {
          id: "staging-phone-uuid-1",
          tenant_id: tenantId,
          customer_id: customerId,
          phone,
          is_primary: true,
          deleted_at: null,
        };
        stagingPhones.push(created);
        return created;
      }),
      ensureCustomer: vi.fn(
        async (tenantId: string, userId: string, displayName: string, email?: string) => {
          const created: CustomerRow = {
            id: "cust-staging-uuid-999",
            tenant_id: tenantId,
            user_id: userId,
            kind: "individual",
            display_name: displayName,
            email: email || null,
            deleted_at: null,
            created_at: new Date().toISOString(),
          };
          stagingCustomers.push(created);
          return created;
        },
      ),
    };

    const service = new CustomerProfileService(mockRepo);
    const stagingCtx: ServiceContext = {
      tenantId: stagingTenantId,
      userId: "google-oauth-user-staging-id",
      roles: ["customer"],
      capabilities: capabilitiesFor(["customer"]),
      supabase: {} as unknown as ServiceContext["supabase"],
    };

    // First login read -> returns unmaterialized fallback
    const viewBefore = await service.getProfile(stagingCtx, {
      fallbackUserMetadata: {
        full_name: "Staging Google Tester",
        email: "staging.tester@eatclean.test",
      },
    });

    expect(viewBefore.id).toBe("");
    expect(viewBefore.displayName).toBe("Staging Google Tester");
    expect(viewBefore.email).toBe("staging.tester@eatclean.test");

    // Saving profile in staging -> triggers atomic auto-provisioning
    const saved = await service.updateProfile(stagingCtx, {
      displayName: "Staging Google Tester Updated",
      phone: "+34 699 111 222",
    });

    expect(saved.id).toBe("cust-staging-uuid-999");
    expect(stagingCustomers.length).toBe(1);
    expect(stagingCustomers[0].display_name).toBe("Staging Google Tester Updated");
    expect(stagingCustomers[0].tenant_id).toBe(stagingTenantId);
    expect(stagingPhones.length).toBe(1);
    expect(stagingPhones[0].phone).toBe("+34 699 111 222");
  });

  it("5. Allergen Normalization & Kitchen Alert Matching in Staging", () => {
    // Verify canonical EU 14 identifiers
    const allergenIds = EU_ALLERGENS.map((a) => a.id);
    expect(allergenIds).toContain("milk");
    expect(allergenIds).toContain("eggs");
    expect(allergenIds).toContain("nuts");
    expect(allergenIds).not.toContain("dairy");
    expect(allergenIds).not.toContain("egg");

    // Verify Kitchen Engine produces critical safety alert when dish contains customer allergen (milk)
    const result = buildKitchenProductionSheet({
      lines: [
        {
          orderLineId: "line-staging-01",
          orderId: "ord-staging-01",
          orderNumber: "ORD-001",
          customerId: "cust-staging-01",
          customerName: "Alex Hdez",
          deliveryMethod: "home_delivery",
          identity: { itemKind: "dish", dishId: "dish-salmao" },
          dishName: "Poke Salmón Staging",
          dishAllergens: ["milk", "fish"],
          allergenSnapshotState: "DECLARED",
          criticalSafetyAllergens: ["milk"],
          modifications: [],
          packagingType: "individual_tray",
          dayDate: "2026-10-19",
          qty: 1,
          customerNotes: null,
          staffNotes: null,
        },
      ],
      targetDate: "2026-10-19",
      temporalMode: "future",
      resolutionStatus: "definitive",
      versionMetadata: {
        snapshotVersion: 1,
        generatedAt: new Date().toISOString(),
      },
    });

    expect(result.safetySummary.totalAllergyAlertCount).toBe(1);
    expect(result.safetySummary.criticalAllergensPresent.length).toBe(1);
    expect(result.safetySummary.criticalAllergensPresent[0].allergenId).toBe("milk");
    expect(result.safetySummary.criticalAllergensPresent[0].allergenLabel).toBe("Lácteos");
  });
});
