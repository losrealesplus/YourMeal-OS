// ============================================================================
// YOURMEAL OS — ECONOMIC STUDY REPOSITORY INTERFACE & IN-MEMORY (CR-COST-07A/B)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// ============================================================================

import type {
  EconomicStudy,
  StudyVersion,
  StudyIngredient,
  StudyYieldStage,
  StudyStatus,
} from '../domain/product-economics-types';
import type {
  StudyOperationConfig,
  ScenarioCalculationResult,
} from '../domain/production-operational-types';
import type { StudyDecision } from '../domain/decision-intelligence-types';

export interface EconomicStudyRepository {
  createStudy(study: Omit<EconomicStudy, 'id' | 'createdAt' | 'updatedAt'>): Promise<EconomicStudy>;
  getStudyById(id: string, tenantId: string): Promise<EconomicStudy | null>;
  updateStudyStatus(
    id: string,
    tenantId: string,
    status: StudyStatus,
    activeVersion?: number
  ): Promise<EconomicStudy>;
  createVersion(version: Omit<StudyVersion, 'id' | 'createdAt'>): Promise<StudyVersion>;
  getVersionById(id: string): Promise<StudyVersion | null>;
  getVersionByStudyAndNumber(studyId: string, versionNumber: number): Promise<StudyVersion | null>;
  updateVersion(id: string, updates: Partial<StudyVersion>): Promise<StudyVersion>;
  addIngredient(ingredient: Omit<StudyIngredient, 'id' | 'createdAt'>): Promise<StudyIngredient>;
  getIngredientsByVersion(versionId: string): Promise<StudyIngredient[]>;
  deleteIngredient(id: string, versionId: string): Promise<void>;
  addYieldStage(stage: Omit<StudyYieldStage, 'id' | 'createdAt'>): Promise<StudyYieldStage>;
  getYieldStagesByVersion(versionId: string): Promise<StudyYieldStage[]>;
  deleteYieldStage(id: string, versionId: string): Promise<void>;

