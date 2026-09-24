import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { MonthlyOperationsCalendar } from "./monthly-operations-calendar";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

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
    roles: ["operations_manager", "kitchen.operate"],
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
            gte: () => ({
              lte: () => ({
                is: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
          gte: () => ({
            lte: () => ({
              is: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }),
  },
}));

describe("MonthlyOperationsCalendar Component Rendering (G5)", () => {
  it("renders calendar heading, month navigation, and action buttons", () => {
    const html = renderToString(
      <MonthlyOperationsCalendar initialMonth="2026-09" />,
    );

    expect(html).toContain("Calendario Mensual Operativo");
    expect(html).toContain("Septiembre 2026");
    expect(html).toContain("Actualizar");
    expect(html).toContain("+ Nuevo Pedido");
  });

  it("renders the 3 operational KPI cards", () => {
    const html = renderToString(
      <MonthlyOperationsCalendar initialMonth="2026-09" />,
    );

    expect(html).toContain("Total Raciones Mes");
    expect(html).toContain("Pedidos Únicos Mes");
    expect(html).toContain("Días con Producción");
  });

  it("renders weekday column headers for Spanish locale", () => {
    const html = renderToString(
      <MonthlyOperationsCalendar initialMonth="2026-10" />,
    );

    expect(html).toContain("Octubre 2026");
  });
});
