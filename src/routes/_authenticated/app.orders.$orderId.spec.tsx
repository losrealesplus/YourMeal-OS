/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { Route } from "./app.orders.$orderId";
import { CONSTITUTIONAL_DIETARY_DISCLAIMER } from "@/types/dietary";

// Mock router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => ({
    options: config,
    useParams: () => ({ orderId: "ord-test-1" }),
  }),
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  notFound: () => new Error("Not found"),
}));

const mockOrderData = {
  id: "ord-test-1",
  weekStart: "2026-10-05",
  weekLabel: "Semana 5 Oct",
  status: "confirmed",
  deliveryDateIso: "2026-10-07T12:00:00.000Z",
  total: 24.5,
  currency: "EUR",
  items: [
    {
      dishId: "d1",
      qty: 2,
      dayDate: "2026-10-07",
      dish: {
        id: "d1",
        name: "Ensalada César",
        emoji: "🥗",
        kcal: 350,
      },
    },
  ],
  address: {
    label: "Oficina",
    line: "Calle Mayor 12",
    city: "Madrid",
  },
  companyName: "Acme Corp",
  dietarySnapshot: null as any,
};

let currentOrderData: any = mockOrderData;

vi.mock("@/hooks/use-order", () => ({
  useOrder: () => ({
    data: currentOrderData,
    isPending: false,
    isFetched: true,
  }),
}));

vi.mock("@/hooks/use-confirm-order", () => ({
  useConfirmOrder: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/use-repeat-order", () => ({
  useRepeatOrder: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRepeatOrderPreview: () => ({
    data: { canRepeat: false, unavailable: [] },
  }),
}));

vi.mock("@/i18n/localization-provider", () => ({
  useFmt: () => ({
    dateTime: (iso: string) => iso,
    currency: (amt: number) => `${amt} €`,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe("app.orders.$orderId dietary snapshot verification", () => {
  const Component = (Route as any).options.component;

  beforeEach(() => {
    currentOrderData = { ...mockOrderData, dietarySnapshot: null };
  });

  it("displays empty dietary notice and constitutional disclaimer when order has no dietary snapshot", () => {
    currentOrderData = {
      ...mockOrderData,
      dietarySnapshot: null,
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Condiciones dietéticas aplicadas");
    expect(html).toContain("Sin alérgenos ni condiciones especiales declaradas en este pedido.");
    expect(html).toContain(CONSTITUTIONAL_DIETARY_DISCLAIMER);
  });

  it("displays dietary badges and notes when order has active dietary snapshot", () => {
    currentOrderData = {
      ...mockOrderData,
      dietarySnapshot: {
        capturedAt: "2026-10-02T10:00:00.000Z",
        allergens: ["gluten", "milk"],
        customAllergens: ["kiwi"],
        restrictions: ["celiac"],
        preferences: ["vegetarian"],
        dietaryNotes: "Separar aliño en envase aparte",
        isOverride: false,
        overrideReason: null,
        authorUserId: "user-cust-1",
      },
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Condiciones dietéticas aplicadas");
    expect(html).toContain("Gluten");
    expect(html).toContain("Lácteos");
    expect(html).toContain("kiwi");
    expect(html).toContain("Celíaco");
    expect(html).toContain("Vegetariano");
    expect(html).toContain("Separar aliño en envase aparte");
    expect(html).toContain(CONSTITUTIONAL_DIETARY_DISCLAIMER);
  });
});
