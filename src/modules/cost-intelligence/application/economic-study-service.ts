// ============================================================================
// YOURMEAL OS — ECONOMIC STUDY APPLICATION SERVICE (CR-COST-07A/B)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// Orchestrates Drafts, Versions, Multi-Stage BOM, Operations & Scenarios
// ============================================================================

import type { EconomicStudyRepository } from '../infrastructure/economic-study-repository';
import { YieldCascadeCalculator } from '../domain/yield-cascade-calculator';
import { EconomicStudyLifecycle } from '../domain/economic-study-lifecycle';
import { OperationalCostEngine } from '../domain/operational-cost-engine';
import type {
  EconomicStudy,
  StudyVersion,
  StudyIngredient,
  StudyYieldStage,
  YieldCalculationResult,
  GrossUnit,
  PriceProvenance,
  MarketPriceSnapshotEntry,
  SurplusDestination,
} from '../domain/product-economics-types';
import type {
  StudyOperationConfig,
  ScenarioCalculationResult,
  EnergyMethod,
  PackagingMode,
} from '../domain/production-operational-types';
import { BreakEvenCalculator } from '../domain/break-even-calculator';
import { ScenarioEvaluator } from '../domain/scenario-evaluator';
import { MarketVarianceDetector } from '../domain/market-variance-detector';
import { ExecutiveVerdictEngine } from '../domain/executive-verdict-engine';
import type {
  StudyDecision,
  DecisionVerdict,
  HumanDecisionStatus,
  BreakEvenAnalysisResult,
  CapacityConstraint,
  OptimizationGoal,
  ScenarioEvaluationMatrix,
  MarketVarianceCheckResult,
  ExecutiveVerdictResult,
} from '../domain/decision-intelligence-types';

export interface CreateDraftStudyDTO {
  tenantId: string;
  productName: string;
  productCategory?: string;
  targetPvp?: number;
  batchUnitName?: string;
  batchNominalYield?: number;
  isFractionalAllowed?: boolean;
}

export interface AddIngredientDTO {
  versionId: string;
  ingredientName: string;
  grossQuantity: number;
  grossUnit: GrossUnit;
  unitPrice: number;
  priceProvenance: PriceProvenance;
  trimmingLossPct?: number | null;
  densityKgPerL?: number | null;
  pieceMassKg?: number | null;
  marketPriceId?: string;
}

export interface AddYieldStageDTO {
  versionId: string;
  stageOrder: number;
  stageName: string;
  lossPercentage: number;
  provenance?: 'OBSERVADO' | 'MANUAL';
}

export interface ConfigureOperationsDTO {
  versionId: string;
  laborSetupMinutes?: number;
  laborBatchMinutes?: number;
  laborUnitMinutes?: number;
  laborCleaningMinutes?: number;
  laborHourlyRate?: number | null;
  energyMethod?: EnergyMethod;
  energyPowerKw?: number | null;
  energyCycleHours?: number | null;
  energyTariffKwh?: number | null;
  energyPercentageRate?: number | null;
  energyFlatFee?: number | null;
  packagingMode?: PackagingMode;
  packagingUnitCost?: number | null;
  packagingSecondaryCost?: number | null;
  packagingSecondaryCapacity?: number | null;
}

export interface RecordDecisionDTO {
  versionId: string;
  tenantId: string;
  verdict: DecisionVerdict;
  humanStatus: HumanDecisionStatus;
  executiveSummaryText: string;
  selectedScenarioDemand?: number | null;
  recommendedPvp?: number | null;
  approvedByUserId?: string | null;
  decisionNotes?: string | null;
}

export interface StudySummaryDTO {
  study: EconomicStudy;
  activeVersion: StudyVersion;
  ingredients: StudyIngredient[];
  yieldStages: StudyYieldStage[];
  yieldResult: YieldCalculationResult;
  operationConfig: StudyOperationConfig | null;
  scenarios: ScenarioCalculationResult[];
  breakEven: BreakEvenAnalysisResult;
  evaluationMatrix?: ScenarioEvaluationMatrix;
  executiveVerdict?: ExecutiveVerdictResult;
  decision?: StudyDecision | null;
  conclusion: {
    tier: string;
    label: string;
    reason: string;
  };
}

export class EconomicStudyService {
  constructor(private readonly repository: EconomicStudyRepository) {}

