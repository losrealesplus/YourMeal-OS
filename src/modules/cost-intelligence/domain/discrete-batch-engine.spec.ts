import { describe, it, expect } from 'vitest';
import { DiscreteBatchEngine } from './discrete-batch-engine';

describe('DiscreteBatchEngine (CR-COST-07B)', () => {
  it('enforces discrete ceiling batches when fractional is not allowed', () => {
    // Carrot cake: 12 portions per batch
    const r10 = DiscreteBatchEngine.calculateBatches(10, 12, false);
    expect(r10.batchesRequired).toBe(1);
    expect(r10.unitsProduced).toBe(12);
    expect(r10.surplusUnits).toBe(2);

    const r20 = DiscreteBatchEngine.calculateBatches(20, 12, false);
    expect(r20.batchesRequired).toBe(2);
    expect(r20.unitsProduced).toBe(24);
    expect(r20.surplusUnits).toBe(4);

    const r30 = DiscreteBatchEngine.calculateBatches(30, 12, false);
    expect(r30.batchesRequired).toBe(3);
    expect(r30.unitsProduced).toBe(36);
    expect(r30.surplusUnits).toBe(6);

    const r60 = DiscreteBatchEngine.calculateBatches(60, 12, false);
    expect(r60.batchesRequired).toBe(5);
    expect(r60.unitsProduced).toBe(60);
    expect(r60.surplusUnits).toBe(0);
  });

  it('allows continuous fractional batches when physically allowed', () => {
    // Salsa de tomate: 10 kg nominal yield, demand 5 kg
    const r5 = DiscreteBatchEngine.calculateBatches(5, 10, true);
    expect(r5.batchesRequired).toBe(0.5);
    expect(r5.unitsProduced).toBe(5);
    expect(r5.surplusUnits).toBe(0);
    expect(r5.isFractional).toBe(true);
  });

  it('strictly blocks effective sold cost when surplus destination is unconfigured', () => {
    // 20 portions demanded, 24 produced (4 surplus), total direct cost = 48.00 €
    const result = DiscreteBatchEngine.calculateEffectiveCostPerSoldUnit(
      20,
      24,
      48.0,
      'UNCONFIGURED'
    );

    // Constitutional mandate: MUST NOT GUESS
    expect(result.costPerSoldUnit).toBeNull();
    expect(result.financialAbsorptionNote).toContain('destino no configurado');
  });

  it('penalizes sold cost when surplus is treated as MERMA_DESPERDICIO', () => {
    // 20 portions demanded, 24 produced, 48.00 € total cost
    const result = DiscreteBatchEngine.calculateEffectiveCostPerSoldUnit(
      20,
      24,
      48.0,
      'MERMA_DESPERDICIO'
    );

    // 48.00 € / 20 sold units = 2.40 €/ración (penalized from 2.00 €)
    expect(result.costPerSoldUnit).toBe(2.4);
    expect(result.financialAbsorptionNote).toContain('absorbido 100%');
  });

  it('preserves unit cost when surplus is conserved as STOCK_REFRIGERADO', () => {
    // 20 portions demanded, 24 produced, 48.00 € total cost
    const result = DiscreteBatchEngine.calculateEffectiveCostPerSoldUnit(
      20,
      24,
      48.0,
      'STOCK_REFRIGERADO'
    );

    // 48.00 € / 24 produced units = 2.00 €/ración
    expect(result.costPerSoldUnit).toBe(2.0);
    expect(result.financialAbsorptionNote).toContain('conservado como STOCK_REFRIGERADO');
  });

  it('computes exact cost directly when there is zero surplus regardless of surplus status', () => {
    const result = DiscreteBatchEngine.calculateEffectiveCostPerSoldUnit(
      60,
      60,
      90.0,
      'UNCONFIGURED'
    );
    // 90.00 € / 60 = 1.50 €
    expect(result.costPerSoldUnit).toBe(1.5);
    expect(result.financialAbsorptionNote).toContain('sin excedentes');
  });
});
