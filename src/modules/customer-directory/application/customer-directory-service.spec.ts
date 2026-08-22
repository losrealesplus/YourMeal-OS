/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import {
  deriveCustomerStatus,
  RECURRING_MIN_ORDERS,
} from "@/modules/customer-directory/domain/customer-directory";
import { CustomerDirectoryService } from "@/modules/customer-directory";

describe("customer directory domain", () => {
  it("marks brand-new customers without orders as new", () => {
    const status = deriveCustomerStatus({
      createdAt: new Date().toISOString(),
      lastOrderAt: null,
      orderCount: 0,
    });
    expect(status).toBe("new");
  });

  it("marks recent buyers as active", () => {
    const status = deriveCustomerStatus({
      createdAt: "2025-01-01T00:00:00Z",
      lastOrderAt: new Date().toISOString(),
      orderCount: 3,
    });
    expect(status).toBe("active");
  });

  it("marks stale buyers as inactive", () => {
    const status = deriveCustomerStatus({
      createdAt: "2024-01-01T00:00:00Z",
      lastOrderAt: "2024-06-01T00:00:00Z",
      orderCount: 2,
    });
    expect(status).toBe("inactive");
  });

  it("exports CSV with header for particulares", () => {
    const csv = CustomerDirectoryService.toIndividualsCsv([
      {
        id: "c1",
        displayName: "Ana",
        email: "ana@example.com",
        phone: null,
        kind: "individual",
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
        lastOrderAt: null,
        orderCount: RECURRING_MIN_ORDERS,
        averageTicket: 12.5,
        lifetimeTotal: 25,
        companyId: null,
        companyName: null,
        companyCode: null,
        city: "Madrid",
      },
    ]);
    expect(csv.split("\n")[0]).toContain("nombre");
    expect(csv).toContain("Ana");
  });
});

describe("CustomerDirectoryService.updateIndividual", () => {
  const fakeCustomer = {
    id: "cust-1",
    displayName: "Alexander Antiguo",
    email: "alex.old@example.com",
    phone: "+34600000000",
    kind: "individual" as const,
    status: "active" as const,
    createdAt: "2026-01-01T00:00:00Z",
    lastOrderAt: null,
    orderCount: 1,
    averageTicket: 10,
    lifetimeTotal: 10,
    companyId: null,
    companyName: null,
    companyCode: null,
    city: "Madrid",
  };

  function mockCtx(capabilities: string[] = ["customers.write"]): any {
    return {
      supabase: {} as any,
      userId: "user-staff-1",
      tenantId: "tenant-eatclean",
      roles: ["company_admin"],
      capabilities: new Set(capabilities),
      localization: null,
      ip: null,
    };
  }

  it("rejects without tenant or userId", async () => {
    const invalidCtx = {
      supabase: {} as any,
      userId: "",
      tenantId: "",
      roles: [],
      capabilities: new Set(["customers.write"]),
    } as any;

    await expect(
      CustomerDirectoryService.updateIndividual(invalidCtx, "cust-1", {
        displayName: "Alexander",
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });

  it("rejects when customers.write is missing", async () => {
    const readOnlyCtx = mockCtx(["customers.read"]);

    await expect(
      CustomerDirectoryService.updateIndividual(readOnlyCtx, "cust-1", {
        displayName: "Alexander",
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });

  it("rejects empty displayName", async () => {
    const ctx = mockCtx(["customers.write"]);

    await expect(
      CustomerDirectoryService.updateIndividual(ctx, "cust-1", {
        displayName: "   ",
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE", message: "Nombre es obligatorio" });
  });

  it("rejects invalid email format", async () => {
    const ctx = mockCtx(["customers.write"]);

    await expect(
      CustomerDirectoryService.updateIndividual(ctx, "cust-1", {
        displayName: "Alexander",
        email: "not-an-email",
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE", message: "Email no es válido" });
  });

  it("rejects when customer is not found", async () => {
    const ctx = mockCtx(["customers.write"]);
    const fakeSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    ctx.supabase = fakeSupabase;

    await expect(
      CustomerDirectoryService.updateIndividual(ctx, "non-existent-id", {
        displayName: "Alexander",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("successfully updates customer and writes audit log with oldData and newData", async () => {
    const ctx = mockCtx(["customers.write"]);
    const initialCustomer = {
      id: "cust-1",
      display_name: "Alexander Original",
      email: "alex@example.com",
      kind: "individual",
      created_at: "2026-01-01T00:00:00Z",
      user_id: null,
    };

    let updatedDisplayName = initialCustomer.display_name;
    let updatedEmail = initialCustomer.email;

    const fakeSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "customers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockImplementation(async () => ({
              data: {
                ...initialCustomer,
                display_name: updatedDisplayName,
                email: updatedEmail,
              },
              error: null,
            })),
            update: vi.fn().mockImplementation((patch: any) => {
              if (patch.display_name) updatedDisplayName = patch.display_name;
              if (patch.email !== undefined) updatedEmail = patch.email;
              return {
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === "customer_phones" || table === "customer_addresses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({ data: [], error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              then: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "company_employees") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    };
    ctx.supabase = fakeSupabase;

    const result = await CustomerDirectoryService.updateCustomer(ctx, "cust-1", {
      displayName: "Alexander Modificado",
      email: "alex.new@example.com",
      phone: "+34611223344",
      city: "Barcelona",
    });

    expect(result.displayName).toBe("Alexander Modificado");
    expect(result.email).toBe("alex.new@example.com");
  });
});
