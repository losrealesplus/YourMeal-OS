import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError, permissionDenied } from "@/domain/errors";
import { createCustomerDirectoryRepository } from "../infrastructure/customer-directory-repository";
import type {
  CommercialDashboardMetrics,
  CompanyDirectoryFilters,
  CompanyDirectoryRecord,
  CustomerOrderSummary,
  IndividualCustomerFilters,
  IndividualCustomerRecord,
  SupportNoteRecord,
  SupportStats,
} from "../domain/customer-directory";

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function assertCanReadCustomers(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("customers.read") && !ctx.capabilities.has("support.read")) {
    throw permissionDenied("customers.read");
  }
}

function assertCanWriteCustomers(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("customers.write")) {
    throw permissionDenied("customers.write");
  }
}

function assertCanWriteSupport(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("support.write")) {
    throw permissionDenied("support.write");
  }
}

function matchesIndividual(
  row: IndividualCustomerRecord,
  filters: IndividualCustomerFilters,
): boolean {
  if (filters.kind && filters.kind !== "all" && row.kind !== filters.kind) {
    return false;
  }
  if (filters.status && filters.status !== "all" && row.status !== filters.status) {
    return false;
  }
  if (filters.companyId && row.companyId !== filters.companyId) {
    return false;
  }
  if (filters.minOrders != null && row.orderCount < filters.minOrders) {
    return false;
  }
  if (filters.maxOrders != null && row.orderCount > filters.maxOrders) {
    return false;
  }
  if (filters.inactiveDays != null && row.lastOrderAt) {
    const days =
      (Date.now() - new Date(row.lastOrderAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (days < filters.inactiveDays) return false;
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    const hay = [
      row.displayName,
      row.email,
      row.phone,
      row.companyName,
      row.companyCode,
      row.city,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function matchesCompany(
  row: CompanyDirectoryRecord,
  filters: CompanyDirectoryFilters,
): boolean {
  if (filters.status && filters.status !== "all" && row.status !== filters.status) {
    return false;
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    const hay = [
      row.name,
      row.companyCode,
      row.contactName,
      row.contactEmail,
      row.contactPhone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/**
 * Shared Customer Directory — Administración and Atención al Cliente
 * MUST use this service (single repository, no duplicated customer stores).
 */
export const CustomerDirectoryService = {
  async listIndividuals(
    ctx: ServiceContext,
    filters: IndividualCustomerFilters = {},
  ): Promise<IndividualCustomerRecord[]> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);
    const repo = createCustomerDirectoryRepository(ctx.supabase, ctx.tenantId);
    const rows = await repo.listIndividuals();
    return rows.filter((r) => matchesIndividual(r, filters));
  },

  async listCompanies(
    ctx: ServiceContext,
    filters: CompanyDirectoryFilters = {},
  ): Promise<CompanyDirectoryRecord[]> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);
    const repo = createCustomerDirectoryRepository(ctx.supabase, ctx.tenantId);
    const rows = await repo.listCompanies();
    return rows.filter((r) => matchesCompany(r, filters));
  },

  async getCustomerOrders(
    ctx: ServiceContext,
    customerId: string,
  ): Promise<CustomerOrderSummary[]> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);
    const repo = createCustomerDirectoryRepository(ctx.supabase, ctx.tenantId);
    return repo.getCustomerOrders(customerId);
  },

  async listSupportNotes(
    ctx: ServiceContext,
    customerId?: string,
  ): Promise<SupportNoteRecord[]> {
    assertTenant(ctx);
    if (!ctx.capabilities.has("support.read") && !ctx.capabilities.has("customers.read")) {
      throw permissionDenied("support.read");
    }
    const repo = createCustomerDirectoryRepository(ctx.supabase, ctx.tenantId);
    return repo.listSupportNotes(customerId);
  },

  async addSupportNote(
    ctx: ServiceContext,
    input: {
      customerId: string;
      kind: SupportNoteRecord["kind"];
      body: string;
    },
  ): Promise<SupportNoteRecord> {
    assertTenant(ctx);
    assertCanWriteSupport(ctx);
    if (!input.body.trim()) {
      throw new DomainError("INVALID_STATE", "Note body is required");
    }
    const repo = createCustomerDirectoryRepository(ctx.supabase, ctx.tenantId);
    const note = await repo.insertSupportNote({
      customerId: input.customerId,
      kind: input.kind,
      body: input.body.trim(),
      authorId: ctx.userId,
    });
    await AuditService.write(ctx, {
      entityType: "support_note",
      entityId: note.id,
      action: "create",
      newData: {
        customerId: note.customerId,
        kind: note.kind,
      },
    });
    return note;
  },

  async archiveCustomer(
    ctx: ServiceContext,
    customerId: string,
  ): Promise<void> {
    assertTenant(ctx);
    assertCanWriteCustomers(ctx);
    const repo = createCustomerDirectoryRepository(ctx.supabase, ctx.tenantId);
    await repo.softDeleteCustomer(customerId);
    await AuditService.write(ctx, {
      entityType: "customer",
      entityId: customerId,
      action: "archive",
    });
  },

  async commercialDashboard(
    ctx: ServiceContext,
  ): Promise<CommercialDashboardMetrics> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);
    const repo = createCustomerDirectoryRepository(ctx.supabase, ctx.tenantId);
    return repo.commercialMetrics();
  },

  async supportStats(ctx: ServiceContext): Promise<SupportStats> {
    assertTenant(ctx);
    if (!ctx.capabilities.has("support.read") && !ctx.capabilities.has("customers.read")) {
      throw permissionDenied("support.read");
    }
    const repo = createCustomerDirectoryRepository(ctx.supabase, ctx.tenantId);
    return repo.supportStats();
  },

  /** CSV export of particulares — real directory data only. */
  toIndividualsCsv(rows: IndividualCustomerRecord[]): string {
    const header = [
      "id",
      "nombre",
      "estado",
      "email",
      "telefono",
      "tipo",
      "empresa",
      "ultimo_pedido",
      "pedidos",
      "ticket_medio",
      "total",
      "ciudad",
      "alta",
    ].join(",");
    const lines = rows.map((r) =>
      [
        r.id,
        csv(r.displayName),
        r.status,
        csv(r.email),
        csv(r.phone),
        r.kind,
        csv(r.companyName),
        r.lastOrderAt ?? "",
        r.orderCount,
        r.averageTicket.toFixed(2),
        r.lifetimeTotal.toFixed(2),
        csv(r.city),
        r.createdAt,
      ].join(","),
    );
    return [header, ...lines].join("\n");
  },

  toCompaniesCsv(rows: CompanyDirectoryRecord[]): string {
    const header = [
      "id",
      "nombre",
      "codigo",
      "responsable",
      "email",
      "empleados",
      "pedidos",
      "estado",
      "alta",
    ].join(",");
    const lines = rows.map((r) =>
      [
        r.id,
        csv(r.name),
        r.companyCode,
        csv(r.contactName),
        csv(r.contactEmail),
        r.employeeCount,
        r.orderCount,
        r.status,
        r.createdAt,
      ].join(","),
    );
    return [header, ...lines].join("\n");
  },
};

function csv(value: string | null | undefined): string {
  if (value == null) return "";
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}
