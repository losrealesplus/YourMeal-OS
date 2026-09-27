// ============================================================================
// YOURMEAL OS — MULTIDIMENSIONAL SCENARIO EVALUATOR (CR-COST-07C)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// "Escenario calculable ≠ escenario operacionalmente viable."
// "Cero Escenario Óptimo Universal: Recomendado según objetivo y restricciones."
// ============================================================================

import type {
  ScenarioCalculationResult,
  StudyOperationConfig,
} from './production-operational-types';
import type {
  CapacityConstraint,
  CapacityEvaluation,
  CapacityStatus,
  EvaluatedScenario,
  OptimizationGoal,
  ScenarioEvaluationMatrix,
} from './decision-intelligence-types';

export class ScenarioEvaluator {
  /**
   * Evaluates a matrix of scenarios against operational capacity constraints
   * and recommends the best candidate for a specified human optimization goal.
   */
  public static evaluateMatrix(
    scenarios: ScenarioCalculationResult[],
    goal: OptimizationGoal = 'MINIMIZE_COST',
    capacityConstraint?: CapacityConstraint,
    operationConfig?: StudyOperationConfig | null,
    targetPvp?: number | null
  ): ScenarioEvaluationMatrix {
    const evaluatedScenarios: EvaluatedScenario[] = scenarios.map((scenario) => {
      const capacity = this.evaluateCapacity(scenario, capacityConstraint, operationConfig);
      return {
        ...scenario,
        capacity,
        isRecommended: false,
        recommendationReason: '',
      };
    });

    // Determine viable and fully-configured candidates
    const eligibleCandidates = evaluatedScenarios.filter((s) => {
      // 1. Capacity viability check
      if (!s.capacity.isViable) return false;

      // 2. Surplus destination check (if surplus exists and unconfigured, costPerSoldUnit is null)
      if (s.surplusUnits > 0 && s.surplusStatus === 'UNCONFIGURED') return false;

      // 3. Goal-specific prerequisite checks
      if (goal === 'MINIMIZE_COST' && s.costPerSoldUnit == null) return false;
      if (goal === 'MAXIMIZE_MARGIN' && s.grossMarginPct == null) return false;
      if (goal === 'MAXIMIZE_PROFIT' && (targetPvp == null || s.costPerSoldUnit == null)) return false;

      return true;
    });

    let recommendedScenario: EvaluatedScenario | null = null;
    let selectionExplanation = '';

    if (eligibleCandidates.length === 0) {
      const hasInviable = evaluatedScenarios.some((s) => !s.capacity.isViable);
      const hasUnconfiguredSurplus = evaluatedScenarios.some(
        (s) => s.surplusUnits > 0 && s.surplusStatus === 'UNCONFIGURED'
      );

      if (hasInviable && evaluatedScenarios.every((s) => !s.capacity.isViable)) {
        selectionExplanation =
          'Ningún escenario es viable: todos superan la capacidad instalada de cocina.';
      } else if (hasUnconfiguredSurplus) {
        selectionExplanation =
          'No se puede recomendar un escenario: existen excedentes con [DESTINO NO CONFIGURADO]. Configure el destino para desbloquear el coste unitario vendido.';
      } else {
        selectionExplanation =
          'No hay escenarios elegibles con los datos configurados para el objetivo seleccionado.';
      }
    } else {
      recommendedScenario = this.pickBestCandidate(eligibleCandidates, goal, targetPvp);
      if (recommendedScenario) {
        recommendedScenario.isRecommended = true;
        recommendedScenario.recommendationReason = this.buildRecommendationReason(
          recommendedScenario,
          goal,
          targetPvp
        );
        selectionExplanation = `Escenario de ${recommendedScenario.demandUnits} unidades recomendado para el objetivo ${goal}.`;
      }
    }

    const unviableCount = evaluatedScenarios.filter((s) => !s.capacity.isViable).length;

    return {
      goal,
      capacityConstraint,
      scenarios: evaluatedScenarios,
      recommendedScenario,
      selectionExplanation,
      unviableScenariosCount: unviableCount,
    };
  }

