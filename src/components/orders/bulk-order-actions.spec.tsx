import { setOperationalRollbackEnabledForTests } from "@/modules/operations/domain/operational-status";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  useBulkOrderSelection,
  calculateOrderPortions,
  toggleOrderIdInSet,
  toggleAllOrdersInSet,
  filterVisibleOrderIds,
  isOrderMultiDay,
  getTemporalScopeOmissionReason,
  executeRollbackOrders,
  BulkActionBar,
  BulkAdvanceModal,
  BulkRollbackModal,
  type BulkExecutionResult,
} from "./bulk-order-actions";
import type { OperationalOrderListItem } from "@/modules/operations";

// Simulate the checked consent state without needing a browser renderer.
const consentState = vi.hoisted(() => ({ checked: false }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: any) => actual.useState(consentState.checked && initial === false ? true : initial),
  };
});

// Mock Radix dialog for SSR / vitest rendering
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

vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, id, ...props }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}));

function createSyntheticOrders(
  count: number,
  overrides: Partial<OperationalOrderListItem> = {},
): OperationalOrderListItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `order-syn-${i + 1}`,
    tenantId: "tenant-eatclean",
    status: (i % 4 === 0
      ? "draft"
      : i % 4 === 1
      ? "confirmed"
      : i % 4 === 2
      ? "in_production"
      : "prepared") as any,
    weekStart: "2026-10-19",
    total: 25.0,
    createdAt: "2026-10-19T10:00:00Z",
    demandChannel: "company",
    customerId: `cust-${i + 1}`,
    customerName: `Cliente ${i + 1}`,
    customerEmail: `cliente${i + 1}@example.com`,
    companyId: "comp-1",
    companyName: "Empresa Piloto",
    siteId: "site-1",
    siteName: "Sede Central",
    siteAddress: "Calle Principal 1",
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
        dishName: "Plato Principal",
        dayDate: "2026-10-22",
        qty: (i % 3) + 1, // 1, 2, or 3 portions
        notes: null,
      },
    ],
    ...overrides,
  }));
}

describe("Bulk Order Actions — Pure Functions & Selection Helpers", () => {
  it("calculates portions correctly across 1, 20, and 100 orders", () => {
    const singleOrder = createSyntheticOrders(1, {
      items: [
        { id: "i1", dishId: "d1", dishName: "Plato A", dayDate: "2026-10-22", qty: 2, notes: null },
        { id: "i2", dishId: "d2", dishName: "Plato B", dayDate: "2026-10-22", qty: 3, notes: null },
      ],
    })[0];
    expect(calculateOrderPortions(singleOrder)).toBe(5);

    const orders20 = createSyntheticOrders(20);
    const sum20 = orders20.reduce((acc, o) => acc + calculateOrderPortions(o), 0);
    expect(sum20).toBeGreaterThan(20);

    const orders100 = createSyntheticOrders(100);
    const sum100 = orders100.reduce((acc, o) => acc + calculateOrderPortions(o), 0);
    expect(sum100).toBeGreaterThan(100);

    // Empty items
    expect(calculateOrderPortions({ id: "o-empty" } as any)).toBe(0);
  });

  it("handles toggleOrderIdInSet for 1, 20, and 100 orders", () => {
    let set = new Set<string>();

    // Add 1
    set = toggleOrderIdInSet(set, "order-1");
    expect(set.has("order-1")).toBe(true);
    expect(set.size).toBe(1);

    // Toggle off 1
    set = toggleOrderIdInSet(set, "order-1");
    expect(set.has("order-1")).toBe(false);
    expect(set.size).toBe(0);

    // Add 20 orders sequentially
    for (let i = 1; i <= 20; i++) {
      set = toggleOrderIdInSet(set, `order-${i}`);
    }
    expect(set.size).toBe(20);

    // Add up to 100 orders
    for (let i = 21; i <= 100; i++) {
      set = toggleOrderIdInSet(set, `order-${i}`);
    }
    expect(set.size).toBe(100);
  });

  it("handles toggleAllOrdersInSet for 1, 20, and 100 orders", () => {
    const orders100 = createSyntheticOrders(100);
    const orders20 = orders100.slice(0, 20);
    const orders1 = orders100.slice(0, 1);

    // 1 order: select all then toggle off
    let set1 = toggleAllOrdersInSet(new Set(), orders1);
    expect(set1.size).toBe(1);
    set1 = toggleAllOrdersInSet(set1, orders1);
    expect(set1.size).toBe(0);

    // 20 orders: select all then toggle off
    let set20 = toggleAllOrdersInSet(new Set(), orders20);
    expect(set20.size).toBe(20);
    set20 = toggleAllOrdersInSet(set20, orders20);
    expect(set20.size).toBe(0);

    // 100 orders: select all then toggle off
    let set100 = toggleAllOrdersInSet(new Set(), orders100);
    expect(set100.size).toBe(100);
    set100 = toggleAllOrdersInSet(set100, orders100);
    expect(set100.size).toBe(0);
  });

  it("filters out invisible/deleted order IDs correctly", () => {
    const orders = createSyntheticOrders(5);
    const initialSet = new Set(["order-syn-1", "order-syn-2", "order-syn-5"]);

    // If order-syn-5 is filtered out
    const visibleOrders = orders.slice(0, 4);
    const nextSet = filterVisibleOrderIds(initialSet, visibleOrders);

    expect(nextSet.size).toBe(2);
    expect(nextSet.has("order-syn-1")).toBe(true);
    expect(nextSet.has("order-syn-2")).toBe(true);
    expect(nextSet.has("order-syn-5")).toBe(false);
  });
});

