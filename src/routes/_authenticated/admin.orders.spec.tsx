import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import {
  AdminOrdersPage,
  OrdersTable,
  OrderDetailView,
  getOperationalQuickActionLabel,
} from "./admin.orders";
import type { OperationalOrderListItem } from "@/modules/operations";

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
}));

// Mock Radix sheet for SSR test rendering (CR-OPS-UX Fase 1)
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: any) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  SheetHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  SheetTitle: ({ children, className }: any) => (
    <h2 className={className}>{children}</h2>
  ),
  SheetDescription: ({ children, className }: any) => (
    <p className={className}>{children}</p>
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

// Mock useAuth
const mockUser = { id: "user-alex-1" };
const mockTenantId = "tenant-eatclean";
const mockRoles = ["company_admin"];

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    tenantId: mockTenantId,
    roles: mockRoles,
  }),
}));

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
}));

vi.mock("@/services/types", () => ({
  createServiceContext: async () => ({
    supabase: {},
    userId: mockUser.id,
    tenantId: mockTenantId,
    roles: mockRoles,
  }),
}));

// Sample operational order matching production scenario
const sampleOrder: OperationalOrderListItem = {
  id: "fab4f2a9-1111-2222-3333-444455556666",
  tenantId: "tenant-eatclean",
  status: "confirmed",
  weekStart: "2026-09-28",
  notes: "Dejar en recepción de planta 2",
  total: 119.0,
  createdAt: "2026-09-29T12:13:00.000Z",
  demandChannel: "company",
  customerId: "cust-1",
  customerName: "Cecilia la Laguna",
  customerEmail: "cecilia@example.com",
  companyId: "comp-1",
  companyName: "Acme Corp",
  siteId: "site-1",
  siteName: "Sede Central",
  siteAddress: "Calle Mayor 10",
  organizationalUnitId: null,
  organizationalUnitName: null,
  deliveryGroupId: "group-1",
  deliveryGroupName: "Ruta Norte",
  deliveryDates: ["2026-10-01"],
  items: [
    {
      id: "item-1",
      dishId: "dish-1",
      dishName: "Solomillo de pavo con verduras",
      dayDate: "2026-10-01",
      qty: 4,
      notes: "Sin sal añadida",
      unitPrice: 11.9,
    },
    {
      id: "item-2",
      dishId: "dish-2",
      dishName: "Salmón noruego a la plancha",
      dayDate: "2026-10-01",
      qty: 6,
      notes: "Salsa aparte",
      unitPrice: 11.9,
    },
  ],
};

vi.mock("@/components/orders/universal-order-intake-drawer", () => ({
  UniversalOrderIntakeDrawer: () => <div data-testid="intake-drawer" />,
}));

function renderDetailModal(order: OperationalOrderListItem = sampleOrder) {
  return renderToString(<OrderDetailView detail={order} />);
}

describe("CR-OPS-UX Fase 1 · Quick Action State Mapping", () => {
  it("maps operational order statuses to clear human action verbs", () => {
    expect(getOperationalQuickActionLabel("draft")).toBe("Confirmar Pedido");
    expect(getOperationalQuickActionLabel("confirmed")).toBe("Iniciar Cocina");
    expect(getOperationalQuickActionLabel("in_production")).toBe("Marcar Preparado");
    expect(getOperationalQuickActionLabel("prepared")).toBe("Listo para Reparto");
    expect(getOperationalQuickActionLabel("ready_for_delivery")).toBe("Iniciar Reparto");
    expect(getOperationalQuickActionLabel("out_for_delivery")).toBe("Confirmar Entrega");
    expect(getOperationalQuickActionLabel("delivered")).toBeNull();
    expect(getOperationalQuickActionLabel("cancelled")).toBeNull();
  });
});

