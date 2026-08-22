/**
 * Company Account domain (OM) — B2B structural model (ADR 0015).
 *
 * Party umbrella (ADR 0016 — semantic; physical convergence later):
 *   Party → Individual Customer | Company → Memberships
 *
 * DB tables keep foresight names; product language uses Site / Organizational Unit.
 */

export type CustomerType = "individual" | "company_employee";

export type DemandChannel = "individual" | "company";

export type CompanyAccount = {
  id: string;
  tenantId: string;
  name: string;
  companyCode: string;
  vatId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  commercialTerms: string | null;
  fiscalAddress: string | null;
  /** Tenant-configurable label for Organizational Units (Departamento, Área, …). */
  orgUnitLabel: string;
  internalLocationLabel: string;
  billingRule: string;
};

export type Site = {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  address: string | null;
  city: string | null;
  zip: string | null;
  isActive: boolean;
};

export type OrganizationalUnit = {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type EmployeeMembership = {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  siteId: string | null;
  organizationalUnitId: string | null;
  internalLocation: string | null;
  isAdmin: boolean;
  status: string;
};

export type DeliveryGroup = {
  id: string;
  tenantId: string;
  companyId: string;
  siteId: string;
  organizationalUnitId: string;
  name: string;
};

export type OrderDemandContext = {
  demandChannel: DemandChannel;
  companyId: string | null;
  siteId: string | null;
  organizationalUnitId: string | null;
  deliveryGroupId: string | null;
};

export type UpdateCompanyInput = {
  name?: string;
  vatId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  commercialTerms?: string | null;
  fiscalAddress?: string | null;
  orgUnitLabel?: string;
  internalLocationLabel?: string;
  billingRule?: string;
};

export type UpdateSiteInput = {
  name?: string;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  isActive?: boolean;
};

export type UpdateOrganizationalUnitInput = {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type CompanyEmployeeRecord = {
  membershipId: string;
  customerId: string;
  companyId: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  siteId: string | null;
  siteName: string | null;
  organizationalUnitId: string | null;
  organizationalUnitName: string | null;
  internalLocation: string | null;
  isAdmin: boolean;
  status: string;
  createdAt: string;
};

export function isValidCompanyCodeFormat(code: string): boolean {
  return /^[A-Z0-9][A-Z0-9-]{2,31}$/i.test(code.trim());
}