  // 07B: Operational Config & Scenarios
  saveOperationConfig(
    config: Omit<StudyOperationConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudyOperationConfig>;
  getOperationConfig(versionId: string): Promise<StudyOperationConfig | null>;
  saveScenarios(versionId: string, scenarios: ScenarioCalculationResult[]): Promise<void>;
  getScenarios(versionId: string): Promise<ScenarioCalculationResult[]>;

  // 07C: Decisions
  recordDecision(
    decision: Omit<StudyDecision, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudyDecision>;
  getDecisionByVersion(versionId: string): Promise<StudyDecision | null>;
}

export class InMemoryEconomicStudyRepository implements EconomicStudyRepository {
  private studies: Map<string, EconomicStudy> = new Map();
  private versions: Map<string, StudyVersion> = new Map();
  private ingredients: Map<string, StudyIngredient> = new Map();
  private yieldStages: Map<string, StudyYieldStage> = new Map();
  private operationConfigs: Map<string, StudyOperationConfig> = new Map(); // key = versionId
  private scenarios: Map<string, ScenarioCalculationResult[]> = new Map(); // key = versionId
  private decisions: Map<string, StudyDecision> = new Map(); // key = versionId

  async createStudy(
    study: Omit<EconomicStudy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EconomicStudy> {
    const id = `study-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const record: EconomicStudy = {
      ...study,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.studies.set(id, record);
    return record;
  }

  async getStudyById(id: string, tenantId: string): Promise<EconomicStudy | null> {
    const study = this.studies.get(id);
    if (!study || study.tenantId !== tenantId) return null;
    return study;
  }

  async updateStudyStatus(
    id: string,
    tenantId: string,
    status: StudyStatus,
    activeVersion?: number
  ): Promise<EconomicStudy> {
    const study = await this.getStudyById(id, tenantId);
    if (!study) throw new Error(`Study ${id} not found for tenant ${tenantId}`);

    const updated: EconomicStudy = {
      ...study,
      currentStatus: status,
      activeVersionNumber: activeVersion ?? study.activeVersionNumber,
      updatedAt: new Date().toISOString(),
    };
    this.studies.set(id, updated);
    return updated;
  }

  async createVersion(version: Omit<StudyVersion, 'id' | 'createdAt'>): Promise<StudyVersion> {
    const id = `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: StudyVersion = {
      ...version,
      id,
      createdAt: new Date().toISOString(),
    };
    this.versions.set(id, record);
    return record;
  }

  async getVersionById(id: string): Promise<StudyVersion | null> {
    return this.versions.get(id) ?? null;
  }

  async getVersionByStudyAndNumber(
    studyId: string,
    versionNumber: number
  ): Promise<StudyVersion | null> {
    for (const ver of this.versions.values()) {
      if (ver.studyId === studyId && ver.versionNumber === versionNumber) {
        return ver;
      }
    }
    return null;
  }

  async updateVersion(id: string, updates: Partial<StudyVersion>): Promise<StudyVersion> {
    const current = this.versions.get(id);
    if (!current) throw new Error(`Version ${id} not found`);

    const updated: StudyVersion = {
      ...current,
      ...updates,
    };
    this.versions.set(id, updated);
    return updated;
  }

  async addIngredient(
    ingredient: Omit<StudyIngredient, 'id' | 'createdAt'>
  ): Promise<StudyIngredient> {
    const id = `ing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: StudyIngredient = {
      ...ingredient,
      id,
      createdAt: new Date().toISOString(),
    };
    this.ingredients.set(id, record);
    return record;
  }

  async getIngredientsByVersion(versionId: string): Promise<StudyIngredient[]> {
    const list: StudyIngredient[] = [];
    for (const ing of this.ingredients.values()) {
      if (ing.versionId === versionId) {
        list.push(ing);
      }
    }
    return list;
  }

  async deleteIngredient(id: string, versionId: string): Promise<void> {
    const ing = this.ingredients.get(id);
    if (ing && ing.versionId === versionId) {
      this.ingredients.delete(id);
    }
  }

  async addYieldStage(stage: Omit<StudyYieldStage, 'id' | 'createdAt'>): Promise<StudyYieldStage> {
    const id = `stage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: StudyYieldStage = {
      ...stage,
      id,
      createdAt: new Date().toISOString(),
    };
    this.yieldStages.set(id, record);
    return record;
  }

  async getYieldStagesByVersion(versionId: string): Promise<StudyYieldStage[]> {
    const list: StudyYieldStage[] = [];
    for (const stg of this.yieldStages.values()) {
      if (stg.versionId === versionId) {
        list.push(stg);
      }
    }
    return list.sort((a, b) => a.stageOrder - b.stageOrder);
  }

  async deleteYieldStage(id: string, versionId: string): Promise<void> {
    const stg = this.yieldStages.get(id);
    if (stg && stg.versionId === versionId) {
      this.yieldStages.delete(id);
    }
  }

  // 07B: Operations & Scenarios
  async saveOperationConfig(
    config: Omit<StudyOperationConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudyOperationConfig> {
    const id = `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const record: StudyOperationConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.operationConfigs.set(config.versionId, record);
    return record;
  }

  async getOperationConfig(versionId: string): Promise<StudyOperationConfig | null> {
    return this.operationConfigs.get(versionId) ?? null;
  }

  async saveScenarios(versionId: string, scenarios: ScenarioCalculationResult[]): Promise<void> {
    this.scenarios.set(versionId, scenarios);
  }

  async getScenarios(versionId: string): Promise<ScenarioCalculationResult[]> {
    return this.scenarios.get(versionId) ?? [];
  }

  // 07C: Decisions
  async recordDecision(
    decision: Omit<StudyDecision, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudyDecision> {
    const id = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const record: StudyDecision = {
      ...decision,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.decisions.set(decision.versionId, record);
    return record;
  }

  async getDecisionByVersion(versionId: string): Promise<StudyDecision | null> {
    return this.decisions.get(versionId) ?? null;
  }
}
