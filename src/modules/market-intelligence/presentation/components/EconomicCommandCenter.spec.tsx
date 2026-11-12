import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  EconomicCommandCenter,
  persistDecisionIntent,
} from "./EconomicCommandCenter";
import { executeCatalogCsvIngestion } from "./CatalogIngestionDrawer";

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

describe("EconomicCommandCenter & CatalogIngestionDrawer (CR-COST-05 PR1 Integrity)", () => {
  it("renders honest empty state with zero synthetic benchmarks or hardcoded fixtures", () => {
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
      <EconomicCommandCenter
        tenantId="11111111-1111-4111-8111-111111111111"
        tenantName="EatClean"
        userId="22222222-2222-4222-8222-222222222222"
        ingredients={[
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Pechuga de Pollo",
            unit: "kg",
            cost: 6.4,
            category: "Cárnicos",
            annualVolume: 500,
          },
        ]}
        dishes={[
          {
            id: "44444444-4444-4444-8444-444444444444",
            name: "Pollo Teriyaki",
            price: 11.5,
            cost: 3.1,
            laborCost: 0,
            energyCost: 0,
            packagingCost: 0,
            recipeIngredients: [
              { ingredientId: "33333333-3333-4333-8333-333333333333", amount: 0.25 },
            ],
          },
        ]}
      />,
    );

    // Honest empty telemetry
    expect(html).toContain("Pechuga de Pollo");
    expect(html).toContain("Sin datos mapeados");
    expect(html).toContain("Sin benchmark observable");
    expect(html).toContain("Sin fuentes activas");
    expect(html).toContain("0 (sin observaciones mapeadas)");

    // Forbidden legacy synthetic values & labels
    expect(html).not.toContain("5.70");
    expect(html).not.toContain("5.53");
    expect(html).not.toContain("7.20");
    expect(html).not.toContain("30.1");
    expect(html).not.toContain("Makro, Mercadona");
    expect(html).not.toContain("[FIXTURE]");
    expect(html).not.toContain("SIMULADO · FIXTURE");
  });

  it("persists decision intents with valid scenario_id, valid enum values, and pending_action status", async () => {
    const scenarioInserts: Array<Record<string, unknown>> = [];
    const intentInserts: Array<Record<string, unknown>> = [];
    const createdScenarioId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const createdIntentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    const mockSupabase = {
      from: (table: string) => {
        if (table === "cost_simulation_scenarios") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
              }),
            }),
            insert: (payload: Record<string, unknown>) => {
              scenarioInserts.push(payload);
              return {
                select: () => ({
                  single: async () => ({ data: { id: createdScenarioId }, error: null }),
                }),
              };
            },
          };
        }

        if (table === "cost_decision_intents") {
          return {
            insert: (payload: Record<string, unknown>) => {
              intentInserts.push(payload);
              return {
                select: () => ({
                  single: async () => ({
                    data: {
                      id: createdIntentId,
                      recorded_at: "2026-11-12T18:00:00.000Z",
                    },
                    error: null,
                  }),
                }),
              };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };

    const onScenarioCreated = vi.fn();

    const record = await persistDecisionIntent({
      supabaseClient: mockSupabase as never,
      tenantId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      userName: "Alex",
      activeScenarioId: null,
      onScenarioCreated,
      ingredientsCount: 1,
      dishesCount: 1,
      opportunity: {
        id: "opp-1",
        ingredientId: "33333333-3333-4333-8333-333333333333",
        ingredientName: "Salmón Fresco",
        category: "Pescados",
        unit: "kg",
        effectiveWacExTax: 14.5,
        benchmarkPriceExTax: 12.8,
        variancePct: 13.28,
        comparabilityGrade: "HIGH",
        annualVolume: 1000,
        potentialAnnualSavingsEur: 1700,
        actionabilityGrade: "DIRECT_ACTION",
        lifecycleState: "DETECTED",
        calculation: null,
        affectedDishes: [],
      },
      intentType: "investigate_further", // legacy invalid enum -> coerced to 'other'
      targetPrice: "12.80",
      targetDate: "2026-11-27",
      intentRationale: "Validar alternativa de proveedor",
    });

    expect(scenarioInserts).toHaveLength(1);
    expect(onScenarioCreated).toHaveBeenCalledWith(createdScenarioId);
    expect(intentInserts).toHaveLength(1);
    expect(intentInserts[0].scenario_id).toBe(createdScenarioId);
    expect(intentInserts[0].intent_type).toBe("other");
    expect(intentInserts[0].status).toBe("pending_action");
    expect(intentInserts[0].target_entity_type).toBe("ingredient");
    expect(intentInserts[0].target_entity_id).toBe("33333333-3333-4333-8333-333333333333");
    expect(intentInserts[0].recorded_by).toBe("22222222-2222-4222-8222-222222222222");
    expect(record.id).toBe(createdIntentId);
    expect(record.intentType).toBe("other");
    expect(record.targetPriceExTax).toBe(12.8);
  });

  it("throws visibly when Supabase rejects cost_decision_intents insert instead of silent catch", async () => {
    const mockSupabase = {
      from: (table: string) => {
        if (table === "cost_decision_intents") {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: { message: "new row violates check constraint" },
                }),
              }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    };

    await expect(
      persistDecisionIntent({
        supabaseClient: mockSupabase as never,
        tenantId: "11111111-1111-4111-8111-111111111111",
        userId: "22222222-2222-4222-8222-222222222222",
        activeScenarioId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        ingredientsCount: 1,
        dishesCount: 0,
        opportunity: {
          id: "opp-1",
          ingredientId: "33333333-3333-4333-8333-333333333333",
          ingredientName: "Salmón Fresco",
          category: "Pescados",
          unit: "kg",
          effectiveWacExTax: 14.5,
          benchmarkPriceExTax: null,
          variancePct: null,
          comparabilityGrade: "UNKNOWN",
          annualVolume: null,
          potentialAnnualSavingsEur: null,
          actionabilityGrade: "INSUFFICIENT",
          lifecycleState: "DETECTED",
          calculation: null,
          affectedDishes: [],
        },
        intentType: "renegotiate_supplier",
        targetPrice: "12.80",
        targetDate: "2026-11-27",
        intentRationale: "Prueba fallo DB",
      }),
    ).rejects.toThrow("new row violates check constraint");
  });

  it("blocks CSV ingestion when session userId is not a valid UUID and wires selectedSourceId + scope when valid", async () => {
    const ingestCsv = vi.fn(async () => ({
      totalRows: 1,
      validCount: 1,
      quarantinedCount: 0,
      createdProductsCount: 1,
      createdObservationsCount: 1,
      updatedObservationsCount: 0,
      createdTiersCount: 0,
      quarantinedRows: [],
    }));

    const mockService = { ingestCsv } as never;

    await expect(
      executeCatalogCsvIngestion({
        ingestionService: mockService,
        csvContent: "sku,producto,precio,unidad\nA1,Arroz,1.20,kg",
        fileName: "test.csv",
        userId: "current_user",
        selectedSourceId: "55555555-5555-4555-8555-555555555555",
        visibilityScope: "public",
      }),
    ).rejects.toThrow("UUID");

    expect(ingestCsv).not.toHaveBeenCalled();

    const validUserId = "22222222-2222-4222-8222-222222222222";
    const sourceId = "55555555-5555-4555-8555-555555555555";
    const tenantId = "11111111-1111-4111-8111-111111111111";

    await executeCatalogCsvIngestion({
      ingestionService: mockService,
      csvContent: "sku,producto,precio,unidad\nA1,Arroz,1.20,kg",
      fileName: "test.csv",
      userId: validUserId,
      selectedSourceId: sourceId,
      visibilityScope: "private",
      tenantId,
    });

    expect(ingestCsv).toHaveBeenCalledWith(
      "sku,producto,precio,unidad\nA1,Arroz,1.20,kg",
      {
        fileName: "test.csv",
        importedBy: validUserId,
        defaultSourceId: sourceId,
        ownerTenantId: tenantId,
      },
    );
  });
});
