import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import * as fs from "node:fs";
import * as path from "node:path";
import { UniversalOrderIntakeDrawer } from "./universal-order-intake-drawer";

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: any) => (open ? <div data-testid="sheet">{children}</div> : null),
  SheetContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  SheetHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  SheetTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  SheetDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
  SheetFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, className }: any) => <div className={className}>{children}</div>,
  TabsList: ({ children, className }: any) => <div className={className}>{children}</div>,
  TabsTrigger: ({ children, className }: any) => <button type="button" className={className}>{children}</button>,
  TabsContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "test-user-1" },
    tenantId: "tenant-eatclean",
    roles: ["operations_manager"],
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/modules/weekly-menu/application/weekly-menu-queries", () => ({
  fetchPublishedWeeklyMenu: vi.fn(async (_tenantId: string, weekStart: string) => ({
    id: "menu-test-1",
    weekStart,
    status: "published",
    days: [
      {
        dayDate: `${weekStart}`,
        dishes: [
          { id: "dish-1", name: "Pollo al Curry con Quinoa", price: 11.9 },
          { id: "dish-2", name: "Salmón Noruego con Batata", price: 12.5 },
        ],
      },
    ],
  })),
}));

describe("UniversalOrderIntakeDrawer Component Rendering & Contract (CR-OPS-05)", () => {
  it("renders drawer with week title and action buttons when open", () => {
    const html = renderToString(
      <UniversalOrderIntakeDrawer
        open={true}
        onOpenChange={() => {}}
        preselectedCustomerId="cust-123"
        preselectedCustomerName="Juan Pérez"
        preselectedWeekStart="2026-09-28"
      />,
    );

    expect(html).toContain("Captura Universal de Pedido");
    expect(html).toContain("2026-09-28");
    expect(html).toContain("Guardar Borrador");
    expect(html).toContain("Guardar y Confirmar 🟢");
    expect(html).toContain("Platos de la Semana");
  });

  it("does not render contents when open is false", () => {
    const html = renderToString(
      <UniversalOrderIntakeDrawer
        open={false}
        onOpenChange={() => {}}
      />,
    );

    expect(html).not.toContain("Captura Universal de Pedido");
  });

  it("ARCHITECTURE LAW 003: does not query dishes table directly or reference category column", () => {
    const filePath = path.resolve(__dirname, "./universal-order-intake-drawer.tsx");
    const source = fs.readFileSync(filePath, "utf8");

    // Must NOT query dishes catalog table directly for ordering offer
    expect(source).not.toMatch(/\.from\(["']dishes["']\)/);

    // Must NOT reference the non-existent dishes.category column
    expect(source).not.toMatch(/select\(["'].*category[,"']/);

    // MUST consume canonical fetchPublishedWeeklyMenu
    expect(source).toMatch(/fetchPublishedWeeklyMenu/);
    expect(source).toMatch(/from ["']@\/modules\/weekly-menu\/application\/weekly-menu-queries["']/);

    // MUST render DishThumb for canonical photo / fallback representation
    expect(source).toMatch(/DishThumb/);
    expect(source).toMatch(/from ["']@\/components\/consumer\/dish-thumb["']/);
  });

  it("verifies contract adherence: handles empty state messaging and multi-tenant isolation", () => {
    const filePath = path.resolve(__dirname, "./universal-order-intake-drawer.tsx");
    const source = fs.readFileSync(filePath, "utf8");

    // Contract strings for empty state handling
    expect(source).toContain("No hay menú publicado para esta semana");
    expect(source).toContain("Sin platos planificados para este día");

    // Multi-tenant parameter passing
    expect(source).toContain("fetchPublishedWeeklyMenu(tenantId!, weekStart)");
  });
});