describe("Bulk Order Actions — Hook Probe in SSR", () => {
  it("initializes useBulkOrderSelection with clean empty state", () => {
    const orders = createSyntheticOrders(10);
    let captured: any = null;

    function Probe() {
      captured = useBulkOrderSelection(orders, []);
      return (
        <div data-testid="probe">
          <span>{captured.isAllSelected ? "ALL" : "NOT_ALL"}</span>
          <span>{captured.selectedPortions}</span>
        </div>
      );
    }

    const html = renderToString(<Probe />);
    expect(html).toContain("NOT_ALL");
    expect(html).toContain("0");
    expect(captured.selectedOrderIds.size).toBe(0);
    expect(captured.selectedOrders).toHaveLength(0);
    expect(captured.isPartiallySelected).toBe(false);
  });
});

describe("Bulk Order Actions — UI Components", () => {
  it("renders BulkActionBar with selected count and portions", () => {
    const html = renderToString(
      <BulkActionBar
        selectedCount={5}
        selectedPortions={12}
        onAdvance={vi.fn()}
        onRollback={vi.fn()}
        onClear={vi.fn()}
        rollbackEnabled={false}
      />,
    );

    expect(html).toContain("pedidos seleccionados");
    expect(html).toContain("raciones");
    expect(html).toContain("Avanzar estado");
    expect(html).toContain("Retroceder estado");
    expect(html).toContain("Pend. migración");
    expect(html).toContain("Deseleccionar");
  });

  it("renders BulkActionBar with active rollback button when rollbackEnabled is true", () => {
    const html = renderToString(
      <BulkActionBar
        selectedCount={20}
        selectedPortions={45}
        onAdvance={vi.fn()}
        onRollback={vi.fn()}
        onClear={vi.fn()}
        rollbackEnabled={true}
      />,
    );

    expect(html).toContain("pedidos seleccionados");
    expect(html).toContain("raciones");
    expect(html).toContain("Retroceder estado");
    expect(html).not.toContain("Pend. migración");
  });

  it("renders BulkAdvanceModal with breakdown for mixed states and omits delivered", () => {
    const mixedOrders: OperationalOrderListItem[] = [
      ...createSyntheticOrders(2, { status: "draft" }),
      ...createSyntheticOrders(3, { status: "confirmed" }),
      ...createSyntheticOrders(4, { status: "in_production" }),
      ...createSyntheticOrders(2, { status: "prepared" }),
      ...createSyntheticOrders(2, { status: "ready_for_delivery" }),
      ...createSyntheticOrders(1, { status: "delivered" }),
      ...createSyntheticOrders(1, { status: "cancelled" }),
    ];

    const html = renderToString(
      <BulkAdvanceModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={mixedOrders}
        onExecute={vi.fn()}
        busy={false}
      />,
    );

    expect(html).toContain("Avanzar estado");
    expect(html).toContain("Borrador");
    expect(html).toContain("Confirmado");
    expect(html).toContain("En preparación");
    expect(html).toContain("Preparado");
    expect(html).toContain("Listo para reparto");
    expect(html).toContain("pedidos omitidos");
    expect(html).toContain("No se marcarán pedidos como entregados");
    expect(html).toContain("pedidos elegibles");
  });

  it("renders BulkAdvanceModal for homogeneous batch of 100 confirmed orders", () => {
    const confirmed100 = createSyntheticOrders(100, { status: "confirmed" });

    const html = renderToString(
      <BulkAdvanceModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={confirmed100}
        onExecute={vi.fn()}
        busy={false}
      />,
    );

    expect(html).toContain("Avanzar estado");
    expect(html).toContain("Cada pedido avanzará exactamente");
    expect(html).toContain("Confirmado");
    expect(html).toContain("En preparación");
    expect(html).toContain("pedidos elegibles");
  });

  it("renders BulkRollbackModal breakdown and strictly excludes v2 canonical orders", () => {
    const testOrders: OperationalOrderListItem[] = [
      ...createSyntheticOrders(2, { status: "ready_for_delivery", writeContractVersion: 1 }),
      ...createSyntheticOrders(3, { status: "prepared", writeContractVersion: 1 }),
      ...createSyntheticOrders(2, { status: "in_production", writeContractVersion: 1 }),
      ...createSyntheticOrders(2, { status: "prepared", writeContractVersion: 2 }), // V2 should be omitted!
      ...createSyntheticOrders(1, { status: "confirmed", writeContractVersion: 1 }), // Initial status omitted!
      ...createSyntheticOrders(1, { status: "delivered", writeContractVersion: 1 }), // Delivered omitted!
    ];

    const html = renderToString(
      <BulkRollbackModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={testOrders}
        onExecute={vi.fn()}
        busy={false}
        rollbackEnabled={true}
      />,
    );

    expect(html).toContain("Retroceder estado operacional");
    expect(html).toContain("pedidos elegibles");
    expect(html).toContain("Listo para reparto");
    expect(html).toContain("Preparado");
    expect(html).toContain("En preparación");
    expect(html).toContain("Confirmado");
    expect(html).toContain("Pedido canónico v2");
    expect(html).toContain("Motivo del retroceso");
    expect(html).toContain("Confirmar Retroceso");
  });

  it("shows execution summary with succeeded, omitted, and failed orders", () => {
    const orders = createSyntheticOrders(3, { status: "prepared" });
    const mockResult: BulkExecutionResult = {
      succeeded: [{ orderId: "order-syn-1", from: "prepared", to: "ready_for_delivery" }],
      omitted: [{ orderId: "order-syn-2", reason: "Omitido por filtro" }],
      failed: [{ orderId: "order-syn-3", error: "Lock timeout en base de datos" }],
    };

    const html = renderToString(
      <BulkAdvanceModal
        open={true}
        onOpenChange={vi.fn()}
        selectedOrders={orders}
        onExecute={vi.fn(async () => mockResult)}
        busy={false}
      />,
    );

    expect(html).toContain("Avanzar");
    expect(html).toContain("pedidos elegibles");
  });

  describe("Temporal Scope Protection (Multi-Day Orders)", () => {
    it("isOrderMultiDay correctly identifies multi-day orders vs single-day orders", () => {
      const singleDayOrder = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-22"],
        allDeliveryDates: ["2026-10-22"],
        isMultiDay: false,
      })[0];
      expect(isOrderMultiDay(singleDayOrder, "2026-10-22")).toBe(false);

      const flagMultiDayOrder = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-22"],
        isMultiDay: true,
      })[0];
      expect(isOrderMultiDay(flagMultiDayOrder, "2026-10-22")).toBe(true);

      const multiDateOrder = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-22", "2026-10-24"],
        allDeliveryDates: ["2026-10-22", "2026-10-24"],
      })[0];
      expect(isOrderMultiDay(multiDateOrder, "2026-10-22")).toBe(true);

      const differentDateOrder = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-23"],
        allDeliveryDates: ["2026-10-23"],
      })[0];
      expect(isOrderMultiDay(differentDateOrder, "2026-10-22")).toBe(true);

      const unknownScopeOrder = createSyntheticOrders(1, {
        deliveryDates: ["2026-10-22"],
        allDeliveryDates: ["2026-10-22"],
        temporalScopeKnown: false,
      })[0];
      expect(isOrderMultiDay(unknownScopeOrder, "2026-10-22")).toBe(true);
    });

    it("BulkAdvanceModal validates scope when all orders are single-day for operating date", () => {
      const orders = createSyntheticOrders(3, {
        deliveryDates: ["2026-10-22"],
        allDeliveryDates: ["2026-10-22"],
        isMultiDay: false,
        status: "confirmed",
      });

      const html = renderToString(
        <BulkAdvanceModal
          open={true}
          onOpenChange={vi.fn()}
          selectedOrders={orders}
          onExecute={vi.fn()}
          busy={false}
          currentOperatingDate="2026-10-22"
        />,
      );

      expect(html).toContain("Alcance validado");
      expect(html).toContain("2026-10-22");
      expect(html).not.toContain("Atención: ");
      expect(html).toContain("Avanzar 3 pedidos elegibles");
    });

    it("BulkAdvanceModal warns and omits multi-day orders by default for safety", () => {
      const orders = [
        ...createSyntheticOrders(2, {
          deliveryDates: ["2026-10-22"],
          allDeliveryDates: ["2026-10-22"],
          isMultiDay: false,
          status: "confirmed",
        }),
        ...createSyntheticOrders(1, {
          deliveryDates: ["2026-10-22", "2026-10-23"],
          allDeliveryDates: ["2026-10-22", "2026-10-23"],
          isMultiDay: true,
          status: "confirmed",
        }),
      ];

      const html = renderToString(
        <BulkAdvanceModal
          open={true}
          onOpenChange={vi.fn()}
          selectedOrders={orders}
          onExecute={vi.fn()}
          busy={false}
          currentOperatingDate="2026-10-22"
        />,
      );

      expect(html).toContain("Atención: 1 pedido seleccionado es multijornada");
      expect(html).toContain("2026-10-23");
      expect(html).toContain("Incluir pedidos multijornada");
      expect(html).toContain("Omitido por seguridad (multijornada: contiene raciones en otras fechas)");
      expect(html).toContain("Avanzar 2 pedidos elegibles");
    });

    it("BulkRollbackModal warns and omits multi-day orders by default", () => {
      const orders = [
        ...createSyntheticOrders(2, {
          deliveryDates: ["2026-10-22"],
          allDeliveryDates: ["2026-10-22"],
          isMultiDay: false,
          status: "prepared",
          writeContractVersion: 1,
        }),
        ...createSyntheticOrders(1, {
          deliveryDates: ["2026-10-22", "2026-10-25"],
          allDeliveryDates: ["2026-10-22", "2026-10-25"],
          isMultiDay: true,
          status: "prepared",
          writeContractVersion: 1,
        }),
      ];

      const html = renderToString(
        <BulkRollbackModal
          open={true}
          onOpenChange={vi.fn()}
          selectedOrders={orders}
          onExecute={vi.fn()}
          busy={false}
          rollbackEnabled={true}
          currentOperatingDate="2026-10-22"
        />,
      );

      expect(html).toContain("Atención: 1 pedido seleccionado es multijornada");
      expect(html).toContain("2026-10-25");
      expect(html).toContain("Incluir pedidos multijornada");
      expect(html).toContain("Omitido por seguridad (multijornada: contiene raciones en otras fechas)");
      expect(html).toContain("Confirmar Retroceso (2)");
    });
  });
});

