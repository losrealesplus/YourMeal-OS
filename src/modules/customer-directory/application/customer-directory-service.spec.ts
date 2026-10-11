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

  it("updates through canonical revision/idempotency RPC without a second audit write", async () => {
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
      rpc: vi.fn(async (name, args) => {
        expect(name).toBe("p34_customer_command");
        expect(args._command.expectedRevision).toBe(1);
        updatedDisplayName = args._command.patch.displayName;
        updatedEmail = args._command.patch.email;
        return { data: { customerId: "cust-1", revision: 2 }, error: null };
      }),
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
      expectedRevision: 1,
      requestId: "10000000-0000-4000-8000-000000000001",
      displayName: "Alexander Modificado",
      email: "alex.new@example.com",
      phone: "+34611223344",
      city: "Barcelona",
    });

    expect(result.displayName).toBe("Alexander Modificado");
    expect(result.email).toBe("alex.new@example.com");
  });

  it("lists individuals and companies cleanly against production schema without revision column", async () => {
    const ctx = mockCtx(["customers.read"]);
    const fakeSupabase = {
      from: vi.fn((table: string) => {
        if (table === "customers") {
          return {
            select: vi.fn((cols: string) => {
              // Strict invariant: Must NOT select 'revision'
              expect(cols).not.toContain("revision");
              return {
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "cust-1",
                      display_name: "Cliente Real",
                      email: "real@eatclean.es",
                      kind: "individual",
                      created_at: "2026-01-01T00:00:00Z",
                      user_id: null,
                    },
                  ],
                  error: null,
                }),
              };
            }),
          };
        }
        if (table === "companies") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "comp-1",
                    name: "Empresa EatClean",
                    company_code: "EC-001",
                    contact_name: "Admin",
                    contact_email: "admin@eatclean.es",
                    contact_phone: null,
                    created_at: "2026-01-01T00:00:00Z",
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          is: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };
    ctx.supabase = fakeSupabase;

    const individuals = await CustomerDirectoryService.listIndividuals(ctx, {});
    expect(individuals).toHaveLength(1);
    expect(individuals[0].displayName).toBe("Cliente Real");
    expect(individuals[0].revision).toBeUndefined();

    const companies = await CustomerDirectoryService.listCompanies(ctx, {});
    expect(companies).toHaveLength(1);
    expect(companies[0].name).toBe("Empresa EatClean");
  });

  it("strictly isolates EatClean freeze rules from standard non-EatClean tenants", async () => {
    const { isEatCleanContext, EATCLEAN_TENANT_ID, EATCLEAN_TENANT_SLUG } =
      await import("@/config/eatclean-partial-launch");

    // EatClean identifiers must match
    expect(isEatCleanContext(EATCLEAN_TENANT_ID)).toBe(true);
    expect(isEatCleanContext(EATCLEAN_TENANT_SLUG)).toBe(true);
    expect(isEatCleanContext({ tenantId: EATCLEAN_TENANT_ID })).toBe(true);

    // Standard/other tenants must NOT be frozen
    const standardTenantId = "11111111-2222-3333-4444-555555555555";
    const demoTenantSlug = "demo-catering";
    expect(isEatCleanContext(standardTenantId)).toBe(false);
    expect(isEatCleanContext(demoTenantSlug)).toBe(false);
    expect(isEatCleanContext({ tenantId: standardTenantId })).toBe(false);
    expect(isEatCleanContext(null)).toBe(false);
    expect(isEatCleanContext(undefined)).toBe(false);
  });
});

