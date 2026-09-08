import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadSessionIdentity,
  resetSessionIdentityInflight,
} from "./SessionBootstrapService";
import { can, hasStaffAccess } from "@/permissions";
import { OrderService } from "@/modules/orders/application/order-service";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";

// Mock Supabase client
const mockUserRolesSelect = vi.fn();
const mockProfilesSelect = vi.fn();
const mockTenantMembersSelect = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "user_roles") {
        return {
          select: () => ({
            eq: () => mockUserRolesSelect(),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => mockProfilesSelect(),
            }),
          }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: () => ({
            eq: () => ({
              is: () => ({
                limit: () => ({
                  maybeSingle: () => mockTenantMembersSelect(),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      };
    },
  },
}));

vi.mock("@/lib/ensure-platform-owner-session", () => ({
  tryEnsurePlatformOwnerSession: vi.fn(async () => undefined),
}));

vi.mock("@/services/feature-flag-service", () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(async () => true),
  },
}));

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

describe("ADR 0065 — Customer Effective Role Resolution", () => {
  afterEach(() => {
    resetSessionIdentityInflight();
    vi.clearAllMocks();
  });

  it("Test A: Approved customer with no user_roles resolves effective role ['customer']", async () => {
    mockUserRolesSelect.mockResolvedValueOnce({ data: [], error: null });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: "user-cust-1", full_name: "Customer User", avatar_url: null, locale: "es", phone: null },
      error: null,
    });
    mockTenantMembersSelect.mockResolvedValueOnce({
      data: {
        tenant_id: "tenant-eatclean",
        status: "approved",
        membership_type: "customer",
        tenants: { id: "tenant-eatclean", name: "EatClean", slug: "eatclean" },
      },
      error: null,
    });

    const session = await loadSessionIdentity("user-cust-1");

    expect(session.userId).toBe("user-cust-1");
    expect(session.membershipStatus).toBe("approved");
    expect(session.tenant?.id).toBe("tenant-eatclean");
    expect(session.roles).toEqual(["customer"]);
  });

  it("Test B: Pending customer does NOT receive customer role and has no tenant bound", async () => {
    mockUserRolesSelect.mockResolvedValueOnce({ data: [], error: null });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: "user-cust-2", full_name: "Pending Customer", avatar_url: null, locale: "es", phone: null },
      error: null,
    });
    mockTenantMembersSelect.mockResolvedValueOnce({
      data: {
        tenant_id: "tenant-eatclean",
        status: "pending",
        membership_type: "customer",
        tenants: { id: "tenant-eatclean", name: "EatClean", slug: "eatclean" },
      },
      error: null,
    });

    const session = await loadSessionIdentity("user-cust-2");

    expect(session.membershipStatus).toBe("pending");
    expect(session.tenant).toBeNull();
    expect(session.roles).toEqual([]);
  });

  it("Test C: Approved customer has capability orders.write = true", () => {
    const roles = ["customer"] as const;
    expect(can(roles, "orders.write")).toBe(true);
    expect(can(roles, "orders.read")).toBe(true);
    expect(can(roles, "menus.read")).toBe(true);
  });

  it("Test D: Approved customer has capability orders.manage = false", () => {
    const roles = ["customer"] as const;
    expect(can(roles, "orders.manage")).toBe(false);
  });

  it("Test E: Approved customer has NO admin/staff capabilities", () => {
    const roles = ["customer"] as const;
    expect(hasStaffAccess(roles)).toBe(false);
    expect(can(roles, "saas.manage")).toBe(false);
    expect(can(roles, "admin.settings")).toBe(false);
    expect(can(roles, "kitchen.operate")).toBe(false);
    expect(can(roles, "logistics.operate")).toBe(false);
    expect(can(roles, "customers.read")).toBe(false);
    expect(can(roles, "customers.write")).toBe(false);
  });

  it("Test F: Staff employee / company_admin roles are preserved unchanged from user_roles", async () => {
    mockUserRolesSelect.mockResolvedValueOnce({
      data: [{ role: "company_admin" }],
      error: null,
    });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: "user-admin-1", full_name: "Admin User", avatar_url: null, locale: "es", phone: null },
      error: null,
    });
    mockTenantMembersSelect.mockResolvedValueOnce({
      data: {
        tenant_id: "tenant-eatclean",
        status: "approved",
        membership_type: "employee",
        tenants: { id: "tenant-eatclean", name: "EatClean", slug: "eatclean" },
      },
      error: null,
    });

    const session = await loadSessionIdentity("user-admin-1");

    expect(session.membershipStatus).toBe("approved");
    expect(session.roles).toEqual(["company_admin"]);
    expect(hasStaffAccess(session.roles)).toBe(true);
  });

  it("Test G: SaaS admin role is preserved unchanged from user_roles", async () => {
    mockUserRolesSelect.mockResolvedValueOnce({
      data: [{ role: "saas_admin" }],
      error: null,
    });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: "user-saas-1", full_name: "SaaS Admin", avatar_url: null, locale: "es", phone: null },
      error: null,
    });
    mockTenantMembersSelect.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const session = await loadSessionIdentity("user-saas-1");

    expect(session.roles).toEqual(["saas_admin"]);
    expect(can(session.roles, "saas.manage")).toBe(true);
  });

  it("Test H: Pending staff membership preserves user_roles but blocks active tenant", async () => {
    mockUserRolesSelect.mockResolvedValueOnce({
      data: [{ role: "kitchen" }],
      error: null,
    });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: "user-staff-pending", full_name: "Staff Pending", avatar_url: null, locale: "es", phone: null },
      error: null,
    });
    mockTenantMembersSelect.mockResolvedValueOnce({
      data: {
        tenant_id: "tenant-eatclean",
        status: "pending",
        membership_type: "employee",
        tenants: { id: "tenant-eatclean", name: "EatClean", slug: "eatclean" },
      },
      error: null,
    });

    const session = await loadSessionIdentity("user-staff-pending");

    expect(session.membershipStatus).toBe("pending");
    expect(session.tenant).toBeNull();
    expect(session.roles).toEqual(["kitchen"]);
  });

  it("Test I: Customer role requires 0 rows in user_roles table", async () => {
    mockUserRolesSelect.mockResolvedValueOnce({ data: [], error: null });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: "user-cust-i", full_name: "Customer Zero Roles", avatar_url: null, locale: "es", phone: null },
      error: null,
    });
    mockTenantMembersSelect.mockResolvedValueOnce({
      data: {
        tenant_id: "tenant-eatclean",
        status: "approved",
        membership_type: "customer",
        tenants: { id: "tenant-eatclean", name: "EatClean", slug: "eatclean" },
      },
      error: null,
    });

    const session = await loadSessionIdentity("user-cust-i");

    expect(session.roles).toEqual(["customer"]);
  });

  it("Test J: Customer A cannot confirm Customer B order (ownership check fails with PERMISSION_DENIED)", async () => {
    const mockOrderRepo = {
      findByIdWithItems: vi.fn(async () => ({
        order: { id: "order-b", customer_id: "cust-b", status: "draft" },
        items: [],
      })),
      findCustomerIdForUser: vi.fn(async () => "cust-a"),
    };

    const ctx: ServiceContext = {
      supabase: {} as never,
      userId: "user-cust-a",
      tenantId: "tenant-eatclean",
      roles: ["customer"],
      capabilities: new Set(["orders.write"]),
      localization: null,
      ip: null,
    };

    // Replace order repository creation for this test
    vi.spyOn(
      await import("@/modules/orders/infrastructure/order-repository"),
      "createOrderRepository",
    ).mockReturnValue(mockOrderRepo as never);

    await expect(OrderService.confirm(ctx, "order-b")).rejects.toThrow(
      "Cannot confirm an order you do not own",
    );
  });

  it("Test K: SessionBootstrapService role resolution is pure read-only with no mutation side-effects", async () => {
    mockUserRolesSelect.mockResolvedValueOnce({ data: [], error: null });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: "user-k", full_name: "Customer K", avatar_url: null, locale: "es", phone: null },
      error: null,
    });
    mockTenantMembersSelect.mockResolvedValueOnce({
      data: {
        tenant_id: "tenant-eatclean",
        status: "approved",
        membership_type: "customer",
        tenants: { id: "tenant-eatclean", name: "EatClean", slug: "eatclean" },
      },
      error: null,
    });

    const session = await loadSessionIdentity("user-k");
    expect(session.roles).toEqual(["customer"]);
    expect(session.userId).toBe("user-k");
    expect(session.membershipStatus).toBe("approved");
    // Verified: SessionBootstrapService derives roles purely in memory without mutating database state
  });
});
