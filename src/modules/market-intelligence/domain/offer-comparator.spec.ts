import { describe, expect, it } from 'vitest';
import { OfferComparator } from './offer-comparator';
import {
  ComparisonContext,
  ComparisonInputObservation,
  MarketDeliveryCoverage,
  MarketPriceObservation,
  MarketProduct,
  MarketSource,
  MarketTenantConfig,
  ProductMapping,
} from './types';

describe('OfferComparator (CR-COST-05 Bloque 3)', () => {
  const mockTenantConfig: MarketTenantConfig = {
    id: 'cfg-1',
    tenantId: 'tenant-eatclean',
    pricingComparisonMode: 'landed_cost',
    catchWeightPolicy: 'allow_variable_kg',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const createMockSource = (id: string, name: string, sourceType = 'b2b_wholesale'): MarketSource => ({
    id,
    name,
    sourceType: sourceType as any,
    defaultTaxMode: 'ex_tax',
    defaultRegion: 'ES_TENERIFE_TF',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  });

  const createMockProduct = (id: string, rawName: string, thermalState: any = 'fresh'): MarketProduct => ({
    id,
    sourceId: 'src-1',
    rawName,
    category: 'Protein',
    thermalState,
    standardQuantity: 1.0,
    standardUnit: 'kg',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  });

  const createMockObservation = (
    id: string,
    productId: string,
    price: number,
    overrides: Partial<MarketPriceObservation> = {}
  ): MarketPriceObservation => ({
    id,
    marketProductId: productId,
    observedAt: '2026-11-20T10:00:00Z',
    priceRaw: price,
    currency: 'EUR',
    taxMode: 'ex_tax',
    taxRate: 0.0,
    normalizedPriceExTax: price,
    normalizedUnit: 'EUR_PER_KG',
    promotionStatus: 'standard',
    regionCode: 'ES_TENERIFE_TF',
    captureMethod: 'assisted_entry',
    qualityStatus: 'VERIFIED',
    freightInclusion: 'included',
    createdAt: '2026-11-20T10:00:00Z',
    ...overrides,
  });

  const createMockMapping = (
    ingredientId: string,
    productId: string,
    grade: any = 'HIGH'
  ): ProductMapping => ({
    id: `map-${ingredientId}-${productId}`,
    tenantId: 'tenant-eatclean',
    tenantIngredientId: ingredientId,
    marketProductId: productId,
    matchConfidence: 0.95,
    matchStatus: 'confirmed',
    comparabilityGrade: grade,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  });

  const refDate = new Date('2026-11-21T12:00:00Z');

  // ==========================================================================
  // 1. Geographic Coverage Gate (Canarias vs Peninsula)
  // ==========================================================================
  describe('Geographic Coverage Gates', () => {
    it('disqualifies offers documented as unavailable in destination territory', () => {
      const source = createMockSource('src-madrid', 'Madrid Wholesale');
      const product = createMockProduct('prod-1', 'Solomillo Vacuno Fresco');
      const observation = createMockObservation('obs-1', product.id, 14.5, {
        regionCode: 'ES_PENINSULA_MAINLAND',
      });
      const mapping = createMockMapping('ing-1', product.id, 'HIGH');

      const coverage: MarketDeliveryCoverage = {
        id: 'cov-1',
        sourceId: source.id,
        countryCode: 'ES',
        regionCode: 'ES_CANARIAS_REGIONAL',
        coverageStatus: 'documented_unavailable',
        fulfillmentMode: 'delivery',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-1', name: 'Solomillo Vacuno', effectiveWacExTax: 16.0 },
        [{ source, product, observation, mapping, coverages: [coverage] }],
        {
          targetLocation: { countryCode: 'ES', regionCode: 'ES_CANARIAS_REGIONAL' },
          referenceDate: refDate,
        },
        mockTenantConfig
      );

      expect(ranking.top1).toBeNull();
      expect(ranking.disqualifiedOffers.length).toBe(1);
      expect(ranking.disqualifiedOffers[0].reason).toBe('OUT_OF_GEOGRAPHIC_COVERAGE');
    });

    it('blocks offer from Top 1 when delivery coverage is unknown in destination territory', () => {
      const source = createMockSource('src-peninsula', 'Peninsula Cash');
      const product = createMockProduct('prod-1', 'Pechuga Pollo');
      const observation = createMockObservation('obs-1', product.id, 6.2, {
        regionCode: 'ES_PENINSULA_MAINLAND',
      });
      const mapping = createMockMapping('ing-1', product.id, 'HIGH');

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-1', name: 'Pechuga Pollo', effectiveWacExTax: 7.5 },
        [{ source, product, observation, mapping, coverages: [] }], // No documented coverage for target
        {
          targetLocation: { countryCode: 'ES', regionCode: 'ES_TENERIFE_TF', islandCode: 'TENERIFE' },
          referenceDate: refDate,
        },
        mockTenantConfig
      );

      // Offer cannot be Top 1 because delivery to Tenerife is not verified
      expect(ranking.top1).toBeNull();
      expect(ranking.alternatives.length).toBe(1);
      expect(ranking.alternatives[0].uncertaintyFlags).toContain('UNVERIFIED_GEO_COVERAGE');
      expect(ranking.alternatives[0].isEligibleTop1).toBe(false);
    });

    it('declares Top 1 when delivery coverage is documented and matches destination', () => {
      const source = createMockSource('src-tenerife', 'Makro Adeje');
      const product = createMockProduct('prod-1', 'Pechuga Pollo');
      const observation = createMockObservation('obs-1', product.id, 6.5, {
        regionCode: 'ES_TENERIFE_TF',
      });
      const mapping = createMockMapping('ing-1', product.id, 'HIGH');

      const coverage: MarketDeliveryCoverage = {
        id: 'cov-tf',
        sourceId: source.id,
        countryCode: 'ES',
        regionCode: 'ES_TENERIFE_TF',
        islandCode: 'TENERIFE',
        coverageStatus: 'documented_available',
        fulfillmentMode: 'delivery',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-1', name: 'Pechuga Pollo', effectiveWacExTax: 7.5 },
        [{ source, product, observation, mapping, coverages: [coverage] }],
        {
          targetLocation: { countryCode: 'ES', regionCode: 'ES_TENERIFE_TF', islandCode: 'TENERIFE' },
          referenceDate: refDate,
        },
        mockTenantConfig
      );

      expect(ranking.top1).not.toBeNull();
      expect(ranking.top1?.sourceName).toBe('Makro Adeje');
      expect(ranking.top1?.deliveryCoverageState).toBe('delivery_available');
      expect(ranking.top1?.uncertaintyFlags).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 2. Landed Cost vs Origin Price & Freight Surcharges
  // ==========================================================================
  describe('Landed Cost vs Origin Price Modes', () => {
    it('applies freight surcharge in landed_cost mode and compares correctly', () => {
      const sourceA = createMockSource('src-a', 'Proveedor Portes Pagados');
      const productA = createMockProduct('prod-a', 'Aceite Oliva 5L');
      const obsA = createMockObservation('obs-a', productA.id, 5.0, {
        freightInclusion: 'included',
      });

      const sourceB = createMockSource('src-b', 'Proveedor Portes Debidos');
      const productB = createMockProduct('prod-b', 'Aceite Oliva 5L');
      const obsB = createMockObservation('obs-b', productB.id, 4.2, {
        freightInclusion: 'excluded',
        freightCostRaw: 50.0, // 50€ freight total
      });

      const mappingA = createMockMapping('ing-oil', productA.id, 'HIGH');
      const mappingB = createMockMapping('ing-oil', productB.id, 'HIGH');

      // Lote de 25 kg: para Proveedor B, recargo = 50 / 25 = 2.0 €/kg -> Landed Cost = 4.2 + 2.0 = 6.2 €/kg
      // Proveedor A Landed Cost = 5.0 €/kg. Proveedor A gana en modo landed_cost!
      const rankingLanded = OfferComparator.compareOffers(
        { id: 'ing-oil', name: 'Aceite Oliva', effectiveWacExTax: 5.5 },
        [
          { source: sourceA, product: productA, observation: obsA, mapping: mappingA },
          { source: sourceB, product: productB, observation: obsB, mapping: mappingB },
        ],
        { batchQuantity: 25, comparisonMode: 'landed_cost', referenceDate: refDate }
      );

      expect(rankingLanded.top1?.sourceName).toBe('Proveedor Portes Pagados');
      expect(rankingLanded.top1?.landedCostExTax).toBe(5.0);
      expect(rankingLanded.alternatives[0].sourceName).toBe('Proveedor Portes Debidos');
      expect(rankingLanded.alternatives[0].landedCostExTax).toBe(6.2);

      // En modo origin_price: Proveedor B (4.2 €) gana frente a Proveedor A (5.0 €)
      const rankingOrigin = OfferComparator.compareOffers(
        { id: 'ing-oil', name: 'Aceite Oliva', effectiveWacExTax: 5.5 },
        [
          { source: sourceA, product: productA, observation: obsA, mapping: mappingA },
          { source: sourceB, product: productB, observation: obsB, mapping: mappingB },
        ],
        { batchQuantity: 25, comparisonMode: 'origin_price', referenceDate: refDate }
      );

      expect(rankingOrigin.top1?.sourceName).toBe('Proveedor Portes Debidos');
      expect(rankingOrigin.top1?.effectiveComparablePriceExTax).toBe(4.2);
    });

    it('blocks offer from Top 1 when freight is unknown in landed_cost mode', () => {
      const source = createMockSource('src-x', 'Proveedor Sin Portes Claros');
      const product = createMockProduct('prod-x', 'Harina Fuerza');
      const obs = createMockObservation('obs-x', product.id, 0.8, {
        freightInclusion: 'unknown',
      });
      const mapping = createMockMapping('ing-flour', product.id, 'HIGH');

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-flour', name: 'Harina Fuerza', effectiveWacExTax: 1.1 },
        [{ source, product, observation: obs, mapping }],
        { comparisonMode: 'landed_cost', referenceDate: refDate }
      );

      expect(ranking.top1).toBeNull();
      expect(ranking.alternatives[0].uncertaintyFlags).toContain('UNKNOWN_FREIGHT');
      expect(ranking.alternatives[0].isEligibleTop1).toBe(false);
    });

    it('recognizes free freight threshold when batch order amount exceeds minimum', () => {
      const source = createMockSource('src-f', 'Distribuidor Mayorista');
      const product = createMockProduct('prod-f', 'Arroz Grano Largo');
      const obs = createMockObservation('obs-f', product.id, 1.2, {
        freightInclusion: 'free_above_threshold',
        freeFreightMinOrderAmount: 100.0,
      });
      const mapping = createMockMapping('ing-rice', product.id, 'HIGH');

      // Lote de 100 kg * 1.2 €/kg = 120 € > 100 € umbral -> Portes Gratis
      const ranking = OfferComparator.compareOffers(
        { id: 'ing-rice', name: 'Arroz Grano Largo', effectiveWacExTax: 1.5 },
        [{ source, product, observation: obs, mapping }],
        { batchQuantity: 100, comparisonMode: 'landed_cost', referenceDate: refDate }
      );

      expect(ranking.top1).not.toBeNull();
      expect(ranking.top1?.freightStatus).toBe('free_threshold_reached');
      expect(ranking.top1?.freightSurchargePerUnit).toBe(0);
      expect(ranking.top1?.landedCostExTax).toBe(1.2);
    });
  });

  // ==========================================================================
  // 3. Volume Tiers Application & D-010 Invariants
  // ==========================================================================
  describe('Volume Tiers & D-010', () => {
    it('applies the appropriate volume tier matching batchQuantity', () => {
      const source = createMockSource('src-t', 'Mayorista con Tiers');
      const product = createMockProduct('prod-t', 'Queso Gouda Barra');
      const obs = createMockObservation('obs-t', product.id, 9.5, {
        volumeTiers: [
          {
            id: 'tier-1',
            observationId: 'obs-t',
            minQuantity: 10,
            tierQuantityUnit: 'kg',
            tierPriceRaw: 8.5,
            tierNormalizedPriceExTax: 8.5,
            taxMode: 'ex_tax',
            taxRate: 0.0,
          },
          {
            id: 'tier-2',
            observationId: 'obs-t',
            minQuantity: 50,
            tierQuantityUnit: 'kg',
            tierPriceRaw: 7.2,
            tierNormalizedPriceExTax: 7.2,
            taxMode: 'ex_tax',
            taxRate: 0.0,
          },
        ],
      });
      const mapping = createMockMapping('ing-cheese', product.id, 'HIGH');

      // Batch 30 kg qualifies for Tier 1 (min 10 kg: 8.5 €/kg) but not Tier 2 (min 50 kg)
      const ranking30 = OfferComparator.compareOffers(
        { id: 'ing-cheese', name: 'Queso Gouda', effectiveWacExTax: 10.0 },
        [{ source, product, observation: obs, mapping }],
        { batchQuantity: 30, referenceDate: refDate }
      );

      expect(ranking30.top1?.appliedTier?.minQuantity).toBe(10);
      expect(ranking30.top1?.effectiveComparablePriceExTax).toBe(8.5);

      // Batch 60 kg qualifies for Tier 2 (min 50 kg: 7.2 €/kg)
      const ranking60 = OfferComparator.compareOffers(
        { id: 'ing-cheese', name: 'Queso Gouda', effectiveWacExTax: 10.0 },
        [{ source, product, observation: obs, mapping }],
        { batchQuantity: 60, referenceDate: refDate }
      );

      expect(ranking60.top1?.appliedTier?.minQuantity).toBe(50);
      expect(ranking60.top1?.effectiveComparablePriceExTax).toBe(7.2);
    });

    it('blocks tier from Top 1 when tier has unknown tax mode under D-010', () => {
      const source = createMockSource('src-d010', 'Distribuidor Incompleto');
      const product = createMockProduct('prod-d010', 'Mantequilla Bloque');
      const obs = createMockObservation('obs-d010', product.id, 8.0, {
        volumeTiers: [
          {
            id: 'tier-bad',
            observationId: 'obs-d010',
            minQuantity: 20,
            tierQuantityUnit: 'kg',
            tierPriceRaw: 6.5,
            tierNormalizedPriceExTax: null, // Null under D-010 constraint
            taxMode: 'unknown',
            taxRate: null,
          },
        ],
      });
      const mapping = createMockMapping('ing-butter', product.id, 'HIGH');

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-butter', name: 'Mantequilla', effectiveWacExTax: 8.5 },
        [{ source, product, observation: obs, mapping }],
        { batchQuantity: 25, referenceDate: refDate }
      );

      expect(ranking.top1).toBeNull();
      expect(ranking.alternatives[0].uncertaintyFlags).toContain('UNQUANTIFIED_SURCHARGE');
      expect(ranking.alternatives[0].isEligibleTop1).toBe(false);
    });
  });

  // ==========================================================================
  // 4. Anti-Deception Eligibility Gates for Top 1
  // ==========================================================================
  describe('Anti-Deception Gates for Top 1', () => {
    it('blocks expired observations from Top 1', () => {
      const source = createMockSource('src-exp', 'Makro Caducado');
      const product = createMockProduct('prod-exp', 'Tomate Rama');
      const obs = createMockObservation('obs-exp', product.id, 1.8, {
        validTo: '2026-11-10', // Expired relative to refDate 2026-11-21
      });
      const mapping = createMockMapping('ing-tom', product.id, 'HIGH');

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-tom', name: 'Tomate', effectiveWacExTax: 2.2 },
        [{ source, product, observation: obs, mapping }],
        { referenceDate: refDate }
      );

      expect(ranking.top1).toBeNull();
      expect(ranking.alternatives[0].uncertaintyFlags).toContain('STALE_OBSERVATION');
    });

    it('disqualifies offer when thermal state is incompatible with target', () => {
      const source = createMockSource('src-therm', 'Pescados Mar');
      const product = createMockProduct('prod-therm', 'Merluza Filete Ultracongelada', 'frozen');
      const obs = createMockObservation('obs-therm', product.id, 7.5);
      const mapping = createMockMapping('ing-fish', product.id, 'HIGH');

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-fish', name: 'Merluza Fresca', effectiveWacExTax: 12.0 },
        [{ source, product, observation: obs, mapping }],
        { targetThermalState: 'fresh', referenceDate: refDate }
      );

      expect(ranking.top1).toBeNull();
      expect(ranking.disqualifiedOffers.length).toBe(1);
      expect(ranking.disqualifiedOffers[0].reason).toBe('THERMAL_STATE_INCOMPATIBLE');
    });

    it('disqualifies offer when minimum order quantity exceeds batch quantity', () => {
      const source = createMockSource('src-moq', 'Gran Mayorista');
      const product = createMockProduct('prod-moq', 'Azúcar Saco');
      const obs = createMockObservation('obs-moq', product.id, 0.7, {
        minOrderQty: 100, // MOQ 100 kg
        minOrderUnit: 'kg',
      });
      const mapping = createMockMapping('ing-sugar', product.id, 'HIGH');

      // Batch is only 20 kg
      const ranking = OfferComparator.compareOffers(
        { id: 'ing-sugar', name: 'Azúcar', effectiveWacExTax: 1.0 },
        [{ source, product, observation: obs, mapping }],
        { batchQuantity: 20, referenceDate: refDate }
      );

      expect(ranking.top1).toBeNull();
      expect(ranking.disqualifiedOffers.length).toBe(1);
      expect(ranking.disqualifiedOffers[0].reason).toBe('MIN_ORDER_QTY_EXCEEDED');
    });
  });

  // ==========================================================================
  // 5. Deterministic Tie-Breaking Hierarchy
  // ==========================================================================
  describe('Tie-Breaking Hierarchy', () => {
    it('breaks price ties by preferring lower uncertainty, fresher observations, and higher mapping grade', () => {
      const sourceA = createMockSource('src-a', 'Mayorista Fresco Certificado', 'b2b_wholesale');
      const productA = createMockProduct('prod-a', 'Cebolla Grano');
      const obsA = createMockObservation('obs-a', productA.id, 1.0, {
        observedAt: '2026-11-20T10:00:00Z', // Fresher
      });
      const mappingA = createMockMapping('ing-onion', productA.id, 'HIGH');

      const sourceB = createMockSource('src-b', 'Mayorista con Aviso AIEM', 'b2b_wholesale');
      const productB = createMockProduct('prod-b', 'Cebolla Grano');
      const obsB = createMockObservation('obs-b', productB.id, 1.0, {
        observedAt: '2026-11-15T10:00:00Z', // Less fresh
        aiemStatus: 'applicable_inclusion_unknown', // 1 uncertainty flag
      });
      const mappingB = createMockMapping('ing-onion', productB.id, 'MEDIUM');

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-onion', name: 'Cebolla', effectiveWacExTax: 1.3 },
        [
          { source: sourceB, product: productB, observation: obsB, mapping: mappingB },
          { source: sourceA, product: productA, observation: obsA, mapping: mappingA },
        ],
        { referenceDate: refDate }
      );

      // Both have 1.00 €/kg price. Source A wins tie-break due to 0 uncertainty flags and higher freshness!
      expect(ranking.top1?.sourceName).toBe('Mayorista Fresco Certificado');
      expect(ranking.alternatives[0].sourceName).toBe('Mayorista con Aviso AIEM');
    });
  });

  // ==========================================================================
  // 6. Honest Savings Calculation
  // ==========================================================================
  describe('Honest Savings Under Uncertainty', () => {
    it('computes verified savings when Top 1 has 0 uncertainty flags', () => {
      const source = createMockSource('src-ok', 'Makro Tenerife');
      const product = createMockProduct('prod-ok', 'Sal Maldon');
      const obs = createMockObservation('obs-ok', product.id, 8.0);
      const mapping = createMockMapping('ing-salt', product.id, 'HIGH');

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-salt', name: 'Sal Maldon', effectiveWacExTax: 10.0 },
        [{ source, product, observation: obs, mapping }],
        { referenceDate: refDate }
      );

      expect(ranking.top1).not.toBeNull();
      expect(ranking.savingsConfidence).toBe('VERIFIED');
      expect(ranking.savingsVsWacEurPerUnit).toBe(2.0); // 10.0 - 8.0
      expect(ranking.savingsVsWacPct).toBe(20.0);
    });

    it('marks savings as UNCERTAIN and does not claim guaranteed savings when winner has flags', () => {
      const source = createMockSource('src-aiem', 'Importador Canario');
      const product = createMockProduct('prod-aiem', 'Harina Especial');
      const obs = createMockObservation('obs-aiem', product.id, 0.9, {
        aiemStatus: 'applicable_inclusion_unknown',
      });
      const mapping = createMockMapping('ing-flour2', product.id, 'HIGH');

      const ranking = OfferComparator.compareOffers(
        { id: 'ing-flour2', name: 'Harina Especial', effectiveWacExTax: 1.2 },
        [{ source, product, observation: obs, mapping }],
        { referenceDate: refDate }
      );

      // Offer has AIEM uncertainty flag
      expect(ranking.top1?.uncertaintyFlags).toContain('AIEM_INCLUSION_UNKNOWN');
      expect(ranking.savingsConfidence).toBe('UNCERTAIN');
      expect(ranking.savingsVsWacEurPerUnit).toBeNull();
      expect(ranking.savingsExplanation).toContain('incertidumbres en la oferta ganadora');
    });
  });
});
