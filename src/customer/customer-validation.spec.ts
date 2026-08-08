/**
 * OPERATIONAL-002 Phase 3 — Customer Validation Matrix (automated).
 * No UI. No CRUD screens. Asserts CustomerFacade commands/queries + Law 002.
 */

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
  getCompanyAccountsQuery,
  getCustomerQuery,
  getDeliveryLocationsQuery,
  listRecentCustomersQuery,
  searchCustomersQuery,
} from "./CustomerQueries";
import type { CustomerRuntimeIdentity } from "./customerServiceContext";
import type { ServiceContext } from "@/services/types";
import type {
  CompanyDirectoryRecord,
  IndividualCustomerRecord,
} from "@/modules/customer-directory";
import type { CompanyAccount, Site } from "@/modules/company-account";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ValidationVerdict =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "UNIMPLEMENTED";

export type ValidationRow = {
  id: string;
  name: string;
  expected: string;
  observed: string;
  evidence: string;
  verdict: ValidationVerdict;
};

/** Filled by tests — acta / report source of truth. */
export const CUSTOMER_VALIDATION_MATRIX: ValidationRow[] = [];

function record(row: ValidationRow) {
  CUSTOMER_VALIDATION_MATRIX.push(row);
  expect(row.verdict).not.toBe("FAIL");
}

function identity(
  partial: Partial<CustomerRuntimeIdentity> = {},
): CustomerRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["company_admin"],
      capabilities: [
        "customers.read",
        "customers.write",
        "company.manage",
        "support.read",
      ],
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
    capabilities: new Set([
      "customers.read",
      "customers.write",
      "company.manage",
      "support.read",
    ]),
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
  city: "Madrid",
  zip: null,
  isActive: true,
};

function facadeWith(
  overrides: {
    directory?: Record<string, unknown>;
    companyAccount?: Record<string, unknown>;
    resolveContext?: (identity: CustomerRuntimeIdentity) => Promise<
      | { ok: true; ctx: ServiceContext }
      | {
          ok: false;
          error: {
            code: "PERMISSION_DENIED" | "TENANT_MISMATCH" | "UNKNOWN";
            message: string;
            recoverable: boolean;
          };
        }
    >;
  } = {},
) {
  return new CustomerFacade({
    resolveContext:
      overrides.resolveContext ??
      (async () => ({ ok: true as const, ctx: ctx() })),
    directory: {
      listIndividuals: vi.fn(async () => [individual]),
      listCompanies: vi.fn(async () => [companyRow]),
      archiveCustomer: vi.fn(async () => undefined),
      ...overrides.directory,
    } as never,
    companyAccount: {
      ensureIndividualCustomer: vi.fn(async () => "c1"),
      provisionCompany: vi.fn(async () => ({
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
      })),
      listSites: vi.fn(async () => [site]),
      ...overrides.companyAccount,
    } as never,
  });
}