  /**
   * Creates a new Economic Study draft with an initial mutable version (v1).
   */
  async createDraft(dto: CreateDraftStudyDTO): Promise<{
    study: EconomicStudy;
    version: StudyVersion;
  }> {
    const study = await this.repository.createStudy({
      tenantId: dto.tenantId,
      productName: dto.productName,
      productCategory: dto.productCategory ?? 'general',
      currentStatus: 'BORRADOR',
      activeVersionNumber: 1,
    });

    const version = await this.repository.createVersion({
      studyId: study.id,
      versionNumber: 1,
      versionStatus: 'BORRADOR',
      targetPvp: dto.targetPvp ?? null,
      salesUnit: 'ración',
      salesUnitSize: 1.0,
      batchUnitName: dto.batchUnitName ?? 'lote',
      batchNominalYield: dto.batchNominalYield ?? 1.0,
      isFractionalAllowed: dto.isFractionalAllowed ?? false,
      surplusDestination: 'UNCONFIGURED',
      conclusionTier: 'INSUFFICIENT_DATA',
      provenanceSummary: 'MANUAL',
      marketPricesSnapshot: {},
      isFrozen: false,
    });

    return { study, version };
  }

  /**
   * Updates version specifications such as target PVP, nominal yield, surplus destination.
   */
  async updateVersionSpecifications(
    versionId: string,
    specs: {
      targetPvp?: number | null;
      batchNominalYield?: number;
      isFractionalAllowed?: boolean;
      surplusDestination?: SurplusDestination;
    }
  ): Promise<StudyVersion> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);

    EconomicStudyLifecycle.assertVersionMutable(version);

    return this.repository.updateVersion(versionId, {
      ...specs,
    });
  }

  /**
   * Adds an ingredient line to a study version with automatic trimming loss computation.
   */
  async addIngredient(dto: AddIngredientDTO): Promise<StudyIngredient> {
    const version = await this.repository.getVersionById(dto.versionId);
    if (!version) throw new Error(`Version ${dto.versionId} not found`);

    EconomicStudyLifecycle.assertVersionMutable(version);

    const trimmingPct = dto.trimmingLossPct !== undefined ? dto.trimmingLossPct : null;
    const netUsableQuantity = YieldCascadeCalculator.calculateIngredientNetUsable(
      dto.grossQuantity,
      trimmingPct
    );

    const ingredient = await this.repository.addIngredient({
      versionId: dto.versionId,
      ingredientName: dto.ingredientName,
      grossQuantity: dto.grossQuantity,
      grossUnit: dto.grossUnit,
      marketPriceId: dto.marketPriceId ?? null,
      unitPrice: dto.unitPrice,
      priceProvenance: dto.priceProvenance,
      densityKgPerL: dto.densityKgPerL ?? null,
      pieceMassKg: dto.pieceMassKg ?? null,
      trimmingLossPct: trimmingPct,
      netUsableQuantity,
    });

    // Refresh readiness and conclusion tier
    await this.refreshVersionReadiness(version.studyId, version.id);

    return ingredient;
  }

  /**
   * Adds a process yield stage (e.g. baking, portioning) to a study version.
   */
  async addYieldStage(dto: AddYieldStageDTO): Promise<StudyYieldStage> {
    const version = await this.repository.getVersionById(dto.versionId);
    if (!version) throw new Error(`Version ${dto.versionId} not found`);

    EconomicStudyLifecycle.assertVersionMutable(version);

    const stage = await this.repository.addYieldStage({
      versionId: dto.versionId,
      stageOrder: dto.stageOrder,
      stageName: dto.stageName,
      lossPercentage: dto.lossPercentage,
      provenance: dto.provenance ?? 'MANUAL',
    });

    return stage;
  }

  /**
   * Computes the deterministic multi-stage yield and raw material economics.
   */
  async calculateYield(versionId: string): Promise<YieldCalculationResult> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);

    const ingredients = await this.repository.getIngredientsByVersion(versionId);
    const stages = await this.repository.getYieldStagesByVersion(versionId);

    return YieldCascadeCalculator.calculateYieldCascade(
      ingredients,
      stages,
      version.batchNominalYield
    );
  }

  /**
   * 07B: Configures operational costs (Labor, Energy, Packaging).
   */
  async configureOperations(dto: ConfigureOperationsDTO): Promise<StudyOperationConfig> {
    const version = await this.repository.getVersionById(dto.versionId);
    if (!version) throw new Error(`Version ${dto.versionId} not found`);

    EconomicStudyLifecycle.assertVersionMutable(version);

    return this.repository.saveOperationConfig({
      versionId: dto.versionId,
      laborSetupMinutes: dto.laborSetupMinutes ?? 0,
      laborBatchMinutes: dto.laborBatchMinutes ?? 0,
      laborUnitMinutes: dto.laborUnitMinutes ?? 0,
      laborCleaningMinutes: dto.laborCleaningMinutes ?? 0,
      laborHourlyRate: dto.laborHourlyRate ?? null,
      energyMethod: dto.energyMethod ?? 'UNCONFIGURED',
      energyPowerKw: dto.energyPowerKw ?? null,
      energyCycleHours: dto.energyCycleHours ?? null,
      energyTariffKwh: dto.energyTariffKwh ?? null,
      energyPercentageRate: dto.energyPercentageRate ?? null,
      energyFlatFee: dto.energyFlatFee ?? null,
      packagingMode: dto.packagingMode ?? 'UNCONFIGURED',
      packagingUnitCost: dto.packagingUnitCost ?? null,
      packagingSecondaryCost: dto.packagingSecondaryCost ?? null,
      packagingSecondaryCapacity: dto.packagingSecondaryCapacity ?? null,
    });
  }

  /**
   * 07B: Generates the scenario matrix for standard ramp [10, 20, 30, 60, 100, 300] + custom demands.
   */
  async generateScenarios(
    versionId: string,
    tenantId: string,
    customDemands: number[] = []
  ): Promise<ScenarioCalculationResult[]> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);

    let study = await this.repository.getStudyById(version.studyId, tenantId);
    if (!study) throw new Error(`Study ${version.studyId} not found for tenant ${tenantId}`);

    const ingredients = await this.repository.getIngredientsByVersion(versionId);
    const stages = await this.repository.getYieldStagesByVersion(versionId);
    const config = await this.repository.getOperationConfig(versionId);

    const yieldResult = YieldCascadeCalculator.calculateYieldCascade(
      ingredients,
      stages,
      version.batchNominalYield
    );

    const defaultRamp = [10, 20, 30, 60, 100, 300];
    const allDemands = Array.from(new Set([...defaultRamp, ...customDemands]));

    const scenarios = OperationalCostEngine.calculateScenarioMatrix(
      allDemands,
      version.batchNominalYield,
      version.isFractionalAllowed,
      version.surplusDestination,
      yieldResult.totalGrossMaterialCost,
      version.targetPvp,
      config
    );

    await this.repository.saveScenarios(versionId, scenarios);

    // Progress study status through lifecycle
    if (study.currentStatus === 'BORRADOR' || study.currentStatus === 'EN_CONFIGURACION') {
      if (EconomicStudyLifecycle.canTransition(study.currentStatus, 'EN_CONFIGURACION')) {
        study = await this.repository.updateStudyStatus(study.id, tenantId, 'EN_CONFIGURACION');
      }
      if (EconomicStudyLifecycle.canTransition(study.currentStatus, 'LISTO_SIMULAR')) {
        study = await this.repository.updateStudyStatus(study.id, tenantId, 'LISTO_SIMULAR');
      }
    }

    if (EconomicStudyLifecycle.canTransition(study.currentStatus, 'ESTUDIADO')) {
      await this.repository.updateStudyStatus(study.id, tenantId, 'ESTUDIADO');
    }

    return scenarios;
  }

  /**
   * Freezes a study version, rendering it completely immutable.
   */
  async freezeVersion(versionId: string): Promise<StudyVersion> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);

    return this.repository.updateVersion(versionId, {
      isFrozen: true,
      versionStatus: 'CONGELADA',
    });
  }

  /**
   * Creates a new version (v2, v3, etc.) copying specifications, operations, and snapshotting market prices.
   */
  async createNewVersion(
    studyId: string,
    tenantId: string,
    marketPricesSnapshot: Record<string, MarketPriceSnapshotEntry> = {}
  ): Promise<StudyVersion> {
    const study = await this.repository.getStudyById(studyId, tenantId);
    if (!study) throw new Error(`Study ${studyId} not found for tenant ${tenantId}`);

    const previousVersion = await this.repository.getVersionByStudyAndNumber(
      studyId,
      study.activeVersionNumber
    );
    if (!previousVersion) throw new Error(`Active version not found for study ${studyId}`);

    // Create next version
    const nextVersionNumber = study.activeVersionNumber + 1;
    const newVersion = await this.repository.createVersion({
      studyId,
      versionNumber: nextVersionNumber,
      versionStatus: 'BORRADOR',
      targetPvp: previousVersion.targetPvp,
      salesUnit: previousVersion.salesUnit,
      salesUnitSize: previousVersion.salesUnitSize,
      batchUnitName: previousVersion.batchUnitName,
      batchNominalYield: previousVersion.batchNominalYield,
      isFractionalAllowed: previousVersion.isFractionalAllowed,
      surplusDestination: previousVersion.surplusDestination,
      conclusionTier: previousVersion.conclusionTier,
      provenanceSummary: previousVersion.provenanceSummary,
      marketPricesSnapshot,
      isFrozen: false,
    });

    // Copy ingredients
    const previousIngredients = await this.repository.getIngredientsByVersion(previousVersion.id);
    for (const ing of previousIngredients) {
      await this.repository.addIngredient({
        versionId: newVersion.id,
        ingredientName: ing.ingredientName,
        grossQuantity: ing.grossQuantity,
        grossUnit: ing.grossUnit,
        marketPriceId: ing.marketPriceId,
        unitPrice: ing.unitPrice,
        priceProvenance: ing.priceProvenance,
        densityKgPerL: ing.densityKgPerL,
        pieceMassKg: ing.pieceMassKg,
        trimmingLossPct: ing.trimmingLossPct,
        netUsableQuantity: ing.netUsableQuantity,
      });
    }

    // Copy yield stages
    const previousStages = await this.repository.getYieldStagesByVersion(previousVersion.id);
    for (const stg of previousStages) {
      await this.repository.addYieldStage({
        versionId: newVersion.id,
        stageOrder: stg.stageOrder,
        stageName: stg.stageName,
        lossPercentage: stg.lossPercentage,
        provenance: stg.provenance,
      });
    }

    // Copy operation config if present
    const prevOpConfig = await this.repository.getOperationConfig(previousVersion.id);
    if (prevOpConfig) {
      await this.repository.saveOperationConfig({
        versionId: newVersion.id,
        laborSetupMinutes: prevOpConfig.laborSetupMinutes,
        laborBatchMinutes: prevOpConfig.laborBatchMinutes,
        laborUnitMinutes: prevOpConfig.laborUnitMinutes,
        laborCleaningMinutes: prevOpConfig.laborCleaningMinutes,
        laborHourlyRate: prevOpConfig.laborHourlyRate,
        energyMethod: prevOpConfig.energyMethod,
        energyPowerKw: prevOpConfig.energyPowerKw,
        energyCycleHours: prevOpConfig.energyCycleHours,
        energyTariffKwh: prevOpConfig.energyTariffKwh,
        energyPercentageRate: prevOpConfig.energyPercentageRate,
        energyFlatFee: prevOpConfig.energyFlatFee,
        packagingMode: prevOpConfig.packagingMode,
        packagingUnitCost: prevOpConfig.packagingUnitCost,
        packagingSecondaryCost: prevOpConfig.packagingSecondaryCost,
        packagingSecondaryCapacity: prevOpConfig.packagingSecondaryCapacity,
      });
    }

    // Update active version number in study
    await this.repository.updateStudyStatus(
      studyId,
      tenantId,
      study.currentStatus,
      nextVersionNumber
    );

    return newVersion;
  }

  /**
   * 07C: Calculates break-even batch and unit economics and recommended PVP.
   */
  async calculateBreakEven(
    versionId: string,
    targetMarginPct: number = 70.0
  ): Promise<BreakEvenAnalysisResult> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);

    const yieldResult = await this.calculateYield(versionId);
    const opConfig = await this.repository.getOperationConfig(versionId);

    return BreakEvenCalculator.calculateBreakEven(
      yieldResult.rawMaterialCostPerNominalPortion,
      version.batchNominalYield,
      version.targetPvp,
      opConfig,
      targetMarginPct
    );
  }

  /**
   * 07C: Evaluates scenarios against capacity constraints and selects the best candidate for an optimization goal.
   */
  async evaluateScenariosAndRecommend(
    versionId: string,
    goal: OptimizationGoal = 'MINIMIZE_COST',
    capacityConstraint?: CapacityConstraint
  ): Promise<ScenarioEvaluationMatrix> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);

    const scenarios = await this.repository.getScenarios(versionId);
    const opConfig = await this.repository.getOperationConfig(versionId);

    return ScenarioEvaluator.evaluateMatrix(
      scenarios,
      goal,
      capacityConstraint,
      opConfig,
      version.targetPvp
    );
  }

  /**
   * 07C: Checks for market price variances between frozen snapshot and current market prices.
   */
  async checkMarketVariance(
    versionId: string,
    currentMarketPrices: Record<string, number>
  ): Promise<MarketVarianceCheckResult> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);

    return MarketVarianceDetector.checkVariance(
      version.marketPricesSnapshot,
      currentMarketPrices
    );
  }

  /**
   * 07C: Synthesizes executive conclusion, human narrative explanation, and updates conclusion tier.
   */
  async generateExecutiveSynthesis(
    versionId: string,
    tenantId: string,
    goal: OptimizationGoal = 'MINIMIZE_COST',
    capacityConstraint?: CapacityConstraint
  ): Promise<{
    verdict: ExecutiveVerdictResult;
    evaluationMatrix: ScenarioEvaluationMatrix;
    breakEven: BreakEvenAnalysisResult;
  }> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);

    const study = await this.repository.getStudyById(version.studyId, tenantId);
    if (!study) throw new Error(`Study ${version.studyId} not found for tenant ${tenantId}`);

    const ingredients = await this.repository.getIngredientsByVersion(versionId);
    const opConfig = await this.repository.getOperationConfig(versionId);

    const breakEven = await this.calculateBreakEven(versionId);
    const evaluationMatrix = await this.evaluateScenariosAndRecommend(
      versionId,
      goal,
      capacityConstraint
    );

    const verdict = ExecutiveVerdictEngine.synthesizeVerdict(
      study.productName,
      version,
      ingredients,
      opConfig,
      evaluationMatrix,
      breakEven
    );

    await this.repository.updateVersion(versionId, {
      conclusionTier: verdict.conclusionTier,
    });

    return {
      verdict,
      evaluationMatrix,
      breakEven,
    };
  }

  /**
   * 07C: Records a formal sovereign decision on a study version and freezes it.
   */
  async recordDecision(dto: RecordDecisionDTO): Promise<StudyDecision> {
    const version = await this.repository.getVersionById(dto.versionId);
    if (!version) throw new Error(`Version ${dto.versionId} not found`);

    let study = await this.repository.getStudyById(version.studyId, dto.tenantId);
    if (!study) throw new Error(`Study ${version.studyId} not found for tenant ${dto.tenantId}`);

    const decision = await this.repository.recordDecision({
      versionId: dto.versionId,
      decisionVerdict: dto.verdict,
      humanDecisionStatus: dto.humanStatus,
      executiveSummaryText: dto.executiveSummaryText,
      selectedScenarioDemand: dto.selectedScenarioDemand ?? null,
      recommendedPvp: dto.recommendedPvp ?? null,
      approvedByUserId: dto.approvedByUserId ?? null,
      decisionNotes: dto.decisionNotes ?? null,
      decidedAt: new Date().toISOString(),
    });

    // Advance study to DECISION status
    if (EconomicStudyLifecycle.canTransition(study.currentStatus, 'DECISION')) {
      await this.repository.updateStudyStatus(study.id, dto.tenantId, 'DECISION');
    }

    // Freeze version
    await this.freezeVersion(dto.versionId);

    return decision;
  }

  /**
   * Retrieves the comprehensive summary of a study and its active version.
   */
  async getStudySummary(studyId: string, tenantId: string): Promise<StudySummaryDTO> {
    const study = await this.repository.getStudyById(studyId, tenantId);
    if (!study) throw new Error(`Study ${studyId} not found for tenant ${tenantId}`);

    const activeVersion = await this.repository.getVersionByStudyAndNumber(
      studyId,
      study.activeVersionNumber
    );
    if (!activeVersion) throw new Error(`Active version not found for study ${studyId}`);

    const ingredients = await this.repository.getIngredientsByVersion(activeVersion.id);
    const yieldStages = await this.repository.getYieldStagesByVersion(activeVersion.id);
    const operationConfig = await this.repository.getOperationConfig(activeVersion.id);
    const scenarios = await this.repository.getScenarios(activeVersion.id);
    const decision = await this.repository.getDecisionByVersion(activeVersion.id);

    const yieldResult = YieldCascadeCalculator.calculateYieldCascade(
      ingredients,
      yieldStages,
      activeVersion.batchNominalYield
    );

    const conclusion = EconomicStudyLifecycle.evaluateConclusionTier(
      ingredients,
      activeVersion.targetPvp
    );

    const breakEven = await this.calculateBreakEven(activeVersion.id);

    return {
      study,
      activeVersion,
      ingredients,
      yieldStages,
      yieldResult,
      operationConfig,
      scenarios,
      breakEven,
      decision,
      conclusion,
    };
  }

  private async refreshVersionReadiness(studyId: string, versionId: string): Promise<void> {
    const version = await this.repository.getVersionById(versionId);
    if (!version) return;

    const ingredients = await this.repository.getIngredientsByVersion(versionId);
    const conclusion = EconomicStudyLifecycle.evaluateConclusionTier(
      ingredients,
      version.targetPvp
    );

    await this.repository.updateVersion(versionId, {
      conclusionTier: conclusion.tier,
      provenanceSummary: conclusion.label,
    });
  }
}
