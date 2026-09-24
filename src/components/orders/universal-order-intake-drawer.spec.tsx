import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
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

describe("UniversalOrderIntakeDrawer Component Rendering (G4)", () => {
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
});