describe("OPERATIONAL-002 Customer Validation Matrix", () => {
  afterEach(() => {
    resetCustomerFacade();
  });

  it("V01 CreateCustomer (ensure_for_session)", async () => {
    const ensure = vi.fn(async () => "c1");
    const facade = facadeWith({
      companyAccount: { ensureIndividualCustomer: ensure },
    });
    const result = await facade.createCustomer(
      identity(),
      createCustomerCommand({
        partyKind: "individual",
        mode: "ensure_for_session",
      }),
    );
    const ok =
      result.ok &&
      result.partyRef?.kind === "individual" &&
      result.partyRef.id === "c1" &&
      ensure.mock.calls.length === 1;
    record({
      id: "V01",
      name: "CreateCustomer",
      expected: "ok · partyRef individual · delegates ensureIndividualCustomer",
      observed: `ok=${result.ok} party=${result.partyRef?.kind}:${result.partyRef?.id} ensureCalls=${ensure.mock.calls.length}`,
      evidence: "CustomerFacade.createCustomer(ensure_for_session)",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V02 UpdateCustomer (expected UNIMPLEMENTED)", async () => {
    const facade = facadeWith();
    const result = await facade.updateCustomer(
      identity(),
      updateCustomerCommand({
        partyRef: { kind: "individual", id: "c1" },
        patch: { displayName: "X" },
      }),
    );
    const ok =
      !result.ok &&
      result.errors[0]?.code === "UNIMPLEMENTED" &&
      result.errors[0]?.recoverable === true;
    record({
      id: "V02",
      name: "UpdateCustomer (expected UNIMPLEMENTED)",
      expected: "UNIMPLEMENTED · recoverable · intent frozen",
      observed: `ok=${result.ok} code=${result.errors[0]?.code} recoverable=${result.errors[0]?.recoverable}`,
      evidence: "CustomerFacade.updateCustomer",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V03 ArchiveCustomer", async () => {
    const archive = vi.fn(
      async (_ctx: ServiceContext, _customerId: string) => undefined,
    );
    const facade = facadeWith({
      directory: { archiveCustomer: archive },
    });
    const result = await facade.archiveCustomer(
      identity(),
      archiveCustomerCommand({
        partyRef: { kind: "individual", id: "c1" },
      }),
    );
    const ok =
      result.ok &&
      archive.mock.calls.length === 1 &&
      archive.mock.calls[0]?.[1] === "c1";
    record({
      id: "V03",
      name: "ArchiveCustomer",
      expected: "ok · delegates directory.archiveCustomer",
      observed: `ok=${result.ok} calls=${archive.mock.calls.length} id=${archive.mock.calls[0]?.[1]}`,
      evidence: "CustomerFacade.archiveCustomer",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V04 RestoreCustomer (expected UNIMPLEMENTED)", async () => {
    const facade = facadeWith();
    const result = await facade.restoreCustomer(
      identity(),
      restoreCustomerCommand({
        partyRef: { kind: "individual", id: "c1" },
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V04",
      name: "RestoreCustomer (expected UNIMPLEMENTED)",
      expected: "UNIMPLEMENTED · intent frozen · no invented restore",
      observed: `ok=${result.ok} code=${result.errors[0]?.code}`,
      evidence: "CustomerFacade.restoreCustomer",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V05 SearchCustomers", async () => {
    const facade = facadeWith();
    const result = await facade.searchCustomers(
      identity(),
      searchCustomersQuery({ query: "mar" }),
    );
    const ok =
      result.ok &&
      result.summaries.length === 2 &&
      result.summaries.some((s) => s.partyKind === "individual") &&
      result.summaries.some((s) => s.partyKind === "company_account");
    record({
      id: "V05",
      name: "SearchCustomers",
      expected: "summaries for individual + company_account",
      observed: `ok=${result.ok} n=${result.summaries.length} kinds=${result.summaries.map((s) => s.partyKind).join(",")}`,
      evidence: "CustomerFacade.searchCustomers",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V06 GetCustomer", async () => {
    const facade = facadeWith();
    const result = await facade.getCustomer(
      identity(),
      getCustomerQuery({ partyRef: { kind: "individual", id: "c1" } }),
    );
    const ok =
      result.ok &&
      result.context?.summary.id === "c1" &&
      result.context.profile?.email === "maria@example.com" &&
      result.context.permissions.canWrite === true;
    record({
      id: "V06",
      name: "GetCustomer",
      expected: "CustomerContext · profile · permissions from Identity",
      observed: `ok=${result.ok} id=${result.context?.summary.id} canWrite=${result.context?.permissions.canWrite}`,
      evidence: "CustomerFacade.getCustomer",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V07 ListRecentCustomers", async () => {
    const facade = facadeWith();
    const result = await facade.listRecentCustomers(
      identity(),
      listRecentCustomersQuery({ limit: 5 }),
    );
    const ok = result.ok && result.summaries.length > 0;
    record({
      id: "V07",
      name: "ListRecentCustomers",
      expected: "ok · non-empty summaries (directory compose)",
      observed: `ok=${result.ok} n=${result.summaries.length}`,
      evidence: "CustomerFacade.listRecentCustomers",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V08 Company Accounts", async () => {
    const facade = facadeWith();
    const result = await facade.getCompanyAccounts(
      identity(),
      getCompanyAccountsQuery({ query: "" }),
    );
    const ok =
      result.ok &&
      result.summaries.every((s) => s.partyKind === "company_account") &&
      result.summaries[0]?.id === "co1";
    record({
      id: "V08",
      name: "Company Accounts",
      expected: "only company_account summaries",
      observed: `ok=${result.ok} n=${result.summaries.length} kind=${result.summaries[0]?.partyKind}`,
      evidence: "CustomerFacade.getCompanyAccounts",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V09 Delivery Locations", async () => {
    const listSites = vi.fn(async () => [site]);
    const facade = facadeWith({
      companyAccount: { listSites },
    });
    const companyLocs = await facade.getDeliveryLocations(
      identity(),
      getDeliveryLocationsQuery({
        partyRef: { kind: "company_account", id: "co1" },
      }),
    );
    const individualLocs = await facade.getDeliveryLocations(
      identity(),
      getDeliveryLocationsQuery({
        partyRef: { kind: "individual", id: "c1" },
      }),
    );
    const companyOk =
      companyLocs.ok &&
      companyLocs.locations[0]?.kind === "company_site" &&
      companyLocs.locations[0].siteId === "s1";
    const individualGap =
      individualLocs.locations.length === 0 &&
      individualLocs.errors.some((e) => e.code === "UNIMPLEMENTED");
    const ok = companyOk && individualGap;
    record({
      id: "V09",
      name: "Delivery Locations",
      expected:
        "company sites via listSites · individual UNIMPLEMENTED (CJ-002)",
      observed: `companyOk=${companyOk} individualGap=${individualGap}`,
      evidence: "CustomerFacade.getDeliveryLocations",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V10 Identity integration", async () => {
    const resolveContext = vi.fn(async () => ({
      ok: false as const,
      error: {
        code: "PERMISSION_DENIED" as const,
        message: "Authenticated session required for Customer operations",
        recoverable: true,
      },
    }));
    const facade = facadeWith({ resolveContext });
    const denied = await facade.searchCustomers(
      identity({ session: { present: false, userId: null } }),
      searchCustomersQuery({ query: "" }),
    );
    const noTenantResolve = vi.fn(async () => ({
      ok: false as const,
      error: {
        code: "TENANT_MISMATCH" as const,
        message: "Tenant required for Customer operations",
        recoverable: true,
      },
    }));
    const facade2 = facadeWith({ resolveContext: noTenantResolve });
    const mismatch = await facade2.searchCustomers(
      identity({ tenant: null }),
      searchCustomersQuery({ query: "" }),
    );
    const ok =
      denied.errors[0]?.code === "PERMISSION_DENIED" &&
      mismatch.errors[0]?.code === "TENANT_MISMATCH";
    record({
      id: "V10",
      name: "Identity integration",
      expected: "no session → PERMISSION_DENIED · no tenant → TENANT_MISMATCH",
      observed: `denied=${denied.errors[0]?.code} mismatch=${mismatch.errors[0]?.code}`,
      evidence: "resolveCustomerServiceContext via Facade",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V11 Permission checks", async () => {
    const facade = facadeWith();
    const reader = identity({
      permissions: {
        roles: ["support"],
        capabilities: ["customers.read", "support.read"],
      },
    });
    const got = await facade.getCustomer(
      reader,
      getCustomerQuery({ partyRef: { kind: "individual", id: "c1" } }),
    );
    const ok =
      got.ok &&
      got.context?.permissions.canRead === true &&
      got.context.permissions.canWrite === false &&
      got.context.permissions.canSupport === true;
    record({
      id: "V11",
      name: "Permission checks",
      expected: "canRead/canWrite/canSupport derived from Identity caps",
      observed: `canRead=${got.context?.permissions.canRead} canWrite=${got.context?.permissions.canWrite} canSupport=${got.context?.permissions.canSupport}`,
      evidence: "capabilityBitsFromIdentity → CustomerContext.permissions",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V12 Bootstrap interaction", async () => {
    // Customer does not load bootstrap; it consumes Identity runtime only.
    // Ensure Facade never imports BootstrapOrchestrator / ReadyGate.
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/customer/CustomerFacade.ts"),
      "utf8",
    );
    const useSrc = readFileSync(
      resolve(process.cwd(), "src/customer/useCustomer.ts"),
      "utf8",
    );
    const ok =
      !facadeSrc.includes("BootstrapOrchestrator") &&
      !facadeSrc.includes("BootstrapIdentityStore") &&
      !useSrc.includes("supabase") &&
      useSrc.includes("useIdentity");
    record({
      id: "V12",
      name: "Bootstrap interaction",
      expected: "Customer consumes Identity · does not own Bootstrap load",
      observed: `facadeOwnsBootstrap=${facadeSrc.includes("BootstrapOrchestrator")} useCustomerUsesIdentity=${useSrc.includes("useIdentity")} useCustomerImportsSupabase=${useSrc.includes("supabase")}`,
      evidence: "static source inspection CustomerFacade / useCustomer",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V13 Facade integrity", async () => {
    const facade = facadeWith();
    const viaExecute = await facade.execute(
      identity(),
      createCustomerCommand({
        partyKind: "individual",
        mode: "ensure_for_session",
      }),
    );
    const viaQuery = await facade.query(
      identity(),
      searchCustomersQuery({ query: "" }),
    );
    const merge = await facade.execute(
      identity(),
      mergeCustomerCommand({
        source: { kind: "individual", id: "c1" },
        target: { kind: "individual", id: "c2" },
      }),
    );
    const ok =
      viaExecute.ok &&
      "summaries" in viaQuery &&
      viaQuery.ok &&
      merge.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V13",
      name: "Facade integrity",
      expected: "execute/query route commands · MergeCustomer UNIMPLEMENTED",
      observed: `executeOk=${viaExecute.ok} queryOk=${"ok" in viaQuery && viaQuery.ok} merge=${merge.errors[0]?.code}`,
      evidence: "CustomerFacade.execute / query",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V14 Repository delegation", async () => {
    const listIndividuals = vi.fn(async () => [individual]);
    const listCompanies = vi.fn(async () => [companyRow]);
    const archiveCustomer = vi.fn(async () => undefined);
    const ensureIndividualCustomer = vi.fn(async () => "c1");
    const provisionCompany = vi.fn(async () => ({
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
    const listSites = vi.fn(async () => [site]);
    const facade = facadeWith({
      directory: { listIndividuals, listCompanies, archiveCustomer },
      companyAccount: {
        ensureIndividualCustomer,
        provisionCompany,
        listSites,
      },
    });

    await facade.searchCustomers(
      identity(),
      searchCustomersQuery({ query: "" }),
    );
    await facade.archiveCustomer(
      identity(),
      archiveCustomerCommand({
        partyRef: { kind: "individual", id: "c1" },
      }),
    );
    await facade.createCustomer(
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
    await facade.getDeliveryLocations(
      identity(),
      getDeliveryLocationsQuery({
        partyRef: { kind: "company_account", id: "co1" },
      }),
    );

    const ok =
      listIndividuals.mock.calls.length >= 1 &&
      listCompanies.mock.calls.length >= 1 &&
      archiveCustomer.mock.calls.length === 1 &&
      provisionCompany.mock.calls.length === 1 &&
      listSites.mock.calls.length === 1;
    record({
      id: "V14",
      name: "Repository delegation",
      expected: "Facade composes Directory + CompanyAccount only",
      observed: `listInd=${listIndividuals.mock.calls.length} listCo=${listCompanies.mock.calls.length} archive=${archiveCustomer.mock.calls.length} provision=${provisionCompany.mock.calls.length} sites=${listSites.mock.calls.length}`,
      evidence: "injected service spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V15 Foundation Law 002 compliance", async () => {
    const indexSrc = readFileSync(
      resolve(process.cwd(), "src/customer/index.ts"),
      "utf8",
    );
    const useSrc = readFileSync(
      resolve(process.cwd(), "src/customer/useCustomer.ts"),
      "utf8",
    );
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/customer/CustomerFacade.ts"),
      "utf8",
    );
    const publicExportsOk =
      indexSrc.includes("CustomerFacade") &&
      indexSrc.includes("useCustomer") &&
      !indexSrc.includes("customerServiceContext") &&
      !indexSrc.includes("createCustomerDirectoryRepository") &&
      !indexSrc.includes("integrations/supabase");
    const uiPathOk =
      useSrc.includes("useIdentity") && !useSrc.includes("integrations/supabase");
    const lawDoc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    const lawPresent = lawDoc.includes("FOUNDATION LAW 002");
    const ok =
      publicExportsOk &&
      uiPathOk &&
      lawPresent &&
      facadeSrc.includes("Never exposes Supabase");
    record({
      id: "V15",
      name: "Foundation Law compliance",
      expected: "public API = Facade only · Law 002 documented · no Supabase to UI",
      observed: `publicExportsOk=${publicExportsOk} uiPathOk=${uiPathOk} lawPresent=${lawPresent}`,
      evidence: "index.ts · useCustomer.ts · FOUNDATION_LOCK.md",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V16 CreateCustomer company_account", async () => {
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
    const facade = facadeWith({
      companyAccount: { provisionCompany: provision },
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
    const ok =
      result.ok &&
      result.partyRef?.kind === "company_account" &&
      result.context?.deliveryLocation?.kind === "company_site" &&
      provision.mock.calls.length === 1;
    record({
      id: "V16",
      name: "CreateCustomer company_account",
      expected: "provisionCompany · company_account partyRef · site delivery",
      observed: `ok=${result.ok} kind=${result.partyRef?.kind} delivery=${result.context?.deliveryLocation?.kind}`,
      evidence: "CustomerFacade.createCustomer(provision)",
      verdict: ok ? "PASS" : "FAIL",
    });
  });
});
