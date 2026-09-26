/**
 * ADMIN · Cost Intelligence & E9 Decision Cockpit (CR-COST-03)
 * Subsystem: Platform Core / Cost Intelligence
 * Capabilities: inventory.read / inventory.operate / operations_manager
 */

import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  AlertTriangle,
  Play,
  Save,
  Plus,
  ArrowRight,
  Sliders,
  DollarSign,
  PieChart,
  History,
  CheckCircle2,
  FileText,
  Filter,
} from "lucide-react";
import { AdminHeader, PanelCard, SectionTitle, StatusChip } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { simulateScenario } from "@/modules/cost-intelligence/domain/cost-simulation-engine";
import type {
  CostBaselineSnapshot,
  HypotheticalVariables,
  ScenarioResult,
} from "@/modules/cost-intelligence/domain/types";
import type {
  ScenarioPresetType,
  DecisionIntentType,
} from "@/modules/cost-intelligence/domain/scenario-types";

export const Route = createFileRoute("/_authenticated/admin/cost-intelligence")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "inventory.operate");
  },
  component: CostIntelligenceCockpitPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Cost Intelligence Cockpit" },
      {
        name: "description",
        content: "Simulación de escenarios económicos E9, análisis de costes y registro de decisiones.",
      },
    ],
  }),
});

