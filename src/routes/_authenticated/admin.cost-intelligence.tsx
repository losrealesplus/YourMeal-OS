/**
 * ADMIN · Cost Intelligence & E9 Decision Cockpit (CR-COST-03 / CR-COST-04)
 * Subsystem: Platform Core / Cost Intelligence
 * Capabilities: inventory.operate / accounting.operate / operations_manager
 */

import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useEffect, useState, useMemo } from "react";
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
  RefreshCw,
  FolderOpen,
  Sparkles,
  Layers,
} from "lucide-react";
import { MarketIntelligenceTab } from "@/modules/market-intelligence/presentation/components/MarketIntelligenceTab";
import { EconomicCommandCenter } from "@/modules/market-intelligence/presentation/components/EconomicCommandCenter";
import { IndirectCostQuickEditModal } from "@/modules/market-intelligence/presentation/components/IndirectCostQuickEditModal";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
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
import {
  buildFoodCostBaselineSnapshot,
  type FoodDishRecord,
  type FoodIngredientRecord,
  type FoodRecipeLineRecord,
} from "@/modules/dish-library/application/food-cost-baseline-adapter";
import { ScenarioManagementService } from "@/modules/cost-intelligence/application/scenario-management-service";
import { DecisionIntentService } from "@/modules/cost-intelligence/application/decision-intent-service";
import type {
  CostBaselineSnapshot,
  HypotheticalVariables,
  ScenarioResult,
} from "@/modules/cost-intelligence/domain/types";
import type {
  ScenarioPresetType,
  DecisionIntentType,
  CostSimulationScenarioRecord,
  CostDecisionIntentRecord,
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
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [activeTab, setActiveTab] = useState<"command_center" | "simulator" | "anatomy" | "anomalies" | "history" | "scenarios" | "market_intelligence">("command_center");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Live Database Records
  const [liveDishes, setLiveDishes] = useState<FoodDishRecord[]>([]);
  const [liveIngredients, setLiveIngredients] = useState<FoodIngredientRecord[]>([]);
  const [liveRecipes, setLiveRecipes] = useState<FoodRecipeLineRecord[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<CostSimulationScenarioRecord[]>([]);
  const [savedIntents, setSavedIntents] = useState<CostDecisionIntentRecord[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // In-situ Overhead Micro-Editor State
  const [editingDish, setEditingDish] = useState<FoodDishRecord | null>(null);

  // Market Intelligence Simulation Hypothesis State
  const [activeHypothesis, setActiveHypothesis] = useState<{
    ingredientId: string;
    ingredientName: string;
    baseCost: number;
    simulatedPrice: number;
    deltaPct: number;
  } | null>(null);

  // Cockpit Controls State
  const [preset, setPreset] = useState<ScenarioPresetType>("supplier_hike");
  const [targetMarginThreshold, setTargetMarginThreshold] = useState<number>(60.0);
  const [selectedProductDriver, setSelectedProductDriver] = useState<string | null>(null);

  // Simulation Variables State
  const [rawMaterialInflationPct, setRawMaterialInflationPct] = useState<number>(10);
  const [energyInflationPct, setEnergyInflationPct] = useState<number>(0);
  const [laborInflationPct, setLaborInflationPct] = useState<number>(0);
  const [packagingInflationPct, setPackagingInflationPct] = useState<number>(0);

  // Save Scenario Dialog State
  const [isSaveScenarioOpen, setIsSaveScenarioOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");

  // Record Decision Intent Dialog State
  const [isIntentDialogOpen, setIsIntentDialogOpen] = useState(false);
  const [intentType, setIntentType] = useState<DecisionIntentType>("renegotiate_supplier");
  const [intentRationale, setIntentRationale] = useState("");
  const [intentDate, setIntentDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function reloadData() {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      const scenarioService = new ScenarioManagementService();
      const decisionService = new DecisionIntentService();

      const [dishesRes, ingRes, recipesRes, scenariosList, intentsList] = await Promise.all([
        supabase.from("dishes").select("id, name, price, cost, labor_cost, energy_cost, packaging_cost, margin_pct").eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("ingredients").select("id, name, unit, cost, waste_percentage, supplier_id").eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("dish_ingredients").select("dish_id, ingredient_id, amount").eq("tenant_id", tenantId),
        scenarioService.listScenarios(ctx).catch(() => []),
        decisionService.listIntentsForTenant(ctx).catch(() => []),
      ]);

      const dishes: FoodDishRecord[] = (dishesRes.data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        price: Number(d.price || 0),
        monthlyVolume: 400, // standard baseline monthly units
        laborCost: Number(d.labor_cost || 0),
        energyCost: Number(d.energy_cost || 0),
        packagingCost: Number(d.packaging_cost || 0),
      }));

      const ingredients: FoodIngredientRecord[] = (ingRes.data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        unit: i.unit || "kg",
        cost: Number(i.cost || 0),
        wastePercentage: Number(i.waste_percentage || 0),
        supplierId: i.supplier_id || undefined,
      }));

      const recipes: FoodRecipeLineRecord[] = (recipesRes.data || []).map((r: any) => ({
        dishId: r.dish_id,
        ingredientId: r.ingredient_id,
        amount: Number(r.amount || 0),
      }));

      setLiveDishes(dishes);
      setLiveIngredients(ingredients);
      setLiveRecipes(recipes);
      setSavedScenarios(scenariosList);
      setSavedIntents(intentsList);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantId, roles]);

  // Construct Dynamic Baseline from Live Supabase Data
  const liveBaselineSnapshot: CostBaselineSnapshot = useMemo(() => {
    if (liveDishes.length === 0) {
      return {
        snapshotId: `snap-empty-${tenantId}`,
        createdAt: new Date().toISOString(),
        products: [],
      };
    }

    const ingredientsMap = new Map<string, FoodIngredientRecord>();
    liveIngredients.forEach((ing) => ingredientsMap.set(ing.id, ing));

    // If dishes don't have recipe lines, create a synthetic BOM component matching dish.cost
    const recipeLinesWithFallback = [...liveRecipes];
    liveDishes.forEach((d) => {
      const hasLines = recipeLinesWithFallback.some((r) => r.dishId === d.id);
      if (!hasLines) {
        // synthesize a primary food component representing the dish's raw cost
        const syntheticIngId = `syn-${d.id}`;
        if (!ingredientsMap.has(syntheticIngId)) {
          ingredientsMap.set(syntheticIngId, {
            id: syntheticIngId,
            name: `Base Materia Prima (${d.name})`,
            unit: "ración",
            cost: (d as any).cost || 3.5,
            wastePercentage: 5,
          });
        }
        recipeLinesWithFallback.push({
          dishId: d.id,
          ingredientId: syntheticIngId,
          amount: 1,
        });
      }
    });

    return buildFoodCostBaselineSnapshot(
      `snap-${tenantId}-${Date.now()}`,
      liveDishes,
      ingredientsMap,
      recipeLinesWithFallback,
    );
  }, [liveDishes, liveIngredients, liveRecipes, tenantId]);

  // Build hypothetical simulation variables
  const hypotheticalVariables: HypotheticalVariables = useMemo(() => {
    const itemDeltas: Record<string, number> = {};
    liveIngredients.forEach((ing) => {
      if (activeHypothesis && activeHypothesis.ingredientId === ing.id) {
        // Deterministic market intelligence benchmark hypothesis delta
        itemDeltas[ing.id] = (activeHypothesis.simulatedPrice - ing.cost) / (ing.cost || 1);
      } else {
        itemDeltas[ing.id] = rawMaterialInflationPct / 100;
      }
    });

    return {
      itemCostDeltas: itemDeltas,
      overheadDeltas: {
        energyRateDeltaPct: energyInflationPct / 100,
        laborRateDeltaPct: laborInflationPct / 100,
      },
    };
  }, [liveIngredients, rawMaterialInflationPct, energyInflationPct, laborInflationPct, activeHypothesis]);

  // Pure E9 Simulation Engine Execution (Zero operational mutations)
  const simulationResult: ScenarioResult = useMemo(() => {
    if (liveBaselineSnapshot.products.length === 0) {
      return {
        scenarioId: "sc-empty",
        name: "Empty Baseline",
        createdAt: new Date().toISOString(),
        baselineSnapshotId: "snap-empty",
        appliedVariables: hypotheticalVariables,
        summary: {
          totalCurrentMonthlyCost: 0,
          totalSimulatedMonthlyCost: 0,
          totalMonthlyCostDelta: 0,
          totalMonthlyProfitImpact: 0,
          avgCostDeltaPct: 0,
          avgMarginDeltaPct: 0,
        },
        products: [],
      };
    }

    return simulateScenario(liveBaselineSnapshot, hypotheticalVariables, {
      scenarioId: activeScenarioId || "sc-cockpit-live",
      name: "Simulación Cockpit",
    });
  }, [liveBaselineSnapshot, hypotheticalVariables, activeScenarioId]);

  const handleApplyPreset = (p: ScenarioPresetType) => {
    setPreset(p);
    if (p === "supplier_hike") {
      setRawMaterialInflationPct(15);
      setEnergyInflationPct(0);
      setLaborInflationPct(0);
      setPackagingInflationPct(0);
    } else if (p === "energy_surge") {
      setRawMaterialInflationPct(0);
      setEnergyInflationPct(25);
      setLaborInflationPct(0);
      setPackagingInflationPct(0);
    } else if (p === "labor_escalation") {
      setRawMaterialInflationPct(0);
      setEnergyInflationPct(0);
      setLaborInflationPct(10);
      setPackagingInflationPct(0);
    } else if (p === "item_inflation") {
      setRawMaterialInflationPct(12);
      setEnergyInflationPct(5);
      setLaborInflationPct(5);
      setPackagingInflationPct(5);
    } else if (p === "yield_optimization") {
      setRawMaterialInflationPct(-5);
      setEnergyInflationPct(0);
      setLaborInflationPct(0);
      setPackagingInflationPct(0);
    }
  };

  async function handleSaveScenario(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenantId) return;

    if (!scenarioName.trim()) {
      toast.error("El nombre del escenario es obligatorio.");
      return;
    }

    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      const scenarioService = new ScenarioManagementService();
      const record = await scenarioService.createAndSimulateScenario(ctx, {
        name: scenarioName.trim(),
        description: scenarioDescription.trim() || undefined,
        presetType: preset,
        baselineSnapshot: liveBaselineSnapshot,
        appliedVariables: hypotheticalVariables,
      });

      setActiveScenarioId(record.id);
      setIsSaveScenarioOpen(false);
      setScenarioName("");
      setScenarioDescription("");
      toast.success(`Escenario "${record.name}" guardado persistentemente.`);
      await reloadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDecisionIntent(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenantId) return;

    if (!intentRationale.trim()) {
      toast.error("Por favor, describe el motivo cualitativo de la decisión.");
      return;
    }

    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      // Ensure we have a persisted scenario record to anchor the intent
      let targetScenarioId = activeScenarioId;
      if (!targetScenarioId) {
        const scenarioService = new ScenarioManagementService();
        const sc = await scenarioService.createAndSimulateScenario(ctx, {
          name: `Escenario ${new Date().toLocaleDateString("es-ES")}`,
          presetType: preset,
          baselineSnapshot: liveBaselineSnapshot,
          appliedVariables: hypotheticalVariables,
        });
        targetScenarioId = sc.id;
        setActiveScenarioId(sc.id);
      }

      const decisionService = new DecisionIntentService();
      await decisionService.recordDecisionIntent(ctx, {
        scenarioId: targetScenarioId,
        intentType,
        rationale: intentRationale.trim(),
        plannedEffectiveDate: intentDate,
      });

      toast.success("Decisión registrada y auditada correctamente en Supabase.");
      setIsIntentDialogOpen(false);
      setIntentRationale("");
      await reloadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function handleLoadSavedScenario(sc: CostSimulationScenarioRecord) {
    setActiveScenarioId(sc.id);
    if (sc.appliedVariables.overheadDeltas?.energyRateDeltaPct != null) {
      setEnergyInflationPct(sc.appliedVariables.overheadDeltas.energyRateDeltaPct * 100);
    }
    if (sc.appliedVariables.overheadDeltas?.laborRateDeltaPct != null) {
      setLaborInflationPct(sc.appliedVariables.overheadDeltas.laborRateDeltaPct * 100);
    }
    setPreset(sc.presetType);
    setActiveTab("simulator");
    toast.success(`Escenario "${sc.name}" cargado en el simulador.`);
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <AdminHeader
        goal="Simulación de escenarios económicos E9 y registro de decisiones de gestión"
        capability="inventory.operate / accounting.operate"
        object="CostSimulation"
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cockpit de Inteligencia de Costes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Simulación de escenarios económicos (E9), análisis de escandallos con WAC real y registro de decisiones de gestión.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reloadData}
            disabled={loading}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Recargar Datos Reales
          </Button>
          <Button
            size="sm"
            onClick={() => setIsSaveScenarioOpen(true)}
            className="gap-1.5 text-xs h-8"
          >
            <Save className="h-3.5 w-3.5" />
            Guardar Escenario
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("command_center")}
          className={cn(
            "px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0",
            activeTab === "command_center"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Sparkles className="h-4 w-4 text-indigo-500" />
          Centro de Decisión Económica (v4.1)
        </button>
        <button
          onClick={() => setActiveTab("simulator")}
          className={cn(
            "px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0",
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
            "px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0",
            activeTab === "anatomy"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <PieChart className="h-4 w-4" />
          Anatomía de Costes [REAL] ({liveDishes.length} platos)
        </button>
        <button
          onClick={() => setActiveTab("scenarios")}
          className={cn(
            "px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0",
            activeTab === "scenarios"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <FolderOpen className="h-4 w-4" />
          Escenarios Guardados [SIMULADO] ({savedScenarios.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0",
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <History className="h-4 w-4" />
          Histórico de Decisiones ({savedIntents.length})
        </button>
        <button
          onClick={() => setActiveTab("market_intelligence")}
          className={cn(
            "px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0",
            activeTab === "market_intelligence"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Layers className="h-4 w-4 text-indigo-500" />
          Fuentes y Mappings de Mercado
        </button>
      </div>

      {/* TAB 0: ECONOMIC COMMAND CENTER (CR-COST-05 v4.1 PRIMARY DECISION SURFACE) */}
      {activeTab === "command_center" && tenantId && (
        <EconomicCommandCenter
          tenantId={tenantId}
          tenantName={user?.user_metadata?.company_name || "Restaurante"}
          userId={user?.id}
          userName={user?.email || "Gerente"}
          ingredients={liveIngredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            unit: ing.unit,
            cost: Number(ing.cost || 0),
            annualVolume:
              ing.name.toLowerCase().includes("pollo") || ing.name.toLowerCase().includes("pechuga") || ing.name.toLowerCase().includes("harina") ? 1200 :
              ing.name.toLowerCase().includes("aceite") ? 600 :
              ing.name.toLowerCase().includes("arroz") ? 800 : undefined,
          }))}
          dishes={liveDishes.map((d) => ({
            id: d.id,
            name: d.name,
            price: Number(d.price || 0),
            cost: (d.laborCost || 0) + (d.energyCost || 0) + (d.packagingCost || 0) + 2.50,
            laborCost: Number(d.laborCost || 0),
            energyCost: Number(d.energyCost || 0),
            packagingCost: Number(d.packagingCost || 0),
            monthlyVolume: 400,
            recipeIngredients: liveRecipes
              .filter((r) => r.dishId === d.id)
              .map((r) => ({ ingredientId: r.ingredientId, amount: r.amount })),
          }))}
          onRefreshData={reloadData}
          onOpenMacroSimulator={() => setActiveTab("simulator")}
        />
      )}

      {/* TAB 1: SIMULADOR DE ESCENARIOS */}
      {activeTab === "simulator" && (
        <div className="space-y-6">
          {/* Active Simulation Hypothesis Banner */}
          {activeHypothesis && (
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider">
                  HIPÓTESIS
                </span>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>Simulación con Benchmark de Mercado: {activeHypothesis.ingredientName}</span>
                    <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-300">
                      {activeHypothesis.deltaPct > 0 ? "+" : ""}{activeHypothesis.deltaPct.toFixed(1)}% vs WAC
                    </Badge>
                  </div>
                  <p className="text-xs text-indigo-700/90 mt-0.5">
                    Precio proyectado: {activeHypothesis.simulatedPrice.toFixed(2)} € (Base WAC: {activeHypothesis.baseCost.toFixed(2)} €). Hipótesis en memoria determinista; no altera costes reales de compra ni facturas.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setActiveHypothesis(null);
                  toast.info("Hipótesis revertida a Coste Real WAC.");
                }}
                className="text-xs font-semibold bg-white border-indigo-200 hover:bg-indigo-100 text-indigo-800 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Revertir a Coste Real (Deshacer)
              </Button>
            </div>
          )}

          {/* Executive KPI Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <PanelCard className="p-4 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                <span>Coste Mensual Simulado</span>
                <Badge variant="outline" className="text-[9px] uppercase font-mono bg-purple-50 text-purple-700 border-purple-200">
                  SIMULADO
                </Badge>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(simulationResult.summary.totalSimulatedMonthlyCost)}
              </div>
              <div className="text-xs mt-1 text-muted-foreground flex items-center gap-1">
                <span>Base [REAL]: {formatCurrency(simulationResult.summary.totalCurrentMonthlyCost)}</span>
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
              <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                <span>Margen Bruto Medio</span>
                <Badge variant="outline" className="text-[9px] uppercase font-mono bg-purple-50 text-purple-700 border-purple-200">
                  SIMULADO
                </Badge>
              </div>
              <div className="text-2xl font-bold mt-1">
                {simulationResult.products.length > 0
                  ? (
                      simulationResult.products.reduce((acc, p) => acc + p.simulatedMarginPct, 0) /
                      simulationResult.products.length
                    ).toFixed(2)
                  : "0,00"}{" "}
                %
              </div>
              <div className="text-xs mt-1 text-muted-foreground flex items-center gap-1">
                <span>Variación de margen:</span>
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
              <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                <span>Impacto en Beneficio</span>
                <Badge variant="outline" className="text-[9px] uppercase font-mono bg-purple-50 text-purple-700 border-purple-200">
                  SIMULADO
                </Badge>
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
                className="w-full mt-2 gap-2 text-xs"
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
                  <SelectTrigger className="w-[220px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier_hike">Subida Proveedor (+15%)</SelectItem>
                    <SelectItem value="energy_surge">Shock Energético (+25%)</SelectItem>
                    <SelectItem value="labor_escalation">Coste Laboral (+10%)</SelectItem>
                    <SelectItem value="item_inflation">Inflación General (+12%)</SelectItem>
                    <SelectItem value="yield_optimization">Mejora de Rendimiento (-5%)</SelectItem>
                    <SelectItem value="custom">Personalizado (Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <Label>Inflación Materias Primas</Label>
                  <span className="text-primary font-bold">{rawMaterialInflationPct > 0 ? "+" : ""}{rawMaterialInflationPct}%</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="1"
                  value={rawMaterialInflationPct}
                  onChange={(e) => {
                    setPreset("custom");
                    setRawMaterialInflationPct(Number(e.target.value));
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
                <h3 className="font-semibold text-base">Matriz de Impacto en Catálogo Real</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Comparación side-by-side entre coste real auditado y simulación hipotética sobre platos activos.
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

            {simulationResult.products.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No hay platos activos configurados en este tenant para simular.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b uppercase font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Plato / Producto</th>
                      <th className="py-2.5 px-3 text-right">PVP [REAL]</th>
                      <th className="py-2.5 px-3 text-right">Coste Real [REAL]</th>
                      <th className="py-2.5 px-3 text-right">Coste Simulado [SIMULADO]</th>
                      <th className="py-2.5 px-3 text-right">Δ Coste</th>
                      <th className="py-2.5 px-3 text-right">Margen Real [REAL]</th>
                      <th className="py-2.5 px-3 text-right">Margen Simulado [SIMULADO]</th>
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
                              Ver Factores
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </PanelCard>
        </div>
      )}

      {/* TAB 2: ANATOMÍA DE COSTES LIVE */}
      {activeTab === "anatomy" && (
        <PanelCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <SectionTitle title="Anatomía de Costes Reales (WAC & Escandallos)" />
              <p className="text-xs text-muted-foreground mt-0.5">
                Desglose de costes operativos actuales derivados del catálogo real de platos e ingredientes en Supabase.
              </p>
            </div>
            <Badge variant="outline" className="text-xs uppercase font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
              DATOS REALES AUDITADOS
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {liveBaselineSnapshot.products.map((p) => (
              <div key={p.productId} className="p-4 bg-muted/20 border rounded-lg space-y-2 text-xs">
                <div className="font-bold text-sm flex items-center justify-between">
                  <span>{p.productName}</span>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
                    REAL
                  </Badge>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">PVP:</span>
                  <span className="font-semibold">{formatCurrency(p.salesPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mano de Obra:</span>
                  <span>
                    {p.overheads.laborCost > 0 ? (
                      formatCurrency(p.overheads.laborCost)
                    ) : (
                      <span className="text-muted-foreground/60 italic">— (Sin configurar)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energía:</span>
                  <span>
                    {p.overheads.energyCost > 0 ? (
                      formatCurrency(p.overheads.energyCost)
                    ) : (
                      <span className="text-muted-foreground/60 italic">— (Sin configurar)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Packaging:</span>
                  <span>
                    {p.overheads.packagingCost > 0 ? (
                      formatCurrency(p.overheads.packagingCost)
                    ) : (
                      <span className="text-muted-foreground/60 italic">— (Sin configurar)</span>
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t font-semibold flex justify-between items-center">
                  <span>Ingredientes ({p.bomComponents.length}):</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {p.bomComponents
                      .map((c) => c.componentName.split(" ")[0])
                      .slice(0, 3)
                      .join(", ")}
                    {p.bomComponents.length > 3 ? "..." : ""}
                  </span>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px] px-2 text-amber-700 bg-amber-50/50 border-amber-200 hover:bg-amber-100 font-medium"
                    onClick={() => {
                      const dish = liveDishes.find((d) => d.id === p.productId);
                      if (dish) setEditingDish(dish);
                    }}
                  >
                    <Sliders className="w-3 h-3 mr-1" />
                    Imputar Costes Indirectos
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {/* TAB 3: ESCENARIOS GUARDADOS */}
      {activeTab === "scenarios" && (
        <PanelCard className="p-5 space-y-4">
          <SectionTitle title="Escenarios Guardados (Persistencia Real en Supabase)" />
          <p className="text-xs text-muted-foreground">
            Escenarios guardados con snapshot inmutable en la base de datos de producción.
          </p>
          {savedScenarios.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No hay escenarios guardados todavía. Usa el botón "Guardar Escenario" en el simulador.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {savedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="p-4 border rounded-lg bg-background flex justify-between items-center text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{sc.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {sc.presetType}
                      </Badge>
                    </div>
                    {sc.description && <p className="text-muted-foreground">{sc.description}</p>}
                    <p className="text-[11px] text-muted-foreground">
                      Creado: {new Date(sc.createdAt).toLocaleDateString("es-ES")} · Estado: {sc.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handleLoadSavedScenario(sc)}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Cargar en Simulador
                  </Button>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      )}

      {/* TAB 4: HISTÓRICO DE DECISIONES */}
      {activeTab === "history" && (
        <PanelCard className="p-5 space-y-4">
          <SectionTitle title="Histórico de Decisiones de Gestión (Audit Trail en Supabase)" />
          <p className="text-xs text-muted-foreground">
            Registro inmutable de decisiones humanas tomadas a partir de simulaciones económicas.
          </p>
          {savedIntents.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No hay decisiones registradas aún. Registra una desde el simulador.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {savedIntents.map((intent) => (
                <div key={intent.id} className="p-4 border rounded-lg bg-background text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {intent.intentType}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {intent.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{intent.rationale}</p>
                  <div className="flex justify-between text-muted-foreground pt-1 border-t text-[11px]">
                    <span>Fecha prevista: {intent.plannedEffectiveDate || "Inmediata"}</span>
                    <span className="font-semibold text-primary">ID: {intent.id.slice(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      )}

      {/* TAB 5: INTELIGENCIA DE MERCADO (CR-COST-05) */}
      {activeTab === "market_intelligence" && tenantId && (
        <MarketIntelligenceTab
          tenantId={tenantId}
          tenantName={user?.user_metadata?.company_name || "Restaurante"}
          ingredients={liveIngredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            unit: ing.unit,
            cost: Number(ing.cost || 0),
            annualVolume:
              ing.name.toLowerCase().includes("pollo") ? 1200 :
              ing.name.toLowerCase().includes("aceite") ? 600 :
              ing.name.toLowerCase().includes("arroz") ? 800 : undefined,
          }))}
          onInjectSimulation={(ingredientId, simulatedPrice, deltaPct) => {
            const ing = liveIngredients.find((i) => i.id === ingredientId);
            setActiveHypothesis({
              ingredientId,
              ingredientName: ing?.name || ingredientId,
              baseCost: Number(ing?.cost || 0),
              simulatedPrice,
              deltaPct,
            });
            setActiveTab("simulator");
            toast.success(`Hipótesis de mercado inyectada: ${ing?.name || ingredientId} a ${simulatedPrice.toFixed(2)} €`);
          }}
        />
      )}

      {/* In-Situ Indirect Cost Imputation Modal */}
      {editingDish && tenantId && (
        <IndirectCostQuickEditModal
          open={Boolean(editingDish)}
          onOpenChange={(open) => !open && setEditingDish(null)}
          tenantId={tenantId}
          dishId={editingDish.id}
          dishName={editingDish.name}
          currentOverheads={{
            laborCost: editingDish.laborCost || 0,
            energyCost: editingDish.energyCost || 0,
            packagingCost: editingDish.packagingCost || 0,
          }}
          onCostUpdated={reloadData}
        />
      )}

      {/* Save Scenario Modal */}
      <Dialog open={isSaveScenarioOpen} onOpenChange={setIsSaveScenarioOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSaveScenario} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" />
                Guardar Escenario de Simulación
              </DialogTitle>
              <DialogDescription className="text-xs">
                Guarda este escenario con su snapshot determinista en Supabase para consultarlo o re-evaluarlo en el futuro.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="sc-name">Nombre del Escenario *</Label>
                <Input
                  id="sc-name"
                  required
                  placeholder="ej. Shock Pescados Q4 2026"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sc-desc">Descripción / Supuestos</Label>
                <Textarea
                  id="sc-desc"
                  rows={2}
                  placeholder="ej. Subida prevista del proveedor Pescados Canarias ante escasez de salmón..."
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsSaveScenarioOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                Guardar en Base de Datos
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Decision Intent Modal */}
      <Dialog open={isIntentDialogOpen} onOpenChange={setIsIntentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSaveDecisionIntent} className="space-y-4">
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

            <div className="space-y-3 py-1 text-xs">
              <div className="space-y-1.5">
                <Label>Tipo de Acción Prevista *</Label>
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
                <Label htmlFor="intent-date">Fecha Prevista de Ejecución</Label>
                <Input
                  id="intent-date"
                  type="date"
                  value={intentDate}
                  onChange={(e) => setIntentDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="intent-rationale">Justificación y Plan de Acción *</Label>
                <Textarea
                  id="intent-rationale"
                  rows={3}
                  required
                  placeholder="Describe la justificación comercial, acuerdo alcanzado o motivo de la decisión..."
                  value={intentRationale}
                  onChange={(e) => setIntentRationale(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsIntentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                Guardar Decisión en Audit Trail
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
