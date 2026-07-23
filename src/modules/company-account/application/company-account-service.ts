import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError } from "@/domain/errors";
import { createCompanyAccountRepository } from "../infrastructure/company-account-repository";
import type {
  CompanyAccount,
  EmployeeMembership,
  OrderDemandContext,
  OrganizationalUnit,
  Site,
} from "../domain/company-account";
import { isValidCompanyCodeFormat } from "../domain/company-account";

export type RegisterCompanyInput = {
  name: string;
  vatId?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  commercialTerms?: string | null;
  fiscalAddress: string;
  deliveryAddress?: string | null;
  orgUnitLabel?: string;
  /** Optional first site name (defaults to "Sede principal"). */
  siteName?: string;
  /** Optional first organizational unit name. */
  unitName?: string;
};

export type JoinCompanyInput = {
  companyCode: string;
  siteId: string;
  organizationalUnitId: string;
  internalLocation?: string | null;
};

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function canStaffManage(ctx: ServiceContext): boolean {
  return (
    ctx.roles.includes("saas_admin") || ctx.roles.includes("company_admin")
  );
}

export const CompanyAccountService = {
  /** CJ-001 safety: person Customer + membership + role for the active tenant. */
  async ensureIndividualCustomer(ctx: ServiceContext): Promise<string> {
    assertTenant(ctx);
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    const customerId = await repo.ensureIndividualCustomer({
      userId: ctx.userId,
      displayName:
        (ctx as ServiceContext & { displayName?: string }).displayName ?? null,
      email: null,
    });
    return customerId;
  },

  async registerCompany(
    ctx: ServiceContext,
    input: RegisterCompanyInput,
  ): Promise<{ company: CompanyAccount; site: Site; unit: OrganizationalUnit }> {
    assertTenant(ctx);
    if (!input.name.trim()) {
      throw new DomainError("INVALID_STATE", "Company name is required");
    }
    if (!input.contactName.trim() || !input.contactEmail.trim()) {
      throw new DomainError("INVALID_STATE", "Contact person is required");
    }
    if (!input.fiscalAddress.trim()) {
      throw new DomainError("INVALID_STATE", "Fiscal address is required");
    }

    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    const customerId = await repo.ensureIndividualCustomer({
      userId: ctx.userId,
      displayName: input.contactName,
      email: input.contactEmail,
    });

    const companyCode = await repo.generateCompanyCode();
    const company = await repo.insertCompany({
      name: input.name.trim(),
      companyCode,
      vatId: input.vatId ?? null,
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim(),
      contactPhone: input.contactPhone ?? null,
      commercialTerms: input.commercialTerms ?? null,
      fiscalAddress: input.fiscalAddress.trim(),
      orgUnitLabel: input.orgUnitLabel?.trim() || "Departamento",
    });

    const site = await repo.insertSite({
      companyId: company.id,
      name: input.siteName?.trim() || "Sede principal",
      address: input.deliveryAddress?.trim() || input.fiscalAddress.trim(),
    });

    const unit = await repo.insertOrganizationalUnit({
      siteId: site.id,
      name: input.unitName?.trim() || "General",
    });

    await repo.insertMembership({
      companyId: company.id,
      customerId,
      siteId: site.id,
      organizationalUnitId: unit.id,
      isAdmin: true,
    });

    await AuditService.write(ctx, {
      entityType: "company",
      entityId: company.id,
      action: "create",
      newData: { companyCode: company.companyCode, name: company.name },
    });

    return { company, site, unit };
  },

  async lookupCompanyByCode(
    ctx: ServiceContext,
    code: string,
  ): Promise<CompanyAccount> {
    assertTenant(ctx);
    if (!isValidCompanyCodeFormat(code)) {
      throw new DomainError("INVALID_STATE", "Invalid company code format");
    }
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    const company = await repo.findCompanyByCode(code);
    if (!company) {
      throw new DomainError("NOT_FOUND", "Company code not found");
    }
    return company;
  },

  async joinCompany(
    ctx: ServiceContext,
    input: JoinCompanyInput,
  ): Promise<EmployeeMembership> {
    assertTenant(ctx);
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    const company = await this.lookupCompanyByCode(ctx, input.companyCode);

    const sites = await repo.listSites(company.id);
    const site = sites.find((s) => s.id === input.siteId);
    if (!site) {
      throw new DomainError("INVALID_STATE", "Site does not belong to company");
    }

    const units = await repo.listOrganizationalUnits(site.id);
    const unit = units.find((u) => u.id === input.organizationalUnitId);
    if (!unit) {
      throw new DomainError(
        "INVALID_STATE",
        "Organizational unit does not belong to site",
      );
    }

    const customerId = await repo.ensureIndividualCustomer({
      userId: ctx.userId,
    });

    const existing = await repo.findMembershipForCustomer(customerId);
    if (existing && existing.companyId === company.id) {
      throw new DomainError("INVALID_STATE", "Already a member of this company");
    }

    const membership = await repo.insertMembership({
      companyId: company.id,
      customerId,
      siteId: site.id,
      organizationalUnitId: unit.id,
      internalLocation: input.internalLocation ?? null,
      isAdmin: false,
    });

    await AuditService.write(ctx, {
      entityType: "company_employee",
      entityId: membership.id,
      action: "create",
      newData: {
        companyId: company.id,
        siteId: site.id,
        organizationalUnitId: unit.id,
      },
    });

    return membership;
  },

  async listSites(ctx: ServiceContext, companyId: string): Promise<Site[]> {
    assertTenant(ctx);
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    return repo.listSites(companyId);
  },

  async listOrganizationalUnits(
    ctx: ServiceContext,
    siteId: string,
  ): Promise<OrganizationalUnit[]> {
    assertTenant(ctx);
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    return repo.listOrganizationalUnits(siteId);
  },

  async createSite(
    ctx: ServiceContext,
    input: { companyId: string; name: string; address?: string | null },
  ): Promise<Site> {
    assertTenant(ctx);
    await this.assertCanManageCompany(ctx, input.companyId);
    if (!input.name.trim()) {
      throw new DomainError("INVALID_STATE", "Site name is required");
    }
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    const site = await repo.insertSite({
      companyId: input.companyId,
      name: input.name.trim(),
      address: input.address ?? null,
    });
    await AuditService.write(ctx, {
      entityType: "company_location",
      entityId: site.id,
      action: "create",
      newData: { name: site.name, companyId: input.companyId },
    });
    return site;
  },

  async createOrganizationalUnit(
    ctx: ServiceContext,
    input: { companyId: string; siteId: string; name: string },
  ): Promise<OrganizationalUnit> {
    assertTenant(ctx);
    await this.assertCanManageCompany(ctx, input.companyId);
    if (!input.name.trim()) {
      throw new DomainError("INVALID_STATE", "Unit name is required");
    }
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    const unit = await repo.insertOrganizationalUnit({
      siteId: input.siteId,
      name: input.name.trim(),
    });
    await AuditService.write(ctx, {
      entityType: "company_department",
      entityId: unit.id,
      action: "create",
      newData: { name: unit.name, siteId: input.siteId },
    });
    return unit;
  },

  async getMembershipForUser(
    ctx: ServiceContext,
  ): Promise<{
    membership: EmployeeMembership;
    company: CompanyAccount;
  } | null> {
    assertTenant(ctx);
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    const customerId = await repo.ensureIndividualCustomer({
      userId: ctx.userId,
    });
    const membership = await repo.findMembershipForCustomer(customerId);
    if (!membership) return null;
    const company = await repo.findCompanyById(membership.companyId);
    if (!company) return null;
    return { membership, company };
  },

  /**
   * Demand context for Order programming — B2C leaves company fields null.
   */
  async resolveOrderDemandContext(
    ctx: ServiceContext,
    customerId: string,
  ): Promise<OrderDemandContext> {
    const repo = createCompanyAccountRepository(ctx.supabase, ctx.tenantId);
    const membership = await repo.findMembershipForCustomer(customerId);
    if (
      !membership ||
      !membership.siteId ||
      !membership.organizationalUnitId
    ) {
      return {
        demandChannel: "individual",
        companyId: null,
        siteId: null,
        organizationalUnitId: null,
        deliveryGroupId: null,
      };
    }

    const deliveryGroupId = await repo.resolveDeliveryGroup({
      companyId: membership.companyId,
      siteId: membership.siteId,
      organizationalUnitId: membership.organizationalUnitId,
    });

    return {
      demandChannel: "company",
      companyId: membership.companyId,
      siteId: membership.siteId,
      organizationalUnitId: membership.organizationalUnitId,
      deliveryGroupId,
    };
  },

  async assertCanManageCompany(
    ctx: ServiceContext,
    companyId: string,
  ): Promise<void> {
    if (canStaffManage(ctx)) return;
    const bound = await this.getMembershipForUser(ctx);
    if (
      !bound ||
      bound.membership.companyId !== companyId ||
      !bound.membership.isAdmin
    ) {
      throw new DomainError(
        "PERMISSION_DENIED",
        "company.manage required for this Company Account",
      );
    }
  },
};
