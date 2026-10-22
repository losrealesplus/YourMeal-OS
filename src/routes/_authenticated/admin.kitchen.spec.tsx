import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { KitchenWorkspacePage, executeBulkAdvanceOrders } from "./admin.kitchen";
import type { OperationalOrderListItem } from "@/modules/operations";
import {
  BulkActionBar,
  BulkAdvanceModal,
  BulkRollbackModal,
  calculateOrderPortions,
  isOrderMultiDay,
} from "@/components/orders/bulk-order-actions";

// Mock Radix dialog for SSR test rendering
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }: any) => (
    <h2 className={className}>{children}</h2>
  ),
  DialogDescription: ({ children, className }: any) => (
    <p className={className}>{children}</p>
  ),
  DialogFooter: ({ children, className }: any) => (
    <footer className={className}>{children}</footer>
  ),
}));

// Mock TanStack router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

// Mock permissions
vi.mock("@/permissions/route-guards", () => ({
  assertCapabilityFromContext: vi.fn(),
}));

// Mock useAuth & useCan
const mockUser = { id: "user-kitchen-1" };
const mockTenantId = "tenant-eatclean";
const mockRoles = ["kitchen"];

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    tenantId: mockTenantId,
    roles: mockRoles,
  }),
}));

vi.mock("@/hooks/use-can", () => ({
  useCan: () => ({
    can: () => true,
  }),
}));

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        is: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

vi.mock("@/services/types", () => ({
  createServiceContext: async () => ({
    supabase: {},
    userId: mockUser.id,
    tenantId: mockTenantId,
    roles: mockRoles,
  }),
}));

// Mock OperationsService
vi.mock("@/modules/operations", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    OperationsService: {
      listOperationalOrders: vi.fn().mockResolvedValue([]),
    },
  };
});

// Mock MonthlyOperationsCalendar
vi.mock("@/components/operations/monthly-operations-calendar", () => ({
  MonthlyOperationsCalendar: () => <div data-testid="monthly-calendar" />,
}));

function createSyntheticOrders(
  count: number,
  overrides: Partial<OperationalOrderListItem> = {},
): OperationalOrderListItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `order-kitchen-${i + 1}`,
    tenantId: "tenant-eatclean",
    status: (i % 3 === 0
      ? "confirmed"
      : i % 3 === 1
      ? "in_production"
      : "prepared") as any,
    weekStart: "2026-10-19",
    total: 30.0,
    createdAt: "2026-10-19T08:00:00Z",
    demandChannel: "company",
    customerId: `cust-${i + 1}`,
    customerName: `Comensal ${i + 1}`,
    customerEmail: `comensal${i + 1}@eatclean.test`,
    companyId: "comp-eatclean-1",
    companyName: "Acme Corp",
    siteId: "site-1",
    siteName: "Sede Norte",
    siteAddress: "Avenida Central 42",
    organizationalUnitId: null,
    organizationalUnitName: null,
    deliveryGroupId: "group-1",
    deliveryGroupName: "Ruta 1",
    deliveryDates: ["2026-10-22"],
    notes: null,
    items: [
      {
        id: `item-${i + 1}-1`,
        dishId: "dish-1",
        dishName: "Pollo con arroz jazmín",
        dayDate: "2026-10-22",
        qty: (i % 2) + 1, // 1 or 2 portions
        notes: null,
      },
    ],
    ...overrides,
  }));
}

describe("Cocina Workspace — KitchenWorkspacePage SSR & Structure", () => {
  it("renders page header, title, tabs, and filter controls", () => {
    const html = renderToString(<KitchenWorkspacePage />);

    expect(html).toContain("Cocina");
    expect(html).toContain("Pedidos Diarios");
    expect(html).toContain("Calendario Mensual");
    expect(html).toContain("Fecha");
    expect(html).toContain("Empresa");
    expect(html).toContain("Sede");
    expect(html).toContain("Delivery Group");
  });
});

