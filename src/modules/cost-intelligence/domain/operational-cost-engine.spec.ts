import { describe, it, expect } from 'vitest';
import { OperationalCostEngine } from './operational-cost-engine';
import type { StudyOperationConfig } from './production-operational-types';

describe('OperationalCostEngine (CR-COST-07B)', () => {
  describe('Labor Costing (Non-Linear Scale Curves)', () => {
    it('demonstrates labor economy of scale between 1 batch and 4 batches', () => {
      const config: Partial<StudyOperationConfig> = {
        laborSetupMinutes: 15,
        laborCleaningMinutes: 15,
        laborBatchMinutes: 10,
        laborUnitMinutes: 0.5,
        laborHourlyRate: 18.0, // 18 €/hour
      };

      // 1 Batch of 12 units
      // Setup (15) + Clean (15) + Batch (10*1) + Unit (0.5*12=6) = 46 min
      const r1 = OperationalCostEngine.calculateLaborCost(1, 12, config);
      expect(r1.totalMinutes).toBe(46);
      expect(r1.totalLaborCost).toBeCloseTo((46 / 60) * 18, 2); // 13.80 €
      const unitLabor1 = r1.totalLaborCost! / 12;
      expect(unitLabor1).toBeCloseTo(1.15, 2);

      // 4 Batches of 48 units
      // Setup (15) + Clean (15) + Batch (10*4=40) + Unit (0.5*48=24) = 94 min
      const r4 = OperationalCostEngine.calculateLaborCost(4, 48, config);
      expect(r4.totalMinutes).toBe(94);
      expect(r4.totalLaborCost).toBeCloseTo((94 / 60) * 18, 2); // 28.20 €
      const unitLabor4 = r4.totalLaborCost! / 48;
      expect(unitLabor4).toBeCloseTo(0.5875, 2);

      // Labor cost per unit drops by ~49%
      expect(unitLabor4).toBeLessThan(unitLabor1);
    });

    it('returns null for labor cost when hourly rate is unconfigured (NO FALSE ZERO)', () => {
      const config: Partial<StudyOperationConfig> = {
        laborSetupMinutes: 15,
        laborCleaningMinutes: 15,
        laborHourlyRate: null, // UNCONFIGURED
      };

      const result = OperationalCostEngine.calculateLaborCost(1, 10, config);
      expect(result.totalMinutes).toBe(30);
      expect(result.totalLaborCost).toBeNull();
    });
  });

  describe('Energy Costing (3 Traceable Modes)', () => {
    it('calculates QUANTITATIVE energy: power * hours * tariff * batches', () => {
      const config: Partial<StudyOperationConfig> = {
        energyMethod: 'QUANTITATIVE',
        energyPowerKw: 3.5,
        energyCycleHours: 1.2,
        energyTariffKwh: 0.18,
      };

      // 2 batches = 2 * (3.5 * 1.2 * 0.18 = 0.756) = 1.512 €
      const result = OperationalCostEngine.calculateEnergyCost(2, 50, config);
      expect(result.totalEnergyCost).toBeCloseTo(1.512, 3);
      expect(result.details).toContain('Cuantitativo');
    });

    it('calculates PERCENTAGE energy: % of raw material cost', () => {
      const config: Partial<StudyOperationConfig> = {
        energyMethod: 'PERCENTAGE',
        energyPercentageRate: 5.0, // 5%
      };

      const result = OperationalCostEngine.calculateEnergyCost(1, 60.0, config);
      expect(result.totalEnergyCost).toBeCloseTo(3.0, 2);
      expect(result.details).toContain('Porcentual: 5%');
    });

    it('calculates MANUAL_FLAT energy: flat fee * batches', () => {
      const config: Partial<StudyOperationConfig> = {
        energyMethod: 'MANUAL_FLAT',
        energyFlatFee: 1.25,
      };

      const result = OperationalCostEngine.calculateEnergyCost(3, 50, config);
      expect(result.totalEnergyCost).toBeCloseTo(3.75, 2);
    });

    it('handles NOT_APPLICABLE as legitimate 0.00 and UNCONFIGURED as null', () => {
      const rNotApp = OperationalCostEngine.calculateEnergyCost(1, 50, {
        energyMethod: 'NOT_APPLICABLE',
      });
      expect(rNotApp.totalEnergyCost).toBe(0.0);

      const rUnconf = OperationalCostEngine.calculateEnergyCost(1, 50, {
        energyMethod: 'UNCONFIGURED',
      });
      expect(rUnconf.totalEnergyCost).toBeNull();
    });
  });

  describe('Packaging Costing (Primary & Secondary Bundles)', () => {
    it('calculates primary unit containers and secondary bulk boxes', () => {
      const config: Partial<StudyOperationConfig> = {
        packagingMode: 'CONFIGURED',
        packagingUnitCost: 0.25, // 0.25 € per portion
        packagingSecondaryCost: 0.8, // 0.80 € per outer box
        packagingSecondaryCapacity: 12, // 12 portions per box
      };

      // Demand 20 units -> 20 * 0.25 = 5.00 € primary
      // 20 units -> ceil(20/12) = 2 boxes * 0.80 = 1.60 € secondary
      // Total = 6.60 €
      const result = OperationalCostEngine.calculatePackagingCost(20, config);
      expect(result.totalPackagingCost).toBeCloseTo(6.6, 2);
      expect(result.primaryCost).toBe(5.0);
      expect(result.secondaryCost).toBe(1.6);
      expect(result.secondaryBoxesCount).toBe(2);
    });

    it('handles NOT_APPLICABLE as 0.00 and UNCONFIGURED as null', () => {
      const rNotApp = OperationalCostEngine.calculatePackagingCost(20, {
        packagingMode: 'NOT_APPLICABLE',
      });
      expect(rNotApp.totalPackagingCost).toBe(0.0);

      const rUnconf = OperationalCostEngine.calculatePackagingCost(20, {
        packagingMode: 'UNCONFIGURED',
      });
      expect(rUnconf.totalPackagingCost).toBeNull();
    });
  });

  describe('Scenario Matrix (Multidimensional Production Simulation)', () => {
    it('generates standard ramp + custom demands with non-linear costs and surplus blocking', () => {
      const baseBatchRawCost = 6.36; // 1 batch of 12 portions = 6.36 € raw mat
      const targetPvp = 4.0; // 4.00 € PVP

      const config: Partial<StudyOperationConfig> = {
        laborSetupMinutes: 15,
        laborCleaningMinutes: 15,
        laborBatchMinutes: 10,
        laborUnitMinutes: 0.5,
        laborHourlyRate: 18.0,
        energyMethod: 'QUANTITATIVE',
        energyPowerKw: 3.5,
        energyCycleHours: 1.0,
        energyTariffKwh: 0.2, // 0.70 € per batch
        packagingMode: 'CONFIGURED',
        packagingUnitCost: 0.2,
      };

      // Case 1: Surplus destination is UNCONFIGURED
      const matrixUnconf = OperationalCostEngine.calculateScenarioMatrix(
        [10, 20, 30, 60, 42], // includes custom 42
        12,
        false,
        'UNCONFIGURED',
        baseBatchRawCost,
        targetPvp,
        config
      );

      expect(matrixUnconf).toHaveLength(5);

      // Scenario 10 units: 1 batch produced (12 units, 2 surplus)
      const s10 = matrixUnconf.find((s) => s.demandUnits === 10)!;
      expect(s10.batchesRequired).toBe(1);
      expect(s10.surplusUnits).toBe(2);
      expect(s10.costPerSoldUnit).toBeNull(); // BLOCKED BY UNCONFIGURED SURPLUS
      expect(s10.grossMarginPct).toBeNull();
      expect(s10.warnings.some((w) => w.includes('sin destino configurado'))).toBe(true);

      // Scenario 60 units: 5 batches produced (60 units, 0 surplus)
      // Exactly matches demand, so costPerSoldUnit is unlocked even if surplus is unconfigured!
      const s60 = matrixUnconf.find((s) => s.demandUnits === 60)!;
      expect(s60.batchesRequired).toBe(5);
      expect(s60.surplusUnits).toBe(0);
      expect(s60.costPerSoldUnit).not.toBeNull();
      expect(s60.grossMarginPct).not.toBeNull();
      expect(s60.grossMarginPct!).toBeGreaterThan(50);

      // Custom scenario 42 units:
      const s42 = matrixUnconf.find((s) => s.demandUnits === 42)!;
      expect(s42.isCustomScenario).toBe(true);
      expect(s42.batchesRequired).toBe(4); // ceil(42/12) = 4 batches = 48 units

      // Case 2: Surplus destination is STOCK_REFRIGERADO
      const matrixStock = OperationalCostEngine.calculateScenarioMatrix(
        [10, 20, 60],
        12,
        false,
        'STOCK_REFRIGERADO',
        baseBatchRawCost,
        targetPvp,
        config
      );

      const s10Stock = matrixStock.find((s) => s.demandUnits === 10)!;
      expect(s10Stock.costPerSoldUnit).not.toBeNull();
      expect(s10Stock.grossMarginPct).not.toBeNull();

      const s60Stock = matrixStock.find((s) => s.demandUnits === 60)!;
      // Unit cost at 60 is lower than at 10 due to setup amortisation
      expect(s60Stock.costPerSoldUnit!).toBeLessThan(s10Stock.costPerSoldUnit!);
    });
  });
});
