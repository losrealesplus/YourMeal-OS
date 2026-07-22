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

// ─── PM-003 Production module ─────────────────────────────────────────
// Sub-areas: Planning · Batch · Packaging · Labels · Kitchen
// Scaffold-only data. Business rules will live in ProductionService.

export type MockPlanningRun = {
  id: string;
  serviceDateIso: string;   // UTC — day the meals are delivered
  dish: string;
  ordered: number;
  planned: number;
  station: "cold" | "hot" | "assembly" | "packing";
  status: "draft" | "scheduled" | "released";
};

export const MOCK_PLANNING_RUNS: MockPlanningRun[] = [
  { id: "pl-01", serviceDateIso: "2026-07-23T00:00:00Z", dish: "Bowl de quinoa & aguacate", ordered: 42, planned: 45, station: "cold",     status: "released"  },
  { id: "pl-02", serviceDateIso: "2026-07-23T00:00:00Z", dish: "Pollo a la plancha",        ordered: 60, planned: 62, station: "hot",      status: "released"  },
  { id: "pl-03", serviceDateIso: "2026-07-23T00:00:00Z", dish: "Salmón al horno",           ordered: 34, planned: 36, station: "hot",      status: "scheduled" },
  { id: "pl-04", serviceDateIso: "2026-07-23T00:00:00Z", dish: "Wraps mediterráneos",       ordered: 28, planned: 30, station: "assembly", status: "scheduled" },
  { id: "pl-05", serviceDateIso: "2026-07-24T00:00:00Z", dish: "Curry de garbanzos",        ordered: 22, planned: 24, station: "hot",      status: "draft"     },
  { id: "pl-06", serviceDateIso: "2026-07-24T00:00:00Z", dish: "Ensalada césar de kale",    ordered: 18, planned: 20, station: "cold",     status: "draft"     },
];

export type MockBatch = {
  id: string;
  code: string;             // human-readable batch code
  dish: string;
  station: "cold" | "hot" | "assembly" | "packing";
  qty: number;
  startedIso: string;
  targetIso: string;
  progress: number;
  operator: string;
};

export const MOCK_BATCHES: MockBatch[] = [
  { id: "b-01", code: "B-260723-01", dish: "Bowl de quinoa & aguacate", station: "cold",     qty: 45,  startedIso: "2026-07-23T06:00:00Z", targetIso: "2026-07-23T07:40:00Z", progress: 100, operator: "Ana"   },
  { id: "b-02", code: "B-260723-02", dish: "Pollo a la plancha",        station: "hot",      qty: 62,  startedIso: "2026-07-23T07:00:00Z", targetIso: "2026-07-23T09:15:00Z", progress: 68,  operator: "Marco" },
  { id: "b-03", code: "B-260723-03", dish: "Salmón al horno",           station: "hot",      qty: 36,  startedIso: "2026-07-23T08:15:00Z", targetIso: "2026-07-23T10:00:00Z", progress: 20,  operator: "Iván"  },
  { id: "b-04", code: "B-260723-04", dish: "Wraps mediterráneos",       station: "assembly", qty: 30,  startedIso: "2026-07-23T10:00:00Z", targetIso: "2026-07-23T11:30:00Z", progress: 0,   operator: "—"     },
];

export type MockPackagingLine = {
  id: string;
  channel: "delivery" | "pickup" | "corporate";
  boxesTotal: number;
  boxesDone: number;
  eta: string;              // HH:MM local shift
  status: "queued" | "running" | "done";
};

export const MOCK_PACKAGING_LINES: MockPackagingLine[] = [
  { id: "pk-01", channel: "delivery",  boxesTotal: 96, boxesDone: 42, eta: "12:30", status: "running" },
  { id: "pk-02", channel: "pickup",    boxesTotal: 24, boxesDone: 24, eta: "12:00", status: "done"    },
  { id: "pk-03", channel: "corporate", boxesTotal: 22, boxesDone: 0,  eta: "13:15", status: "queued"  },
];

export type MockLabelJob = {
  id: string;
  dish: string;
  qty: number;
  format: "meal" | "batch" | "logistic";
  printer: string;
  status: "ready" | "printing" | "done";
};

export const MOCK_LABEL_JOBS: MockLabelJob[] = [
  { id: "lb-01", dish: "Bowl de quinoa & aguacate", qty: 45,  format: "meal",      printer: "Zebra · Assembly", status: "done"     },
  { id: "lb-02", dish: "Pollo a la plancha",        qty: 62,  format: "meal",      printer: "Zebra · Assembly", status: "printing" },
  { id: "lb-03", dish: "Cajas Ruta Norte",          qty: 71,  format: "logistic",  printer: "Zebra · Dispatch", status: "ready"    },
  { id: "lb-04", dish: "Cajas Ruta Sur",            qty: 71,  format: "logistic",  printer: "Zebra · Dispatch", status: "ready"    },
];

export type MockKitchenStation = {
  id: "cold" | "hot" | "assembly" | "packing";
  head: string;
  load: number;            // 0..100
  activeBatches: number;
  nextBatchAt: string;     // HH:MM
};

