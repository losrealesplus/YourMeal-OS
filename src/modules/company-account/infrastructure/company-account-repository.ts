/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { DomainError } from "@/domain/errors";
import type {
  CompanyAccount,
  CompanyEmployeeRecord,
  EmployeeMembership,
  OrganizationalUnit,
  Site,
  UpdateCompanyInput,
  UpdateOrganizationalUnitInput,
  UpdateSiteInput,
} from "../domain/company-account";

type Client = SupabaseClient<Database>;

function mapCompany(row: Record<string, unknown>): CompanyAccount {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name),
    companyCode: String(row.company_code ?? ""),
    vatId: (row.vat_id as string | null) ?? null,
    contactName: (row.contact_name as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    commercialTerms: (row.commercial_terms as string | null) ?? null,
    fiscalAddress: (row.fiscal_address as string | null) ?? null,
    orgUnitLabel: String(row.org_unit_label ?? "Departamento"),
    internalLocationLabel: String(row.internal_location_label ?? "Ubicación"),
    billingRule: String(row.billing_rule ?? "grouped"),
  };
}

/**
 * Persistence for ADR 0015. Uses `any` query builder until generated
 * Database types include company_code / delivery_groups / order B2B columns.
 */
export function createCompanyAccountRepository(client: Client, tenantId: string) {
  const db = client as any;

  return {
    async ensureIndividualCustomer(input: {
      userId: string;
      displayName?: string | null;
      email?: string | null;
    }): Promise<string> {
      const { data, error } = await db.rpc("ensure_individual_customer", {
        p_tenant_id: tenantId,
        p_user_id: input.userId,
        p_display_name: input.displayName ?? null,
        p_email: input.email ?? null,
      });
      if (error) throw error;
      return String(data);
    },

    async generateCompanyCode(): Promise<string> {
      const { data, error } = await db.rpc("generate_company_code", {
        p_tenant_id: tenantId,
      });
      if (error) throw error;
      return String(data);
    },

    async listCompanies(): Promise<CompanyAccount[]> {
      const { data, error } = await db
        .from("companies")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapCompany);
    },

    async findCompanyByCode(code: string): Promise<CompanyAccount | null> {
      const { data, error } = await db
        .from("companies")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("company_code", code.trim().toUpperCase())
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data ? mapCompany(data as Record<string, unknown>) : null;
    },

    async findCompanyById(id: string): Promise<CompanyAccount | null> {
      const { data, error } = await db
        .from("companies")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data ? mapCompany(data as Record<string, unknown>) : null;
    },

    async insertCompany(input: {
      name: string;
      companyCode: string;
      vatId?: string | null;
      contactName?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
      commercialTerms?: string | null;
      fiscalAddress?: string | null;
      orgUnitLabel?: string;
    }): Promise<CompanyAccount> {
      const { data, error } = await db
        .from("companies")
        .insert({
          tenant_id: tenantId,
          name: input.name,
          company_code: input.companyCode,
          vat_id: input.vatId ?? null,
          contact_name: input.contactName ?? null,
          contact_email: input.contactEmail ?? null,
          contact_phone: input.contactPhone ?? null,
          commercial_terms: input.commercialTerms ?? null,
          fiscal_address: input.fiscalAddress ?? null,
          org_unit_label: input.orgUnitLabel ?? "Departamento",
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapCompany(data as Record<string, unknown>);
    },

    async updateCompany(companyId: string, input: UpdateCompanyInput): Promise<CompanyAccount> {
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.vatId !== undefined) patch.vat_id = input.vatId ? input.vatId.trim() : null;
      if (input.contactName !== undefined)
        patch.contact_name = input.contactName ? input.contactName.trim() : null;
      if (input.contactEmail !== undefined)
        patch.contact_email = input.contactEmail ? input.contactEmail.trim() : null;
      if (input.contactPhone !== undefined)
        patch.contact_phone = input.contactPhone ? input.contactPhone.trim() : null;
      if (input.commercialTerms !== undefined)
        patch.commercial_terms = input.commercialTerms ? input.commercialTerms.trim() : null;
      if (input.fiscalAddress !== undefined)
        patch.fiscal_address = input.fiscalAddress ? input.fiscalAddress.trim() : null;
      if (input.orgUnitLabel !== undefined) patch.org_unit_label = input.orgUnitLabel.trim();
      if (input.internalLocationLabel !== undefined)
        patch.internal_location_label = input.internalLocationLabel.trim();
      if (input.billingRule !== undefined) patch.billing_rule = input.billingRule.trim();

      const { data, error } = await db
        .from("companies")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", companyId)
        .is("deleted_at", null)
        .select("*")
        .single();
      if (error) throw error;
      return mapCompany(data as Record<string, unknown>);
    },

    async listSites(companyId: string): Promise<Site[]> {
      const { data, error } = await db
        .from("company_locations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        tenantId: String(r.tenant_id),
        companyId: String(r.company_id),
        name: String(r.name),
        address: (r.address as string | null) ?? null,
        city: (r.city as string | null) ?? null,
        zip: (r.zip as string | null) ?? null,
        isActive: r.is_active !== false,
      }));
    },

    async insertSite(input: {
      companyId: string;
      name: string;
      address?: string | null;
      city?: string | null;
      zip?: string | null;
    }): Promise<Site> {
      const { data, error } = await db
        .from("company_locations")
        .insert({
          tenant_id: tenantId,
          company_id: input.companyId,
          name: input.name,
          address: input.address ?? null,
          city: input.city ?? null,
          zip: input.zip ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        companyId: String(r.company_id),
        name: String(r.name),
        address: (r.address as string | null) ?? null,
        city: (r.city as string | null) ?? null,
        zip: (r.zip as string | null) ?? null,
        isActive: true,
      };
    },

    async findSiteById(siteId: string): Promise<Site | null> {
      const { data, error } = await db
        .from("company_locations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", siteId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        companyId: String(r.company_id),
        name: String(r.name),
        address: (r.address as string | null) ?? null,
        city: (r.city as string | null) ?? null,
        zip: (r.zip as string | null) ?? null,
        isActive: r.is_active !== false,
      };
    },

    async updateSite(companyId: string, siteId: string, input: UpdateSiteInput): Promise<Site> {
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.address !== undefined) patch.address = input.address ? input.address.trim() : null;
      if (input.city !== undefined) patch.city = input.city ? input.city.trim() : null;
      if (input.zip !== undefined) patch.zip = input.zip ? input.zip.trim() : null;
      if (input.isActive !== undefined) patch.is_active = input.isActive;

      const { data, error } = await db
        .from("company_locations")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("company_id", companyId)
        .eq("id", siteId)
        .is("deleted_at", null)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new DomainError("NOT_FOUND", "Site not found for this company");
      }
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        companyId: String(r.company_id),
        name: String(r.name),
        address: (r.address as string | null) ?? null,
        city: (r.city as string | null) ?? null,
        zip: (r.zip as string | null) ?? null,
        isActive: r.is_active !== false,
      };
    },

    async listOrganizationalUnits(siteId: string): Promise<OrganizationalUnit[]> {
      const { data, error } = await db
        .from("company_departments")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("company_location_id", siteId)
        .is("deleted_at", null)
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        tenantId: String(r.tenant_id),
        siteId: String(r.company_location_id),
        name: String(r.name),
        sortOrder: Number(r.sort_order ?? 0),
        isActive: r.is_active !== false,
      }));
    },

    async findOrganizationalUnitById(unitId: string): Promise<OrganizationalUnit | null> {
      const { data, error } = await db
        .from("company_departments")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", unitId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        siteId: String(r.company_location_id),
        name: String(r.name),
        sortOrder: Number(r.sort_order ?? 0),
        isActive: r.is_active !== false,
      };
    },

    async insertOrganizationalUnit(input: {
      siteId: string;
      name: string;
    }): Promise<OrganizationalUnit> {
      const { data, error } = await db
        .from("company_departments")
        .insert({
          tenant_id: tenantId,
          company_location_id: input.siteId,
          name: input.name,
        })
        .select("*")
        .single();
      if (error) throw error;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        siteId: String(r.company_location_id),
        name: String(r.name),
        sortOrder: Number(r.sort_order ?? 0),
        isActive: true,
      };
    },

    async updateOrganizationalUnit(
      unitId: string,
      input: UpdateOrganizationalUnitInput,
    ): Promise<OrganizationalUnit> {
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
      if (input.isActive !== undefined) patch.is_active = input.isActive;

      const { data, error } = await db
        .from("company_departments")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", unitId)
        .is("deleted_at", null)
        .select("*")
        .single();
      if (error) throw error;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        siteId: String(r.company_location_id),
        name: String(r.name),
        sortOrder: Number(r.sort_order ?? 0),
        isActive: r.is_active !== false,
      };
    },

    async listCompanyEmployees(companyId: string): Promise<CompanyEmployeeRecord[]> {
      const { data, error } = await db
        .from("company_employees")
        .select(
          `
          id,
          tenant_id,
          company_id,
          customer_id,
          location_id,
          department_id,
          internal_location,
          is_admin,
          status,
          created_at,
          customers!inner (
            id,
            display_name,
            email
          ),
          company_locations (
            id,
            name
          ),
          company_departments (
            id,
            name
          )
        `,
        )
        .eq("tenant_id", tenantId)
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return ((data ?? []) as any[]).map((r) => ({
        membershipId: String(r.id),
        customerId: String(r.customer_id),
        companyId: String(r.company_id),
        displayName: r.customers?.display_name ?? null,
        email: r.customers?.email ?? null,
        phone: null,
        siteId: r.location_id ? String(r.location_id) : null,
        siteName: r.company_locations?.name ?? null,
        organizationalUnitId: r.department_id ? String(r.department_id) : null,
        organizationalUnitName: r.company_departments?.name ?? null,
        internalLocation: r.internal_location ?? null,
        isAdmin: Boolean(r.is_admin),
        status: String(r.status ?? "active"),
        createdAt: String(r.created_at),
      }));
    },

    async findMembershipForCustomer(customerId: string): Promise<EmployeeMembership | null> {
      const { data, error } = await db
        .from("company_employees")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("customer_id", customerId)
        .is("deleted_at", null)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        companyId: String(r.company_id),
        customerId: String(r.customer_id),
        siteId: (r.location_id as string | null) ?? null,
        organizationalUnitId: (r.department_id as string | null) ?? null,
        internalLocation: (r.internal_location as string | null) ?? null,
        isAdmin: Boolean(r.is_admin),
        status: String(r.status ?? "active"),
      };
    },

    async insertMembership(input: {
      companyId: string;
      customerId: string;
      siteId?: string | null;
      organizationalUnitId?: string | null;
      internalLocation?: string | null;
      isAdmin?: boolean;
    }): Promise<EmployeeMembership> {
      const { data, error } = await db
        .from("company_employees")
        .insert({
          tenant_id: tenantId,
          company_id: input.companyId,
          customer_id: input.customerId,
          location_id: input.siteId ?? null,
          department_id: input.organizationalUnitId ?? null,
          internal_location: input.internalLocation ?? null,
          is_admin: input.isAdmin ?? false,
          status: "active",
        })
        .select("*")
        .single();
      if (error) throw error;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        companyId: String(r.company_id),
        customerId: String(r.customer_id),
        siteId: (r.location_id as string | null) ?? null,
        organizationalUnitId: (r.department_id as string | null) ?? null,
        internalLocation: (r.internal_location as string | null) ?? null,
        isAdmin: Boolean(r.is_admin),
        status: String(r.status ?? "active"),
      };
    },

    async resolveDeliveryGroup(input: {
      companyId: string;
      siteId: string;
      organizationalUnitId: string;
    }): Promise<string> {
      const { data, error } = await db.rpc("resolve_delivery_group", {
        p_tenant_id: tenantId,
        p_company_id: input.companyId,
        p_site_id: input.siteId,
        p_ou_id: input.organizationalUnitId,
      });
      if (error) throw error;
      return String(data);
    },
  };
}