// Sample Live Baseline for EatClean
const EATCLEAN_LIVE_BASELINE: CostBaselineSnapshot = {
  snapshotId: "snap-eatclean-live-20260926",
  createdAt: "2026-09-26T16:00:00Z",
  products: [
    {
      productId: "dish-poke-salmon",
      productName: "Salmon Quinoa Poke Bowl",
      salesPrice: 12.90,
      monthlyVolume: 450,
      bomComponents: [
        {
          componentId: "ing-salmon",
          componentName: "Salmón Noruego Fresco",
          quantity: 0.16,
          unit: "kg",
          unitCost: 14.50,
          yieldLoss: { wastePercentage: 0.08 },
          supplierId: "sup-pescados-canarias",
        },
        {
          componentId: "ing-quinoa",
          componentName: "Quinoa Real Orgánica",
          quantity: 0.10,
          unit: "kg",
          unitCost: 2.80,
          yieldLoss: { wastePercentage: 0.02 },
          supplierId: "sup-granos-bio",
        },
        {
          componentId: "ing-avocado",
          componentName: "Aguacate Hass Tenerife",
          quantity: 0.08,
          unit: "kg",
          unitCost: 4.20,
          yieldLoss: { wastePercentage: 0.15 },
          supplierId: "sup-mercatenerife",
        },
      ],
      overheads: {
        laborCost: 1.40,
        energyCost: 0.45,
        packagingCost: 0.65,
      },
    },
    {
      productId: "dish-curry-garbanzos",
      productName: "Curry Cremoso de Garbanzos & Coco",
      salesPrice: 9.50,
      monthlyVolume: 600,
      bomComponents: [
        {
          componentId: "ing-garbanzos",
          componentName: "Garbanzos Ecológicos",
          quantity: 0.20,
          unit: "kg",
          unitCost: 1.60,
          yieldLoss: { wastePercentage: 0.03 },
          supplierId: "sup-granos-bio",
        },
        {
          componentId: "ing-leche-coco",
          componentName: "Leche de Coco 100%",
          quantity: 0.15,
          unit: "L",
          unitCost: 2.20,
          supplierId: "sup-import-gourmet",
        },
      ],
      overheads: {
        laborCost: 1.10,
        energyCost: 0.40,
        packagingCost: 0.65,
      },
    },
    {
      productId: "dish-pollo-teriyaki",
      productName: "Pollo de Corral Teriyaki & Arroz",
      salesPrice: 11.50,
      monthlyVolume: 520,
      bomComponents: [
        {
          componentId: "ing-pechuga-pollo",
          componentName: "Pechuga Pollo Corral",
          quantity: 0.22,
          unit: "kg",
          unitCost: 7.20,
          yieldLoss: { wastePercentage: 0.05 },
          supplierId: "sup-carnes-norte",
        },
        {
          componentId: "ing-arroz-jazmin",
          componentName: "Arroz Jazmín",
          quantity: 0.12,
          unit: "kg",
          unitCost: 1.80,
          supplierId: "sup-granos-bio",
        },
      ],
      overheads: {
        laborCost: 1.30,
        energyCost: 0.45,
        packagingCost: 0.65,
      },
    },
  ],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)} %`;
}

export function CostIntelligenceCockpitPage() {
  const [activeTab, setActiveTab] = useState<"simulator" | "anatomy" | "anomalies" | "history">("simulator");
  const [preset, setPreset] = useState<ScenarioPresetType>("supplier_hike");
  const [targetMarginThreshold, setTargetMarginThreshold] = useState<number>(60.0); // Configurable threshold %
  const [selectedProductDriver, setSelectedProductDriver] = useState<string | null>(null);

  // Simulation Variables State
  const [salmonInflationPct, setSalmonInflationPct] = useState<number>(15);
  const [energyInflationPct, setEnergyInflationPct] = useState<number>(10);
  const [laborInflationPct, setLaborInflationPct] = useState<number>(0);

  // Decision Intent Dialog State
  const [isIntentDialogOpen, setIsIntentDialogOpen] = useState(false);
  const [intentType, setIntentType] = useState<DecisionIntentType>("renegotiate_supplier");
  const [intentRationale, setIntentRationale] = useState("");
  const [intentDate, setIntentDate] = useState("2026-10-01");

  // Simulated Saved State
  const [savedIntents, setSavedIntents] = useState<Array<{
    id: string;
    scenarioName: string;
    intentType: DecisionIntentType;
    rationale: string;
    date: string;
    status: string;
  }>>([
    {
      id: "int-1",
      scenarioName: "Shock Pescado Q4",
      intentType: "renegotiate_supplier",
      rationale: "Fijar precio con Pescados Canarias a 13.80€/kg hasta diciembre.",
      date: "2026-10-01",
      status: "pending_action",
    },
  ]);

  // Construct hypothetical variables from state
  const hypotheticalVariables: HypotheticalVariables = useMemo(() => {
    return {
      itemCostDeltas: {
        "ing-salmon": salmonInflationPct / 100,
      },
      overheadDeltas: {
        energyRateDeltaPct: energyInflationPct / 100,
        laborRateDeltaPct: laborInflationPct / 100,
      },
    };
  }, [salmonInflationPct, energyInflationPct, laborInflationPct]);

  // Execute E9 Simulation in Pure Memory (Zero side effects)
  const simulationResult: ScenarioResult = useMemo(() => {
    return simulateScenario(EATCLEAN_LIVE_BASELINE, hypotheticalVariables, {
      scenarioId: "sc-cockpit-live",
      name: "Simulación Cockpit",
    });
  }, [hypotheticalVariables]);

  const handleApplyPreset = (p: ScenarioPresetType) => {
    setPreset(p);
    if (p === "supplier_hike") {
      setSalmonInflationPct(15);
      setEnergyInflationPct(0);
      setLaborInflationPct(0);
    } else if (p === "energy_surge") {
      setSalmonInflationPct(0);
      setEnergyInflationPct(25);
      setLaborInflationPct(0);
    } else if (p === "labor_escalation") {
      setSalmonInflationPct(0);
      setEnergyInflationPct(0);
      setLaborInflationPct(10);
    } else if (p === "item_inflation") {
      setSalmonInflationPct(20);
      setEnergyInflationPct(5);
      setLaborInflationPct(0);
    } else if (p === "yield_optimization") {
      setSalmonInflationPct(-5);
      setEnergyInflationPct(0);
      setLaborInflationPct(0);
    }
  };

  const handleSaveDecisionIntent = () => {
    if (!intentRationale.trim()) {
      toast.error("Por favor, describe el motivo de la decisión.");
      return;
    }

    setSavedIntents((prev) => [
      ...prev,
      {
        id: `int-${Date.now()}`,
        scenarioName: "Simulación Cockpit Actual",
        intentType,
        rationale: intentRationale.trim(),
        date: intentDate,
        status: "pending_action",
      },
    ]);

    toast.success("Decisión registrada correctamente en el audit trail.");
    setIsIntentDialogOpen(false);
    setIntentRationale("");
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        goal="Simulación de escenarios económicos E9 y análisis de escandallos"
        capability="inventory.operate"
        object="CostSimulation"
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cost Intelligence Cockpit</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Simulación económica What-If (E9), análisis de escandallos WAC y registro de decisiones de gestión.
        </p>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("simulator")}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2",
            activeTab === "simulator"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Play className="h-4 w-4" />
          Simulador de Escenarios (E9)
        </button>
        <button
          onClick={() => setActiveTab("anatomy")}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2",
            activeTab === "anatomy"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <PieChart className="h-4 w-4" />
          Anatomía de Costes Live
        </button>
        <button
          onClick={() => setActiveTab("anomalies")}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2",
            activeTab === "anomalies"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Desviaciones & Anomalías
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2",
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <History className="h-4 w-4" />
          Histórico de Decisiones ({savedIntents.length})
        </button>
      </div>

      {activeTab === "simulator" && (
        <div className="space-y-6">
          {/* Executive Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <PanelCard className="p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Coste Mensual Simulado
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(simulationResult.summary.totalSimulatedMonthlyCost)}
              </div>
              <div className="text-xs mt-1 text-muted-foreground flex items-center gap-1">
                <span>Baseline: {formatCurrency(simulationResult.summary.totalCurrentMonthlyCost)}</span>
                <Badge
                  variant={simulationResult.summary.totalMonthlyCostDelta > 0 ? "destructive" : "secondary"}
                  className="text-[10px] ml-auto"
                >
                  {simulationResult.summary.totalMonthlyCostDelta > 0 ? "+" : ""}
                  {formatCurrency(simulationResult.summary.totalMonthlyCostDelta)}
                </Badge>
              </div>
            </PanelCard>

            <PanelCard className="p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Margen Bruto Medio
              </div>
              <div className="text-2xl font-bold mt-1">
                {(
                  simulationResult.products.reduce((acc, p) => acc + p.simulatedMarginPct, 0) /
                  simulationResult.products.length
                ).toFixed(2)} %
              </div>
              <div className="text-xs mt-1 text-muted-foreground flex items-center gap-1">
                <span>Delta margen:</span>
                <span
                  className={cn(
                    "font-semibold ml-auto",
                    simulationResult.summary.avgMarginDeltaPct < 0 ? "text-destructive" : "text-primary",
                  )}
                >
                  {formatPercent(simulationResult.summary.avgMarginDeltaPct)}
                </span>
              </div>
            </PanelCard>

            <PanelCard className="p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Impacto en Beneficio
              </div>
              <div
                className={cn(
                  "text-2xl font-bold mt-1",
                  simulationResult.summary.totalMonthlyProfitImpact < 0 ? "text-destructive" : "text-primary",
                )}
              >
                {formatCurrency(simulationResult.summary.totalMonthlyProfitImpact)}
              </div>
              <div className="text-xs mt-1 text-muted-foreground">Impacto mensual proyectado</div>
            </PanelCard>

            <PanelCard className="p-4 bg-muted/30 flex flex-col justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                  Acción Estratégica
                </div>
                <div className="text-xs mt-1 text-muted-foreground">
                  Registrar decisión humana informada por este escenario.
                </div>
              </div>
              <Button
                onClick={() => setIsIntentDialogOpen(true)}
                className="w-full mt-2 gap-2"
                variant="default"
              >
                <CheckCircle2 className="h-4 w-4" />
                Registrar Decisión
              </Button>
            </PanelCard>
          </div>

          {/* Scenario Variables & Presets Controls */}
          <PanelCard className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Variables de Simulación & Plantillas</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Plantilla rápida:</span>
                <Select value={preset} onValueChange={(val) => handleApplyPreset(val as ScenarioPresetType)}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier_hike">Subida Proveedor (+15%)</SelectItem>
                    <SelectItem value="energy_surge">Shock Energético (+25%)</SelectItem>
                    <SelectItem value="labor_escalation">Coste Laboral (+10%)</SelectItem>
                    <SelectItem value="item_inflation">Inflación Materias Primas</SelectItem>
                    <SelectItem value="yield_optimization">Mejora de Rendimiento (-5%)</SelectItem>
                    <SelectItem value="custom">Personalizado (Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <Label>Inflación Salmón (Materia Prima)</Label>
                  <span className="text-primary font-bold">{salmonInflationPct > 0 ? "+" : ""}{salmonInflationPct}%</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="1"
                  value={salmonInflationPct}
                  onChange={(e) => {
                    setPreset("custom");
                    setSalmonInflationPct(Number(e.target.value));
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <Label>Variación Tarifa Eléctrica</Label>
                  <span className="text-primary font-bold">{energyInflationPct > 0 ? "+" : ""}{energyInflationPct}%</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="1"
                  value={energyInflationPct}
                  onChange={(e) => {
                    setPreset("custom");
                    setEnergyInflationPct(Number(e.target.value));
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <Label>Variación Coste Mano de Obra</Label>
                  <span className="text-primary font-bold">{laborInflationPct > 0 ? "+" : ""}{laborInflationPct}%</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  step="1"
                  value={laborInflationPct}
                  onChange={(e) => {
                    setPreset("custom");
                    setLaborInflationPct(Number(e.target.value));
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>
          </PanelCard>

          {/* Product Portfolio Matrix & Target Margin Filter */}
          <PanelCard className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
              <div>
                <h3 className="font-semibold text-base">Matriz de Impacto por Producto</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Comparación side-by-side entre coste real y simulación What-If.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-md border text-xs">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="threshold" className="text-xs font-medium">
                  Margen Objetivo Mínimo:
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="threshold"
                    type="number"
                    value={targetMarginThreshold}
                    onChange={(e) => setTargetMarginThreshold(Number(e.target.value))}
                    className="w-16 h-7 text-xs"
                    min="0"
                    max="100"
                  />
                  <span className="font-semibold">%</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b uppercase font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Plato / Producto</th>
                    <th className="py-2.5 px-3 text-right">PVP</th>
                    <th className="py-2.5 px-3 text-right">Coste Real</th>
                    <th className="py-2.5 px-3 text-right">Coste Simulado</th>
                    <th className="py-2.5 px-3 text-right">Δ Coste</th>
                    <th className="py-2.5 px-3 text-right">Margen Real</th>
                    <th className="py-2.5 px-3 text-right">Margen Simulado</th>
                    <th className="py-2.5 px-3 text-center">Estado Margen</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {simulationResult.products.map((prod) => {
                    const isBelowThreshold = prod.simulatedMarginPct < targetMarginThreshold;
                    return (
                      <tr key={prod.productId} className="hover:bg-muted/20">
                        <td className="py-3 px-3 font-semibold">{prod.productName}</td>
                        <td className="py-3 px-3 text-right font-medium">{formatCurrency(prod.salesPrice)}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground">{formatCurrency(prod.currentCost)}</td>
                        <td className="py-3 px-3 text-right font-bold">{formatCurrency(prod.simulatedCost)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-destructive">
                          +{formatCurrency(prod.costDelta)}
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground">{prod.currentMarginPct.toFixed(2)}%</td>
                        <td className="py-3 px-3 text-right font-bold">
                          <span className={cn(isBelowThreshold ? "text-destructive" : "text-primary")}>
                            {prod.simulatedMarginPct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isBelowThreshold ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Bajo Objetivo (&lt;{targetMarginThreshold}%)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary">
                              Óptimo
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() =>
                              setSelectedProductDriver(
                                selectedProductDriver === prod.productId ? null : prod.productId,
                              )
                            }
                          >
                            Ver Drivers
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Drilldown Cost Driver Drawer / Expanded View */}
            {selectedProductDriver && (
              <div className="bg-muted/30 p-4 rounded-lg border border-primary/20 mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    Desglose de Cost Drivers:{" "}
                    {
                      simulationResult.products.find((p) => p.productId === selectedProductDriver)
                        ?.productName
                    }
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setSelectedProductDriver(null)}
                  >
                    Cerrar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Impacto individual de ingredientes, energía, mano de obra y mermas en este plato.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-background rounded border">
                    <div className="text-muted-foreground">Materia Prima Directa</div>
                    <div className="font-bold text-sm mt-1">Salmón Noruego (+15%)</div>
                    <div className="text-destructive font-semibold mt-0.5">+0,35 € / ración</div>
                  </div>
                  <div className="p-3 bg-background rounded border">
                    <div className="text-muted-foreground">Energía (Dark Kitchen)</div>
                    <div className="font-bold text-sm mt-1">Tarifa Luz (+{energyInflationPct}%)</div>
                    <div className="text-destructive font-semibold mt-0.5">
                      +{((0.45 * energyInflationPct) / 100).toFixed(2)} € / ración
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded border">
                    <div className="text-muted-foreground">Mermas de Preparación</div>
                    <div className="font-bold text-sm mt-1">Merma Limpieza Salmón (8%)</div>
                    <div className="text-muted-foreground font-semibold mt-0.5">0,19 € absorbido</div>
                  </div>
                </div>
              </div>
            )}
          </PanelCard>
        </div>
      )}

      {activeTab === "anatomy" && (
        <PanelCard className="p-5 space-y-4">
          <SectionTitle title="Anatomía de Costes Live (WAC & Escandallos)" />
          <p className="text-xs text-muted-foreground">
            Desglose de costes operativos actuales derivados del histórico WAC y recetas activas en EatClean.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {EATCLEAN_LIVE_BASELINE.products.map((p) => (
              <div key={p.productId} className="p-4 bg-muted/20 border rounded-lg space-y-2 text-xs">
                <div className="font-bold text-sm">{p.productName}</div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">PVP:</span>
                  <span className="font-semibold">{formatCurrency(p.salesPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mano de Obra:</span>
                  <span>{formatCurrency(p.overheads.laborCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energía:</span>
                  <span>{formatCurrency(p.overheads.energyCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Packaging:</span>
                  <span>{formatCurrency(p.overheads.packagingCost)}</span>
                </div>
                <div className="pt-2 border-t font-semibold flex justify-between">
                  <span>Ingredientes ({p.bomComponents.length}):</span>
                  <span>
                    {p.bomComponents
                      .map((c) => c.componentName.split(" ")[0])
                      .join(", ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {activeTab === "anomalies" && (
        <PanelCard className="p-5 space-y-4">
          <SectionTitle title="Detección de Desviaciones & Precios Anómalos" />
          <p className="text-xs text-muted-foreground">
            Alertas automáticas de variaciones de precios respecto a estándares o costes históricos.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-amber-700 dark:text-amber-400">
                Alerta de Subida: Salmón Noruego Fresco
              </div>
              <div className="text-muted-foreground">
                Última compra registrada a 14.50 €/kg vs histórico promedio de 12.00 €/kg (+20.83% de variación).
              </div>
            </div>
          </div>
        </PanelCard>
      )}

      {activeTab === "history" && (
        <PanelCard className="p-5 space-y-4">
          <SectionTitle title="Histórico de Decisiones de Gestión (Audit Trail)" />
          <p className="text-xs text-muted-foreground">
            Registro inmutable de decisiones humanas tomadas a partir de escenarios de simulación.
          </p>
          <div className="space-y-3 pt-2">
            {savedIntents.map((intent) => (
              <div key={intent.id} className="p-4 border rounded-lg bg-background text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {intent.scenarioName}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {intent.intentType}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{intent.rationale}</p>
                <div className="flex justify-between text-muted-foreground pt-1 border-t text-[11px]">
                  <span>Fecha prevista: {intent.date}</span>
                  <span className="font-semibold text-primary">Estado: {intent.status}</span>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {/* Record Decision Intent Modal */}
      <Dialog open={isIntentDialogOpen} onOpenChange={setIsIntentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Registrar Decisión de Gestión
            </DialogTitle>
            <DialogDescription className="text-xs">
              Documenta la acción que tomará el equipo a raíz de esta simulación. Esta acción no modifica
              automáticamente precios ni inventario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label>Tipo de Acción Prevista</Label>
              <Select value={intentType} onValueChange={(v) => setIntentType(v as DecisionIntentType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renegotiate_supplier">Renegociar con Proveedor</SelectItem>
                  <SelectItem value="adjust_menu_price">Ajustar PVP de Plato</SelectItem>
                  <SelectItem value="reformulate_recipe">Reformular Receta / Ingredientes</SelectItem>
                  <SelectItem value="accept_margin_compression">Asumir Compresión Temporal de Margen</SelectItem>
                  <SelectItem value="other">Otra Decisión Estratégica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Fecha Prevista de Ejecución</Label>
              <Input
                type="date"
                value={intentDate}
                onChange={(e) => setIntentDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Justificación / Rationale de Gestión</Label>
              <Textarea
                placeholder="Ej: Se acuerda reunión con proveedor de salmón para fijar volumen trimestral y limitar subida a un 5%..."
                value={intentRationale}
                onChange={(e) => setIntentRationale(e.target.value)}
                className="text-xs min-h-[90px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsIntentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveDecisionIntent}>
              Guardar Decisión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
