import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CustomerFacade,
  resetCustomerFacade,
} from "./CustomerFacade";
import {
  archiveCustomerCommand,
  createCustomerCommand,
  mergeCustomerCommand,
  restoreCustomerCommand,
  updateCustomerCommand,
} from "./CustomerCommands";
import {
  getCustomerQuery,
  getDeliveryLocationsQuery,
  searchCustomersQuery,
} from "./CustomerQueries";
import type { CustomerRuntimeIdentity } from "./customerServiceContext";
import type { ServiceContext } from "@/services/types";
import type {
  CompanyDirectoryRecord,
  IndividualCustomerRecord,
} from "@/modules/customer-directory";
import type { CompanyAccount, Site } from "@/modules/company-account";

function identity(
  partial: Partial<CustomerRuntimeIdentity> = {},
): CustomerRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["company_admin"],
      capabilities: ["customers.read", "customers.write", "company.manage"],
    },
    currentUser: {
      id: "u1",
      fullName: "Alex",
      avatarUrl: null,
      locale: "es",
      phone: null,
    },
    ...partial,
  };
}

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "u1",
    tenantId: "t1",
    roles: ["company_admin"],
    capabilities: new Set(["customers.read", "customers.write", "company.manage"]),
  };
}

const individual: IndividualCustomerRecord = {
  id: "c1",
  displayName: "María",
  email: "maria@example.com",
  phone: "+34600000000",
  kind: "individual",
  status: "active",
  createdAt: "2026-01-01T00:00:00Z",
  lastOrderAt: null,
  orderCount: 2,
  averageTicket: 30,
  lifetimeTotal: 60,
  companyId: null,
  companyName: null,
  companyCode: null,
  city: "Madrid",
};

