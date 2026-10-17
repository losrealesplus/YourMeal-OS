/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import {
  Route,
  getTimeOfDayGreeting,
  resolveCustomerHomeState,
  getAdaptiveCTA,
} from "./app.index";

// Mock router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => ({
    options: config,
    useSearch: () => ({ state: undefined }),
  }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, className }: any) => (
    <a href={typeof to === "string" ? to : "/"} className={className}>
      {children}
    </a>
  ),
}));

// Mock hooks
let mockAuthUser: any = {
  id: "user-cust-1",
  email: "alex@eatclean.test",
  user_metadata: { full_name: "Alejandro Real" },
};
let mockIsStaff = false;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isStaff: mockIsStaff,
    tenantId: "tenant-eatclean-1",
  }),
}));
let mockUpcomingDelivery: any = { kind: "none" };
let mockUpcomingLoading = false;
let mockUpcomingError: any = null;

vi.mock("@/hooks/use-upcoming-delivery", () => ({
  useUpcomingDelivery: () => ({
    data: mockUpcomingDelivery,
    isLoading: mockUpcomingLoading,
    error: mockUpcomingError,
    refetch: vi.fn(),
  }),
}));

let mockCustomerOrders: any = [];
let mockOrdersLoading = false;
let mockOrdersError: any = null;

vi.mock("@/hooks/use-customer-orders", () => ({
  useCustomerOrders: () => ({
    data: mockCustomerOrders,
    isLoading: mockOrdersLoading,
    error: mockOrdersError,
    refetch: vi.fn(),
  }),
}));

let mockProfileData: any = {
  customerId: "cust-1",
  tenantId: "tenant-eatclean-1",
  displayName: "Alejandro",
  addresses: [
    {
      id: "addr-1",
      label: "Casa",
      street: "Paseo de la Castellana 42",
      city: "Madrid",
      archived: false,
    },
  ],
};
let mockProfileSuccess = true;
let mockProfileLoading = false;
let mockProfileError: any = null;

vi.mock("@/hooks/use-customer-self-profile", () => ({
  useCustomerSelfProfile: () => ({
    profile: {
      data: mockProfileData,
      isSuccess: mockProfileSuccess,
      isLoading: mockProfileLoading,
      error: mockProfileError,
    },
  }),
}));

