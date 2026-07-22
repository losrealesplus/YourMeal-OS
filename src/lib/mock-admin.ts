/**
 * Mock data for the Admin Suite scaffold.
 *
 * NOT business data. NOT persisted. Do NOT use in Services.
 * Exists only so admin screens can render coherent placeholders while
 * CustomerService / MenuService / ProductionService / PromotionService /
 * AccountingService are wired in.
 *
 * Canonical units (per PLATFORM ARCHITECTURE RULES):
 *   grams · ml · km · Celsius · UTC ISO-8601 · minor units (cents) · ISO 4217
 */

export type AdminKpi = {
  key: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
};

// ─── Dashboard ────────────────────────────────────────────────────────
export const MOCK_ADMIN_KPIS: AdminKpi[] = [
  { key: "tomorrowOrders",   value: "142", delta: "+8",  trend: "up" },
  { key: "kitchenCapacity",  value: "74%", delta: "+5%", trend: "up" },
  { key: "inventoryAlerts",  value: "3",   delta: "−1",  trend: "down" },
  { key: "purchasingPending",value: "6",   delta: "+2",  trend: "up" },
];

export const MOCK_TIMELINE: Array<{ hour: string; label: string; qty: number }> = [
  { hour: "07:00", label: "Batch cook · Bowls",   qty: 62 },
  { hour: "09:00", label: "Batch cook · Proteins", qty: 48 },
  { hour: "11:00", label: "Assembly line",         qty: 110 },
  { hour: "13:00", label: "Packing & labels",      qty: 142 },
  { hour: "15:00", label: "Dispatch · Ruta Norte", qty: 71 },
  { hour: "16:00", label: "Dispatch · Ruta Sur",   qty: 71 },
];

// ─── Customers ────────────────────────────────────────────────────────
export type MockAdminCustomer = {
  id: string;
  name: string;
  email: string;
  plan: "flex" | "weekly" | "family";
  mealsThisWeek: number;
  lifetimeCents: number;
  currency: string;
  status: "active" | "paused" | "churned";
  joinedIso: string;
};

export const MOCK_ADMIN_CUSTOMERS: MockAdminCustomer[] = [
  { id: "c-01", name: "María González", email: "maria@example.com", plan: "weekly", mealsThisWeek: 10, lifetimeCents: 84500,  currency: "EUR", status: "active", joinedIso: "2025-01-14T00:00:00Z" },
  { id: "c-02", name: "Javier Pérez",   email: "javier@example.com", plan: "family", mealsThisWeek: 21, lifetimeCents: 213400, currency: "EUR", status: "active", joinedIso: "2024-09-02T00:00:00Z" },
  { id: "c-03", name: "Laura Suárez",   email: "laura@example.com",  plan: "flex",   mealsThisWeek: 4,  lifetimeCents: 12800,  currency: "EUR", status: "paused", joinedIso: "2025-04-21T00:00:00Z" },
  { id: "c-04", name: "Tomás Herrera",  email: "tomas@example.com",  plan: "weekly", mealsThisWeek: 7,  lifetimeCents: 47200,  currency: "EUR", status: "active", joinedIso: "2025-02-10T00:00:00Z" },
  { id: "c-05", name: "Sofía Ramos",    email: "sofia@example.com",  plan: "flex",   mealsThisWeek: 0,  lifetimeCents: 6400,   currency: "EUR", status: "churned",joinedIso: "2024-11-30T00:00:00Z" },
];

// ─── Weekly Menus ─────────────────────────────────────────────────────
export type MockAdminMenu = {
  id: string;
  weekIsoStart: string;      // UTC
  status: "draft" | "published" | "archived";
  dishesCount: number;
  ordersCount: number;
};

export const MOCK_ADMIN_MENUS: MockAdminMenu[] = [
  { id: "m-w30", weekIsoStart: "2026-07-20T00:00:00Z", status: "published", dishesCount: 12, ordersCount: 142 },
  { id: "m-w31", weekIsoStart: "2026-07-27T00:00:00Z", status: "draft",     dishesCount: 8,  ordersCount: 0 },
  { id: "m-w29", weekIsoStart: "2026-07-13T00:00:00Z", status: "archived",  dishesCount: 12, ordersCount: 138 },
];

