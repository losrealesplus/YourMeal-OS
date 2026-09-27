/**
 * CR-COST-05: Product Matching & Comparability Engine
 * Pure multi-factor semantic and culinary matching algorithm.
 */

import {
  ComparabilityGrade,
  MatchCandidateInput,
  MatchClassification,
  MatchConfidenceResult,
  MatchDimensionBreakdown,
  MarketProduct,
  ThermalState,
  StandardUnit,
} from './types';

export interface MatchWeights {
  name: number; // default 0.40
  thermalState: number; // default 0.25
  unit: number; // default 0.15
  spec: number; // default 0.10
  grade: number; // default 0.10
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  name: 0.40,
  thermalState: 0.25,
  unit: 0.15,
  spec: 0.10,
  grade: 0.10,
};

export class ProductMatcher {
  private static readonly STOP_WORDS = new Set([
    'de', 'del', 'la', 'el', 'los', 'las', 'en', 'con', 'sin', 'para', 'por', 'y', 'o',
    'a', 'al', 'kg', 'kilo', 'gr', 'g', 'l', 'lt', 'pack', 'bandeja', 'caja', 'bolsa'
  ]);

  /**
   * Evaluates match confidence between a tenant ingredient and an observable market product.
   */
  public static evaluateMatch(
    tenantInput: MatchCandidateInput,
    marketProduct: MarketProduct,
    weights: MatchWeights = DEFAULT_MATCH_WEIGHTS
  ): MatchConfidenceResult {
    // 1. Semantic Name Score (w = 0.40)
    const nameScore = this.computeNameOverlapScore(
      tenantInput.tenantIngredientName,
      marketProduct.rawName
    );

    // 2. Thermal State Score (w = 0.25)
    const thermalStateScore = this.computeThermalStateScore(
      tenantInput.tenantThermalState,
      marketProduct.thermalState
    );

    // 3. Physical Metric Base Score (w = 0.15)
    const unitScore = this.computeUnitScore(
      tenantInput.tenantUnit,
      marketProduct.standardUnit
    );

    // 4. Cut / Prep Specification Score (w = 0.10)
    const specScore = this.computeSpecScore(
      tenantInput.tenantCutSpec,
      marketProduct.cutSpecification,
      tenantInput.tenantIngredientName,
      marketProduct.rawName
    );

    // 5. Quality / Breed Grade Score (w = 0.10)
    const gradeScore = this.computeGradeScore(
      tenantInput.tenantQualityGrade,
      marketProduct.qualityGrade,
      tenantInput.tenantIngredientName,
      marketProduct.rawName
    );

    const breakdown: MatchDimensionBreakdown = {
      nameScore: this.round(nameScore, 4),
      thermalStateScore: this.round(thermalStateScore, 4),
      unitScore: this.round(unitScore, 4),
      specScore: this.round(specScore, 4),
      gradeScore: this.round(gradeScore, 4),
    };

    const rawScore =
      weights.name * nameScore +
      weights.thermalState * thermalStateScore +
      weights.unit * unitScore +
      weights.spec * specScore +
      weights.grade * gradeScore;

    const confidenceScore = this.round(Math.min(1.0, Math.max(0.0, rawScore)), 4);

    let classification: MatchClassification;
    let suggestedComparability: ComparabilityGrade;

    if (confidenceScore >= 0.90) {
      classification = 'HIGH_MATCH';
      suggestedComparability = 'HIGH';
    } else if (confidenceScore >= 0.70) {
      classification = 'MEDIUM_MATCH';
      suggestedComparability = 'MEDIUM';
    } else if (confidenceScore >= 0.50) {
      classification = 'LOW_MATCH';
      suggestedComparability = 'LOW';
    } else {
      classification = 'UNMATCHED';
      suggestedComparability = 'UNKNOWN';
    }

    return {
      confidenceScore,
      classification,
      breakdown,
      suggestedComparability,
    };
  }

  /**
   * Tokenizes and computes culinary token overlap with containment & Dice metric.
   */
  public static computeNameOverlapScore(nameA: string, nameB: string): number {
    const tokensA = this.tokenize(nameA);
    const tokensB = this.tokenize(nameB);

    if (tokensA.length === 0 || tokensB.length === 0) {
      return 0.0;
    }

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    let matchesA = 0;
    for (const tA of setA) {
      if (setB.has(tA)) {
        matchesA++;
      } else {
        for (const tB of setB) {
          if (this.areStemsEquivalent(tA, tB)) {
            matchesA += 0.9;
            break;
          }
        }
      }
    }

    let matchesB = 0;
    for (const tB of setB) {
      if (setA.has(tB)) {
        matchesB++;
      } else {
        for (const tA of setA) {
          if (this.areStemsEquivalent(tB, tA)) {
            matchesB += 0.9;
            break;
          }
        }
      }
    }

    const coverageA = matchesA / setA.size;
    const coverageB = matchesB / setB.size;
    const minCoverage = Math.min(coverageA, coverageB);
    const maxCoverage = Math.max(coverageA, coverageB);
    const dice = (matchesA + matchesB) / (setA.size + setB.size);

    return Math.min(1.0, (maxCoverage * 0.5) + (dice * 0.3) + (minCoverage * 0.2));
  }