  private static evaluateCapacity(
    scenario: ScenarioCalculationResult,
    constraint?: CapacityConstraint,
    operationConfig?: StudyOperationConfig | null
  ): CapacityEvaluation {
    if (!constraint || (!constraint.maxUnitsPerRun && !constraint.maxLaborMinutesPerRun)) {
      return {
        demandUnits: scenario.demandUnits,
        unitsProduced: scenario.unitsProduced,
        capacityLoadPct: null,
        status: 'UNCONFIGURED',
        isViable: true,
        exceededBottlenecks: [],
      };
    }

    const exceededBottlenecks: string[] = [];
    let capacityLoadPct: number | null = null;

    // Unit capacity check
    if (constraint.maxUnitsPerRun && constraint.maxUnitsPerRun > 0) {
      capacityLoadPct = Number(
        ((scenario.unitsProduced / constraint.maxUnitsPerRun) * 100).toFixed(1)
      );
      if (scenario.unitsProduced > constraint.maxUnitsPerRun) {
        exceededBottlenecks.push(`MAX_UNITS_EXCEEDED (${scenario.unitsProduced} > ${constraint.maxUnitsPerRun})`);
      }
    }

    // Labor shift minutes capacity check
    if (constraint.maxLaborMinutesPerRun && operationConfig) {
      const setup = operationConfig.laborSetupMinutes || 0;
      const clean = operationConfig.laborCleaningMinutes || 0;
      const batch = (operationConfig.laborBatchMinutes || 0) * scenario.batchesRequired;
      const unit = (operationConfig.laborUnitMinutes || 0) * scenario.unitsProduced;
      const totalMinutes = setup + clean + batch + unit;

      if (totalMinutes > constraint.maxLaborMinutesPerRun) {
        exceededBottlenecks.push(
          `LABOR_SHIFT_EXCEEDED (${totalMinutes} min > ${constraint.maxLaborMinutesPerRun} min)`
        );
      }
    }

    let status: CapacityStatus = 'VIABLE';
    let isViable = true;
    let warningMessage: string | undefined = undefined;

    if (exceededBottlenecks.length > 0) {
      status = 'INVIABLE_CAPACITY';
      isViable = false;
      warningMessage = `🔴 INVIABLE POR CAPACIDAD: ${exceededBottlenecks.join(', ')}`;
    } else if (capacityLoadPct != null && capacityLoadPct >= 85) {
      status = 'BOTTLENECK_NEAR';
      warningMessage = `⚠️ CUELLO DE BOTELLA CERCANO (${capacityLoadPct}% de capacidad ocupada)`;
    }

    return {
      demandUnits: scenario.demandUnits,
      unitsProduced: scenario.unitsProduced,
      capacityLoadPct,
      status,
      isViable,
      exceededBottlenecks,
      warningMessage,
    };
  }

  private static pickBestCandidate(
    candidates: EvaluatedScenario[],
    goal: OptimizationGoal,
    targetPvp?: number | null
  ): EvaluatedScenario {
    switch (goal) {
      case 'MINIMIZE_COST':
        return candidates.reduce((best, curr) =>
          (curr.costPerSoldUnit ?? Infinity) < (best.costPerSoldUnit ?? Infinity) ? curr : best
        );

      case 'MAXIMIZE_MARGIN':
        return candidates.reduce((best, curr) =>
          (curr.grossMarginPct ?? -Infinity) > (best.grossMarginPct ?? -Infinity) ? curr : best
        );

      case 'MAXIMIZE_PROFIT': {
        const pvp = targetPvp ?? 0;
        const profit = (s: EvaluatedScenario) => s.demandUnits * pvp - s.totalKnownDirectCost;
        return candidates.reduce((best, curr) => (profit(curr) > profit(best) ? curr : best));
      }

      case 'MINIMIZE_SURPLUS':
        return candidates.reduce((best, curr) => {
          if (curr.surplusUnits < best.surplusUnits) return curr;
          if (curr.surplusUnits === best.surplusUnits) {
            return curr.demandUnits > best.demandUnits ? curr : best;
          }
          return best;
        });

      case 'RESPECT_CAPACITY': {
        // Find highest volume that is not near bottleneck (load <= 85%)
        const safeCandidates = candidates.filter(
          (c) => c.capacity.capacityLoadPct == null || c.capacity.capacityLoadPct <= 85
        );
        if (safeCandidates.length > 0) {
          return safeCandidates.reduce((best, curr) =>
            curr.demandUnits > best.demandUnits ? curr : best
          );
        }
        // If all viable are > 85%, pick the lowest load
        return candidates.reduce((best, curr) =>
          (curr.capacity.capacityLoadPct ?? Infinity) < (best.capacity.capacityLoadPct ?? Infinity)
            ? curr
            : best
        );
      }
    }
  }

  private static buildRecommendationReason(
    scenario: EvaluatedScenario,
    goal: OptimizationGoal,
    targetPvp?: number | null
  ): string {
    switch (goal) {
      case 'MINIMIZE_COST':
        return `Optimiza el coste unitario a ${scenario.costPerSoldUnit?.toFixed(2)} €/unidad respetando la capacidad física.`;
      case 'MAXIMIZE_MARGIN':
        return `Maximiza el margen bruto al ${scenario.grossMarginPct?.toFixed(1)} % para la demanda solicitada.`;
      case 'MAXIMIZE_PROFIT': {
        const pvp = targetPvp ?? 0;
        const totalProfit = scenario.demandUnits * pvp - scenario.totalKnownDirectCost;
        return `Genera el mayor beneficio neto absoluto (${totalProfit.toFixed(2)} €) dentro de los límites operativos.`;
      }
      case 'MINIMIZE_SURPLUS':
        return `Minimiza los excedentes con solo ${scenario.surplusUnits} unidades sobrantes en ${scenario.batchesRequired} lote(s).`;
      case 'RESPECT_CAPACITY':
        return `Mayor volumen de producción (${scenario.demandUnits} unidades) con carga de capacidad segura (${scenario.capacity.capacityLoadPct ?? 0}%).`;
    }
  }
}
