/**
 * Customer Directory — shared read model for Administración and Atención al Cliente.
 * Physical tables: customers, companies, company_employees, orders, support_notes.
 * @see docs/adr/0015-b2b-b2c-customer-model.md
 */

export type CustomerKind = "individual" | "company_employee";

export type CustomerActivityStatus = "active" | "inactive" | "new";

export type IndividualCustomerRecord = {
  id: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  kind: CustomerKind;
  status: CustomerActivityStatus;
  createdAt: string;
  lastOrderAt: string | null;
  orderCount: number;
  averageTicket: number;
  lifetimeTotal: number;
  companyId: string | null;
  companyName: string | null;
  companyCode: string | null;
  city: string | null;
};

export type UpdateIndividualCustomerInput = {
  displayName: string;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
};

export type CompanyDirectoryRecord = {
  id: string;
  name: string;
  companyCode: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  employeeCount: number;
  orderCount: number;
  lifetimeTotal: number;
  status: "active" | "inactive";
  createdAt: string;
};

export type SupportNoteStatus = "open" | "resolved" | "closed";

export type SupportNoteRecord = {
  id: string;
  customerId: string;
  customerName: string | null;
  kind: "note" | "incident" | "request" | "allergy_update" | "complaint";
  status: SupportNoteStatus;
  body: string;
  authorId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
};

/** Issue kinds that participate in Issues Resolved KPI / lifecycle. */
export const SUPPORT_ISSUE_KINDS: readonly SupportNoteRecord["kind"][] = ["incident", "complaint"];

const SUPPORT_STATUS_TRANSITIONS: Record<SupportNoteStatus, readonly SupportNoteStatus[]> = {
  open: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

export function nextSupportNoteStatuses(from: SupportNoteStatus): SupportNoteStatus[] {
  return [...(SUPPORT_STATUS_TRANSITIONS[from] ?? [])];
}

export function canTransitionSupportNote(from: SupportNoteStatus, to: SupportNoteStatus): boolean {
  return nextSupportNoteStatuses(from).includes(to);
}

export type CustomerOrderSummary = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  demandChannel: string | null;
  companyId: string | null;
};

export type IndividualCustomerFilters = {
  query?: string;
  kind?: CustomerKind | "all";
  status?: CustomerActivityStatus | "all";
  companyId?: string | null;
  minOrders?: number | null;
  maxOrders?: number | null;
  inactiveDays?: number | null;
};

export type CompanyDirectoryFilters = {
  query?: string;
  status?: "active" | "inactive" | "all";
};

export type CommercialDashboardMetrics = {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  companies: number;
  activeCompanies: number;
  linkedEmployees: number;
  weeklyOrders: number;
  monthlyOrders: number;
  averageTicket: number;
  recurringCustomers: number;
  inactiveCustomers: number;
  peakPurchaseDay: string | null;
  troughPurchaseDay: string | null;
  peakPurchaseHour: number | null;
  purchaseFrequencyDays: number | null;
  companiesWithoutOrders: number;
  topCompanies: Array<{
    id: string;
    name: string;
    orderCount: number;
    total: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    orderCount: number;
    total: number;
  }>;
  topMenus: Array<{ name: string; count: number }>;
};

export type SupportStats = {
  activeCustomers: number;
  inactiveCustomers: number;
  recurringCustomers: number;
  activeCompanies: number;
  companiesWithoutOrders: number;
  openIncidents: number;
  pendingOrders: number;
};

/** Days without order → inactive (operational heuristic for pilot). */
export const INACTIVE_AFTER_DAYS = 45;
export const ACTIVE_WITHIN_DAYS = 30;
export const NEW_WITHIN_DAYS = 30;
export const RECURRING_MIN_ORDERS = 2;

export function daysBetween(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso).getTime();
  return Math.floor((to.getTime() - from) / (1000 * 60 * 60 * 24));
}

export function deriveCustomerStatus(input: {
  createdAt: string;
  lastOrderAt: string | null;
  orderCount: number;
}): CustomerActivityStatus {
  const createdDays = daysBetween(input.createdAt);
  if (createdDays <= NEW_WITHIN_DAYS && input.orderCount === 0) return "new";
  if (!input.lastOrderAt) {
    return createdDays <= NEW_WITHIN_DAYS ? "new" : "inactive";
  }
  const sinceOrder = daysBetween(input.lastOrderAt);
  if (sinceOrder <= ACTIVE_WITHIN_DAYS) return "active";
  if (sinceOrder > INACTIVE_AFTER_DAYS) return "inactive";
  return "active";
}
