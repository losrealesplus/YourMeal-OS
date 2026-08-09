/**
 * CustomerFacade — sole public operational API for Customer Capability (ADR 0059).
 *
 * Composes CustomerDirectoryService + CompanyAccountService.
 * Never exposes Supabase, repositories, or storage shapes to consumers.
 *
 * Commands express write intent. Queries express read intent.
 * Operational Modules consume this API only — never directory/company modules directly
 * for new Customer surfaces.
 */

import { CustomerDirectoryService } from "@/modules/customer-directory";
import type { IndividualCustomerRecord } from "@/modules/customer-directory";
import { CompanyAccountService } from "@/modules/company-account";
import type { ServiceContext } from "@/services/types";
import type {
  CustomerCommandResult,
  CustomerContext,
  CustomerResult,
  CustomerSummary,
  DeliveryLocationRef,
  PartyRef,
} from "./CustomerContext";
import type {
  ArchiveCustomerCommand,
  CreateCustomerCommand,
  CustomerCommand,
  MergeCustomerCommand,
  RestoreCustomerCommand,
  UpdateCustomerCommand,
} from "./CustomerCommands";
import type {
  CustomerQuery,
  GetCompanyAccountsQuery,
  GetCustomerQuery,
  GetDeliveryLocationsQuery,
  ListRecentCustomersQuery,
  SearchCustomersQuery,
} from "./CustomerQueries";
import {
  buildCompanyContext,
  buildIndividualContext,
  failCommand,
  failResult,
  mapCompanySummary,
  mapDomainError,
  mapIndividualSummary,
  sitesToDeliveryLocations,
  unimplementedError,
} from "./mapCustomer";
import {
  capabilityBitsFromIdentity,
  resolveCustomerServiceContext,
  type CustomerRuntimeIdentity,
} from "./customerServiceContext";

export type CustomerFacadeDeps = {
  directory: typeof CustomerDirectoryService;
  companyAccount: typeof CompanyAccountService;
  resolveContext: typeof resolveCustomerServiceContext;
};

const defaultDeps: CustomerFacadeDeps = {
  directory: CustomerDirectoryService,
  companyAccount: CompanyAccountService,
  resolveContext: resolveCustomerServiceContext,
};

export class CustomerFacade {
  private readonly deps: CustomerFacadeDeps;

  constructor(deps: Partial<CustomerFacadeDeps> = {}) {
    this.deps = { ...defaultDeps, ...deps };
  }

  // ── Commands ──────────────────────────────────────────────────────────

  async execute(
    identity: CustomerRuntimeIdentity,
    command: CustomerCommand,
  ): Promise<CustomerCommandResult> {
    switch (command.type) {
      case "CreateCustomer":
        return this.createCustomer(identity, command);
      case "UpdateCustomer":
        return this.updateCustomer(identity, command);
      case "ArchiveCustomer":
        return this.archiveCustomer(identity, command);
      case "RestoreCustomer":
        return this.restoreCustomer(identity, command);
      case "MergeCustomer":
        return this.mergeCustomer(identity, command);
      default: {
        const _exhaustive: never = command;
        return failCommand([
          {
            code: "UNKNOWN",
            message: `Unknown command: ${String(_exhaustive)}`,
            recoverable: false,
          },
        ]);
      }
    }
  }