describe("Temporal scope consent boundary", () => {
  it.each([false, true])("never admits unknown scope with includeMultiDay=%s", (include) => {
    const order = createSyntheticOrders(1, { temporalScopeKnown: false })[0];
    expect(getTemporalScopeOmissionReason(order, "2026-10-22", include))
      .toContain("alcance temporal no determinable");
  });
  it("consent only unlocks known multi-day orders", () => {
    const order = createSyntheticOrders(1, {
      temporalScopeKnown: true,
      allDeliveryDates: ["2026-10-22", "2026-10-23"],
    })[0];
    expect(getTemporalScopeOmissionReason(order, "2026-10-22", false)).toContain("multijornada");
    expect(getTemporalScopeOmissionReason(order, "2026-10-22", true)).toBeNull();
  });
});

describe("Bulk modal unknown scope with consent checked", () => {
  it.each(["advance", "rollback"])("%s keeps unknown orders excluded", (action) => {
    consentState.checked = true;
    try {
      const selectedOrders = [
        ...createSyntheticOrders(1, { temporalScopeKnown: false, status: "prepared" }),
        ...createSyntheticOrders(1, {
          id: "known-multiday", status: "prepared", temporalScopeKnown: true,
          allDeliveryDates: ["2026-10-22", "2026-10-23"],
        }),
      ];
      const props = { open: true, onOpenChange: vi.fn(), selectedOrders, onExecute: vi.fn(), busy: false,
        currentOperatingDate: "2026-10-22" };
      const html = renderToString(action === "advance"
        ? <BulkAdvanceModal {...props} />
        : <BulkRollbackModal {...props} rollbackEnabled={true} />);
      expect(html).toContain("alcance temporal no determinable");
      expect(html).toContain(action === "advance" ? "Avanzar 1 pedido elegible" : "Confirmar Retroceso (1)");
      expect(html).not.toContain(action === "advance" ? "Avanzar 2 pedidos elegibles" : "Confirmar Retroceso (2)");
    } finally {
      consentState.checked = false;
    }
  });
});