  /**
   * Evaluates thermal state compatibility.
   */
  public static computeThermalStateScore(
    stateA?: ThermalState,
    stateB?: ThermalState
  ): number {
    if (!stateA || !stateB) {
      return 0.8; // neutral when unspecified
    }
    if (stateA === stateB) {
      return 1.0;
    }
    if ((stateA === 'ambient' && stateB === 'dry') || (stateA === 'dry' && stateB === 'ambient')) {
      return 0.9;
    }
    // Fresh vs Frozen is a strict mismatch in culinary economics
    if ((stateA === 'fresh' && stateB === 'frozen') || (stateA === 'frozen' && stateB === 'fresh')) {
      return 0.0;
    }
    return 0.2;
  }

  /**
   * Evaluates physical metric unit compatibility.
   */
  public static computeUnitScore(unitA: StandardUnit, unitB: StandardUnit): number {
    if (unitA === unitB) {
      return 1.0;
    }
    // Incompatible physical dimensions (e.g. kg vs l or kg vs unit)
    return 0.0;
  }

  /**
   * Evaluates cut / preparation specifications.
   */
  public static computeSpecScore(
    specA?: string,
    specB?: string,
    rawNameA: string = '',
    rawNameB: string = ''
  ): number {
    const textA = ((specA || '') + ' ' + rawNameA).toLowerCase();
    const textB = ((specB || '') + ' ' + rawNameB).toLowerCase();

    const specKeywords = [
      'limpia', 'filete', 'fileteada', 'entera', 'picada', 'deshuesada',
      'dados', 'troceada', 'lonchas', 'tiras', 'sin piel', 'con piel'
    ];

    let matches = 0;
    let relevantCount = 0;

    for (const kw of specKeywords) {
      const inA = textA.includes(kw);
      const inB = textB.includes(kw);

      if (inA || inB) {
        relevantCount++;
        if (inA && inB) {
          matches++;
        }
      }
    }

    if (relevantCount === 0) {
      return 1.0; // Both default/unspecified
    }

    return matches / relevantCount;
  }

  /**
   * Evaluates quality grade & breed origins.
   */
  public static computeGradeScore(
    gradeA?: string,
    gradeB?: string,
    rawNameA: string = '',
    rawNameB: string = ''
  ): number {
    const textA = ((gradeA || '') + ' ' + rawNameA).toLowerCase();
    const textB = ((gradeB || '') + ' ' + rawNameB).toLowerCase();

    const gradeKeywords = [
      'campero', 'bio', 'ecologico', 'ecologica', 'organico',
      'granel', 'premium', 'extra', 'ibérico', 'iberico'
    ];

    let mismatches = 0;
    let checked = 0;

    for (const kw of gradeKeywords) {
      const inA = textA.includes(kw);
      const inB = textB.includes(kw);

      if (inA || inB) {
        checked++;
        if (inA !== inB) {
          mismatches++;
        }
      }
    }

    if (checked === 0) {
      return 1.0; // Standard / unmarked
    }

    return Math.max(0.0, 1.0 - (mismatches / checked));
  }

  private static areStemsEquivalent(a: string, b: string): boolean {
    if (a === b) return true;
    if (a.length < 3 || b.length < 3) return false;

    // Remove gender/plural endings (o, a, os, as, es)
    const stemA = a.replace(/(?:os|as|es|[oaei])$/, '');
    const stemB = b.replace(/(?:os|as|es|[oaei])$/, '');
    if (stemA.length >= 3 && stemA === stemB) return true;

    // Geographic / demonym equivalence (e.g. noruego / noruega / norueg)
    if (
      (a.startsWith('norueg') && b.startsWith('norueg')) ||
      (a.startsWith('espanol') && b.startsWith('espanol')) ||
      (a.startsWith('canari') && b.startsWith('canari'))
    ) {
      return true;
    }

    if (
      (a.length >= 4 && b.startsWith(a.slice(0, 4))) ||
      (b.length >= 4 && a.startsWith(b.slice(0, 4)))
    ) {
      return true;
    }

    return false;
  }

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/\b\d+\s*(?:kg|kilo|kilos|g|gr|gramos|l|lt|litros|ml|cl|ud|un|pz|piezas|unidades|pack|bolsa|caja)\b/g, ' ')
      .replace(/\b\d+\b/g, ' ') // standalone numbers
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !this.STOP_WORDS.has(w));
  }

  private static round(value: number, decimals: number = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
