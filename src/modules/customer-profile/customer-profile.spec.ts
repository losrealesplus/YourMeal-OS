/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { customerProfileSchema, type CustomerProfileRecord } from "./domain/customer-profile";
import { CustomerProfileService } from "./application/customer-profile-service";
import type { CustomerProfileRepository } from "./infrastructure/customer-profile-repository";
import type { ServiceContext } from "@/services/types";
import { capabilitiesFor } from "@/permissions";

function mockCtx(overrides?: Partial<ServiceContext>): ServiceContext {
  return {
    tenantId: "tenant-eatclean-uuid",
    userId: "user-123",
    roles: ["customer"],
    capabilities: capabilitiesFor(["customer"]),
    supabase: {} as any,
    ...overrides,
  };
}

describe("CR-UX-CLIENT-02 · Customer Profile Domain & Validation", () => {
  it("TC-PROF-08: validates display name length and format correctly", () => {
    // Too short (< 2 chars)
    const invalidShort = customerProfileSchema.safeParse({ displayName: "A" });
    expect(invalidShort.success).toBe(false);

    // Valid standard name
    const valid = customerProfileSchema.safeParse({
      displayName: "Isabella Hernandez",
      phone: "+34 600 123 456",
    });
    expect(valid.success).toBe(true);

    // Valid without phone
    const validNoPhone = customerProfileSchema.safeParse({
      displayName: "Carlos Gomez",
      phone: "",
    });
    expect(validNoPhone.success).toBe(true);

    // Invalid phone characters
    const invalidPhone = customerProfileSchema.safeParse({
      displayName: "Carlos Gomez",
      phone: "invalid-phone-abc",
    });
    expect(invalidPhone.success).toBe(false);
  });
});