// Synthetic repository responses: these tests are not authenticated E2E.
describe("customer directory recovery boundaries", () => {
  const eatclean = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  function context(
    tenantId = "11111111-2222-4333-8444-555555555555",
    capabilities = ["customers.read", "customers.write"],
    failedTable?: string,
  ): any {
    const rows: Record<string, any[]> = {
      customers: [
        {
          id: "synthetic-customer",
          display_name: "Ana Tenerife",
          email: "synthetic@example.test",
          kind: "individual",
          created_at: "2024-01-01T00:00:00Z",
          user_id: null,
        },
      ],
      companies: [
        {
          id: "synthetic-company",
          name: "Synthetic Catering",
          company_code: "SYN",
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
    };
    const from = vi.fn((table: string) => {
      const result = {
        data: rows[table] ?? [],
        error: table === failedTable ? { code: "42501", message: "synthetic failure" } : null,
      };
      const chain: any = { then: (resolve: any) => Promise.resolve(result).then(resolve) };
      chain.select = vi.fn((columns: string) => {
        if (table === "customers") expect(columns).not.toContain("revision");
        return chain;
      });
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.is = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.maybeSingle = vi
        .fn()
        .mockResolvedValue({ data: rows[table]?.[0] ?? null, error: result.error });
      return chain;
    });
    return {
      tenantId,
      userId: "synthetic-staff",
      capabilities: new Set(capabilities),
      roles: ["company_admin"],
      supabase: { from, rpc: vi.fn() },
    };
  }

  it.each(["create", "update", "archive"])(
    "blocks EatClean %s before repository access",
    async (operation) => {
      const ctx = context(eatclean);
      const call =
        operation === "create"
          ? CustomerDirectoryService.createIndividualStaff(ctx, { displayName: "Synthetic" })
          : operation === "update"
            ? CustomerDirectoryService.updateIndividual(ctx, "synthetic-customer", {
                displayName: "Synthetic",
              })
            : CustomerDirectoryService.archiveCustomer(ctx, "synthetic-customer");
      await expect(call).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
      expect(ctx.supabase.from).not.toHaveBeenCalled();
      expect(ctx.supabase.rpc).not.toHaveBeenCalled();
    },
  );

  it.each([eatclean, "11111111-2222-4333-8444-555555555555"])(
    "rejects write without capability for tenant %s",
    async (tenant) => {
      const ctx = context(tenant, ["customers.read"]);
      await expect(
        CustomerDirectoryService.createIndividualStaff(ctx, { displayName: "Synthetic" }),
      ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
      expect(ctx.supabase.from).not.toHaveBeenCalled();
    },
  );

  it("does not freeze canonical creation for another tenant", async () => {
    const ctx = context();
    ctx.supabase.rpc.mockResolvedValue({
      data: { customerId: "new-synthetic", revision: 1 },
      error: null,
    });
    expect(
      await CustomerDirectoryService.createIndividualStaff(ctx, { displayName: "Synthetic" }),
    ).toBe("new-synthetic");
    expect(ctx.supabase.rpc).toHaveBeenCalledWith(
      "p34_customer_command",
      expect.objectContaining({ _tenant: ctx.tenantId }),
    );
  });

  it("keeps companies readable when individuals fail", async () => {
    const ctx = context(eatclean, ["customers.read"], "customers");
    const results = await Promise.allSettled([
      CustomerDirectoryService.listIndividuals(ctx),
      CustomerDirectoryService.listCompanies(ctx),
    ]);
    expect(results[0].status).toBe("rejected");
    expect(results[1]).toMatchObject({
      status: "fulfilled",
      value: [{ name: "Synthetic Catering" }],
    });
  });

  it("surfaces company errors without losing individual reads", async () => {
    const ctx = context(eatclean, ["customers.read"], "companies");
    await expect(CustomerDirectoryService.listCompanies(ctx)).rejects.toMatchObject({
      code: "42501",
    });
    expect(await CustomerDirectoryService.listIndividuals(ctx)).toHaveLength(1);
  });

  it("filters searches and status against revision-free reads", async () => {
    const ctx = context(eatclean, ["customers.read"]);
    expect(
      await CustomerDirectoryService.listIndividuals(ctx, {
        query: "TENERIFE",
        status: "inactive",
      }),
    ).toHaveLength(1);
    expect(await CustomerDirectoryService.listIndividuals(ctx, { query: "absent" })).toHaveLength(
      0,
    );
    expect(await CustomerDirectoryService.listCompanies(ctx, { query: "SYN" })).toHaveLength(1);
    expect(await CustomerDirectoryService.listCompanies(ctx, { query: "absent" })).toHaveLength(0);
    expect(
      (await CustomerDirectoryService.getIndividualById(ctx, "synthetic-customer"))?.revision,
    ).toBeUndefined();
  });
});
