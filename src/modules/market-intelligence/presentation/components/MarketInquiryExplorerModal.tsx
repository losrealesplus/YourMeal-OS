/**
 * YOURMEAL-OS · Market Inquiry & Product Economics Workspace ("Preguntar al Mercado" & CR-COST-07)
 * Progressive 4-Level Funnel: Mercado (1) ──► Receta & Mermas (2) ──► Fábrica & Escenarios (3) ──► Decisión Soberana (4)
 * "YOURMEAL OS NO ASUME: PREGUNTA, CALCULA Y EXPLICA."
 * "Escenario calculable ≠ escenario operacionalmente viable."
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calculator,
  Sliders,
  Layers,
  ArrowRight,
  ArrowLeft,
  Lock,
  ShieldCheck,
  Scale,
  DollarSign,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import { MarketProduct } from '../../domain/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import { YieldCascadeCalculator } from '@/modules/cost-intelligence/domain/yield-cascade-calculator';
import { OperationalCostEngine } from '@/modules/cost-intelligence/domain/operational-cost-engine';
import { BreakEvenCalculator } from '@/modules/cost-intelligence/domain/break-even-calculator';
import { ScenarioEvaluator } from '@/modules/cost-intelligence/domain/scenario-evaluator';
import { ExecutiveVerdictEngine } from '@/modules/cost-intelligence/domain/executive-verdict-engine';
import type {
  GrossUnit,
  PriceProvenance,
  StudyVersion,
  StudyIngredient,
  StudyYieldStage,
  SurplusDestination,
} from '@/modules/cost-intelligence/domain/product-economics-types';
import type {
  StudyOperationConfig,
  EnergyMethod,
  PackagingMode,
  ScenarioCalculationResult,
} from '@/modules/cost-intelligence/domain/production-operational-types';
import type {
  OptimizationGoal,
  DecisionVerdict,
  HumanDecisionStatus,
  StudyDecision,
  BreakEvenAnalysisResult,
  ScenarioEvaluationMatrix,
  ExecutiveVerdictResult,
} from '@/modules/cost-intelligence/domain/decision-intelligence-types';

export interface InquiryIngredientRow {
  id: string;
  name: string;
  grossAmount: number;
  grossUnit: GrossUnit;
  unitPrice: number;
  provenance: PriceProvenance;
  sourceName?: string;
  densityKgPerL?: number | null;
  pieceMassKg?: number | null;
  trimmingLossPct: number | null; // null = [NO CONFIGURADO], 0 = [0% MERMA]
}

export interface MarketInquiryExplorerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketProducts: MarketProduct[];
  tenantId?: string;
  userId?: string;
  userName?: string;
  studyId?: string;
  initialStudy?: any;
  onSaveInquiry?: (data: any) => void;
}

export function MarketInquiryExplorerModal({
  open,
  onOpenChange,
  marketProducts,
  tenantId = 'tenant-current',
  userId,
  userName = 'Gerente',
  studyId,
  initialStudy,
  onSaveInquiry,
}: MarketInquiryExplorerModalProps) {
  // Navigation: 4 Levels
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3 | 4>(1);

  // Initial active version resolution if initialStudy provided
  const initialActiveVer = useMemo(() => {
    if (!initialStudy) return null;
    const versions = (initialStudy.study_versions || []) as any[];
    return (
      versions.find((v: any) => v.version_number === initialStudy.active_version_number) ||
      versions[0] ||
      null
    );
  }, [initialStudy]);

  // Level 1: Market & Basic Dish Info
  const [dishName, setDishName] = useState<string>(
    () => initialStudy?.product_name || 'Tarta de Zanahoria Casera'
  );
  const [dishCategory, setDishCategory] = useState<string>(
    () => initialStudy?.product_category || 'Repostería / Postres'
  );
  const [targetSalesPrice, setTargetSalesPrice] = useState<string>(() =>
    initialActiveVer?.target_pvp != null ? String(initialActiveVer.target_pvp) : '4.00'
  );
  const [monthlyVolume, setMonthlyVolume] = useState<string>('300');

  const [ingredients, setIngredients] = useState<InquiryIngredientRow[]>(() => {
    if (initialActiveVer?.study_ingredients && initialActiveVer.study_ingredients.length > 0) {
      return initialActiveVer.study_ingredients.map((ing: any) => ({
        id: ing.id,
        name: ing.ingredient_name,
        grossAmount: Number(ing.gross_quantity) || 0,
        grossUnit: ing.gross_unit as GrossUnit,
        unitPrice: Number(ing.unit_price) || 0,
        provenance: (ing.price_provenance || 'MANUAL') as PriceProvenance,
        trimmingLossPct: ing.trimming_loss_pct != null ? Number(ing.trimming_loss_pct) : null,
        densityKgPerL: ing.density_kg_per_l != null ? Number(ing.density_kg_per_l) : null,
        pieceMassKg: ing.piece_mass_kg != null ? Number(ing.piece_mass_kg) : null,
      }));
    }
    return [
      {
        id: 'ing-1',
        name: 'Zanahoria fresca',
        grossAmount: 0.25,
        grossUnit: 'kg',
        unitPrice: 1.15,
        provenance: 'OBSERVADO',
        sourceName: 'Makro Adeje',
        densityKgPerL: null,
        pieceMassKg: null,
        trimmingLossPct: 10.0,
      },
      {
        id: 'ing-2',
        name: 'Harina de trigo repostería',
        grossAmount: 0.12,
        grossUnit: 'kg',
        unitPrice: 0.95,
        provenance: 'OBSERVADO',
        sourceName: 'Makro Adeje',
        densityKgPerL: null,
        pieceMassKg: null,
        trimmingLossPct: 0.0,
      },
      {
        id: 'ing-3',
        name: 'Huevos camperos L',
        grossAmount: 1,
        grossUnit: 'unit',
        unitPrice: 0.22,
        provenance: 'OBSERVADO',
        sourceName: 'Mercadona',
        densityKgPerL: null,
        pieceMassKg: 0.063, // 63g por huevo verificado
        trimmingLossPct: 0.0,
      },
      {
        id: 'ing-4',
        name: 'Queso crema cobertura',
        grossAmount: 0.08,
        grossUnit: 'kg',
        unitPrice: 4.5,
        provenance: 'MANUAL',
        sourceName: undefined,
        densityKgPerL: null,
        pieceMassKg: null,
        trimmingLossPct: null, // [NO CONFIGURADO]
      },
    ];
  });

  const [newIngredientName, setNewIngredientName] = useState('');

  // Level 2: Recipe & Physical Yield
  const [batchUnitName, setBatchUnitName] = useState(() => initialActiveVer?.batch_unit_name || 'tarta');
  const [batchNominalYield, setBatchNominalYield] = useState<number>(
    () => initialActiveVer?.batch_nominal_yield != null ? Number(initialActiveVer.batch_nominal_yield) : 12
  );
  const [isFractionalAllowed, setIsFractionalAllowed] = useState(() =>
    initialActiveVer?.is_fractional_allowed != null ? Boolean(initialActiveVer.is_fractional_allowed) : false
  );
  const [cookingLossPct, setCookingLossPct] = useState<number>(6.0); // 6% horno
  const [portioningLossPct, setPortioningLossPct] = useState<number>(3.0); // 3% recorte

  // Level 3: Factory Operations & Scenarios
  const [laborSetupMin, setLaborSetupMin] = useState<number>(15);
  const [laborCleaningMin, setLaborCleaningMin] = useState<number>(15);
  const [laborBatchMin, setLaborBatchMin] = useState<number>(10);
  const [laborUnitMin, setLaborUnitMin] = useState<number>(0.5);
  const [laborHourlyRate, setLaborHourlyRate] = useState<string>('15.00'); // null if empty

  const [energyMethod, setEnergyMethod] = useState<EnergyMethod>('QUANTITATIVE');
  const [energyPowerKw, setEnergyPowerKw] = useState<number>(3.0);
  const [energyCycleHours, setEnergyCycleHours] = useState<number>(1.0);
  const [energyTariffKwh, setEnergyTariffKwh] = useState<number>(0.2);
  const [energyPercentageRate, setEnergyPercentageRate] = useState<number>(5.0);
  const [energyFlatFee, setEnergyFlatFee] = useState<number>(1.5);

  const [packagingMode, setPackagingMode] = useState<PackagingMode>('CONFIGURED');
  const [packagingUnitCost, setPackagingUnitCost] = useState<number>(0.15);
  const [packagingSecondaryCost, setPackagingSecondaryCost] = useState<number>(1.2);
  const [packagingSecondaryCapacity, setPackagingSecondaryCapacity] = useState<number>(12);

  const [surplusDestination, setSurplusDestination] =
    useState<SurplusDestination>(() => initialActiveVer?.surplus_destination || 'STOCK_REFRIGERADO');

  const [customDemandInput, setCustomDemandInput] = useState<string>('');
  const [customDemands, setCustomDemands] = useState<number[]>([]);

  // Level 4: Decision & Capacity
  const [maxUnitsPerRun, setMaxUnitsPerRun] = useState<string>('60'); // capacity constraint
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('MINIMIZE_COST');

  // Human sovereign decision state
  const [humanDecisionStatus, setHumanDecisionStatus] =
    useState<HumanDecisionStatus>('APPROVED');
  const [decisionVerdict, setDecisionVerdict] =
    useState<DecisionVerdict>('APPROVED_FOR_MENU');
  const [decisionNotes, setDecisionNotes] = useState<string>(
    'Validado por el jefe de cocina tras revisar costes de tirada y amortización.'
  );
  const [isVersionFrozen, setIsVersionFrozen] = useState<boolean>(() => {
    if (!initialActiveVer) return false;
    return initialActiveVer.is_frozen === true || initialActiveVer.version_status === 'CONGELADA';
  });
  const [recordedDecision, setRecordedDecision] = useState<StudyDecision | null>(() => {
    if (!initialActiveVer) return null;
    const dec = Array.isArray(initialActiveVer.study_decisions)
      ? initialActiveVer.study_decisions[0]
      : initialActiveVer.study_decisions;
    if (!dec) return null;
    return {
      id: dec.id,
      versionId: initialActiveVer.id,
      decisionVerdict: dec.decision_verdict,
      humanDecisionStatus: dec.human_decision_status,
      executiveSummaryText: dec.executive_summary_text || '',
      selectedScenarioDemand:
        dec.selected_scenario_demand != null ? Number(dec.selected_scenario_demand) : null,
      recommendedPvp: dec.recommended_pvp != null ? Number(dec.recommended_pvp) : null,
      approvedByUserId: dec.approved_by_user_id || null,
      decisionNotes: dec.decision_notes || '',
      decidedAt: dec.decided_at || new Date().toISOString(),
      createdAt: dec.created_at || new Date().toISOString(),
      updatedAt: dec.updated_at || new Date().toISOString(),
    };
  });
  const [persistedStudyId, setPersistedStudyId] = useState<string | null>(
    () => initialStudy?.id || null
  );
  const [persistedVersionId, setPersistedVersionId] = useState<string | null>(
    () => initialActiveVer?.id || null
  );
  const [isLoadingStudy, setIsLoadingStudy] = useState<boolean>(false);

  // Rehydrate state from a persistent study entity
  const applyRehydratedStudy = (data: any) => {
    if (!data) return;
    setPersistedStudyId(data.id);
    if (data.product_name) setDishName(data.product_name);
    if (data.product_category) setDishCategory(data.product_category);

    const versions = (data.study_versions || []) as any[];
    const activeVer =
      versions.find((v: any) => v.version_number === data.active_version_number) || versions[0];
    if (activeVer) {
      setPersistedVersionId(activeVer.id);
      const isFrozen =
        activeVer.is_frozen === true || activeVer.version_status === 'CONGELADA';
      setIsVersionFrozen(isFrozen);

      if (activeVer.target_pvp != null) setTargetSalesPrice(String(activeVer.target_pvp));
      if (activeVer.batch_unit_name) setBatchUnitName(activeVer.batch_unit_name);
      if (activeVer.batch_nominal_yield != null)
        setBatchNominalYield(Number(activeVer.batch_nominal_yield));
      if (activeVer.is_fractional_allowed != null)
        setIsFractionalAllowed(Boolean(activeVer.is_fractional_allowed));
      if (activeVer.surplus_destination) setSurplusDestination(activeVer.surplus_destination);

      if (activeVer.study_ingredients && activeVer.study_ingredients.length > 0) {
        setIngredients(
          activeVer.study_ingredients.map((ing: any) => ({
            id: ing.id,
            name: ing.ingredient_name,
            grossAmount: Number(ing.gross_quantity) || 0,
            grossUnit: ing.gross_unit as GrossUnit,
            unitPrice: Number(ing.unit_price) || 0,
            provenance: (ing.price_provenance || 'MANUAL') as PriceProvenance,
            trimmingLossPct:
              ing.trimming_loss_pct != null ? Number(ing.trimming_loss_pct) : null,
            densityKgPerL: ing.density_kg_per_l != null ? Number(ing.density_kg_per_l) : null,
            pieceMassKg: ing.piece_mass_kg != null ? Number(ing.piece_mass_kg) : null,
          }))
        );
      }

      if (activeVer.study_yield_stages && activeVer.study_yield_stages.length > 0) {
        for (const stg of activeVer.study_yield_stages) {
          if (stg.stage_order === 1) setCookingLossPct(Number(stg.loss_percentage) || 0);
          if (stg.stage_order === 2) setPortioningLossPct(Number(stg.loss_percentage) || 0);
        }
      }

      const opCfg = Array.isArray(activeVer.study_operation_configs)
        ? activeVer.study_operation_configs[0]
        : activeVer.study_operation_configs;
      if (opCfg) {
        if (opCfg.labor_setup_minutes != null)
          setLaborSetupMin(Number(opCfg.labor_setup_minutes));
        if (opCfg.labor_batch_minutes != null)
          setLaborBatchMin(Number(opCfg.labor_batch_minutes));
        if (opCfg.labor_unit_minutes != null) setLaborUnitMin(Number(opCfg.labor_unit_minutes));
        if (opCfg.labor_cleaning_minutes != null)
          setLaborCleaningMin(Number(opCfg.labor_cleaning_minutes));
        if (opCfg.labor_hourly_rate != null)
          setLaborHourlyRate(String(opCfg.labor_hourly_rate));
        if (opCfg.energy_method) setEnergyMethod(opCfg.energy_method);
        if (opCfg.energy_power_kw != null) setEnergyPowerKw(Number(opCfg.energy_power_kw));
        if (opCfg.energy_cycle_hours != null)
          setEnergyCycleHours(Number(opCfg.energy_cycle_hours));
        if (opCfg.energy_tariff_kwh != null)
          setEnergyTariffKwh(Number(opCfg.energy_tariff_kwh));
        if (opCfg.energy_percentage_rate != null)
          setEnergyPercentageRate(Number(opCfg.energy_percentage_rate));
        if (opCfg.energy_flat_fee != null) setEnergyFlatFee(Number(opCfg.energy_flat_fee));
        if (opCfg.packaging_mode) setPackagingMode(opCfg.packaging_mode);
        if (opCfg.packaging_unit_cost != null)
          setPackagingUnitCost(Number(opCfg.packaging_unit_cost));
        if (opCfg.packaging_secondary_cost != null)
          setPackagingSecondaryCost(Number(opCfg.packaging_secondary_cost));
        if (opCfg.packaging_secondary_capacity != null)
          setPackagingSecondaryCapacity(Number(opCfg.packaging_secondary_capacity));
      }

      const dec = Array.isArray(activeVer.study_decisions)
        ? activeVer.study_decisions[0]
        : activeVer.study_decisions;
      if (dec) {
        setDecisionVerdict(dec.decision_verdict);
        setHumanDecisionStatus(dec.human_decision_status);
        if (dec.decision_notes) setDecisionNotes(dec.decision_notes);
        setRecordedDecision({
          id: dec.id,
          versionId: activeVer.id,
          decisionVerdict: dec.decision_verdict,
          humanDecisionStatus: dec.human_decision_status,
          executiveSummaryText: dec.executive_summary_text || '',
          selectedScenarioDemand:
            dec.selected_scenario_demand != null
              ? Number(dec.selected_scenario_demand)
              : null,
          recommendedPvp:
            dec.recommended_pvp != null ? Number(dec.recommended_pvp) : null,
          approvedByUserId: dec.approved_by_user_id || null,
          decisionNotes: dec.decision_notes || '',
          decidedAt: dec.decided_at || new Date().toISOString(),
          createdAt: dec.created_at || new Date().toISOString(),
          updatedAt: dec.updated_at || new Date().toISOString(),
        });
      }
    }
  };

  useEffect(() => {
    if (!open) return;

    if (initialStudy) {
      applyRehydratedStudy(initialStudy);
      return;
    }

    if (tenantId === 'tenant-test') {
      return;
    }

    let isMounted = true;
    async function rehydrateStudy() {
      try {
        setIsLoadingStudy(true);
        let query = (supabase as any)
          .from('economic_studies')
          .select(`
            id,
            product_name,
            product_category,
            current_status,
            active_version_number,
            study_versions (
              id,
              version_number,
              version_status,
              target_pvp,
              sales_unit,
              sales_unit_size,
              batch_unit_name,
              batch_nominal_yield,
              is_fractional_allowed,
              surplus_destination,
              conclusion_tier,
              provenance_summary,
              is_frozen,
              study_decisions (
                id,
                decision_verdict,
                human_decision_status,
                executive_summary_text,
                selected_scenario_demand,
                recommended_pvp,
                decision_notes,
                decided_at
              ),
              study_ingredients (
                id,
                ingredient_name,
                gross_quantity,
                gross_unit,
                unit_price,
                price_provenance,
                trimming_loss_pct,
                density_kg_per_l,
                piece_mass_kg
              ),
              study_yield_stages (
                id,
                stage_order,
                stage_name,
                loss_percentage,
                provenance
              ),
              study_operation_configs (
                id,
                labor_setup_minutes,
                labor_batch_minutes,
                labor_unit_minutes,
                labor_cleaning_minutes,
                labor_hourly_rate,
                energy_method,
                energy_power_kw,
                energy_cycle_hours,
                energy_tariff_kwh,
                energy_percentage_rate,
                energy_flat_fee,
                packaging_mode,
                packaging_unit_cost,
                packaging_secondary_cost,
                packaging_secondary_capacity
              )
            )
          `);

        if (studyId) {
          query = query.eq('id', studyId);
        } else if (tenantId && tenantId !== 'tenant-current' && tenantId !== 'tenant-test') {
          query = query.eq('tenant_id', tenantId).order('updated_at', { ascending: false }).limit(1);
        } else {
          query = query.order('updated_at', { ascending: false }).limit(1);
        }

        const { data, error } = await query.maybeSingle();
        if (!isMounted) return;

        if (!error && data) {
          applyRehydratedStudy(data);
        }
      } catch (err) {
        console.warn('[MarketInquiry] Rehydration skipped:', err);
      } finally {
        if (isMounted) setIsLoadingStudy(false);
      }
    }

    rehydrateStudy();
    return () => {
      isMounted = false;
    };
  }, [open, tenantId, studyId, initialStudy]);

  // ───────────────────────────────────────────────────────────────────────────
  // Domain Engines Calculations in Memory (Zero operational mutations)
  // ───────────────────────────────────────────────────────────────────────────

  // 1. Yield Cascade Calculation
  const yieldResult = useMemo(() => {
    const domainIngredients: StudyIngredient[] = ingredients.map((ing) => ({
      id: ing.id,
      versionId: 'ver-current',
      ingredientName: ing.name,
      grossQuantity: ing.grossAmount,
      grossUnit: ing.grossUnit,
      unitPrice: ing.unitPrice,
      priceProvenance: ing.provenance,
      densityKgPerL: ing.densityKgPerL ?? null,
      pieceMassKg: ing.pieceMassKg ?? null,
      trimmingLossPct: ing.trimmingLossPct,
      netUsableQuantity:
        ing.trimmingLossPct != null
          ? ing.grossAmount * (1 - ing.trimmingLossPct / 100)
          : null,
      createdAt: new Date().toISOString(),
    }));

    const stages: StudyYieldStage[] = [
      {
        id: 'stg-1',
        versionId: 'ver-current',
        stageOrder: 1,
        stageName: 'Cocción y horneado',
        lossPercentage: cookingLossPct,
        provenance: 'OBSERVADO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'stg-2',
        versionId: 'ver-current',
        stageOrder: 2,
        stageName: 'Porcionado y recorte',
        lossPercentage: portioningLossPct,
        provenance: 'MANUAL',
        createdAt: new Date().toISOString(),
      },
    ];

    return YieldCascadeCalculator.calculateYieldCascade(
      domainIngredients,
      stages,
      batchNominalYield
    );
  }, [ingredients, cookingLossPct, portioningLossPct, batchNominalYield]);

  // 2. Operational Config & Scenario Matrix
  const operationConfig: StudyOperationConfig = useMemo(() => {
    const rate = laborHourlyRate.trim() !== '' ? Number(laborHourlyRate) : null;
    return {
      id: 'op-cfg-current',
      versionId: 'ver-current',
      laborSetupMinutes: laborSetupMin,
      laborBatchMinutes: laborBatchMin,
      laborUnitMinutes: laborUnitMin,
      laborCleaningMinutes: laborCleaningMin,
      laborHourlyRate: rate,
      energyMethod,
      energyPowerKw: energyMethod === 'QUANTITATIVE' ? energyPowerKw : null,
      energyCycleHours: energyMethod === 'QUANTITATIVE' ? energyCycleHours : null,
      energyTariffKwh: energyMethod === 'QUANTITATIVE' ? energyTariffKwh : null,
      energyPercentageRate: energyMethod === 'PERCENTAGE' ? energyPercentageRate : null,
      energyFlatFee: energyMethod === 'MANUAL_FLAT' ? energyFlatFee : null,
      packagingMode,
      packagingUnitCost: packagingMode === 'CONFIGURED' ? packagingUnitCost : null,
      packagingSecondaryCost: packagingMode === 'CONFIGURED' ? packagingSecondaryCost : null,
      packagingSecondaryCapacity:
        packagingMode === 'CONFIGURED' ? packagingSecondaryCapacity : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    laborSetupMin,
    laborBatchMin,
    laborUnitMin,
    laborCleaningMin,
    laborHourlyRate,
    energyMethod,
    energyPowerKw,
    energyCycleHours,
    energyTariffKwh,
    energyPercentageRate,
    energyFlatFee,
    packagingMode,
    packagingUnitCost,
    packagingSecondaryCost,
    packagingSecondaryCapacity,
  ]);

  const scenarios: ScenarioCalculationResult[] = useMemo(() => {
    const defaultRamp = [10, 20, 30, 60, 100, 300];
    const allDemands = Array.from(new Set([...defaultRamp, ...customDemands])).sort(
      (a, b) => a - b
    );
    const targetPvp = targetSalesPrice.trim() !== '' ? Number(targetSalesPrice) : null;

    return OperationalCostEngine.calculateScenarioMatrix(
      allDemands,
      batchNominalYield,
      isFractionalAllowed,
      surplusDestination,
      yieldResult.totalGrossMaterialCost,
      targetPvp,
      operationConfig
    );
  }, [
    batchNominalYield,
    isFractionalAllowed,
    surplusDestination,
    yieldResult.totalGrossMaterialCost,
    targetSalesPrice,
    operationConfig,
    customDemands,
  ]);

  // 3. Break-Even Analysis
  const breakEvenResult: BreakEvenAnalysisResult = useMemo(() => {
    const targetPvp = targetSalesPrice.trim() !== '' ? Number(targetSalesPrice) : null;
    return BreakEvenCalculator.calculateBreakEven(
      yieldResult.rawMaterialCostPerNominalPortion,
      batchNominalYield,
      targetPvp,
      operationConfig,
      70.0
    );
  }, [yieldResult, batchNominalYield, targetSalesPrice, operationConfig]);

  // 4. Scenario Evaluation against Capacity Constraints
  const evaluationMatrix: ScenarioEvaluationMatrix = useMemo(() => {
    const targetPvp = targetSalesPrice.trim() !== '' ? Number(targetSalesPrice) : null;
    const maxUnits = maxUnitsPerRun.trim() !== '' ? Number(maxUnitsPerRun) : null;

    return ScenarioEvaluator.evaluateMatrix(
      scenarios,
      optimizationGoal,
      { maxUnitsPerRun: maxUnits },
      operationConfig,
      targetPvp
    );
  }, [scenarios, optimizationGoal, maxUnitsPerRun, operationConfig, targetSalesPrice]);

  // 5. Executive Verdict & Conclusion Triad
  const executiveVerdict: ExecutiveVerdictResult = useMemo(() => {
    const targetPvp = targetSalesPrice.trim() !== '' ? Number(targetSalesPrice) : null;
    const mockVersion: StudyVersion = {
      id: 'ver-current',
      studyId: 'study-current',
      versionNumber: 1,
      versionStatus: isVersionFrozen ? 'CONGELADA' : 'BORRADOR',
      targetPvp,
      salesUnit: 'ración',
      salesUnitSize: 1,
      batchUnitName,
      batchNominalYield,
      isFractionalAllowed,
      surplusDestination,
      conclusionTier: 'CONDITIONED',
      provenanceSummary: yieldResult.provenanceDistribution.dominantProvenance,
      marketPricesSnapshot: {},
      isFrozen: isVersionFrozen,
      createdAt: new Date().toISOString(),
    };

    const domainIngredients: StudyIngredient[] = ingredients.map((ing) => ({
      id: ing.id,
      versionId: 'ver-current',
      ingredientName: ing.name,
      grossQuantity: ing.grossAmount,
      grossUnit: ing.grossUnit,
      unitPrice: ing.unitPrice,
      priceProvenance: ing.provenance,
      densityKgPerL: ing.densityKgPerL ?? null,
      pieceMassKg: ing.pieceMassKg ?? null,
      trimmingLossPct: ing.trimmingLossPct,
      netUsableQuantity:
        ing.trimmingLossPct != null
          ? ing.grossAmount * (1 - ing.trimmingLossPct / 100)
          : null,
      createdAt: new Date().toISOString(),
    }));

    return ExecutiveVerdictEngine.synthesizeVerdict(
      dishName,
      mockVersion,
      domainIngredients,
      operationConfig,
      evaluationMatrix,
      breakEvenResult
    );
  }, [
    dishName,
    targetSalesPrice,
    isVersionFrozen,
    batchUnitName,
    batchNominalYield,
    isFractionalAllowed,
    surplusDestination,
    yieldResult,
    ingredients,
    operationConfig,
    evaluationMatrix,
    breakEvenResult,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // User Actions
  // ───────────────────────────────────────────────────────────────────────────

  const handleAddIngredient = () => {
    if (isVersionFrozen) {
      toast.error('Acción denegada: La versión 1 está CONGELADA e inmutable.');
      return;
    }
    if (!newIngredientName.trim()) return;
    const newRow: InquiryIngredientRow = {
      id: `ing-${Date.now()}`,
      name: newIngredientName.trim(),
      grossAmount: 0.1,
      grossUnit: 'kg',
      unitPrice: 2.5,
      provenance: 'MANUAL',
      trimmingLossPct: null,
    };
    setIngredients((prev) => [...prev, newRow]);
    setNewIngredientName('');
  };

  const handleRemoveIngredient = (id: string) => {
    if (isVersionFrozen) {
      toast.error('Acción denegada: La versión 1 está CONGELADA e inmutable.');
      return;
    }
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateIngredient = (id: string, patch: Partial<InquiryIngredientRow>) => {
    if (isVersionFrozen) {
      toast.error('Acción denegada: La versión 1 está CONGELADA e inmutable.');
      return;
    }
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  };

  const handleAddCustomDemand = () => {
    if (isVersionFrozen) {
      toast.error('Acción denegada: La versión 1 está CONGELADA e inmutable.');
      return;
    }
    const val = parseInt(customDemandInput.trim(), 10);
    if (!isNaN(val) && val > 0 && !customDemands.includes(val)) {
      setCustomDemands((prev) => [...prev, val]);
      setCustomDemandInput('');
      toast.success(`Escenario ad-hoc de ${val} raciones añadido a la matriz.`);
    }
  };

  const handleConfirmDecision = () => {
    if (isVersionFrozen) {
      toast.error('Acción denegada: La versión 1 ya está confirmada y congelada.');
      return;
    }
    const decision: StudyDecision = {
      id: `dec-${Date.now().toString(36)}`,
      versionId: persistedVersionId || 'ver-1',
      decisionVerdict,
      executiveSummaryText: executiveVerdict.narrativeSummary,
      humanDecisionStatus,
      selectedScenarioDemand: evaluationMatrix.recommendedScenario?.demandUnits ?? null,
      recommendedPvp: Number(targetSalesPrice) || null,
      approvedByUserId: userId ?? null,
      decisionNotes,
      decidedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRecordedDecision(decision);
    setIsVersionFrozen(true);
    toast.success(
      `Decisión soberana registrada. Versión 1 congelada e inmutable (#${decision.id}).`
    );

    // If persistent connection exists, update Supabase version to frozen
    if (persistedVersionId && tenantId && tenantId !== 'tenant-current' && tenantId !== 'tenant-test') {
      (supabase as any)
        .from('study_versions')
        .update({ is_frozen: true, version_status: 'CONGELADA' })
        .eq('id', persistedVersionId)
        .then(() => {})
        .catch((err: unknown) => console.warn('[MarketInquiry] Remote freeze sync failed:', err));
    }

    onSaveInquiry?.({
      studyId: persistedStudyId || `study-${Date.now()}`,
      productName: dishName,
      decision,
      status: 'DECISION',
      isFrozen: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 bg-slate-50">
        {/* Header Strip with 4-Level Funnel Stepper */}
        <div className="p-5 bg-white border-b sticky top-0 z-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Estudio Económico de Producto (CR-COST-07)</span>
                  {isVersionFrozen && (
                    <Badge className="bg-slate-900 text-white text-[10px] font-mono flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      v1 CONGELADA
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {dishName} · Embudo unificado: Mercado ──► Receta ──► Fábrica ──► Decisión
                </DialogDescription>
              </div>
            </div>

            {/* Triad Conclusion Badge */}
            <Badge
              className={cn(
                'text-xs font-mono py-1 px-2.5',
                executiveVerdict.conclusionTier === 'CERTIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : executiveVerdict.conclusionTier === 'CONDITIONED'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-200 text-slate-700 border-slate-300'
              )}
            >
              {executiveVerdict.headline}
            </Badge>
          </div>

          {/* Progressive 4-Level Stepper */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t text-xs">
            <button
              onClick={() => setCurrentLevel(1)}
              className={cn(
                'p-2 rounded-lg font-semibold text-left transition-all border flex items-center gap-2',
                currentLevel === 1
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px]', currentLevel === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700')}>1</span>
              <div>
                <div className="leading-tight">1. Mercado</div>
                <div className="text-[10px] text-slate-400 font-normal">Cotización MP</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentLevel(2)}
              className={cn(
                'p-2 rounded-lg font-semibold text-left transition-all border flex items-center gap-2',
                currentLevel === 2
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px]', currentLevel === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700')}>2</span>
              <div>
                <div className="leading-tight">2. Receta</div>
                <div className="text-[10px] text-slate-400 font-normal">Lotes y Mermas</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentLevel(3)}
              className={cn(
                'p-2 rounded-lg font-semibold text-left transition-all border flex items-center gap-2',
                currentLevel === 3
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px]', currentLevel === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700')}>3</span>
              <div>
                <div className="leading-tight">3. Fábrica</div>
                <div className="text-[10px] text-slate-400 font-normal">MO, Luz, Escenarios</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentLevel(4)}
              className={cn(
                'p-2 rounded-lg font-semibold text-left transition-all border flex items-center gap-2',
                currentLevel === 4
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px]', currentLevel === 4 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700')}>4</span>
              <div>
                <div className="leading-tight">4. Decisión</div>
                <div className="text-[10px] text-slate-400 font-normal">Capacidad y Cierre</div>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Body: Active Level */}
        <div className="p-5 space-y-5">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* NIVEL 1: MERCADO (Cotización de Materia Prima)                 */}
          {/* ───────────────────────────────────────────────────────────── */}
          {currentLevel === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Nombre del Plato</Label>
                  <Input
                    value={dishName}
                    disabled={isVersionFrozen}
                    onChange={(e) => setDishName(e.target.value)}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">PVP Objetivo (€ / ración)</Label>
                  <Input
                    type="number"
                    step="0.10"
                    disabled={isVersionFrozen}
                    value={targetSalesPrice}
                    onChange={(e) => setTargetSalesPrice(e.target.value)}
                    className="h-8 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Demanda Mensual Estimada</Label>
                  <Input
                    type="number"
                    disabled={isVersionFrozen}
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Table of Ingredients */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-3 border-b flex items-center justify-between bg-slate-50/70">
                  <span className="font-bold text-xs uppercase text-slate-700">
                    Ingredientes y Precios de Mercado
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Materia prima base: <strong>{yieldResult.rawMaterialCostPerNominalPortion.toFixed(2)} €/ración</strong>
                  </span>
                </div>

                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b text-[10px] text-slate-500 uppercase">
                    <tr>
                      <th className="p-2.5">Ingrediente</th>
                      <th className="p-2.5 w-24">Cantidad</th>
                      <th className="p-2.5">Procedencia</th>
                      <th className="p-2.5 text-right">Precio Unitario</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {ingredients.map((ing) => {
                      const subtotal = ing.grossAmount * ing.unitPrice;
                      return (
                        <tr key={ing.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-sans font-medium text-slate-900">{ing.name}</td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                disabled={isVersionFrozen}
                                value={ing.grossAmount}
                                onChange={(e) =>
                                  handleUpdateIngredient(ing.id, {
                                    grossAmount: Number(e.target.value) || 0,
                                  })
                                }
                                className="h-6 w-16 text-xs p-1 font-mono"
                              />
                              <span className="text-[11px] text-slate-400">{ing.grossUnit}</span>
                            </div>
                          </td>
                          <td className="p-2.5">
                            {ing.provenance === 'OBSERVADO' && (
                              <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">
                                [OBSERVADO] {ing.sourceName}
                              </Badge>
                            )}
                            {ing.provenance === 'REAL' && (
                              <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                [REAL] Factura
                              </Badge>
                            )}
                            {ing.provenance === 'MANUAL' && (
                              <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                                [MANUAL] Supuesto
                              </Badge>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-bold">
                            {ing.provenance === 'MANUAL' ? (
                              <Input
                                type="number"
                                step="0.05"
                                disabled={isVersionFrozen}
                                value={ing.unitPrice}
                                onChange={(e) =>
                                  handleUpdateIngredient(ing.id, {
                                    unitPrice: Number(e.target.value) || 0,
                                  })
                                }
                                className="h-6 w-16 text-xs font-mono p-1 text-right ml-auto"
                              />
                            ) : (
                              <span>{ing.unitPrice.toFixed(2)} €/{ing.grossUnit}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {subtotal.toFixed(3)} €
                          </td>
                          <td className="p-2.5 text-right">
                            {!isVersionFrozen && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveIngredient(ing.id)}
                                className="h-6 w-6 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {!isVersionFrozen && (
                  <div className="p-2.5 bg-slate-50/50 border-t flex items-center gap-2">
                    <Input
                      placeholder="Añadir nuevo ingrediente a cotizar..."
                      value={newIngredientName}
                      onChange={(e) => setNewIngredientName(e.target.value)}
                      className="h-7 text-xs bg-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddIngredient}
                      disabled={!newIngredientName.trim()}
                      className="h-7 text-xs font-semibold shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Añadir
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setCurrentLevel(2)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
                >
                  <span>Avanzar a Receta & Mermas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* NIVEL 2: RECETA & MERMAS (Física de Lotes y Rendimiento)       */}
          {/* ───────────────────────────────────────────────────────────── */}
          {currentLevel === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-white rounded-xl border space-y-3">
                <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider">
                  Definición de Lote Físico de Producción
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-slate-600">Unidad de Preparación / Lote</Label>
                    <Input
                      value={batchUnitName}
                      disabled={isVersionFrozen}
                      onChange={(e) => setBatchUnitName(e.target.value)}
                      placeholder="ej. tarta, bandeja, olla"
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-600">Raciones Vendibles por Lote</Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      disabled={isVersionFrozen}
                      value={batchNominalYield}
                      onChange={(e) => setBatchNominalYield(Number(e.target.value) || 1)}
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-600">¿Permite Lotes Fraccionados?</Label>
                    <Select
                      value={isFractionalAllowed ? 'true' : 'false'}
                      disabled={isVersionFrozen}
                      onValueChange={(val) => setIsFractionalAllowed(val === 'true')}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No (Solo lotes enteros físicos)</SelectItem>
                        <SelectItem value="true">Sí (Cálculo fraccionario continuo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Multi-Stage Losses */}
              <div className="p-4 bg-white rounded-xl border space-y-3">
                <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center justify-between">
                  <span>Mermas de Proceso Culinar (Cascada Cuantitativa)</span>
                  <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 border-indigo-200">
                    Rendimiento Global: {yieldResult.cookingAndProcessYieldPct.toFixed(1)}%
                  </Badge>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border">
                    <div className="flex justify-between font-semibold">
                      <span>Etapa 1: Cocción y evaporación al horno</span>
                      <span className="font-mono text-indigo-700">{cookingLossPct}% merma</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="0.5"
                      disabled={isVersionFrozen}
                      value={cookingLossPct}
                      onChange={(e) => setCookingLossPct(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border">
                    <div className="flex justify-between font-semibold">
                      <span>Etapa 2: Porcionado y recorte de bordes</span>
                      <span className="font-mono text-indigo-700">{portioningLossPct}% merma</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      disabled={isVersionFrozen}
                      value={portioningLossPct}
                      onChange={(e) => setPortioningLossPct(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Warnings regarding density and trimming */}
                {yieldResult.epistemicWarnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Advertencias Epistemológicas (Cero Supuestos Mágicos):</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {yieldResult.epistemicWarnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentLevel(1)}
                  className="text-xs font-semibold gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Mercado</span>
                </Button>
                <Button
                  onClick={() => setCurrentLevel(3)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
                >
                  <span>Avanzar a Fábrica & Operaciones</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* NIVEL 3: FÁBRICA & OPERACIONES (Tiempos, Energía, Packaging)   */}
          {/* ───────────────────────────────────────────────────────────── */}
          {currentLevel === 3 && (
            <div className="space-y-4 animate-fade-in">
              {/* Labor Times */}
              <div className="p-4 bg-white rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider">
                    Mano de Obra No Lineal (Setup Fijo + Tiempos Variables)
                  </h4>
                  {operationConfig.laborHourlyRate == null ? (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-bold">
                      [NO CONFIGURADO]
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                      Tarifa: {operationConfig.laborHourlyRate.toFixed(2)} €/h
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-slate-600">Setup Fijo (min)</Label>
                    <Input
                      type="number"
                      disabled={isVersionFrozen}
                      value={laborSetupMin}
                      onChange={(e) => setLaborSetupMin(Number(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-600">Limpieza Fija (min)</Label>
                    <Input
                      type="number"
                      disabled={isVersionFrozen}
                      value={laborCleaningMin}
                      onChange={(e) => setLaborCleaningMin(Number(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-600">Por Lote (min)</Label>
                    <Input
                      type="number"
                      disabled={isVersionFrozen}
                      value={laborBatchMin}
                      onChange={(e) => setLaborBatchMin(Number(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-600">Por Ración (min)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      disabled={isVersionFrozen}
                      value={laborUnitMin}
                      onChange={(e) => setLaborUnitMin(Number(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-600">Coste / Hora (€/h)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Vacío = [NO CONFIG.]"
                      disabled={isVersionFrozen}
                      value={laborHourlyRate}
                      onChange={(e) => setLaborHourlyRate(e.target.value)}
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Energy & Packaging & Surplus */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Energy */}
                <div className="p-3.5 bg-white rounded-xl border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase text-[11px] text-slate-800">Energía Trazable</span>
                    <Badge variant="outline" className="text-[9px]">
                      {energyMethod}
                    </Badge>
                  </div>
                  <Select
                    value={energyMethod}
                    disabled={isVersionFrozen}
                    onValueChange={(val) => setEnergyMethod(val as EnergyMethod)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUANTITATIVE">Cuantitativa (kW · h · tarifa)</SelectItem>
                      <SelectItem value="PERCENTAGE">Porcentual (% s/ materia prima)</SelectItem>
                      <SelectItem value="MANUAL_FLAT">Tarifa Plana por Lote (€)</SelectItem>
                      <SelectItem value="NOT_APPLICABLE">[No Aplica (0,00 €)]</SelectItem>
                      <SelectItem value="UNCONFIGURED">[No Configurado (null)]</SelectItem>
                    </SelectContent>
                  </Select>
                  {energyMethod === 'QUANTITATIVE' && (
                    <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-[11px]">
                      <div>
                        <Label className="text-[10px]">kW</Label>
                        <Input
                          type="number"
                          value={energyPowerKw}
                          onChange={(e) => setEnergyPowerKw(Number(e.target.value) || 0)}
                          className="h-6 p-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Horas</Label>
                        <Input
                          type="number"
                          value={energyCycleHours}
                          onChange={(e) => setEnergyCycleHours(Number(e.target.value) || 0)}
                          className="h-6 p-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">€/kWh</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={energyTariffKwh}
                          onChange={(e) => setEnergyTariffKwh(Number(e.target.value) || 0)}
                          className="h-6 p-1 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Packaging */}
                <div className="p-3.5 bg-white rounded-xl border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase text-[11px] text-slate-800">Packaging</span>
                    <Badge variant="outline" className="text-[9px]">
                      {packagingMode}
                    </Badge>
                  </div>
                  <Select
                    value={packagingMode}
                    disabled={isVersionFrozen}
                    onValueChange={(val) => setPackagingMode(val as PackagingMode)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONFIGURED">Configurado (Primario + Secundario)</SelectItem>
                      <SelectItem value="NOT_APPLICABLE">[No Aplica (0,00 €)]</SelectItem>
                      <SelectItem value="UNCONFIGURED">[No Configurado (null)]</SelectItem>
                    </SelectContent>
                  </Select>
                  {packagingMode === 'CONFIGURED' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div>
                        <Label className="text-[10px]">Primario (€/u)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          value={packagingUnitCost}
                          onChange={(e) => setPackagingUnitCost(Number(e.target.value) || 0)}
                          className="h-6 p-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Caja (€/caja)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={packagingSecondaryCost}
                          onChange={(e) => setPackagingSecondaryCost(Number(e.target.value) || 0)}
                          className="h-6 p-1 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Surplus Destination */}
                <div className="p-3.5 bg-white rounded-xl border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase text-[11px] text-slate-800">Destino Excedente</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px]',
                        surplusDestination === 'UNCONFIGURED' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                      )}
                    >
                      {surplusDestination === 'UNCONFIGURED' ? '[PENDIENTE]' : surplusDestination}
                    </Badge>
                  </div>
                  <Select
                    value={surplusDestination}
                    disabled={isVersionFrozen}
                    onValueChange={(val) => setSurplusDestination(val as SurplusDestination)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK_REFRIGERADO">Stock Refrigerado</SelectItem>
                      <SelectItem value="STOCK_CONGELADO">Stock Congelado</SelectItem>
                      <SelectItem value="VENTA_POSTERIOR">Venta Posterior</SelectItem>
                      <SelectItem value="MERMA_DESPERDICIO">Merma / Desperdicio</SelectItem>
                      <SelectItem value="CONSUMO_INTERNO">Consumo Interno</SelectItem>
                      <SelectItem value="UNCONFIGURED">[Destino No Configurado]</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    {surplusDestination === 'UNCONFIGURED'
                      ? '⚠️ Bloquea el coste por unidad vendida si se generan raciones sobrantes.'
                      : 'Define el tratamiento contable de las raciones producidas no vendidas.'}
                  </p>
                </div>
              </div>

              {/* Scenario Matrix */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-3 border-b bg-slate-50/70 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase text-slate-700">
                    Matriz Multidimensional de Escenarios (Rampa de Producción)
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Demanda ad-hoc..."
                      value={customDemandInput}
                      onChange={(e) => setCustomDemandInput(e.target.value)}
                      className="h-6 w-32 text-[11px] bg-white font-mono"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDemand()}
                    />
                    <Button size="sm" onClick={handleAddCustomDemand} className="h-6 text-[11px] px-2 font-semibold">
                      + Añadir
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-50 border-b text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5">Demanda</th>
                        <th className="p-2.5 text-center">Lotes</th>
                        <th className="p-2.5 text-center">Producidas</th>
                        <th className="p-2.5 text-center">Excedente</th>
                        <th className="p-2.5 text-right">Coste Total</th>
                        <th className="p-2.5 text-right">Coste / Ración Vendida</th>
                        <th className="p-2.5 text-right">Margen Bruto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {scenarios.map((sc) => (
                        <tr key={sc.demandUnits} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{sc.demandUnits} raciones</td>
                          <td className="p-2.5 text-center">{sc.batchesRequired}</td>
                          <td className="p-2.5 text-center">{sc.unitsProduced}</td>
                          <td className="p-2.5 text-center">
                            {sc.surplusUnits > 0 ? (
                              <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800">
                                +{sc.surplusUnits} u
                              </Badge>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-medium">{sc.totalKnownDirectCost.toFixed(2)} €</td>
                          <td className="p-2.5 text-right font-bold">
                            {sc.costPerSoldUnit != null ? (
                              <span className="text-indigo-700">{sc.costPerSoldUnit.toFixed(2)} €</span>
                            ) : (
                              <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-300">
                                [DESTINO NO CONFIGURADO]
                              </Badge>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-bold">
                            {sc.grossMarginPct != null ? (
                              <span className={sc.grossMarginPct >= 60 ? 'text-emerald-700' : 'text-amber-700'}>
                                {sc.grossMarginPct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentLevel(2)}
                  className="text-xs font-semibold gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Receta</span>
                </Button>
                <Button
                  onClick={() => setCurrentLevel(4)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
                >
                  <span>Avanzar a Decisión & Capacidad</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* NIVEL 4: DECISIÓN SOBERANA & BREAK-EVEN (Inteligencia Ejecutiva) */}
          {/* ───────────────────────────────────────────────────────────── */}
          {currentLevel === 4 && (
            <div className="space-y-4 animate-fade-in">
              {/* Capacity Constraints & Optimization Goal */}
              <div className="p-4 bg-white rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider">
                    Objetivo Humano & Restricciones de Capacidad Física
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 border-indigo-200">
                    Escenario calculable ≠ escenario viable
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <Label className="text-slate-600">Objetivo de Optimización</Label>
                    <Select
                      value={optimizationGoal}
                      disabled={isVersionFrozen}
                      onValueChange={(val) => setOptimizationGoal(val as OptimizationGoal)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MINIMIZE_COST">Minimizar Coste Unitario Vendido</SelectItem>
                        <SelectItem value="MAXIMIZE_MARGIN">Maximizar Margen Bruto (%)</SelectItem>
                        <SelectItem value="MAXIMIZE_PROFIT">Maximizar Beneficio Neto Total (€)</SelectItem>
                        <SelectItem value="MINIMIZE_SURPLUS">Minimizar Raciones Excedentes</SelectItem>
                        <SelectItem value="RESPECT_CAPACITY">Maximizar Volumen con Capacidad Segura (&lt;85%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-600">Capacidad Máxima Instalada (raciones/tirada)</Label>
                    <Input
                      type="number"
                      step="5"
                      disabled={isVersionFrozen}
                      value={maxUnitsPerRun}
                      onChange={(e) => setMaxUnitsPerRun(e.target.value)}
                      placeholder="ej. 60 raciones (límite de horno)"
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Recommended Scenario Card */}
              {evaluationMatrix.recommendedScenario ? (
                <div className="p-4 rounded-xl bg-linear-to-br from-indigo-50/90 via-white to-indigo-50/40 border border-indigo-200 text-slate-900 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-indigo-600 text-white font-bold text-[10px]">
                        RECOMENDADO
                      </span>
                      <span className="font-bold text-sm text-indigo-950">
                        Escenario de {evaluationMatrix.recommendedScenario.demandUnits} raciones ({evaluationMatrix.recommendedScenario.batchesRequired} lote/s)
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white text-indigo-800 border-indigo-300 font-mono">
                      Carga: {evaluationMatrix.recommendedScenario.capacity.capacityLoadPct ?? 0}%
                    </Badge>
                  </div>

                  <p className="text-xs text-indigo-800">
                    {evaluationMatrix.recommendedScenario.recommendationReason}
                  </p>

                  <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-[10px] text-slate-400 block">Coste / Ración</span>
                      <span className="font-bold text-slate-900">{evaluationMatrix.recommendedScenario.costPerSoldUnit?.toFixed(2)} €</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-[10px] text-slate-400 block">Margen Bruto</span>
                      <span className="font-bold text-emerald-700">{evaluationMatrix.recommendedScenario.grossMarginPct?.toFixed(1)}%</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-[10px] text-slate-400 block">Excedente Físico</span>
                      <span className="font-bold text-slate-900">{evaluationMatrix.recommendedScenario.surplusUnits} u</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-[10px] text-slate-400 block">Beneficio Proyectado</span>
                      <span className="font-bold text-indigo-700">
                        +{((evaluationMatrix.recommendedScenario.demandUnits * Number(targetSalesPrice)) - evaluationMatrix.recommendedScenario.totalKnownDirectCost).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>{evaluationMatrix.selectionExplanation}</span>
                </div>
              )}

              {/* Break-Even & Sensitivity Factors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Break-Even */}
                <div className="p-3.5 bg-white rounded-xl border space-y-2 font-mono">
                  <span className="font-bold uppercase text-[10px] text-slate-400 font-sans block">
                    Punto de Equilibrio (Break-Even)
                  </span>
                  <div className="flex justify-between">
                    <span>Coste Fijo por Tirada:</span>
                    <strong>{breakEvenResult.batchMetrics.fixedCostPerBatch.toFixed(2)} €</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Margen Contribución / Ración:</span>
                    <strong>{breakEvenResult.batchMetrics.contributionMarginPerUnit?.toFixed(2) ?? '—'} €</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Raciones para Amortizar Tirada:</span>
                    <strong className="text-indigo-700">
                      {breakEvenResult.batchMetrics.breakEvenBatchUnits != null
                        ? `${breakEvenResult.batchMetrics.breakEvenBatchUnits} raciones`
                        : 'No alcanzable'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>PVP Mínimo Recomendado (70% margen):</span>
                    <strong className="text-emerald-700">
                      {breakEvenResult.pvpRecommendation.minimumViablePvp?.toFixed(2) ?? '—'} €
                    </strong>
                  </div>
                </div>

                {/* Sensitivity & Epistemic Warnings */}
                <div className="p-3.5 bg-white rounded-xl border space-y-2 text-xs">
                  <span className="font-bold uppercase text-[10px] text-slate-400 block">
                    Factores de Sensibilidad & Auditoría
                  </span>
                  {executiveVerdict.sensitivityFactors.length > 0 ? (
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {executiveVerdict.sensitivityFactors.map((fact, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">Sin factores de sensibilidad detectados.</p>
                  )}
                </div>
              </div>

              {/* Sovereign Decision Recording Box */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      Registro de Decisión Soberana Humana (study_decisions)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Auditoría Inmutable Supabase
                  </span>
                </div>

                {isVersionFrozen ? (
                  <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/50 space-y-1">
                    <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Decisión ratificada y versión congelada: {recordedDecision?.decisionVerdict}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{recordedDecision?.decisionNotes}</p>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Registrado el {recordedDecision?.decidedAt} por {userName}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <Label className="text-slate-300">Veredicto Ejecutivo *</Label>
                        <Select
                          value={decisionVerdict}
                          onValueChange={(val) => setDecisionVerdict(val as DecisionVerdict)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APPROVED_FOR_MENU">🟢 Aprobado para Inclusión en Carta</SelectItem>
                            <SelectItem value="REJECTED_MARGIN_TOO_LOW">🔴 Rechazado por Margen Insuficiente</SelectItem>
                            <SelectItem value="REJECTED_CAPACITY_LIMIT">🔴 Rechazado por Límite de Capacidad</SelectItem>
                            <SelectItem value="POSTPONED_NEEDS_RECIPE_REVISION">🟡 Pospuesto para Reformulación de Receta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-slate-300">Estado de la Decisión</Label>
                        <Select
                          value={humanDecisionStatus}
                          onValueChange={(val) => setHumanDecisionStatus(val as HumanDecisionStatus)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APPROVED">Confirmada / Aprobada</SelectItem>
                            <SelectItem value="REJECTED">Rechazada</SelectItem>
                            <SelectItem value="POSTPONED">Pospuesta / En espera</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <Label className="text-slate-300">Notas de Decisión del Comité / Chef</Label>
                      <Textarea
                        rows={2}
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        className="text-xs bg-slate-800 border-slate-700 text-white resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        onClick={handleConfirmDecision}
                        className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Confirmar Decisión y Congelar Versión 1</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentLevel(3)}
                  className="text-xs font-semibold gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Fábrica</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 bg-white border-t flex items-center justify-between sm:justify-between sticky bottom-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Nivel {currentLevel} de 4
            </span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
