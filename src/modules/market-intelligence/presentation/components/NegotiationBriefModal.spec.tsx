import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { NegotiationBriefModal } from './NegotiationBriefModal';
import { NegotiationBrief } from '../../domain/types';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  DialogDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
  DialogFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

describe('NegotiationBriefModal Component', () => {
  it('renders complete negotiation brief with executive summary and talking points', () => {
    const mockBrief: NegotiationBrief = {
      tenantId: 'tenant_eatclean',
      tenantName: 'EatClean Demo',
      generatedAt: '2026-09-27T12:00:00.000Z',
      ingredientId: 'ing_salmon',
      ingredientName: 'Salmón Noruego Fresco',
      targetSupplierName: 'Pescados del Atlántico',
      currentInvoicedPriceExTax: 14.50,
      effectiveWacExTax: 14.50,
      consumptionVolume: 1200,
      unit: 'kg',
      projectedAnnualSpendEur: 17400,
      benchmarkPriceExTax: 12.80,
      potentialAnnualSavingsEur: 2040,
      targetRenegotiationPriceExTax: 12.80,
      varianceAnalysis: {
        tenantIngredientId: 'ing_salmon',
        tenantIngredientName: 'Salmón Noruego Fresco',
        unit: 'EUR_PER_KG',
        effectiveWacExTax: 14.50,
        currentInvoicedPriceExTax: 14.50,
        benchmarkPriceExTax: 12.80,
        marketVariancePct: 13.28,
        supplierPriceGapEur: 1.70,
        annualSpendAtRiskEur: 2040,
        status: 'UNFAVORABLE_OVERPAYING',
        confidenceSummary: 'HIGH',
      },
      observableComponents: [
        {
          observationId: 'obs_salm_1',
          sourceId: 'src_makro',
          sourceName: 'Makro',
          sourceType: 'cash_carry',
          rawName: 'Salmón Entero Fresco',
          regionCode: 'ES_TENERIFE_TF',
          observedAt: '2026-09-26T10:00:00.000Z',
          rawPrice: 62.50,
          taxMode: 'ex_tax',
          taxRate: 0.03,
          normalizedPriceExTax: 12.50,
          normalizedUnit: 'EUR_PER_KG',
          comparabilityGrade: 'HIGH',
          weight: 0.7,
          isStale: false,
          isPromo: false,
        },
      ],
      talkingPoints: [
        {
          topic: 'Diferencial de Mercado',
          point: 'El precio actual de adquisición supera el promedio ponderado de mercado en un 13.3%.',
          evidence: 'Makro (€12.50/kg, EXACT_A)',
          impactEur: 2040,
        },
      ],
    };

    const html = renderToString(
      <NegotiationBriefModal
        open={true}
        onOpenChange={() => {}}
        brief={mockBrief}
      />
    );

    expect(html).toContain('Salmón Noruego Fresco');
    expect(html).toContain('EatClean Demo');
    expect(html).toContain('14.50');
    expect(html).toContain('12.80');
    expect(html).toContain('+13.3% Sobreprecio vs Mercado');
    expect(html).toContain('2040.00 €');
    expect(html).toContain('Argumentos Clave para la Negociación');
    expect(html).toContain('Diferencial de Mercado');
    expect(html).toContain('Makro');
  });

  it('renders null when brief is not provided', () => {
    const html = renderToString(
      <NegotiationBriefModal
        open={true}
        onOpenChange={() => {}}
        brief={null}
      />
    );

    expect(html).toBe('');
  });
});