  async createCustomer(
    identity: CustomerRuntimeIdentity,
    command: CreateCustomerCommand,
  ): Promise<CustomerCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error]);

    try {
      if (command.partyKind === "individual") {
        if (command.mode === "staff_create") {
          // CREATE success = write success (OPPO MVP-01.1: INSERT ok must not
          // become ok:false because a secondary listIndividuals read-back fails).
          const id = await this.deps.directory.createIndividualStaff(
            resolved.ctx,
            {
              displayName: command.displayName,
              phone: command.phone,
              street: command.street,
              city: command.city,
            },
          );
          const partyRef: PartyRef = { kind: "individual", id };
          const permissions = capabilityBitsFromIdentity(identity);
          const createdRow: IndividualCustomerRecord = {
            id,
            displayName: command.displayName?.trim() || null,
            email: null,
            phone: command.phone?.trim() || null,
            kind: "individual",
            status: "new",
            createdAt: new Date().toISOString(),
            lastOrderAt: null,
            orderCount: 0,
            averageTicket: 0,
            lifetimeTotal: 0,
            companyId: null,
            companyName: null,
            companyCode: null,
            city: command.city?.trim() || null,
          };
          const context = buildIndividualContext(
            createdRow,
            resolved.ctx.tenantId,
            permissions,
          );
          return { ok: true, partyRef, context, errors: [] };
        }

        const displayName =
          command.displayName ??
          identity.currentUser?.fullName ??
          null;
        const ctxWithName = {
          ...resolved.ctx,
          displayName,
        } as ServiceContext & { displayName?: string | null };
        const id = await this.deps.companyAccount.ensureIndividualCustomer(
          ctxWithName,
        );
        const partyRef: PartyRef = { kind: "individual", id };
        const got = await this.getCustomer(identity, {
          type: "GetCustomer",
          partyRef,
        });
        return {
          ok: got.ok,
          partyRef,
          context: got.context,
          errors: got.errors,
        };
      }

      const provisioned = await this.deps.companyAccount.provisionCompany(
        resolved.ctx,
        {
          name: command.name,
          contactName: command.contactName,
          contactEmail: command.contactEmail,
          contactPhone: command.contactPhone,
          vatId: command.vatId,
          commercialTerms: command.commercialTerms,
          fiscalAddress: command.fiscalAddress,
          deliveryAddress: command.deliveryAddress,
          siteName: command.siteName,
          unitName: command.unitName,
          orgUnitLabel: command.orgUnitLabel,
        },
      );
      const partyRef: PartyRef = {
        kind: "company_account",
        id: provisioned.company.id,
      };
      const permissions = capabilityBitsFromIdentity(identity);
      const summary = {
        partyKind: "company_account" as const,
        id: provisioned.company.id,
        displayName: provisioned.company.name,
        status: "active" as const,
        demandChannelDefault: "company" as const,
        tenantId: provisioned.company.tenantId,
        tags: [`code:${provisioned.company.companyCode}`],
        userId: null,
      };
      const context: CustomerContext = {
        summary,
        profile: null,
        companyAccountId: provisioned.company.id,
        deliveryLocation: {
          kind: "company_site",
          siteId: provisioned.site.id,
        },
        identityUserId: identity.session.userId,
        permissions,
      };
      return { ok: true, partyRef, context, errors: [] };
    } catch (e) {
      return failCommand([mapDomainError(e)]);
    }
  }

  async updateCustomer(
    identity: CustomerRuntimeIdentity,
    command: UpdateCustomerCommand,
  ): Promise<CustomerCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], command.partyRef);
    void resolved;
    return failCommand(
      [
        unimplementedError("UpdateCustomer", {
          partyRef: command.partyRef,
          patch: command.patch,
        }),
      ],
      command.partyRef,
    );
  }

  async archiveCustomer(
    identity: CustomerRuntimeIdentity,
    command: ArchiveCustomerCommand,
  ): Promise<CustomerCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], command.partyRef);

    if (command.partyRef.kind !== "individual") {
      return failCommand(
        [
          unimplementedError("ArchiveCustomer.company_account", {
            partyRef: command.partyRef,
          }),
        ],
        command.partyRef,
      );
    }

    try {
      await this.deps.directory.archiveCustomer(
        resolved.ctx,
        command.partyRef.id,
      );
      return {
        ok: true,
        partyRef: command.partyRef,
        context: null,
        errors: [],
      };
    } catch (e) {
      return failCommand([mapDomainError(e)], command.partyRef);
    }
  }

  async restoreCustomer(
    identity: CustomerRuntimeIdentity,
    command: RestoreCustomerCommand,
  ): Promise<CustomerCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], command.partyRef);
    void resolved;
    return failCommand(
      [
        unimplementedError("RestoreCustomer", {
          partyRef: command.partyRef,
        }),
      ],
      command.partyRef,
    );
  }

  async mergeCustomer(
    identity: CustomerRuntimeIdentity,
    command: MergeCustomerCommand,
  ): Promise<CustomerCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], command.source);
    void resolved;
    return failCommand(
      [
        unimplementedError("MergeCustomer", {
          source: command.source,
          target: command.target,
        }),
      ],
      command.source,
    );
  }

  // ── Queries ───────────────────────────────────────────────────────────

  async query(
    identity: CustomerRuntimeIdentity,
    q: CustomerQuery,
  ): Promise<
    | CustomerResult
    | { ok: boolean; summaries: CustomerSummary[]; errors: CustomerResult["errors"] }
    | {
        ok: boolean;
        locations: DeliveryLocationRef[];
        errors: CustomerResult["errors"];
      }
  > {
    switch (q.type) {
      case "GetCustomer":
        return this.getCustomer(identity, q);
      case "SearchCustomers":
        return this.searchCustomers(identity, q);
      case "ListRecentCustomers":
        return this.listRecentCustomers(identity, q);
      case "GetDeliveryLocations":
        return this.getDeliveryLocations(identity, q);
      case "GetCompanyAccounts":
        return this.getCompanyAccounts(identity, q);
      default: {
        const _exhaustive: never = q;
        return failResult([
          {
            code: "UNKNOWN",
            message: `Unknown query: ${String(_exhaustive)}`,
            recoverable: false,
          },
        ]);
      }
    }
  }

  async getCustomer(
    identity: CustomerRuntimeIdentity,
    q: GetCustomerQuery,
  ): Promise<CustomerResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failResult([resolved.error]);

    const permissions = capabilityBitsFromIdentity(identity);
    const tenantId = resolved.ctx.tenantId;

    try {
      if (q.partyRef.kind === "individual") {
        const rows = await this.deps.directory.listIndividuals(resolved.ctx, {});
        const row = rows.find((r) => r.id === q.partyRef.id);
        if (!row) {
          return failResult([
            {
              code: "NOT_FOUND",
              message: `Individual Customer ${q.partyRef.id} not found`,
              recoverable: false,
              evidence: { partyRef: q.partyRef },
            },
          ]);
        }
        return {
          ok: true,
          context: buildIndividualContext(row, tenantId, permissions),
          errors: [],
        };
      }

      const companies = await this.deps.directory.listCompanies(resolved.ctx, {});
      const company = companies.find((c) => c.id === q.partyRef.id);
      if (!company) {
        return failResult([
          {
            code: "NOT_FOUND",
            message: `Company Account ${q.partyRef.id} not found`,
            recoverable: false,
            evidence: { partyRef: q.partyRef },
          },
        ]);
      }
      return {
        ok: true,
        context: buildCompanyContext(company, tenantId, permissions),
        errors: [],
      };
    } catch (e) {
      return failResult([mapDomainError(e)]);
    }
  }

  async searchCustomers(
    identity: CustomerRuntimeIdentity,
    q: SearchCustomersQuery,
  ): Promise<{
    ok: boolean;
    summaries: CustomerSummary[];
    errors: CustomerResult["errors"];
  }> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) {
      return { ok: false, summaries: [], errors: [resolved.error] };
    }

    const tenantId = resolved.ctx.tenantId;
    const kind = q.partyKind ?? "all";
    const limit = q.limit ?? 50;

    try {
      const summaries: CustomerSummary[] = [];

      if (kind === "all" || kind === "individual") {
        const rows = await this.deps.directory.listIndividuals(resolved.ctx, {
          query: q.query,
        });
        for (const row of rows) {
          summaries.push(mapIndividualSummary(row, tenantId));
        }
      }

      if (kind === "all" || kind === "company_account") {
        const rows = await this.deps.directory.listCompanies(resolved.ctx, {
          query: q.query,
        });
        for (const row of rows) {
          summaries.push(mapCompanySummary(row, tenantId));
        }
      }

      return {
        ok: true,
        summaries: summaries.slice(0, limit),
        errors: [],
      };
    } catch (e) {
      return { ok: false, summaries: [], errors: [mapDomainError(e)] };
    }
  }

  async listRecentCustomers(
    identity: CustomerRuntimeIdentity,
    q: ListRecentCustomersQuery = { type: "ListRecentCustomers" },
  ): Promise<{
    ok: boolean;
    summaries: CustomerSummary[];
    errors: CustomerResult["errors"];
  }> {
    return this.searchCustomers(identity, {
      type: "SearchCustomers",
      query: "",
      partyKind: q.partyKind ?? "all",
      limit: q.limit ?? 20,
    });
  }

  async getDeliveryLocations(
    identity: CustomerRuntimeIdentity,
    q: GetDeliveryLocationsQuery,
  ): Promise<{
    ok: boolean;
    locations: DeliveryLocationRef[];
    errors: CustomerResult["errors"];
  }> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) {
      return { ok: false, locations: [], errors: [resolved.error] };
    }

    try {
      if (q.partyRef.kind === "company_account") {
        const sites = await this.deps.companyAccount.listSites(
          resolved.ctx,
          q.partyRef.id,
        );
        return {
          ok: true,
          locations: sitesToDeliveryLocations(sites),
          errors: [],
        };
      }

      // Individual address CRUD substrate incomplete (CUSTOMER_CAPABILITY gaps).
      return {
        ok: true,
        locations: [],
        errors: [
          {
            code: "UNIMPLEMENTED",
            message:
              "GetDeliveryLocations for individuals awaits address substrate (CJ-002)",
            recoverable: true,
            evidence: { partyRef: q.partyRef },
          },
        ],
      };
    } catch (e) {
      return { ok: false, locations: [], errors: [mapDomainError(e)] };
    }
  }

  async getCompanyAccounts(
    identity: CustomerRuntimeIdentity,
    q: GetCompanyAccountsQuery = { type: "GetCompanyAccounts" },
  ): Promise<{
    ok: boolean;
    summaries: CustomerSummary[];
    errors: CustomerResult["errors"];
  }> {
    return this.searchCustomers(identity, {
      type: "SearchCustomers",
      query: q.query ?? "",
      partyKind: "company_account",
      limit: q.limit ?? 100,
    });
  }
}

let singleton: CustomerFacade | null = null;

export function getCustomerFacade(): CustomerFacade {
  if (!singleton) singleton = new CustomerFacade();
  return singleton;
}

/** Test helper */
export function resetCustomerFacade(): void {
  singleton = null;
}
