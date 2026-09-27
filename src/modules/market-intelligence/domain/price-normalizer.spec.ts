import { describe, it, expect } from 'vitest';
import { PriceNormalizer } from './price-normalizer';

describe('PriceNormalizer (CR-COST-05)', () => {
  describe('Wholesale ex-tax conversions', () => {
    it('normalizes bulk packaging in kg correctly (Makro 2.5 kg at 13.125 €)', () => {
      const result = PriceNormalizer.normalize({
        priceRaw: 13.125,
        taxMode: 'ex_tax',
        taxRate: 0.0,
        quantity: 2.5,
        unit: 'kg',
      });

      expect(result.priceExTax).toBe(13.125);
      expect(result.normalizedPriceExTax).toBe(5.25);
      expect(result.normalizedUnit).toBe('EUR_PER_KG');
      expect(result.standardQuantity).toBe(2.5);
      expect(result.standardUnit).toBe('kg');
    });

    it('normalizes volume packaging in liters (5 L jug at 38.50 €)', () => {
      const result = PriceNormalizer.normalize({
        priceRaw: 38.5,
        taxMode: 'ex_tax',
        taxRate: 0.0,
        quantity: 5,
        unit: 'l',
      });

      expect(result.normalizedPriceExTax).toBe(7.7);
      expect(result.normalizedUnit).toBe('EUR_PER_L');
      expect(result.standardQuantity).toBe(5);
      expect(result.standardUnit).toBe('l');
    });
  });

  describe('Sub-unit conversions (grams, ml, cl)', () => {
    it('normalizes grams to EUR_PER_KG (400 g tray at 3.20 €)', () => {
      const result = PriceNormalizer.normalize({
        priceRaw: 3.2,
        taxMode: 'ex_tax',
        taxRate: 0.0,
        quantity: 400,
        unit: 'g',
      });

      expect(result.normalizedPriceExTax).toBe(8.0);
      expect(result.normalizedUnit).toBe('EUR_PER_KG');
      expect(result.standardQuantity).toBe(0.4);
      expect(result.standardUnit).toBe('kg');
    });

    it('normalizes milliliters to EUR_PER_L (750 ml bottle at 4.50 €)', () => {
      const result = PriceNormalizer.normalize({
        priceRaw: 4.5,
        taxMode: 'ex_tax',
        taxRate: 0.0,
        quantity: 750,
        unit: 'ml',
      });

      expect(result.normalizedPriceExTax).toBe(6.0);
      expect(result.normalizedUnit).toBe('EUR_PER_L');
      expect(result.standardQuantity).toBe(0.75);
      expect(result.standardUnit).toBe('l');
    });

    it('normalizes centiliters to EUR_PER_L (33 cl can at 0.66 €)', () => {
      const result = PriceNormalizer.normalize({
        priceRaw: 0.66,
        taxMode: 'ex_tax',
        taxRate: 0.0,
        quantity: 33,
        unit: 'cl',
      });

      expect(result.normalizedPriceExTax).toBe(2.0);
      expect(result.normalizedUnit).toBe('EUR_PER_L');
      expect(result.standardQuantity).toBe(0.33);
    });
  });

  describe('Tax normalization (Inc-Tax to Ex-Tax)', () => {
    it('strips Canary IGIC (7%) from retail shelf price', () => {
      // 6.42 € inc 7% IGIC -> 6.00 € ex-tax
      const result = PriceNormalizer.normalize({
        priceRaw: 6.42,
        taxMode: 'inc_tax',
        taxRate: 0.07,
        quantity: 1,
        unit: 'kg',
      });

      expect(result.priceExTax).toBe(6.0);
      expect(result.normalizedPriceExTax).toBe(6.0);
      expect(result.normalizedUnit).toBe('EUR_PER_KG');
    });

    it('strips Mainland IVA (10%) from retail shelf price', () => {
      // 11.00 € inc 10% IVA -> 10.00 € ex-tax for 2kg -> 5.00 €/kg
      const result = PriceNormalizer.normalize({
        priceRaw: 11.0,
        taxMode: 'inc_tax',
        taxRate: 0.1,
        quantity: 2,
        unit: 'kg',
      });

      expect(result.priceExTax).toBe(10.0);
      expect(result.normalizedPriceExTax).toBe(5.0);
      expect(result.normalizedUnit).toBe('EUR_PER_KG');
    });

    it('handles 0% tax rate (super-reduced food products)', () => {
      const result = PriceNormalizer.normalize({
        priceRaw: 4.8,
        taxMode: 'inc_tax',
        taxRate: 0.0,
        quantity: 1,
        unit: 'kg',
      });

      expect(result.priceExTax).toBe(4.8);
      expect(result.normalizedPriceExTax).toBe(4.8);
    });
  });

  describe('Net Drained Weight handling', () => {
    it('uses net drained quantity for canned products when provided', () => {
      // 1000g gross can with 650g net drained tuna at 6.50 €
      const result = PriceNormalizer.normalize({
        priceRaw: 6.5,
        taxMode: 'ex_tax',
        taxRate: 0.0,
        quantity: 1000,
        netDrainedQuantity: 650,
        unit: 'g',
      });

      expect(result.standardQuantity).toBe(0.65);
      expect(result.normalizedPriceExTax).toBe(10.0);
      expect(result.normalizedUnit).toBe('EUR_PER_KG');
    });
  });

  describe('Unit / Piece normalization', () => {
    it('normalizes count/unit based products', () => {
      const result = PriceNormalizer.normalize({
        priceRaw: 12.0,
        taxMode: 'ex_tax',
        taxRate: 0.0,
        quantity: 24,
        unit: 'ud',
      });

      expect(result.normalizedPriceExTax).toBe(0.5);
      expect(result.normalizedUnit).toBe('EUR_PER_UNIT');
      expect(result.standardUnit).toBe('unit');
    });
  });

  describe('Input validation & Edge cases', () => {
    it('throws error for negative prices', () => {
      expect(() => {
        PriceNormalizer.normalize({
          priceRaw: -5,
          taxMode: 'ex_tax',
          taxRate: 0.0,
          quantity: 1,
          unit: 'kg',
        });
      }).toThrow('Raw price cannot be negative');
    });

    it('throws error for invalid tax rate', () => {
      expect(() => {
        PriceNormalizer.normalize({
          priceRaw: 10,
          taxMode: 'inc_tax',
          taxRate: 1.5,
          quantity: 1,
          unit: 'kg',
        });
      }).toThrow('Tax rate must be between 0.0 and 1.0');
    });

    it('throws error for zero or negative quantity', () => {
      expect(() => {
        PriceNormalizer.normalize({
          priceRaw: 10,
          taxMode: 'ex_tax',
          taxRate: 0.0,
          quantity: 0,
          unit: 'kg',
        });
      }).toThrow('Effective quantity must be strictly greater than 0');
    });

    it('throws error for unsupported units', () => {
      expect(() => {
        PriceNormalizer.normalize({
          priceRaw: 10,
          taxMode: 'ex_tax',
          taxRate: 0.0,
          quantity: 1,
          unit: 'bushel',
        });
      }).toThrow('Unsupported measurement unit: bushel');
    });
  });
});