describe("CR-UX-CLIENT-02 · Customer Profile Service (Application Layer)", () => {
  it("TC-PROF-01: retrieves customer profile from relational source of truth", async () => {
    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn().mockResolvedValue({
        id: "cust-999",
        tenant_id: "tenant-eatclean-uuid",
        user_id: "user-123",
        display_name: "Isabella Hernandez",
        email: "isabella@example.com",
        created_at: "2026-01-01T00:00:00Z",
      }),
      getPrimaryPhone: vi.fn().mockResolvedValue({
        id: "phone-111",
        customer_id: "cust-999",
        phone: "+34 611 222 333",
        is_primary: true,
      }),
      updateDisplayName: vi.fn(),
      upsertPrimaryPhone: vi.fn(),
      ensureCustomer: vi.fn(),
    };

    const service = new CustomerProfileService(mockRepo);
    const ctx = mockCtx();

    const profile = await service.getProfile(ctx);

    expect(profile.id).toBe("cust-999");
    expect(profile.displayName).toBe("Isabella Hernandez");
    expect(profile.email).toBe("isabella@example.com");
    expect(profile.phone).toBe("+34 611 222 333");
    expect(profile.phoneId).toBe("phone-111");
    expect(mockRepo.getCustomerByUserId).toHaveBeenCalledWith("tenant-eatclean-uuid", "user-123");
    expect(mockRepo.getPrimaryPhone).toHaveBeenCalledWith("tenant-eatclean-uuid", "cust-999");
  });

  it("TC-PROF-02: applies graceful fallback to auth user_metadata if relational row is empty/unseeded", async () => {
    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn().mockResolvedValue({
        id: "cust-999",
        tenant_id: "tenant-eatclean-uuid",
        user_id: "user-123",
        display_name: null,
        email: "isabella@example.com",
        created_at: "2026-01-01T00:00:00Z",
      }),
      getPrimaryPhone: vi.fn().mockResolvedValue(null),
      updateDisplayName: vi.fn(),
      upsertPrimaryPhone: vi.fn(),
      ensureCustomer: vi.fn(),
    };

    const service = new CustomerProfileService(mockRepo);
    const ctx = mockCtx();

    const profile = await service.getProfile(ctx, {
      fallbackUserMetadata: {
        full_name: "Isabella Metadata",
        phone: "+34 600 000 000",
      },
    });

    expect(profile.displayName).toBe("Isabella Metadata");
    expect(profile.phone).toBe("+34 600 000 000");
  });

  it("TC-PROF-03: updates display name and existing primary phone", async () => {
    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn().mockResolvedValue({
        id: "cust-999",
        tenant_id: "tenant-eatclean-uuid",
        user_id: "user-123",
        display_name: "Old Name",
        email: "isabella@example.com",
        created_at: "2026-01-01T00:00:00Z",
      }),
      getPrimaryPhone: vi.fn().mockResolvedValue({
        id: "phone-111",
        customer_id: "cust-999",
        phone: "+34 600 000 000",
        is_primary: true,
      }),
      updateDisplayName: vi.fn().mockResolvedValue({
        id: "cust-999",
        tenant_id: "tenant-eatclean-uuid",
        user_id: "user-123",
        display_name: "Isabella Updated",
        email: "isabella@example.com",
        created_at: "2026-01-01T00:00:00Z",
      }),
      upsertPrimaryPhone: vi.fn().mockResolvedValue({
        id: "phone-111",
        customer_id: "cust-999",
        phone: "+34 699 888 777",
        is_primary: true,
      }),
      ensureCustomer: vi.fn(),
    };

    const service = new CustomerProfileService(mockRepo);
    const ctx = mockCtx();

    const updated = await service.updateProfile(ctx, {
      displayName: "Isabella Updated",
      phone: "+34 699 888 777",
    });

    expect(mockRepo.updateDisplayName).toHaveBeenCalledWith(
      "tenant-eatclean-uuid",
      "cust-999",
      "user-123",
      "Isabella Updated",
    );
    expect(mockRepo.upsertPrimaryPhone).toHaveBeenCalledWith(
      "tenant-eatclean-uuid",
      "cust-999",
      "+34 699 888 777",
    );
    expect(updated.displayName).toBe("Isabella Updated");
    expect(updated.phone).toBe("+34 699 888 777");
  });

  it("TC-PROF-04: creates primary phone when customer previously had no phone record", async () => {
    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn().mockResolvedValue({
        id: "cust-999",
        tenant_id: "tenant-eatclean-uuid",
        user_id: "user-123",
        display_name: "Isabella",
        email: "isabella@example.com",
        created_at: "2026-01-01T00:00:00Z",
      }),
      getPrimaryPhone: vi.fn().mockResolvedValue(null),
      updateDisplayName: vi.fn().mockResolvedValue({
        id: "cust-999",
        tenant_id: "tenant-eatclean-uuid",
        user_id: "user-123",
        display_name: "Isabella",
        email: "isabella@example.com",
        created_at: "2026-01-01T00:00:00Z",
      }),
      upsertPrimaryPhone: vi.fn().mockResolvedValue({
        id: "phone-new",
        customer_id: "cust-999",
        phone: "+34 655 444 333",
        is_primary: true,
      }),
      ensureCustomer: vi.fn(),
    };

    const service = new CustomerProfileService(mockRepo);
    const ctx = mockCtx();

    const updated = await service.updateProfile(ctx, {
      displayName: "Isabella",
      phone: "+34 655 444 333",
    });

    expect(mockRepo.upsertPrimaryPhone).toHaveBeenCalledWith(
      "tenant-eatclean-uuid",
      "cust-999",
      "+34 655 444 333",
    );
    expect(updated.phone).toBe("+34 655 444 333");
  });

  it("TC-PROF-05: enforces tenant and user isolation boundaries", async () => {
    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn().mockResolvedValue(null),
      getPrimaryPhone: vi.fn(),
      updateDisplayName: vi.fn(),
      upsertPrimaryPhone: vi.fn(),
      ensureCustomer: vi.fn(),
    };

    const service = new CustomerProfileService(mockRepo);
    const ctx = mockCtx({ tenantId: undefined });

    await expect(service.getProfile(ctx)).rejects.toThrow("Tenant and user required");
  });

  it("TC-PROF-09: provides graceful unmaterialized fallback when customer row does not exist yet (first-time Google OAuth login)", async () => {
    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn().mockResolvedValue(null),
      getPrimaryPhone: vi.fn(),
      updateDisplayName: vi.fn(),
      upsertPrimaryPhone: vi.fn(),
      ensureCustomer: vi.fn(),
    };

    const service = new CustomerProfileService(mockRepo);
    const ctx = mockCtx();

    const profile = await service.getProfile(ctx, {
      fallbackUserMetadata: {
        full_name: "Google OAuth User",
        email: "googleuser@gmail.com",
        phone: "+34 600 111 222",
      },
    });

    expect(profile.id).toBe("");
    expect(profile.displayName).toBe("Google OAuth User");
    expect(profile.email).toBe("googleuser@gmail.com");
    expect(profile.phone).toBe("+34 600 111 222");
    expect(mockRepo.getCustomerByUserId).toHaveBeenCalledWith("tenant-eatclean-uuid", "user-123");
  });

  it("TC-PROF-10: auto-provisions customer row in public.customers via ensureCustomer on first profile save", async () => {
    const mockRepo: CustomerProfileRepository = {
      getCustomerByUserId: vi.fn().mockResolvedValue(null),
      getPrimaryPhone: vi.fn().mockResolvedValue(null),
      updateDisplayName: vi.fn(),
      ensureCustomer: vi.fn().mockResolvedValue({
        id: "cust-new-oauth-id",
        tenant_id: "tenant-eatclean-uuid",
        user_id: "user-123",
        display_name: "Isabella Google",
        email: "isabella@gmail.com",
        created_at: "2026-10-17T22:00:00Z",
      }),
      upsertPrimaryPhone: vi.fn().mockResolvedValue({
        id: "phone-new-id",
        customer_id: "cust-new-oauth-id",
        phone: "+34 655 000 111",
        is_primary: true,
      }),
    };

    const service = new CustomerProfileService(mockRepo);
    const ctx = mockCtx();

    const result = await service.updateProfile(ctx, {
      displayName: "Isabella Google",
      phone: "+34 655 000 111",
      email: "isabella@gmail.com",
    });

    expect(mockRepo.ensureCustomer).toHaveBeenCalledWith(
      "tenant-eatclean-uuid",
      "user-123",
      "Isabella Google",
      "isabella@gmail.com",
    );
    expect(mockRepo.upsertPrimaryPhone).toHaveBeenCalledWith(
      "tenant-eatclean-uuid",
      "cust-new-oauth-id",
      "+34 655 000 111",
    );
    expect(result.id).toBe("cust-new-oauth-id");
    expect(result.displayName).toBe("Isabella Google");
    expect(result.phone).toBe("+34 655 000 111");
  });
});