vi.mock("@/hooks/use-weekly-menu", () => ({
  useWeeklyMenu: () => ({
    data: null,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-tenant-brand", () => ({
  useTenantBrand: () => ({
    logoUrl: null,
    colors: {},
    typography: {},
    isLoading: false,
  }),
}));

vi.mock("@/i18n/localization-provider", () => ({
  useFmt: () => ({
    date: (iso: string) => `Fecha: ${iso}`,
    dateTime: (iso: string) => iso,
    currency: (amt: number) => `${amt} €`,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, optionsOrFallback?: any) => {
      if (typeof optionsOrFallback === "string") return optionsOrFallback;
      if (optionsOrFallback && typeof optionsOrFallback === "object" && "count" in optionsOrFallback) {
        return `${optionsOrFallback.count} platos`;
      }
      return key;
    },
  }),
}));

describe("Customer Home (CX-01A) Logic & State Engine", () => {
  it("computes accurate daytime greetings across morning, afternoon, and night", () => {
    // 08:30 Morning
    const morning = new Date("2026-10-17T08:30:00Z");
    morning.setHours(8);
    expect(getTimeOfDayGreeting(morning)).toEqual({
      greeting: "¡Buenos días",
      emoji: "☀️",
    });

    // 15:45 Afternoon
    const afternoon = new Date("2026-10-17T15:45:00Z");
    afternoon.setHours(15);
    expect(getTimeOfDayGreeting(afternoon)).toEqual({
      greeting: "¡Buenas tardes",
      emoji: "🌤️",
    });

    // 22:15 Night
    const night = new Date("2026-10-17T22:15:00Z");
    night.setHours(22);
    expect(getTimeOfDayGreeting(night)).toEqual({
      greeting: "¡Buenas noches",
      emoji: "🌙",
    });

    // 03:00 Early morning / night
    const lateNight = new Date("2026-10-17T03:00:00Z");
    lateNight.setHours(3);
    expect(getTimeOfDayGreeting(lateNight)).toEqual({
      greeting: "¡Buenas noches",
      emoji: "🌙",
    });
  });

  it("resolves the 5 adaptive customer states accurately without simulating fake data", () => {
    // State 1: New Profile
    expect(
      resolveCustomerHomeState({
        hasProfile: false,
        hasAddress: false,
        totalPortions: 0,
        hasUpcomingConfirmed: false,
      }),
    ).toBe("new_profile");

    // State 2: Missing Address
    expect(
      resolveCustomerHomeState({
        hasProfile: true,
        hasAddress: false,
        totalPortions: 0,
        hasUpcomingConfirmed: false,
      }),
    ).toBe("missing_address");

    // State 3: Draft Pending (has draft order, but 0 confirmed portions)
    expect(
      resolveCustomerHomeState({
        hasProfile: true,
        hasAddress: true,
        totalPortions: 0,
        hasUpcomingConfirmed: false,
        hasDraftOrder: true,
      }),
    ).toBe("draft_pending");

    // State 4: Unprogrammed (profile and address ready, but 0 portions and no draft or upcoming confirmed)
    expect(
      resolveCustomerHomeState({
        hasProfile: true,
        hasAddress: true,
        totalPortions: 0,
        hasUpcomingConfirmed: false,
        hasDraftOrder: false,
      }),
    ).toBe("unprogrammed");

    // State 5: Confirmed Delivery (scheduled confirmed portions or upcoming confirmed delivery)
    expect(
      resolveCustomerHomeState({
        hasProfile: true,
        hasAddress: true,
        totalPortions: 4,
        hasUpcomingConfirmed: false,
      }),
    ).toBe("confirmed_delivery");

    expect(
      resolveCustomerHomeState({
        hasProfile: true,
        hasAddress: true,
        totalPortions: 0,
        hasUpcomingConfirmed: true,
      }),
    ).toBe("confirmed_delivery");
  });

  it("provides correct adaptive CTA destinations and labels for each state", () => {
    const cta1 = getAdaptiveCTA("new_profile");
    expect(cta1.ctaTo).toBe("/app/settings/profile");
    expect(cta1.ctaLabel).toBe("Configurar mi perfil");

    const cta2 = getAdaptiveCTA("missing_address");
    expect(cta2.ctaTo).toBe("/app/addresses");
    expect(cta2.ctaLabel).toBe("Añadir dirección de entrega");

    const ctaDraft = getAdaptiveCTA("draft_pending");
    expect(ctaDraft.ctaTo).toBe("/app/orders");
    expect(ctaDraft.ctaLabel).toBe("Completar mi pedido");
    expect(ctaDraft.headline).toBe("Tienes un pedido pendiente");

    const cta3 = getAdaptiveCTA("unprogrammed");
    expect(cta3.ctaTo).toBe("/app/schedule");
    expect(cta3.ctaLabel).toBe("Elegir mis platos");

    const cta4 = getAdaptiveCTA("confirmed_delivery");
    expect(cta4.ctaTo).toBe("/app/orders");
    expect(cta4.ctaLabel).toBe("Revisar mi semana");
  });
});

describe("Customer Home (CX-01A) Presentation Rendering", () => {
  const Component = (Route as any).options.component;

  beforeEach(() => {
    mockAuthUser = {
      id: "user-cust-1",
      email: "alex@eatclean.test",
      user_metadata: { full_name: "Alejandro Real" },
    };
    mockIsStaff = false;
    mockUpcomingDelivery = { kind: "none" };
    mockCustomerOrders = [];
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      displayName: "Alejandro",
      addresses: [
        {
          id: "addr-1",
          label: "Casa",
          street: "Paseo de la Castellana 42",
          city: "Madrid",
          archived: false,
        },
      ],
    };
    mockProfileSuccess = true;
    mockProfileLoading = false;
    mockProfileError = null;
    mockOrdersLoading = false;
    mockOrdersError = null;
    mockUpcomingLoading = false;
    mockUpcomingError = null;
  });

  it("renders State 1 (New Profile): prompts profile setup when displayName is missing", () => {
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      displayName: "",
      addresses: [],
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Tu alimentación, organizada");
    expect(html).toContain("Configurar mi perfil");
    expect(html).toContain('href="/app/settings/profile"');
  });

  it("renders State 2 (Missing Address): prompts address creation when no active address exists", () => {
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      displayName: "Alejandro",
      addresses: [], // No address
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Añade tu dirección");
    expect(html).toContain("Añadir dirección de entrega");
    expect(html).toContain('href="/app/addresses"');
  });

  it("renders State 3 (Unprogrammed): prompts meal selection with clean empty states when customer is genuinely without orders", () => {
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      displayName: "Alejandro",
      addresses: [
        {
          id: "addr-1",
          street: "Calle Gran Vía 1",
          archived: false,
        },
      ],
    };
    mockCustomerOrders = [];
    mockOrdersLoading = false;
    mockOrdersError = null;
    mockUpcomingDelivery = { kind: "none" };

    const html = renderToString(<Component />);
    expect(html).toContain("Tu semana está por organizar");
    expect(html).toContain("Elegir mis platos");
    expect(html).toContain('href="/app/schedule"');
    expect(html).toContain("Sin entregas programadas");
    expect(html).toContain("0 raciones esta semana");
    expect(html).toContain("Planifica de 1 a 7 días según tu ritmo de vida");
  });

  it("renders State: Draft Pending: shows draft notification and CTA when customer has only an unconfirmed draft order", () => {
    const today = new Date();
    const day = today.getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + offset);
    const weekStart = monday.toISOString().slice(0, 10);

    const tuesday = new Date(monday);
    tuesday.setUTCDate(monday.getUTCDate() + 1);
    const dayTue = tuesday.toISOString().slice(0, 10);

    mockCustomerOrders = [
      {
        id: "ord-draft-1",
        weekStart,
        status: "draft",
        itemCount: 4,
        deliveryDate: dayTue,
        dayDates: [dayTue],
      },
    ];
    mockUpcomingDelivery = { kind: "none" };

    const html = renderToString(<Component />);
    // Hero shows pending draft CTA
    expect(html).toContain("Tienes un pedido pendiente");
    expect(html).toContain("Completar mi pedido");
    expect(html).toContain('href="/app/orders"');

    // Weekly strip shows draft awareness, not confirmed schedule
    expect(html).toContain("Ritmo semanal · Borrador");
    expect(html).toContain("Pendiente de confirmar");
    expect(html).toContain("4"); // draft portions
    expect(html).toContain("1"); // draft count
    expect(html).toContain("Tus platos seleccionados no están confirmados todavía");

    // Must NOT present as confirmed delivery
    expect(html).not.toContain("Todo bajo control");
    expect(html).not.toContain("Tu semana está por organizar");
  });

  it("renders State 4 (Confirmed/Scheduled): displays real order metrics accurately labeled as Pedidos (never equating orders with deliveries)", () => {
    // Current Monday
    const today = new Date();
    const day = today.getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + offset);
    const weekStart = monday.toISOString().slice(0, 10);

    const tuesday = new Date(monday);
    tuesday.setUTCDate(monday.getUTCDate() + 1);
    const dayTue = tuesday.toISOString().slice(0, 10);

    const thursday = new Date(monday);
    thursday.setUTCDate(monday.getUTCDate() + 3);
    const dayThu = thursday.toISOString().slice(0, 10);

    mockCustomerOrders = [
      {
        id: "ord-week-1",
        weekStart,
        status: "confirmed",
        itemCount: 5,
        deliveryDate: dayTue,
        dayDates: [dayTue, dayThu],
      },
    ];

    mockUpcomingDelivery = {
      kind: "upcoming",
      delivery: {
        orderId: "ord-week-1",
        phase: "confirmed",
        deliveryDate: dayTue,
        timeWindowLabel: "13:00 - 15:00",
        address: {
          label: "Oficina",
          line: "Castellana 100",
          city: "Madrid",
        },
        itemCount: 5,
        total: 48.5,
        currency: "EUR",
        actions: ["view"],
      },
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Todo bajo control");
    expect(html).toContain("Revisar mi semana");
    expect(html).toContain('href="/app/orders"');

    // Real weekly metrics computed strictly without simulation
    expect(html).toContain("Ritmo semanal");
    expect(html).toContain("2"); // 2 scheduled days (Tue, Thu)
    expect(html).toContain("5"); // 5 total portions
    expect(html).toContain("Pedidos"); // Accurately labeled as Pedidos
    expect(html).toContain("1"); // 1 confirmed order

    // Upcoming delivery card details
    expect(html).toContain("13:00 - 15:00");
    expect(html).toContain("Oficina · Madrid");
    expect(html).toContain("48.5 €");
  });

  it("renders multi-day order correctly: single order with multiple days aggregates days into scheduledDays and counts exactly 1 Pedido", () => {
    const today = new Date();
    const day = today.getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + offset);
    const weekStart = monday.toISOString().slice(0, 10);

    const tuesday = new Date(monday);
    tuesday.setUTCDate(monday.getUTCDate() + 1);
    const dayTue = tuesday.toISOString().slice(0, 10);

    const wednesday = new Date(monday);
    wednesday.setUTCDate(monday.getUTCDate() + 2);
    const dayWed = wednesday.toISOString().slice(0, 10);

    const thursday = new Date(monday);
    thursday.setUTCDate(monday.getUTCDate() + 3);
    const dayThu = thursday.toISOString().slice(0, 10);

    mockCustomerOrders = [
      {
        id: "ord-multi-day",
        weekStart,
        status: "confirmed",
        itemCount: 6,
        deliveryDate: dayTue,
        dayDates: [dayTue, dayWed, dayThu],
      },
    ];

    const html = renderToString(<Component />);
    const cleanHtml = html.replace(/<!--.*?-->/g, "");
    expect(cleanHtml).toContain("3 días activos");
    expect(html).toContain("6"); // 6 portions
    expect(html).toContain("Pedidos");
    expect(html).toContain("1"); // Exactly 1 order, NOT 3
  });

  it("renders multiple orders in the same week: aggregates unique days, sums all portions, and counts total confirmed orders", () => {
    const today = new Date();
    const day = today.getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + offset);
    const weekStart = monday.toISOString().slice(0, 10);

    const tuesday = new Date(monday);
    tuesday.setUTCDate(monday.getUTCDate() + 1);
    const dayTue = tuesday.toISOString().slice(0, 10);

    const wednesday = new Date(monday);
    wednesday.setUTCDate(monday.getUTCDate() + 2);
    const dayWed = wednesday.toISOString().slice(0, 10);

    const thursday = new Date(monday);
    thursday.setUTCDate(monday.getUTCDate() + 3);
    const dayThu = thursday.toISOString().slice(0, 10);

    // Two confirmed orders:
    // Order 1: Tue & Wed (4 portions)
    // Order 2: Wed & Thu (3 portions) -> Wed overlaps, unique days = 3!
    mockCustomerOrders = [
      {
        id: "ord-1",
        weekStart,
        status: "confirmed",
        itemCount: 4,
        deliveryDate: dayTue,
        dayDates: [dayTue, dayWed],
      },
      {
        id: "ord-2",
        weekStart,
        status: "in_production",
        itemCount: 3,
        deliveryDate: dayWed,
        dayDates: [dayWed, dayThu],
      },
    ];

    const html = renderToString(<Component />);
    const cleanHtml = html.replace(/<!--.*?-->/g, "");
    expect(cleanHtml).toContain("3 días activos");
    expect(html).toContain("7"); // 4 + 3 portions
    expect(html).toContain("Pedidos");
    expect(html).toContain("2"); // 2 confirmed orders
  });

  it("renders Skeleton loading state when customer orders query is pending (never shows semana sin organizar while loading)", () => {
    mockCustomerOrders = undefined;
    mockOrdersLoading = true;

    const html = renderToString(<Component />);
    // Displays shimmer / skeleton
    expect(html).toContain("loadingDashboard");
    // Must NOT prematurely show unprogrammed / missing state
    expect(html).not.toContain("Tu semana está por organizar");
    expect(html).not.toContain("Todo bajo control");
    expect(html).not.toContain("Tienes un pedido pendiente");
  });

  it("renders Error recovery state when customer orders query fails (never shows semana sin organizar on error)", () => {
    mockCustomerOrders = undefined;
    mockOrdersLoading = false;
    mockOrdersError = new Error("Network connection error");

    const html = renderToString(<Component />);
    // Displays error UI with retry action
    expect(html).toContain("No pudimos cargar tus pedidos");
    expect(html).toContain("Comprueba tu conexión e inténtalo de nuevo");
    // Must NOT masquerade error as empty state
    expect(html).not.toContain("Tu semana está por organizar");
    expect(html).not.toContain("Todo bajo control");
  });

  it("renders Editorial Gastro Card and Quick Action Navigation Grid", () => {
    const html = renderToString(<Component />);

    // Editorial Gastro Card
    expect(html).toContain("✨ Bienestar diario");
    expect(html).toContain("Tu alimentación, organizada");
    expect(html).toContain("Explorar menú semanal");
    expect(html).toContain('href="/app/menu"');

    // Quick Action Grid
    expect(html).toContain("Accesos rápidos");
    expect(html).toContain("Mi menú");
    expect(html).toContain("Mis pedidos");
    expect(html).toContain("Mis preferencias");
    expect(html).toContain('href="/app/settings/dietary"');
  });
});