const companyRow: CompanyDirectoryRecord = {
  id: "co1",
  name: "Gym Norte",
  companyCode: "GYM001",
  contactName: "Ana",
  contactEmail: "ana@gym.com",
  contactPhone: null,
  employeeCount: 12,
  orderCount: 40,
  lifetimeTotal: 4000,
  status: "active",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("CustomerFacade", () => {
  afterEach(() => {
    resetCustomerFacade();
  });

  it("rejects operations without session", async () => {
    const facade = new CustomerFacade({
      resolveContext: async () => ({
        ok: false,
        error: {
          code: "PERMISSION_DENIED",
          message: "Authenticated session required for Customer operations",
          recoverable: true,
        },
      }),
    });

    const result = await facade.searchCustomers(
      identity({ session: { present: false, userId: null } }),
      searchCustomersQuery({ query: "mar" }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("PERMISSION_DENIED");
  });

  it("SearchCustomersQuery maps individuals and companies to summaries", async () => {
    const facade = new CustomerFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      directory: {
        listIndividuals: vi.fn(async () => [individual]),
        listCompanies: vi.fn(async () => [companyRow]),
        archiveCustomer: vi.fn(),
      } as unknown as typeof import("@/modules/customer-directory").CustomerDirectoryService,
      companyAccount: {} as never,
    });

    const result = await facade.searchCustomers(
      identity(),
      searchCustomersQuery({ query: "" }),
    );

    expect(result.ok).toBe(true);
    expect(result.summaries).toHaveLength(2);
    expect(result.summaries[0]?.partyKind).toBe("individual");
    expect(result.summaries[0]?.displayName).toBe("María");
    expect(result.summaries[1]?.partyKind).toBe("company_account");
    expect(result.summaries[1]?.demandChannelDefault).toBe("company");
  });

  it("GetCustomerQuery returns CustomerContext for individual", async () => {
    const facade = new CustomerFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      directory: {
        listIndividuals: vi.fn(async () => [individual]),
        listCompanies: vi.fn(async () => []),
      } as never,
      companyAccount: {} as never,
    });

    const result = await facade.getCustomer(
      identity(),
      getCustomerQuery({ partyRef: { kind: "individual", id: "c1" } }),
    );

    expect(result.ok).toBe(true);
    expect(result.context?.summary.id).toBe("c1");
    expect(result.context?.profile?.email).toBe("maria@example.com");
    expect(result.context?.permissions.canWrite).toBe(true);
  });

  it("CreateCustomer ensure_for_session composes CompanyAccountService", async () => {
    const ensure = vi.fn(async () => "c1");
    const facade = new CustomerFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      directory: {
        listIndividuals: vi.fn(async () => [individual]),
        listCompanies: vi.fn(async () => []),
      } as never,
      companyAccount: {
        ensureIndividualCustomer: ensure,
      } as never,
    });

    const result = await facade.createCustomer(
      identity(),
      createCustomerCommand({
        partyKind: "individual",
        mode: "ensure_for_session",
      }),
    );

    expect(ensure).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.partyRef).toEqual({ kind: "individual", id: "c1" });
  });

  it("CreateCustomer company_account provisions via CompanyAccountService", async () => {
    const company: CompanyAccount = {
      id: "co1",
      tenantId: "t1",
      name: "Gym Norte",
      companyCode: "GYM001",
      vatId: null,
      contactName: "Ana",
      contactEmail: "ana@gym.com",
      contactPhone: null,
      commercialTerms: null,
      fiscalAddress: "Calle 1",
      orgUnitLabel: "Departamento",
      internalLocationLabel: "Ubicación",
      billingRule: "company",
    };
    const site: Site = {
      id: "s1",
      tenantId: "t1",
      companyId: "co1",
      name: "Sede",
      address: "Calle 1",
      city: null,
      zip: null,
      isActive: true,
    };

    const provision = vi.fn(async () => ({
      company,
      site,
      unit: {
        id: "ou1",
        tenantId: "t1",
        siteId: "s1",
        name: "General",
        sortOrder: 0,
        isActive: true,
      },
    }));

    const facade = new CustomerFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      directory: {} as never,
      companyAccount: { provisionCompany: provision } as never,
    });

    const result = await facade.createCustomer(
      identity(),
      createCustomerCommand({
        partyKind: "company_account",
        mode: "provision",
        name: "Gym Norte",
        contactName: "Ana",
        contactEmail: "ana@gym.com",
        fiscalAddress: "Calle 1",
      }),
    );

    expect(provision).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.partyRef?.kind).toBe("company_account");
    expect(result.context?.deliveryLocation).toEqual({
      kind: "company_site",
      siteId: "s1",
    });
  });

  it("ArchiveCustomerCommand composes directory.archiveCustomer", async () => {
    const archive = vi.fn(async () => undefined);
    const facade = new CustomerFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      directory: { archiveCustomer: archive } as never,
      companyAccount: {} as never,
    });

    const result = await facade.archiveCustomer(
      identity(),
      archiveCustomerCommand({
        partyRef: { kind: "individual", id: "c1" },
      }),
    );

    expect(archive).toHaveBeenCalledWith(expect.anything(), "c1");
    expect(result.ok).toBe(true);
  });

  it("UpdateCustomer / RestoreCustomer / MergeCustomer return UNIMPLEMENTED", async () => {
    const facade = new CustomerFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      directory: {} as never,
      companyAccount: {} as never,
    });

    const update = await facade.updateCustomer(
      identity(),
      updateCustomerCommand({
        partyRef: { kind: "individual", id: "c1" },
        patch: { displayName: "X" },
      }),
    );
    const restore = await facade.restoreCustomer(
      identity(),
      restoreCustomerCommand({
        partyRef: { kind: "individual", id: "c1" },
      }),
    );
    const merge = await facade.mergeCustomer(
      identity(),
      mergeCustomerCommand({
        source: { kind: "individual", id: "c1" },
        target: { kind: "individual", id: "c2" },
      }),
    );

    expect(update.errors[0]?.code).toBe("UNIMPLEMENTED");
    expect(restore.errors[0]?.code).toBe("UNIMPLEMENTED");
    expect(merge.errors[0]?.code).toBe("UNIMPLEMENTED");
  });

  it("GetDeliveryLocationsQuery returns company sites", async () => {
    const listSites = vi.fn(async () => [
      {
        id: "s1",
        tenantId: "t1",
        companyId: "co1",
        name: "Sede",
        address: null,
        city: null,
        zip: null,
        isActive: true,
      } satisfies Site,
    ]);

    const facade = new CustomerFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      directory: {} as never,
      companyAccount: { listSites } as never,
    });

    const result = await facade.getDeliveryLocations(
      identity(),
      getDeliveryLocationsQuery({
        partyRef: { kind: "company_account", id: "co1" },
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.locations).toEqual([
      { kind: "company_site", siteId: "s1" },
    ]);
  });

  it("execute routes CreateCustomerCommand by type", async () => {
    const ensure = vi.fn(async () => "c1");
    const facade = new CustomerFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      directory: {
        listIndividuals: vi.fn(async () => [individual]),
        listCompanies: vi.fn(async () => []),
      } as never,
      companyAccount: { ensureIndividualCustomer: ensure } as never,
    });

    const result = await facade.execute(
      identity(),
      createCustomerCommand({
        partyKind: "individual",
        mode: "ensure_for_session",
      }),
    );

    expect(result.ok).toBe(true);
    expect(ensure).toHaveBeenCalled();
  });
});