describe("Cocina Workspace — Bulk Actions Integration & Scale", () => {
  it("handles 1 synthetic order in bulk actions", () => {
    const singleBatch = createSyntheticOrders(1, { status: "confirmed" });
    const portions = calculateOrderPortions(singleBatch[0]);

    const barHtml = renderToString(
      <BulkActionBar
        selectedCount={1}
        selectedPortions={portions}
        onAdvance={vi.fn()}
        onRollback={vi.fn()}
        onClear={vi.fn()}
        rollbackEnabled={false}
      />,
    );

    expect(barHtml).toContain("pedido seleccionado");
    expect(barHtml).toContain("Avanzar estado");

    const modalHtml = renderToString(
      <BulkAdvanceModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={singleBatch}
        onExecute={vi.fn()}
        busy={false}
      />,
    );

    expect(modalHtml).toContain("Avanzar estado");
    expect(modalHtml).toContain("Confirmado");
    expect(modalHtml).toContain("En preparación");
    expect(modalHtml).toContain("pedido elegible");
  });

  it("handles 20 synthetic orders with mixed operational statuses", () => {
    const batch20 = createSyntheticOrders(20);
    const portions20 = batch20.reduce((sum, o) => sum + calculateOrderPortions(o), 0);

    const barHtml = renderToString(
      <BulkActionBar
        selectedCount={20}
        selectedPortions={portions20}
        onAdvance={vi.fn()}
        onRollback={vi.fn()}
        onClear={vi.fn()}
        rollbackEnabled={false}
      />,
    );

    expect(barHtml).toContain("20");
    expect(barHtml).toContain("pedidos seleccionados");

    const advanceHtml = renderToString(
      <BulkAdvanceModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={batch20}
        onExecute={vi.fn()}
        busy={false}
      />,
    );

    expect(advanceHtml).toContain("Avanzar estado");
    expect(advanceHtml).toContain("Confirmado");
    expect(advanceHtml).toContain("En preparación");
    expect(advanceHtml).toContain("Preparado");
    expect(advanceHtml).toContain("Listo para reparto");
  });

  it("handles 100 synthetic orders with high performance and accurate portion calculations", () => {
    const batch100 = createSyntheticOrders(100);
    const portions100 = batch100.reduce((sum, o) => sum + calculateOrderPortions(o), 0);
    expect(portions100).toBeGreaterThanOrEqual(100);

    const barHtml = renderToString(
      <BulkActionBar
        selectedCount={100}
        selectedPortions={portions100}
        onAdvance={vi.fn()}
        onRollback={vi.fn()}
        onClear={vi.fn()}
        rollbackEnabled={true}
      />,
    );

    expect(barHtml).toContain("100");
    expect(barHtml).toContain("pedidos seleccionados");
    expect(barHtml).toContain("Retroceder estado");

    const rollbackHtml = renderToString(
      <BulkRollbackModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={batch100}
        onExecute={vi.fn()}
        busy={false}
        rollbackEnabled={true}
      />,
    );

    expect(rollbackHtml).toContain("Retroceder estado operacional");
    expect(rollbackHtml).toContain("Motivo del retroceso");
  });

  it("strictly excludes v2 canonical orders from rollback across synthetic batch", () => {
    const mixedContractOrders = [
      ...createSyntheticOrders(5, { status: "prepared", writeContractVersion: 1 }),
      ...createSyntheticOrders(5, { status: "prepared", writeContractVersion: 2 }), // Invariant: v2 canonical rejected
    ];

    const rollbackHtml = renderToString(
      <BulkRollbackModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={mixedContractOrders}
        onExecute={vi.fn()}
        busy={false}
        rollbackEnabled={true}
      />,
    );

    expect(rollbackHtml).toContain("Pedido canónico v2");
    expect(rollbackHtml).toContain("pedidos elegibles");
    expect(rollbackHtml).toContain("pedidos omitidos (no reversibles)");
  });

  it("handles multi-day orders safely with currentOperatingDate in Kitchen workspace", () => {
    const multiDayOrder = createSyntheticOrders(1, {
      status: "in_production",
      deliveryDates: ["2026-10-22", "2026-10-23"],
      allDeliveryDates: ["2026-10-22", "2026-10-23"],
      isMultiDay: true,
    })[0];

    expect(isOrderMultiDay(multiDayOrder, "2026-10-22")).toBe(true);

    const advanceHtml = renderToString(
      <BulkAdvanceModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={[multiDayOrder]}
        onExecute={vi.fn()}
        busy={false}
        currentOperatingDate="2026-10-22"
      />,
    );

    expect(advanceHtml).toContain("Atención: 1 pedido seleccionado es multijornada");
    expect(advanceHtml).toContain("2026-10-23");
    expect(advanceHtml).toContain("Incluir pedidos multijornada");
    expect(advanceHtml).toContain("Omitido por seguridad");
  });

  describe("executeBulkAdvanceOrders — Functional OrderFacade Command Mapping", () => {
    it("invokes exact correct OrderFacade commands for each operational transition", async () => {
      const mockOrderApi = {
        confirmOrder: vi.fn().mockResolvedValue({ ok: true }),
        scheduleProduction: vi.fn().mockResolvedValue({ ok: true }),
        readyForKitchen: vi.fn().mockResolvedValue({ ok: true }),
        readyForDelivery: vi.fn().mockResolvedValue({ ok: true }),
      };

      const orders: OperationalOrderListItem[] = [
        ...createSyntheticOrders(1, { id: "ord-draft", status: "draft" }),
        ...createSyntheticOrders(1, { id: "ord-confirmed", status: "confirmed" }),
        ...createSyntheticOrders(1, { id: "ord-production", status: "in_production" }),
        ...createSyntheticOrders(1, { id: "ord-prepared", status: "prepared" }),
        ...createSyntheticOrders(1, { id: "ord-delivered", status: "delivered" }),
      ];

      const result = await executeBulkAdvanceOrders(orders, mockOrderApi as any);

      // 1. draft → confirmed (must call confirmOrder)
      expect(mockOrderApi.confirmOrder).toHaveBeenCalledTimes(1);
      expect(mockOrderApi.confirmOrder).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: "ord-draft", type: "ConfirmOrder" }),
      );

      // 2. confirmed → in_production (MUST call scheduleProduction, NOT readyForKitchen)
      expect(mockOrderApi.scheduleProduction).toHaveBeenCalledTimes(1);
      expect(mockOrderApi.scheduleProduction).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: "ord-confirmed", type: "ScheduleProduction" }),
      );

      // 3. in_production → prepared (MUST call readyForKitchen, NOT scheduleProduction)
      expect(mockOrderApi.readyForKitchen).toHaveBeenCalledTimes(1);
      expect(mockOrderApi.readyForKitchen).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: "ord-production", type: "ReadyForKitchen" }),
      );

      // 4. prepared → ready_for_delivery (must call readyForDelivery)
      expect(mockOrderApi.readyForDelivery).toHaveBeenCalledTimes(1);
      expect(mockOrderApi.readyForDelivery).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: "ord-prepared", type: "ReadyForDelivery" }),
      );

      // 5. Result verification
      expect(result.succeeded).toEqual([
        { orderId: "ord-draft", from: "draft", to: "confirmed" },
        { orderId: "ord-confirmed", from: "confirmed", to: "in_production" },
        { orderId: "ord-production", from: "in_production", to: "prepared" },
        { orderId: "ord-prepared", from: "prepared", to: "ready_for_delivery" },
      ]);
      expect(result.omitted).toEqual([
        { orderId: "ord-delivered", reason: "Estado delivered omitido" },
      ]);
      expect(result.failed).toEqual([]);
    });

    it("captures execution errors from OrderFacade gracefully", async () => {
      const mockOrderApi = {
        confirmOrder: vi.fn().mockResolvedValue({
          ok: false,
          errors: [{ message: "Fallo de validación de corte horario" }],
        }),
        scheduleProduction: vi.fn(),
        readyForKitchen: vi.fn(),
        readyForDelivery: vi.fn(),
      };

      const orders: OperationalOrderListItem[] = createSyntheticOrders(1, {
        id: "ord-fail",
        status: "draft",
      });

      const result = await executeBulkAdvanceOrders(orders, mockOrderApi as any);

      expect(result.succeeded).toEqual([]);
      expect(result.failed).toEqual([
        { orderId: "ord-fail", error: "Fallo de validación de corte horario" },
      ]);
    });
  });

  describe("Temporal Scope Protection — 1, 2, and 5 delivery dates without delivery_services", () => {
    it("handles 1-date order without delivery_services as single-day", () => {
      const order1Date = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-22"],
        allDeliveryDates: ["2026-10-22"],
        isMultiDay: false,
        temporalScopeKnown: true,
      })[0];

      expect(isOrderMultiDay(order1Date, "2026-10-22")).toBe(false);
    });

    it("handles 2-date order without delivery_services as multi-day", () => {
      const order2Dates = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-22"],
        allDeliveryDates: ["2026-10-22", "2026-10-23"],
        isMultiDay: true,
        temporalScopeKnown: true,
      })[0];

      expect(isOrderMultiDay(order2Dates, "2026-10-22")).toBe(true);
    });

    it("handles 5-date order without delivery_services as multi-day and warns in modal", () => {
      const order5Dates = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-22"],
        allDeliveryDates: [
          "2026-10-19",
          "2026-10-20",
          "2026-10-21",
          "2026-10-22",
          "2026-10-23",
        ],
        isMultiDay: true,
        temporalScopeKnown: true,
        status: "confirmed",
      })[0];

      expect(isOrderMultiDay(order5Dates, "2026-10-22")).toBe(true);

      const html = renderToString(
        <BulkAdvanceModal
          open={true}
          onOpenChange={vi.fn()}
          selectedOrders={[order5Dates]}
          onExecute={vi.fn()}
          busy={false}
          currentOperatingDate="2026-10-22"
        />,
      );

      expect(html).toContain("Atención: 1 pedido seleccionado es multijornada");
      expect(html).toContain("2026-10-19");
      expect(html).toContain("2026-10-23");
      expect(html).toContain("Omitido por seguridad (multijornada: contiene raciones en otras fechas)");
    });

    it("strictly excludes order when temporal scope could not be determined", () => {
      const unknownScopeOrder = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-22"],
        allDeliveryDates: ["2026-10-22"],
        isMultiDay: false,
        temporalScopeKnown: false, // Invariant: scope could not be determined
        status: "confirmed",
      })[0];

      expect(isOrderMultiDay(unknownScopeOrder, "2026-10-22")).toBe(true);

      const html = renderToString(
        <BulkAdvanceModal
          open={true}
          onOpenChange={vi.fn()}
          selectedOrders={[unknownScopeOrder]}
          onExecute={vi.fn()}
          busy={false}
          currentOperatingDate="2026-10-22"
        />,
      );

      expect(html).toContain("Omitido por seguridad (alcance temporal no determinable)");
    });
  });
});
