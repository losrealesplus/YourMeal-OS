/**
 * CR-COST-05: Price and Unit Normalizer Engine
 * Pure economic & physical conversion functions for market observations.
 */

import { NormalizedUnit, StandardUnit, TaxMode } from './types';

export interface RawPriceInput {
  priceRaw: number;
  taxMode: TaxMode;
  taxRate: number; // e.g. 0.0, 0.03, 0.07, 0.10, 0.21
  quantity: number;
  unit: string; // 'kg', 'g', 'l', 'ml', 'cl', 'unit', 'ud', 'pack'
  netDrainedQuantity?: number;
}

export interface NormalizedPriceResult {
  priceExTax: number;
  normalizedPriceExTax: number;
  normalizedUnit: NormalizedUnit;
  standardQuantity: number;
  standardUnit: StandardUnit;
}

export class PriceNormalizer {
  /**
   * Normalizes raw price, tax, and physical measurement into canonical €/kg, €/L or €/unit (Ex-Tax).
   */
  public static normalize(input: RawPriceInput): NormalizedPriceResult {
    if (input.priceRaw < 0) {
      throw new Error('Raw price cannot be negative');
    }
    if (input.taxRate < 0 || input.taxRate > 1.0) {
      throw new Error('Tax rate must be between 0.0 and 1.0 (e.g. 0.07 for 7%)');
    }

    // 1. Strip tax if input is inc_tax
    let priceExTax: number;
    if (input.taxMode === 'inc_tax') {
      priceExTax = input.priceRaw / (1 + input.taxRate);
    } else {
      priceExTax = input.priceRaw;
    }

    // 2. Resolve canonical physical unit & quantity
    const cleanUnit = input.unit.trim().toLowerCase();
    let standardQuantity: number;
    let standardUnit: StandardUnit;
    let normalizedUnit: NormalizedUnit;

    // Use net drained quantity if provided (e.g. tuna in oil, canned chickpeas)
    const effectiveQty = input.netDrainedQuantity && input.netDrainedQuantity > 0
      ? input.netDrainedQuantity
      : input.quantity;

    if (effectiveQty <= 0) {
      throw new Error('Effective quantity must be strictly greater than 0');
    }

    switch (cleanUnit) {
      case 'kg':
      case 'kilo':
      case 'kilogram':
      case 'kilogramo':
      case 'kilogramos':
        standardQuantity = effectiveQty;
        standardUnit = 'kg';
        normalizedUnit = 'EUR_PER_KG';
        break;

      case 'g':
      case 'gr':
      case 'gram':
      case 'gramo':
      case 'gramos':
        standardQuantity = effectiveQty / 1000;
        standardUnit = 'kg';
        normalizedUnit = 'EUR_PER_KG';
        break;

      case 'l':
      case 'lt':
      case 'liter':
      case 'litro':
      case 'litros':
        standardQuantity = effectiveQty;
        standardUnit = 'l';
        normalizedUnit = 'EUR_PER_L';
        break;

      case 'ml':
      case 'milliliter':
      case 'mililitro':
      case 'mililitros':
        standardQuantity = effectiveQty / 1000;
        standardUnit = 'l';
        normalizedUnit = 'EUR_PER_L';
        break;

      case 'cl':
      case 'centiliter':
      case 'centilitro':
      case 'centilitros':
        standardQuantity = effectiveQty / 100;
        standardUnit = 'l';
        normalizedUnit = 'EUR_PER_L';
        break;

      case 'unit':
      case 'ud':
      case 'un':
      case 'unidad':
      case 'unidades':
      case 'pack':
      case 'pz':
      case 'pieza':
      case 'piezas':
        standardQuantity = effectiveQty;
        standardUnit = 'unit';
        normalizedUnit = 'EUR_PER_UNIT';
        break;

      default:
        throw new Error(`Unsupported measurement unit: ${input.unit}`);
    }

    const normalizedPriceExTax = priceExTax / standardQuantity;

    return {
      priceExTax: this.round(priceExTax, 4),
      normalizedPriceExTax: this.round(normalizedPriceExTax, 4),
      normalizedUnit,
      standardQuantity: this.round(standardQuantity, 4),
      standardUnit,
    };
  }

  /**
   * Helper to round float values to specified decimal precision.
   */
  public static round(value: number, decimals: number = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
