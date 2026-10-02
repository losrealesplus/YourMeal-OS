import { describe, it, expect, vi, beforeEach } from "vitest";
import { CustomerDietaryService } from "./customer-dietary-service";
import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("CustomerDietaryService", () => {
  let mockSupabase: any;
  let ctx: ServiceContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(),
    };

    ctx = {
      supabase: mockSupabase,
      userId: "user-123",
      tenantId: "tenant-eatclean",
      roles: ["saas_admin"],
      capabilities: new Set(["customers.read", "customers.write"]),
    };
  });

  it("throws PERMISSION_DENIED if tenant or user is missing", async () => {
    const invalidCtx = { ...ctx, tenantId: "" };
    await expect(
      CustomerDietaryService.getDietaryProfile(invalidCtx, "c1")
    ).rejects.toThrow("Tenant and user required");
  });

  it("throws permissionDenied if capability is missing for read", async () => {
    const noReadCtx = { ...ctx, capabilities: new Set<any>() };
    await expect(
      CustomerDietaryService.getDietaryProfile(noReadCtx, "c1")
    ).rejects.toThrow();
  });

  it("gets customer dietary profile successfully", async () => {
    const mockRow = {
      id: "dp-1",
      tenant_id: "tenant-eatclean",
      customer_id: "c1",
      allergens: ["gluten", "milk"],
      custom_allergens: ["kiwi"],
      restrictions: ["celiac"],
      preferences: ["no_onion"],
      dietary_notes: "Sin sal",
      created_at: "2026-10-02T10:00:00Z",
      updated_at: "2026-10-02T10:00:00Z",
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockRow, error: null });
    const eqCustomerMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqTenantMock = vi.fn().mockReturnValue({ eq: eqCustomerMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqTenantMock });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
    });

    const profile = await CustomerDietaryService.getDietaryProfile(ctx, "c1");

    expect(mockSupabase.from).toHaveBeenCalledWith("customer_dietary_profiles");
    expect(profile).not.toBeNull();
    expect(profile?.allergens).toEqual(["gluten", "milk"]);
    expect(profile?.customAllergens).toEqual(["kiwi"]);
    expect(profile?.restrictions).toEqual(["celiac"]);
    expect(profile?.preferences).toEqual(["no_onion"]);
    expect(profile?.dietaryNotes).toBe("Sin sal");
  });

  it("returns null when customer has no dietary profile", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqCustomerMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqTenantMock = vi.fn().mockReturnValue({ eq: eqCustomerMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqTenantMock });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
    });

    const profile = await CustomerDietaryService.getDietaryProfile(ctx, "c2");
    expect(profile).toBeNull();
  });

  it("saves customer dietary profile with upsert and audit logging", async () => {
    const mockSavedRow = {
      id: "dp-saved-1",
      tenant_id: "tenant-eatclean",
      customer_id: "c1",
      allergens: ["peanuts"],
      custom_allergens: [],
      restrictions: ["lactose_intolerance"],
      preferences: ["vegetarian"],
      dietary_notes: "Cuidado estricto",
      created_at: "2026-10-02T10:00:00Z",
      updated_at: "2026-10-02T10:00:00Z",
    };

    const singleMock = vi.fn().mockResolvedValue({ data: mockSavedRow, error: null });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const upsertMock = vi.fn().mockReturnValue({ select: selectMock });

    mockSupabase.from.mockReturnValue({
      upsert: upsertMock,
    });

    const result = await CustomerDietaryService.saveDietaryProfile(ctx, {
      customerId: "c1",
      allergens: ["peanuts"],
      restrictions: ["lactose_intolerance"],
      preferences: ["vegetarian"],
      dietaryNotes: "Cuidado estricto",
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("customer_dietary_profiles");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "tenant-eatclean",
        customer_id: "c1",
        allergens: ["peanuts"],
        restrictions: ["lactose_intolerance"],
        preferences: ["vegetarian"],
        dietary_notes: "Cuidado estricto",
      }),
      { onConflict: "tenant_id,customer_id" }
    );
    expect(AuditService.write).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        entityType: "customer_dietary_profile",
        entityId: "c1",
        action: "update",
      })
    );
    expect(result.id).toBe("dp-saved-1");
    expect(result.allergens).toEqual(["peanuts"]);
  });

  it("allows operations_manager with customers.write capability to save dietary profile", async () => {
    const opsManagerCtx: ServiceContext = {
      supabase: mockSupabase,
      userId: "user-ops-mgr",
      tenantId: "tenant-eatclean",
      roles: ["operations_manager"],
      capabilities: new Set(["customers.read", "customers.write"]),
    };

    const mockSavedRow = {
      id: "dp-ops-saved-1",
      tenant_id: "tenant-eatclean",
      customer_id: "c-ops-1",
      allergens: ["eggs", "fish"],
      custom_allergens: ["mango"],
      restrictions: ["low_sodium"],
      preferences: ["organic"],
      dietary_notes: "Gestión por operaciones",
      created_at: "2026-10-02T10:30:00Z",
      updated_at: "2026-10-02T10:30:00Z",
    };

    const singleMock = vi.fn().mockResolvedValue({ data: mockSavedRow, error: null });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const upsertMock = vi.fn().mockReturnValue({ select: selectMock });

    mockSupabase.from.mockReturnValue({
      upsert: upsertMock,
    });

    const result = await CustomerDietaryService.saveDietaryProfile(opsManagerCtx, {
      customerId: "c-ops-1",
      allergens: ["eggs", "fish"],
      customAllergens: ["mango"],
      restrictions: ["low_sodium"],
      preferences: ["organic"],
      dietaryNotes: "Gestión por operaciones",
    });

    expect(result.id).toBe("dp-ops-saved-1");
    expect(result.allergens).toEqual(["eggs", "fish"]);
    expect(result.customAllergens).toEqual(["mango"]);
    expect(AuditService.write).toHaveBeenCalledWith(
      opsManagerCtx,
      expect.objectContaining({
        actorId: "user-ops-mgr",
        entityId: "c-ops-1",
        action: "update",
      })
    );
  });

  it("throws permissionDenied if user lacks customers.write capability", async () => {
    const readOnlyCtx: ServiceContext = {
      supabase: mockSupabase,
      userId: "user-readonly",
      tenantId: "tenant-eatclean",
      roles: ["kitchen"],
      capabilities: new Set(["customers.read"]), // Missing customers.write
    };

    await expect(
      CustomerDietaryService.saveDietaryProfile(readOnlyCtx, {
        customerId: "c-readonly-1",
        allergens: ["gluten"],
      })
    ).rejects.toThrow("Missing capability: customers.write");
  });
});
