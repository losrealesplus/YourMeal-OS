import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { IndirectCostQuickEditModal } from "./IndirectCostQuickEditModal";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children?: React.ReactNode; open?: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
  DialogDescription: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => <p className={className}>{children}</p>,
  DialogFooter: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("IndirectCostQuickEditModal Component (CR-COST-05)", () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    tenantId: "tenant_eatclean_pilot",
    dishId: "dish_123",
    dishName: "Bowl Salmón Especial",
    currentOverheads: {
      laborCost: 1.2,
      energyCost: 0.3,
      packagingCost: 0.45,
    },
    manualCost: 3.5,
    salesPrice: 9.9,
    hasRecipe: true,
  };

  it("1. Renders complete modal in edit mode with non-retroactivity warning", () => {
    const html = renderToString(<IndirectCostQuickEditModal {...baseProps} canEdit={true} />);

    expect(html).toContain("Bowl Salmón Especial");
    expect(html).toContain("Imputar Costes de Ficha");
    expect(html).toContain("Guardar en Catálogo");
    expect(html).toContain("Aviso de Procedencia y Alcance");
    expect(html).toContain("No modifican facturas de compra pasadas");
  });

  it("2. Enforces consultation-only mode when canEdit is false (disables mutation)", () => {
    const html = renderToString(<IndirectCostQuickEditModal {...baseProps} canEdit={false} />);

    expect(html).toContain("Consultar Datos de Coste");
    expect(html).toContain("Modo de solo consulta: Permisos insuficientes");
    expect(html).not.toContain("Guardar en Catálogo");
    expect(html).toContain("Cerrar");
    expect(html).toContain("disabled");
  });

  it("3. Clearly displays missing data reasons when dish is incomplete", () => {
    const html = renderToString(
      <IndirectCostQuickEditModal
        {...baseProps}
        hasRecipe={false}
        manualCost={null}
        missingReasons={[
          "Sin escandallo en Dish Library",
          "Sin coste manual registrado en catálogo",
        ]}
        canEdit={true}
      />,
    );

    expect(html).toContain("Completar Datos de Ficha");
    expect(html).toContain("Información Pendiente para este Plato");
    expect(html).toContain("Sin escandallo en Dish Library");
    expect(html).toContain("Sin coste manual registrado en catálogo");
    expect(html).toContain("SIN RECETA");
    expect(html).toContain("Coste Base Materia Prima");
  });

  it("4. Does not render content when open is false", () => {
    const html = renderToString(<IndirectCostQuickEditModal {...baseProps} open={false} />);
    expect(html).toBe("");
  });
});
