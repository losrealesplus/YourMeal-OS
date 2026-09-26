/**
 * YOURMEAL OS — COST SIMULATION SERVICE (E9 Application Facade)
 * Subsystem: Platform Core / Cost Intelligence
 */

import {
  CostBaselineSnapshot,
  HypotheticalVariables,
  ScenarioComparison,
  ScenarioResult,
} from "../domain/types";
import { compareScenarios, simulateScenario } from "../domain/cost-simulation-engine";

export interface ScenarioExecutionRequest {
  scenarioId: string;
  name: string;
  description?: string;
  baseline: CostBaselineSnapshot;
  variables: HypotheticalVariables;
}

export class CostSimulationService {
  private scenariosStore: Map<string, ScenarioResult> = new Map();

  /**
   * Runs a what-if simulation against an immutable baseline snapshot.
   * Invariant: Never mutates baseline, returns standalone reproducible result.
   */
  public executeSimulation(request: ScenarioExecutionRequest): ScenarioResult {
    const result = simulateScenario(request.baseline, request.variables, {
      scenarioId: request.scenarioId,
      name: request.name,
      description: request.description,
    });

    this.scenariosStore.set(result.scenarioId, result);
    return result;
  }

  /**
   * Retrieves a previously executed scenario by ID.
   */
  public getScenario(scenarioId: string): ScenarioResult | undefined {
    return this.scenariosStore.get(scenarioId);
  }

  /**
   * Compares multiple stored scenarios against the baseline.
   */
  public compareStoredScenarios(
    baselineSnapshotId: string,
    scenarioIds: string[],
  ): ScenarioComparison {
    const selectedScenarios: ScenarioResult[] = [];
    for (const id of scenarioIds) {
      const scen = this.scenariosStore.get(id);
      if (scen) {
        selectedScenarios.push(scen);
      }
    }

    return compareScenarios(baselineSnapshotId, selectedScenarios);
  }

  /**
   * Clears in-memory simulation store (useful for test isolations).
   */
  public clearStore(): void {
    this.scenariosStore.clear();
  }
}
