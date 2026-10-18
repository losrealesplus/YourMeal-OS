/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { Route } from "./app.schedule";

// Mock router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => ({
    options: config,
  }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, className }: any) => (
    <a href={typeof to === "string" ? to : "/"} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/i18n/localization-provider", () => ({
  useFmt: () => ({
    currency: (n: number) => `${n.toFixed(2)} €`,
    number: (n: number) => String(n),
    date: (d: any) => String(d),
  }),
}));

const daysDict: Record<string, string> = {
  "customer:dayMon": "Lun",
  "customer:dayTue": "Mar",
  "customer:dayWed": "Mié",
  "customer:dayThu": "Jue",
  "customer:dayFri": "Vie",
  "customer:daySat": "Sáb",
  "customer:daySun": "Dom",
  "customer:dayMonFull": "Lunes",
  "customer:dayTueFull": "Martes",
  "customer:dayWedFull": "Miércoles",
  "customer:dayThuFull": "Jueves",
  "customer:dayFriFull": "Viernes",
  "customer:daySatFull": "Sábado",
  "customer:daySunFull": "Domingo",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, optionsOrFallback?: any) => {
      if (daysDict[key]) return daysDict[key];
      if (typeof optionsOrFallback === "string") return optionsOrFallback;
      return key;
    },
    i18n: { language: "es" },
  }),
}));

const mockAuthUser = {
  id: "user-123",
  email: "cliente@eatclean.es",
  phone: "+34 600 000 000",
  user_metadata: { full_name: "Alejandro Real" },
};

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isStaff: false,
    tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
    roles: ["customer"],
  }),
}));

vi.mock("@/identity/active-tenant-slug", () => ({
  useActiveTenantSlug: () => "eatclean",
}));

let mockCustomerId: string | null = "cust-123";
vi.mock("@/hooks/use-current-customer-id", () => ({
  useCurrentCustomerId: () => ({
    data: mockCustomerId,
    isLoading: false,
    isSuccess: true,
  }),
}));

vi.mock("@/hooks/use-customer-self-profile", () => ({
  useCustomerSelfProfile: () => ({
    tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
    profile: {
      data: mockCustomerId
        ? {
            customerId: mockCustomerId,
            displayName: "Alejandro Real",
            revision: 1,
            addresses: [
              {
                id: "addr-1",
                label: "Casa",
                street: "Calle Mayor 10, 2B",
                city: "Santa Cruz de Tenerife",
                zip: "38001",
                is_default: true,
                archived: false,
              },
            ],
          }
        : null,
    },
    links: { data: [] },
    execute: vi.fn(),
    busy: false,
    uncertain: false,
    reconcile: vi.fn(),
  }),
}));

const mockDishes = [
  {
    id: "dish-1",
    name: "Poke de Salmón Fresh",
    price: 10.5,
    kcal: 450,
    proteinG: 32,
    carbsG: 45,
    fatG: 14,
    emoji: "🥗",
  },
  {
    id: "dish-2",
    name: "Pollo Asado con Boniato",
    price: 9.5,
    kcal: 520,
    proteinG: 40,
    carbsG: 35,
    fatG: 12,
    emoji: "🍗",
  },
];

vi.mock("@/hooks/use-weekly-menu", () => ({
  useWeeklyMenu: () => ({
    data: {
      id: "menu-1",
      weekStart: "2026-10-19",
      status: "published",
      days: [
        { dayDate: "2026-10-19", dishes: mockDishes },
        { dayDate: "2026-10-20", dishes: mockDishes },
        { dayDate: "2026-10-21", dishes: mockDishes },
        { dayDate: "2026-10-22", dishes: mockDishes },
        { dayDate: "2026-10-23", dishes: mockDishes },
        { dayDate: "2026-10-24", dishes: [] },
        { dayDate: "2026-10-25", dishes: [] },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-program-draft-order", () => ({
  useProgramDraftOrder: () => ({
    mutateAsync: vi.fn(async () => ({ order: { id: "order-new-123", total: 20 } })),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-confirm-order", () => ({
  useConfirmOrder: () => ({
    mutateAsync: vi.fn(async () => ({})),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            is: () => ({
              order: () => ({
                order: () => Promise.resolve({ data: [] }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  DialogDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe("app.schedule.tsx (Multi-Day Basket Flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomerId = "cust-123";
  });

  it("renders Step 1 (Multi-Day Basket) with sticky DayPicker and real calendar day numbers (19..23)", () => {
    const Component = (Route.options as any).component;
    const html = renderToString(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    // Week title & selector
    expect(html).toContain("Semana de entrega");
    expect(html).toContain("Semana anterior");
    expect(html).toContain("Semana siguiente");

    // Real calendar dates in DayPicker (19..23)
    expect(html).toContain("Lun");
    expect(html).toContain("19");
    expect(html).toContain("Mar");
    expect(html).toContain("20");
    expect(html).toContain("Mié");
    expect(html).toContain("21");
    expect(html).toContain("Jue");
    expect(html).toContain("22");
    expect(html).toContain("Vie");
    expect(html).toContain("23");

    // Dishes for active day
    expect(html).toContain("Poke de Salmón Fresh");
    expect(html).toContain("Pollo Asado con Boniato");
    expect(html).toContain("Añadir");
  });
});
