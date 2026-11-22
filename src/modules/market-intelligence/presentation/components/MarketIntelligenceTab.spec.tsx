import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { MarketIntelligenceTab } from "./MarketIntelligenceTab";

const mockUseMarketIntelligence = vi.fn();

vi.mock("../hooks/use-market-intelligence", () => ({
  useMarketIntelligence: (...args: unknown[]) => mockUseMarketIntelligence(...args),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children?: React.ReactNode; open?: boolean }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

vi.mock("./MarketInquiryExplorerModal", () => ({
  MarketInquiryExplorerModal: () => null,
}));

describe("MarketIntelligenceTab (CR-COST-05 Cold Start & Actionability)", () => {
  it("renders actionable cold-start guide when no market sources exist", () => {
    mockUseMarketIntelligence.mockReturnValue({
      sources: [],
      marketProducts: [],
      mappings: [],
      benchmarksByIngredient: new Map(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      ingestionService: {} as never,
      mappingService: {} as never,
      generateNegotiationBrief: vi.fn(),
    });

    const html = renderToString(
      <MarketIntelligenceTab
        tenantId="11111111-1111-4111-8111-111111111111"
        tenantName="EatClean"
        ingredients={[]}
      />,
    );

    // Header with updated CSV/PDF action
    expect(html).toContain("Inteligencia de Precios de Mercado");
    expect(html).toContain("Importar Catálogo (CSV / PDF)");
    expect(html).toContain("Preguntar al Mercado");

    // Actionable empty state in benchmark table
    expect(html).toContain("Sin fuentes ni catálogos de mercado activos");
    expect(html).toContain("Para calcular benchmarks y comparar precios de compra");
    expect(html).toContain("Cola de Mapeo");
  });
});