describe("CR-OPS-09A / CR-OPS-UX Fase 1 · OrdersTable (Actionable Table)", () => {
  it("renders clean orders table headers matching specification", () => {
    const html = renderToString(
      <OrdersTable orders={[sampleOrder]} onSelectDetail={() => {}} />,
    );

    expect(html).toContain("Cliente");
    expect(html).toContain("Estado");
    expect(html).toContain("Nº raciones");
    expect(html).toContain("Fecha");
    expect(html).toContain("Acción");
  });

  it("renders customer name, company, portions count, and formatted date", () => {
    const html = renderToString(
      <OrdersTable orders={[sampleOrder]} onSelectDetail={() => {}} />,
    );

    expect(html).toContain("Cecilia la Laguna");
    expect(html).toContain("Acme Corp");
    // 4 + 6 = 10 portions
    expect(html).toContain("10");
    // Formatted date 01/10/2026
    expect(html).toContain("01/10/2026");
    expect(html).toContain("Detalle");
  });

  it("CR-OPS-UX Fase 1: renders 1-click Quick Action button directly in table row", () => {
    const html = renderToString(
      <OrdersTable orders={[sampleOrder]} onSelectDetail={() => {}} />,
    );

    // Order status is 'confirmed' -> action is 'Iniciar Cocina'
    expect(html).toContain("Iniciar Cocina");
    expect(html).toContain("Detalle");
  });

  it("CR-OPS-DIET-01 P2: renders compact dietary alert badges directly in table row", () => {
    const orderWithDietary: OperationalOrderListItem = {
      ...sampleOrder,
      dietarySnapshot: {
        capturedAt: "2026-10-02T10:00:00.000Z",
        allergens: ["gluten", "milk"],
        customAllergens: [],
        restrictions: ["celiac"],
        preferences: [],
        dietaryNotes: null,
        isOverride: false,
      },
    };

    const html = renderToString(
      <OrdersTable orders={[orderWithDietary]} onSelectDetail={() => {}} />,
    );

    // Should render EU allergen labels (Gluten, Lácteos) and celiac restriction
    expect(html).toContain("Gluten, Lácteos");
    expect(html).toContain("Celíaco (Estricto sin trazas)");
  });

  it("renders empty state when there are no operational orders", () => {
    const html = renderToString(
      <OrdersTable orders={[]} onSelectDetail={() => {}} />,
    );

    expect(html).toContain("Sin pedidos operativos.");
  });
});

describe("CR-OPS-UX Fase 1 · OrderDetailView (5-Tier Operational Layout)", () => {
  it("Tier 1: renders operational header with ID, badges, portions, and amount", () => {
    const html = renderDetailModal();

    expect(html).toContain("#fab4f2a9");
    expect(html).toContain("Confirmado");
    expect(html).toContain("B2B Corporativo");
    expect(html).toContain("Cecilia la Laguna");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("10 raciones");
    expect(html).toContain("119.00 €");
  });

  it("Tier 2: renders Hero Action Bar prominently with state buttons and timeline", () => {
    const html = renderDetailModal();

    expect(html).toContain("Acciones Operacionales (CR-OPS-09B)");
    expect(html).toContain("Timeline operacional");
    expect(html).toContain("Iniciar Preparación (Cocina)");
    expect(html).toContain("Cancelar Pedido");
    expect(html).not.toContain("Confirmar Pedido");
  });

  it("Tier 3: renders ordered dishes breakdown with immutable snapshot prices and culinary notes", () => {
    const html = renderDetailModal();

    expect(html).toContain("Platos del Pedido (2)");
    expect(html).toContain("Snapshot financiero inmutable");
    expect(html).toContain("Solomillo de pavo con verduras");
    expect(html).toContain("Sin sal añadida");
    expect(html).toContain("Salmón noruego a la plancha");
    expect(html).toContain("Salsa aparte");
    expect(html).toContain("11.90 €");
    expect(html).toContain("47.60 €"); // 4 * 11.90
    expect(html).toContain("71.40 €"); // 6 * 11.90
  });

  it("Tier 4: renders delivery instructions and customer contact details", () => {
    const html = renderDetailModal();

    expect(html).toContain("cecilia@example.com");
    expect(html).toContain("Sede Central");
    expect(html).toContain("Calle Mayor 10");
    expect(html).toContain("Grupo de entrega: Ruta Norte");
    expect(html).toContain("Dejar en recepción de planta 2");
  });

  it("Tier 5: renders temporal & commercial context card with exact derived values", () => {
    const html = renderDetailModal();

    expect(html).toContain("Contexto Temporal y Comercial");
    // Menu week: derived from orders.week_start
    expect(html).toContain("Semana: 28 sep — 4 oct 2026");
    // Expected delivery / service day: derived from items.day_date
    expect(html).toContain("Fecha Prevista de Entrega");
    expect(html).toContain("Jueves · 01 oct 2026");
    // Creation datetime: derived from orders.created_at
    expect(html).toContain("Fecha de Creación");
    expect(html).toContain("29 sep 2026, 12:13");
    // Confirmation date audit: explicit and honest
    expect(html).toContain("Fecha de Confirmación");
    // Last update audit: explicit and honest
    expect(html).toContain("Última Actualización");
    expect(html).toContain("No disponible (sin columna updated_at en modelo)");
    // Menu origin
    expect(html).toContain("Menú de Origen");
    expect(html).toContain("Menú Semanal Publicado");
  });
});

describe("CR-OPS-09A / CR-OPS-UX Fase 1 · AdminOrdersPage (Root View)", () => {
  it("renders title, intake trigger, and loading skeleton initially", () => {
    const html = renderToString(<AdminOrdersPage />);

    expect(html).toContain("Pedidos");
    expect(html).toContain("Vista de pedidos operativos");
    expect(html).toContain("+ Nuevo Pedido");
  });
});
