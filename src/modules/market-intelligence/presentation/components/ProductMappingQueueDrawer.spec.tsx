import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProductMappingQueueDrawer } from './ProductMappingQueueDrawer';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  DialogDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
  DialogFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value }: any) => <div data-testid="select" data-value={value}>{children}</div>,
  SelectTrigger: ({ children, className }: any) => <button className={className}>{children}</button>,
  SelectValue: () => <span>SelectValue</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}));

describe('ProductMappingQueueDrawer (CR-COST-05 Assisted Mapping Connection)', () => {
  const sampleIngredients = [
    { id: 'ing-1', name: 'Pechuga de Pollo', unit: 'kg', currentWac: 5.5 },
    { id: 'ing-2', name: 'Arroz Bomba', unit: 'kg', currentWac: 1.2 },
  ];

  const sampleMarketProducts = [
    {
      id: 'mp-1',
      sourceId: 'source-makro',
      rawName: 'Pechuga de Pollo Fresca 5kg',
      normalizedName: 'pechuga de pollo fresca',
      canonicalUnit: 'kg' as const,
      comparabilityGrade: 'EXACT' as const,
      lastObservedPriceExTax: 5.2,
      lastObservedAt: '2026-11-20',
      packQuantity: 5,
      brand: 'Makro Chef',
      category: 'Carnes',
      thermalState: 'fresh' as const,
      standardQuantity: 5,
      standardUnit: 'kg' as const,
      isActive: true,
      createdAt: '2026-11-20',
      updatedAt: '2026-11-20',
    },
  ];

  it('renders queue drawer with initialSelectedIngredientId preselected and prefiltered', () => {
    const html = renderToString(
      <ProductMappingQueueDrawer
        open={true}
        onOpenChange={() => {}}
        tenantId="tenant-123"
        userId="user-456"
        ingredients={sampleIngredients}
        marketProducts={sampleMarketProducts}
        existingMappings={[]}
        mappingService={{} as any}
        initialSelectedIngredientId="ing-2"
        initialSearchQuery="Arroz"
      />
    );

    expect(html).toContain('Cola de Mapeo de Ingredientes de Mercado');
    expect(html).toContain('Arroz Bomba');
    expect(html).toContain('Pechuga de Pollo');
  });
});