export const MOCK_MENU_GRID: Array<{ day: string; slots: number; filled: number }> = [
  { day: "Mon", slots: 3, filled: 3 },
  { day: "Tue", slots: 3, filled: 3 },
  { day: "Wed", slots: 3, filled: 2 },
  { day: "Thu", slots: 3, filled: 3 },
  { day: "Fri", slots: 3, filled: 1 },
  { day: "Sat", slots: 2, filled: 0 },
  { day: "Sun", slots: 2, filled: 0 },
];

// ─── Production ───────────────────────────────────────────────────────
export type MockProductionTask = {
  id: string;
  dish: string;
  station: "cold" | "hot" | "assembly" | "packing";
  qty: number;
  progress: number; // 0..100
  eta: string;
};

export const MOCK_PRODUCTION_TASKS: MockProductionTask[] = [
  { id: "p-01", dish: "Bowl de quinoa & aguacate", station: "cold",     qty: 42,  progress: 100, eta: "07:40" },
  { id: "p-02", dish: "Pollo a la plancha",        station: "hot",      qty: 60,  progress: 68,  eta: "09:15" },
  { id: "p-03", dish: "Salmón al horno",           station: "hot",      qty: 34,  progress: 20,  eta: "10:00" },
  { id: "p-04", dish: "Wraps mediterráneos",       station: "assembly", qty: 28,  progress: 0,   eta: "11:30" },
  { id: "p-05", dish: "Cajas del día",             station: "packing",  qty: 142, progress: 0,   eta: "13:00" },
];

// ─── Promotions ───────────────────────────────────────────────────────
export type MockPromotion = {
  id: string;
  code: string;
  name: string;
  discountPct: number;
  redemptions: number;
  cap: number;
  status: "scheduled" | "active" | "ended";
  endsIso: string;
};

export const MOCK_PROMOTIONS: MockPromotion[] = [
  { id: "pr-01", code: "SUMMER10",  name: "Summer boost",      discountPct: 10, redemptions: 84,  cap: 200, status: "active",    endsIso: "2026-08-15T23:59:59Z" },
  { id: "pr-02", code: "WELCOME25", name: "Welcome pack",      discountPct: 25, redemptions: 312, cap: 500, status: "active",    endsIso: "2026-12-31T23:59:59Z" },
  { id: "pr-03", code: "FAMILY15",  name: "Family plan boost", discountPct: 15, redemptions: 0,   cap: 100, status: "scheduled", endsIso: "2026-09-30T23:59:59Z" },
  { id: "pr-04", code: "SPRING20",  name: "Spring launch",     discountPct: 20, redemptions: 428, cap: 500, status: "ended",     endsIso: "2026-05-31T23:59:59Z" },
];

// ─── Accounting ───────────────────────────────────────────────────────
export type MockInvoice = {
  id: string;
  number: string;
  customer: string;
  totalCents: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "refunded";
  issuedIso: string;
};

export const MOCK_INVOICES: MockInvoice[] = [
  { id: "i-1042", number: "2026-1042", customer: "María González", totalCents: 8450,  currency: "EUR", status: "paid",     issuedIso: "2026-07-19T09:00:00Z" },
  { id: "i-1043", number: "2026-1043", customer: "Javier Pérez",   totalCents: 21340, currency: "EUR", status: "paid",     issuedIso: "2026-07-19T09:05:00Z" },
  { id: "i-1044", number: "2026-1044", customer: "Laura Suárez",   totalCents: 3200,  currency: "EUR", status: "pending",  issuedIso: "2026-07-20T09:00:00Z" },
  { id: "i-1045", number: "2026-1045", customer: "Tomás Herrera",  totalCents: 4720,  currency: "EUR", status: "overdue",  issuedIso: "2026-07-05T09:00:00Z" },
  { id: "i-1046", number: "2026-1046", customer: "Sofía Ramos",    totalCents: 1600,  currency: "EUR", status: "refunded", issuedIso: "2026-06-28T09:00:00Z" },
];

export const MOCK_ACCOUNTING_KPIS: AdminKpi[] = [
  { key: "revenueMTD",     value: "€ 18.420", delta: "+12%", trend: "up" },
  { key: "outstanding",    value: "€ 1.240",  delta: "−8%",  trend: "down" },
  { key: "invoicesIssued", value: "142",      delta: "+6",   trend: "up" },
  { key: "refunds",        value: "€ 160",    delta: "flat", trend: "flat" },
];
