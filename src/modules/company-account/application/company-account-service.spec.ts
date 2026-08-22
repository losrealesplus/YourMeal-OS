import { describe, expect, it, vi, beforeEach } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { CompanyAccountService } from "./company-account-service";
import { AuditService } from "@/services/audit-service";
import type {
  CompanyAccount,
  CompanyEmployeeRecord,
  OrganizationalUnit,
  Site,
  UpdateCompanyInput,
  UpdateOrganizationalUnitInput,
  UpdateSiteInput,
} from "../domain/company-account";
import type { createCompanyAccountRepository } from "../infrastructure/company-account-repository";

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

const mockCompany: CompanyAccount = {
  id: "comp-1",
  tenantId: "tenant-eatclean",
  name: "Acme Corp",
  companyCode: "EC-ACME-01",
  vatId: "B12345678",
  contactName: "John Doe",
  contactEmail: "john@acme.com",
  contactPhone: "+34600000000",
  commercialTerms: "Net 30",
  fiscalAddress: "Calle Mayor 1",
  orgUnitLabel: "Departamento",
  internalLocationLabel: "Ubicación",
  billingRule: "grouped",
};

const mockSite: Site = {
  id: "site-1",
  tenantId: "tenant-eatclean",
  companyId: "comp-1",
  name: "Sede Principal",
  address: "Calle Mayor 1",
  city: "Madrid",
  zip: "28001",
  isActive: true,
};

const mockUnit: OrganizationalUnit = {
  id: "unit-1",
  tenantId: "tenant-eatclean",
  siteId: "site-1",
  name: "Dirección",
  sortOrder: 0,
  isActive: true,
};

const mockEmployee: CompanyEmployeeRecord = {
  membershipId: "mem-1",
  customerId: "cust-1",
  companyId: "comp-1",
  displayName: "Alice Smith",
  email: "alice@acme.com",
  phone: null,
  siteId: "site-1",
  siteName: "Sede Principal",
  organizationalUnitId: "unit-1",
  organizationalUnitName: "Dirección",
  internalLocation: "Planta 2",
  isAdmin: false,
  status: "active",
  createdAt: "2026-08-22T10:00:00Z",
};

type MockRepo = ReturnType<typeof createCompanyAccountRepository>;
let repoMock: MockRepo;

vi.mock("../infrastructure/company-account-repository", () => ({
  createCompanyAccountRepository: () => repoMock,
}));

function staffCtx(overrides?: Partial<ServiceContext>): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "staff-1",
    tenantId: "tenant-eatclean",
    roles: ["saas_admin"],
    capabilities: new Set(["company.manage"]),
    localization: null,
    ip: null,
    ...overrides,
  };
}

function unauthorizedCtx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "unauth-user",
    tenantId: "tenant-eatclean",
    roles: ["customer"],
    capabilities: new Set([]),
    localization: null,
    ip: null,
  };
}

