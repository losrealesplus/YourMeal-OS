/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  CompanyAccount,
  EmployeeMembership,
  OrganizationalUnit,
  Site,
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

    async findMembershipForCustomer(
      customerId: string,
    ): Promise<EmployeeMembership | null> {
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