export const MOCK_KITCHEN_STATIONS: MockKitchenStation[] = [
  { id: "cold",     head: "Ana",    load: 62, activeBatches: 2, nextBatchAt: "09:30" },
  { id: "hot",      head: "Marco",  load: 84, activeBatches: 3, nextBatchAt: "09:15" },
  { id: "assembly", head: "Lucía",  load: 38, activeBatches: 1, nextBatchAt: "11:00" },
  { id: "packing",  head: "Diego",  load: 12, activeBatches: 0, nextBatchAt: "12:30" },
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

// ─── PM-004 Delivery module ───────────────────────────────────────────
// Sub-areas: Route · Stops · Deliveries · Attempt · Incidents
// Scaffold-only data. Business rules will live in RouteService / DeliveryService.

export type MockDeliveryRoute = {
  id: string;
  code: string;
  name: string;
  driver: string;
  vehicle: string;
  stops: number;
  distanceKm: number;           // canonical km
  startIso: string;             // UTC
  etaIso: string;               // UTC
  progress: number;             // 0..100
  status: "planned" | "in_progress" | "completed";
};

export const MOCK_DELIVERY_ROUTES: MockDeliveryRoute[] = [
  { id: "r-01", code: "RT-230723-N", name: "Ruta Norte",         driver: "Carlos M.", vehicle: "Van · 1234-ABC",  stops: 18, distanceKm: 62.4, startIso: "2026-07-23T13:30:00Z", etaIso: "2026-07-23T17:10:00Z", progress: 55,  status: "in_progress" },
  { id: "r-02", code: "RT-230723-S", name: "Ruta Sur",           driver: "Elena R.",  vehicle: "Van · 5678-DEF",  stops: 21, distanceKm: 74.1, startIso: "2026-07-23T13:45:00Z", etaIso: "2026-07-23T17:40:00Z", progress: 32,  status: "in_progress" },
  { id: "r-03", code: "RT-230723-C", name: "Ruta Centro",        driver: "Iván P.",   vehicle: "Moto · 9012-GHI", stops: 12, distanceKm: 18.7, startIso: "2026-07-23T14:00:00Z", etaIso: "2026-07-23T16:00:00Z", progress: 0,   status: "planned"     },
  { id: "r-04", code: "RT-220723-N", name: "Ruta Norte (ayer)",  driver: "Carlos M.", vehicle: "Van · 1234-ABC",  stops: 20, distanceKm: 68.2, startIso: "2026-07-22T13:30:00Z", etaIso: "2026-07-22T17:15:00Z", progress: 100, status: "completed"   },
];

export type MockRouteStop = {
  id: string;
  routeCode: string;
  sequence: number;
  customer: string;
  addressShort: string;
  windowStart: string;          // HH:MM local
  windowEnd: string;            // HH:MM local
  boxes: number;
  status: "pending" | "arrived" | "delivered" | "failed";
};

export const MOCK_ROUTE_STOPS: MockRouteStop[] = [
  { id: "s-01", routeCode: "RT-230723-N", sequence: 1, customer: "María González", addressShort: "La Laguna · C/ Herradores 12", windowStart: "14:00", windowEnd: "14:30", boxes: 2, status: "delivered" },
  { id: "s-02", routeCode: "RT-230723-N", sequence: 2, customer: "Javier Pérez",   addressShort: "La Laguna · Av. Trinidad 44",  windowStart: "14:15", windowEnd: "14:45", boxes: 3, status: "delivered" },
  { id: "s-03", routeCode: "RT-230723-N", sequence: 3, customer: "Ana Martín",     addressShort: "Tacoronte · C/ Real 88",       windowStart: "14:40", windowEnd: "15:10", boxes: 1, status: "arrived"   },
  { id: "s-04", routeCode: "RT-230723-N", sequence: 4, customer: "Diego Torres",   addressShort: "Tacoronte · Mesa del Mar",     windowStart: "15:00", windowEnd: "15:30", boxes: 2, status: "pending"   },
  { id: "s-05", routeCode: "RT-230723-N", sequence: 5, customer: "Sofía Ramos",    addressShort: "El Sauzal · C/ Constitución 3",windowStart: "15:20", windowEnd: "15:50", boxes: 1, status: "pending"   },
  { id: "s-06", routeCode: "RT-230723-S", sequence: 1, customer: "Laura Suárez",   addressShort: "Adeje · C/ Grande 21",         windowStart: "14:15", windowEnd: "14:45", boxes: 2, status: "delivered" },
  { id: "s-07", routeCode: "RT-230723-S", sequence: 2, customer: "Tomás Herrera",  addressShort: "Adeje · Av. Los Pueblos 7",    windowStart: "14:30", windowEnd: "15:00", boxes: 4, status: "failed"    },
  { id: "s-08", routeCode: "RT-230723-S", sequence: 3, customer: "Lucía Fdez.",    addressShort: "Arona · C/ Amalia Alayón 15",  windowStart: "15:00", windowEnd: "15:30", boxes: 1, status: "pending"   },
];

export type MockDelivery = {
  id: string;
  orderCode: string;
  customer: string;
  routeCode: string;
  boxes: number;
  status: "scheduled" | "out_for_delivery" | "delivered" | "failed";
  slot: string;                 // HH:MM local
  deliveredIso?: string;        // UTC when delivered
};

export const MOCK_DELIVERIES: MockDelivery[] = [
  { id: "d-01", orderCode: "ORD-2043", customer: "María González", routeCode: "RT-230723-N", boxes: 2, status: "delivered",        slot: "14:00-14:30", deliveredIso: "2026-07-23T14:12:00Z" },
  { id: "d-02", orderCode: "ORD-2044", customer: "Javier Pérez",   routeCode: "RT-230723-N", boxes: 3, status: "delivered",        slot: "14:15-14:45", deliveredIso: "2026-07-23T14:28:00Z" },
  { id: "d-03", orderCode: "ORD-2045", customer: "Ana Martín",     routeCode: "RT-230723-N", boxes: 1, status: "out_for_delivery", slot: "14:40-15:10" },
  { id: "d-04", orderCode: "ORD-2046", customer: "Diego Torres",   routeCode: "RT-230723-N", boxes: 2, status: "scheduled",        slot: "15:00-15:30" },
  { id: "d-05", orderCode: "ORD-2047", customer: "Laura Suárez",   routeCode: "RT-230723-S", boxes: 2, status: "delivered",        slot: "14:15-14:45", deliveredIso: "2026-07-23T14:22:00Z" },
  { id: "d-06", orderCode: "ORD-2048", customer: "Tomás Herrera",  routeCode: "RT-230723-S", boxes: 4, status: "failed",           slot: "14:30-15:00" },
  { id: "d-07", orderCode: "ORD-2049", customer: "Lucía Fdez.",    routeCode: "RT-230723-S", boxes: 1, status: "scheduled",        slot: "15:00-15:30" },
];

export type MockAttemptOutcome = "delivered" | "left_at_door" | "no_answer" | "wrong_address" | "refused" | "damaged";

export type MockDeliveryAttempt = {
  id: string;
  stopCode: string;
  customer: string;
  attempt: number;
  outcome: MockAttemptOutcome;
  photo: boolean;
  signature: boolean;
  timestampIso: string;
  note?: string;
};

export const MOCK_DELIVERY_ATTEMPTS: MockDeliveryAttempt[] = [
  { id: "a-01", stopCode: "RT-230723-N · 01", customer: "María González", attempt: 1, outcome: "delivered",     photo: true,  signature: true,  timestampIso: "2026-07-23T14:12:00Z" },
  { id: "a-02", stopCode: "RT-230723-N · 02", customer: "Javier Pérez",   attempt: 1, outcome: "left_at_door",  photo: true,  signature: false, timestampIso: "2026-07-23T14:28:00Z", note: "Autorizado por el cliente" },
  { id: "a-03", stopCode: "RT-230723-N · 03", customer: "Ana Martín",     attempt: 1, outcome: "no_answer",     photo: false, signature: false, timestampIso: "2026-07-23T14:44:00Z", note: "Reintento a las 16:00" },
  { id: "a-04", stopCode: "RT-230723-S · 02", customer: "Tomás Herrera",  attempt: 2, outcome: "wrong_address", photo: true,  signature: false, timestampIso: "2026-07-23T14:36:00Z", note: "Portal incorrecto" },
];

export type MockDeliveryIncident = {
  id: string;
  code: string;
  routeCode: string;
  customer: string;
  category: "traffic" | "vehicle" | "customer" | "product" | "weather";
  severity: "low" | "medium" | "high";
  status: "open" | "in_review" | "resolved";
  openedIso: string;
  summary: string;
};

export const MOCK_DELIVERY_INCIDENTS: MockDeliveryIncident[] = [
  { id: "in-01", code: "INC-8801", routeCode: "RT-230723-S", customer: "Tomás Herrera", category: "customer", severity: "medium", status: "open",      openedIso: "2026-07-23T14:36:00Z", summary: "Dirección incorrecta en la ficha del cliente." },
  { id: "in-02", code: "INC-8802", routeCode: "RT-230723-N", customer: "Ana Martín",    category: "customer", severity: "low",    status: "in_review", openedIso: "2026-07-23T14:44:00Z", summary: "Cliente ausente en primera visita." },
  { id: "in-03", code: "INC-8798", routeCode: "RT-220723-N", customer: "—",             category: "traffic",  severity: "high",   status: "resolved", openedIso: "2026-07-22T14:10:00Z", summary: "Corte de tráfico en TF-5, ruta desviada." },
  { id: "in-04", code: "INC-8799", routeCode: "RT-220723-S", customer: "Sara López",    category: "product",  severity: "medium", status: "resolved", openedIso: "2026-07-22T15:02:00Z", summary: "Caja dañada en tránsito, reposición programada." },
];