describe("CompanyAccountService (A2-B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMock = {
      ensureIndividualCustomer: vi.fn(async () => "cust-1"),
      generateCompanyCode: vi.fn(async () => "EC-ACME-01"),
      insertCompany: vi.fn(async (input: { name: string; companyCode: string }) => ({
        ...mockCompany,
        ...input,
      })),
      insertSite: vi.fn(async (input: { name: string }) => ({
        ...mockSite,
        ...input,
      })),
      insertOrganizationalUnit: vi.fn(async (input: { name: string }) => ({
        ...mockUnit,
        ...input,
      })),
      listCompanies: vi.fn(async () => [mockCompany]),
      findCompanyById: vi.fn(async (id: string) => (id === "comp-1" ? mockCompany : null)),
      findCompanyByCode: vi.fn(async (code: string) =>
        code === "EC-ACME-01" ? mockCompany : null,
      ),
      updateCompany: vi.fn(async (_id: string, input: UpdateCompanyInput) => ({
        ...mockCompany,
        ...input,
      })),
      listSites: vi.fn(async () => [mockSite]),
      findSiteById: vi.fn(async (id: string) =>
        id === "site-1"
          ? mockSite
          : id === "site-comp-2"
            ? { ...mockSite, id: "site-comp-2", companyId: "comp-2" }
            : null,
      ),
      updateSite: vi.fn(async (companyId: string, siteId: string, input: UpdateSiteInput) => {
        if (siteId === "site-1" && companyId === "comp-1") {
          return { ...mockSite, ...input };
        }
        throw new DomainError("NOT_FOUND", "Site not found for this company");
      }),
      listOrganizationalUnits: vi.fn(async () => [mockUnit]),
      findOrganizationalUnitById: vi.fn(async (id: string) =>
        id === "unit-1"
          ? mockUnit
          : id === "unit-comp-2"
            ? { ...mockUnit, id: "unit-comp-2", siteId: "site-comp-2" }
            : null,
      ),
      updateOrganizationalUnit: vi.fn(
        async (_id: string, input: UpdateOrganizationalUnitInput) => ({
          ...mockUnit,
          ...input,
        }),
      ),
      listCompanyEmployees: vi.fn(async () => [mockEmployee]),
      findMembershipForCustomer: vi.fn(async () => null),
      insertMembership: vi.fn(),
      resolveDeliveryGroup: vi.fn(async () => "dg-1"),
    };
  });

  describe("provisionCompany", () => {
    it("provisions company, initial site, unit, and writes audit", async () => {
      const result = await CompanyAccountService.provisionCompany(staffCtx(), {
        name: "Acme Corp",
        contactName: "John Doe",
        contactEmail: "john@acme.com",
        fiscalAddress: "Calle Mayor 1",
      });

      expect(result.company.companyCode).toBe("EC-ACME-01");
      expect(result.site.name).toBe("Sede principal");
      expect(result.unit.name).toBe("General");
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "company",
          entityId: "comp-1",
          action: "create",
        }),
      );
    });

    it("rejects unauthorized caller", async () => {
      await expect(
        CompanyAccountService.provisionCompany(unauthorizedCtx(), {
          name: "Acme Corp",
          contactName: "John Doe",
          contactEmail: "john@acme.com",
          fiscalAddress: "Calle Mayor 1",
        }),
      ).rejects.toBeInstanceOf(DomainError);
    });

    it("rejects missing mandatory fields", async () => {
      await expect(
        CompanyAccountService.provisionCompany(staffCtx(), {
          name: "",
          contactName: "John Doe",
          contactEmail: "john@acme.com",
          fiscalAddress: "Calle Mayor 1",
        }),
      ).rejects.toBeInstanceOf(DomainError);
    });
  });

  describe("getCompany and updateCompany", () => {
    it("retrieves company by id", async () => {
      const company = await CompanyAccountService.getCompany(staffCtx(), "comp-1");
      expect(company.id).toBe("comp-1");
      expect(company.name).toBe("Acme Corp");
    });

    it("throws NOT_FOUND when company does not exist", async () => {
      await expect(
        CompanyAccountService.getCompany(staffCtx(), "non-existent"),
      ).rejects.toBeInstanceOf(DomainError);
    });

    it("updates company fields and records audit with oldData and newData", async () => {
      const updated = await CompanyAccountService.updateCompany(staffCtx(), "comp-1", {
        name: "Acme Corp Updated",
        contactEmail: "billing@acme.com",
      });

      expect(updated.name).toBe("Acme Corp Updated");
      expect(repoMock.updateCompany).toHaveBeenCalledWith("comp-1", {
        name: "Acme Corp Updated",
        contactEmail: "billing@acme.com",
      });
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "company",
          entityId: "comp-1",
          action: "update",
          oldData: mockCompany,
          newData: expect.objectContaining({ name: "Acme Corp Updated" }),
        }),
      );
    });

    it("rejects invalid contact email", async () => {
      await expect(
        CompanyAccountService.updateCompany(staffCtx(), "comp-1", {
          contactEmail: "invalid-email",
        }),
      ).rejects.toBeInstanceOf(DomainError);
    });

    it("rejects empty name in update", async () => {
      await expect(
        CompanyAccountService.updateCompany(staffCtx(), "comp-1", {
          name: "  ",
        }),
      ).rejects.toBeInstanceOf(DomainError);
    });
  });

  describe("Sites management", () => {
    it("creates a new site and records audit", async () => {
      const site = await CompanyAccountService.createSite(staffCtx(), {
        companyId: "comp-1",
        name: "Sede Barcelona",
        address: "Diagonal 100",
      });

      expect(site.id).toBe("site-1");
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "company_location",
          action: "create",
        }),
      );
    });

    it("updates an existing site and records audit", async () => {
      const site = await CompanyAccountService.updateSite(staffCtx(), {
        companyId: "comp-1",
        siteId: "site-1",
        patch: { name: "Sede Madrid Central" },
      });

      expect(site.name).toBe("Sede Madrid Central");
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "company_location",
          action: "update",
        }),
      );
    });

    it("rejects updating a site belonging to another company (cross-company isolation)", async () => {
      await expect(
        CompanyAccountService.updateSite(staffCtx(), {
          companyId: "comp-1",
          siteId: "site-comp-2",
          patch: { name: "Hijacked Site" },
        }),
      ).rejects.toBeInstanceOf(DomainError);
    });
  });

  describe("Organizational Units management", () => {
    it("creates a unit and records audit", async () => {
      const unit = await CompanyAccountService.createOrganizationalUnit(staffCtx(), {
        companyId: "comp-1",
        siteId: "site-1",
        name: "Finanzas",
      });

      expect(unit.id).toBe("unit-1");
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "company_department",
          action: "create",
        }),
      );
    });

    it("rejects creating a unit in a site belonging to another company", async () => {
      await expect(
        CompanyAccountService.createOrganizationalUnit(staffCtx(), {
          companyId: "comp-1",
          siteId: "site-comp-2",
          name: "Illegal Unit",
        }),
      ).rejects.toBeInstanceOf(DomainError);
    });

    it("updates a unit and records audit", async () => {
      const unit = await CompanyAccountService.updateOrganizationalUnit(staffCtx(), {
        companyId: "comp-1",
        unitId: "unit-1",
        patch: { name: "Recursos Humanos" },
      });

      expect(unit.name).toBe("Recursos Humanos");
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "company_department",
          action: "update",
        }),
      );
    });

    it("rejects updating a unit belonging to another company (cross-company isolation)", async () => {
      await expect(
        CompanyAccountService.updateOrganizationalUnit(staffCtx(), {
          companyId: "comp-1",
          unitId: "unit-comp-2",
          patch: { name: "Hijacked Unit" },
        }),
      ).rejects.toBeInstanceOf(DomainError);
    });
  });

  describe("Company Employees roster", () => {
    it("lists linked employees for a company", async () => {
      const employees = await CompanyAccountService.listCompanyEmployees(staffCtx(), "comp-1");
      expect(employees).toHaveLength(1);
      expect(employees[0].displayName).toBe("Alice Smith");
      expect(employees[0].siteName).toBe("Sede Principal");
      expect(employees[0].organizationalUnitName).toBe("Dirección");
    });
  });
});