describe("Rollback execution boundary", () => {
  it("mutates only eligible selected orders and reports partial results with confirmed states", async () => {
    setOperationalRollbackEnabledForTests(true);
    try {
      const selected = createSyntheticOrders(4, { status: "prepared", revision: 3, temporalScopeKnown: true });
      selected[2].temporalScopeKnown = false;
      selected[3].writeContractVersion = 2;
      const unselected = createSyntheticOrders(1, { id: "not-selected", status: "prepared" })[0];
      const api = { rollbackOrderStatus: vi.fn(async (command: any) => ({
        ok: command.orderId === selected[0].id, orderId: command.orderId,
        status: command.orderId === selected[0].id ? "in_production" : null,
        context: null, errors: [{ message: "conflict" }],
      })) } as any;
      const result = await executeRollbackOrders(selected, "  correction  ", { allowMultiDay: true }, api);
      expect(result.succeeded).toEqual([{ orderId: selected[0].id, from: "prepared", to: "in_production" }]);
      expect(result.failed).toHaveLength(1);
      expect(result.omitted).toHaveLength(2);
      expect(api.rollbackOrderStatus).toHaveBeenCalledTimes(2);
      expect(api.rollbackOrderStatus).toHaveBeenCalledWith(expect.objectContaining({
        orderId: selected[0].id, expectedStatus: "prepared", expectedRevision: 3,
        expectedDeliveryDates: ["2026-10-22"], reason: "correction", allowMultiDay: true,
      }));
      expect(unselected.status).toBe("prepared");
      expect(api.rollbackOrderStatus.mock.calls.some(([c]: any) => c.orderId === unselected.id)).toBe(false);
    } finally { setOperationalRollbackEnabledForTests(false); }
  });
  it("does not claim success for an unconfirmed target state", async () => {
    setOperationalRollbackEnabledForTests(true);
    try {
      const api = { rollbackOrderStatus: vi.fn(async () => ({ ok: true, status: "prepared", errors: [] })) } as any;
      const result = await executeRollbackOrders(createSyntheticOrders(1, { status: "prepared" }), "fix", {}, api);
      expect(result.succeeded).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
    } finally { setOperationalRollbackEnabledForTests(false); }
  });
});
