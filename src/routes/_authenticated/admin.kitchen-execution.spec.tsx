import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { analyzeKitchenConsumptionLines, KitchenExecutionPage } from "./admin.kitchen-execution";
import type { ConsumptionLine } from "@/modules/inventory/domain/inventory-consumption";

// Mock Radix dialogs & accordions for SSR rendering
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: any) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/accordion", () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <button>{children}</button>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock TanStack router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    useSearch: () => ({ date: "2026-10-27" }),
  }),
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

// Mock permissions & auth
let mockCapabilities = new Set<string>(["kitchen.operate"]);
let mockRoles = ["kitchen"];
const mockUser = { id: "user-kitchen-only" };
let mockTenantId = "tenant-eatclean";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    tenantId: mockTenantId,
    roles: mockRoles,
  }),
}));

vi.mock("@/hooks/use-can", () => ({
  useCan: () => ({
    can: (cap: string) => mockCapabilities.has(cap),
  }),
}));

vi.mock("@/permissions/route-guards", () => ({
  assertCapabilityFromContext: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
}));

vi.mock("@/services/types", () => ({
  createServiceContext: async () => ({
    supabase: {},
    userId: mockUser.id,
    tenantId: mockTenantId,
    roles: mockRoles,
    capabilities: mockCapabilities,
  }),
}));

vi.mock("@/modules/operations", () => ({
  KitchenExecutionService: {
    getProductionReportByDate: vi.fn().mockResolvedValue({
      deliveryDate: "2026-10-27",
      totalPortions: 10,
      standardDishes: [],
      customizations: [],
    }),
  },
  kitchenBatchStatusLabel: () => "Pendiente",
  nextKitchenBatchStatuses: () => [],
  primaryKitchenBatchAction: () => null,
}));

vi.mock("@/modules/inventory/application/inventory-service", () => ({
  InventoryService: {
    getConsumptionByDate: vi.fn().mockResolvedValue(null),
    getInventoryStock: vi.fn().mockResolvedValue([]),
    planConsumptionFromProduction: vi.fn(),
    applyConsumption: vi.fn(),
    sealConsumption: vi.fn(),
  },
}));

describe("Kitchen FLOW-04 Presentation & Absence Contract", () => {
  const sampleLines: ConsumptionLine[] = [
    {
      ingredientId: "ing-chicken",
      name: "Pechuga de Pollo",
      qty: 2.5,
      unit: "kg",
    },
    {
      ingredientId: "ing-rice",
      name: "Arroz Integral",
      qty: 1.0,
      unit: "kg",
    },
  ];

  describe("analyzeKitchenConsumptionLines contract", () => {
    it("an ingredient absent from the stock map produces isMissing: true, isDeficit: true, and never announces 'Stock suficiente'", () => {
      // Stock map contains Rice, but Chicken is entirely absent
      const stockMap = new Map<string, { stock: number; unit: string }>([
        ["ing-rice", { stock: 5.0, unit: "kg" }],
      ]);

      const analysis = analyzeKitchenConsumptionLines(sampleLines, stockMap, "planned");

      // Chicken (absent from stockMap)
      const chicken = analysis.find((a) => a.line.ingredientId === "ing-chicken")!;
      expect(chicken.stockKnown).toBe(true);
      expect(chicken.stockItem).toBeNull();
      expect(chicken.isMissing).toBe(true);
      expect(chicken.isDeficit).toBe(true);
      expect(chicken.availableInLineUnit).toBe(0);
      expect(chicken.displayText).toBe("0 kg");

      // Rice (present with sufficient stock)
      const rice = analysis.find((a) => a.line.ingredientId === "ing-rice")!;
      expect(rice.stockKnown).toBe(true);
      expect(rice.isMissing).toBe(false);
      expect(rice.isDeficit).toBe(false);
      expect(rice.availableInLineUnit).toBe(5.0);
      expect(rice.displayText).toBe("5,00 kg");

      // Metric calculations
      const insufficientLines = analysis.filter((item) => item.isDeficit);
      const missingLines = analysis.filter((item) => item.isMissing);
      const hasInsufficientStock = insufficientLines.length > 0;
      const hasMissingIngredients = missingLines.length > 0;

      // Fail-closed invariants
      expect(hasInsufficientStock).toBe(true);
      expect(hasMissingIngredients).toBe(true);
      const isStockSufficient = !hasInsufficientStock && !hasMissingIngredients;
      expect(isStockSufficient).toBe(false); // MUST NEVER BE SUFFICIENT
    });

    it("treats null stockMap as unverifiable / unknown rather than assuming deficit or sufficiency", () => {
      const analysis = analyzeKitchenConsumptionLines(sampleLines, null, "planned");

      for (const item of analysis) {
        expect(item.stockKnown).toBe(false);
        expect(item.stockItem).toBeNull();
        expect(item.isMissing).toBe(false);
        expect(item.isDeficit).toBe(false);
        expect(item.availableInLineUnit).toBeNull();
        expect(item.displayText).toBe("Desconocido");
      }
    });

    it("detects unit incompatibility without claiming false deficit", () => {
      // Stock item is in 'unidades', recipe is in 'kg'
      const stockMap = new Map<string, { stock: number; unit: string }>([
        ["ing-chicken", { stock: 10, unit: "unidades" }],
      ]);

      const analysis = analyzeKitchenConsumptionLines([sampleLines[0]], stockMap, "planned");
      const chicken = analysis[0];
      expect(chicken.isIncompatible).toBe(true);
      expect(chicken.isDeficit).toBe(false);
      expect(chicken.isMissing).toBe(false);
      expect(chicken.availableInLineUnit).toBeNull();
      expect(chicken.displayText).toBe("10,00 unidades");
    });

    it("reports stock sufficient only when all ingredients are present with stock >= line.qty and compatible units", () => {
      const stockMap = new Map<string, { stock: number; unit: string }>([
        ["ing-chicken", { stock: 3.0, unit: "kg" }],
        ["ing-rice", { stock: 2.0, unit: "kg" }],
      ]);

      const analysis = analyzeKitchenConsumptionLines(sampleLines, stockMap, "planned");

      expect(analysis.every((a) => !a.isDeficit && !a.isMissing && !a.isIncompatible)).toBe(true);
      const hasShortage = analysis.some((a) => a.isDeficit || a.isMissing);
      expect(hasShortage).toBe(false);
    });
  });

  describe("KitchenExecutionPage SSR / Component Permissions", () => {
    beforeEach(() => {
      mockCapabilities = new Set(["kitchen.operate"]);
      mockRoles = ["kitchen"];
      mockTenantId = "tenant-eatclean";
    });

    it("renders page without mutation buttons when user has only kitchen.operate", () => {
      const html = renderToString(<KitchenExecutionPage />);

      // Workspace title exists
      expect(html).toContain("Ejecución de Cocina");

      // Mutation buttons must NOT exist in SSR output
      expect(html).not.toContain('data-testid="plan-consumption-button"');
      expect(html).not.toContain('data-testid="apply-consumption-button"');
      expect(html).not.toContain('data-testid="seal-consumption-button"');
    });
  });
});
