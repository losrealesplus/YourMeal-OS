import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MarketInquiryExplorerModal } from './MarketInquiryExplorerModal';

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

describe('MarketInquiryExplorerModal (CR-COST-07 Progressive Funnel)', () => {
  it('renders the 4-level progressive stepper and initial Level 1 market inquiry', () => {
    const html = renderToString(
      <MarketInquiryExplorerModal
        open={true}
        onOpenChange={() => {}}
        marketProducts={[]}
        tenantId="tenant-test"
        userId="user-test"
        userName="Chef Ejecutivo"
      />
    );

    // Verify 4-level stepper labels
    expect(html).toContain('1. Mercado');
    expect(html).toContain('2. Receta');
    expect(html).toContain('3. Fábrica');
    expect(html).toContain('4. Decisión');

    // Verify Level 1 content
    expect(html).toContain('Tarta de Zanahoria Casera');
    expect(html).toContain('PVP Objetivo');
    expect(html).toContain('Zanahoria fresca');
    expect(html).toContain('[OBSERVADO]');
    expect(html).toContain('Queso crema cobertura');
    expect(html).toContain('[MANUAL]');

    // Verify navigation button
    expect(html).toContain('Avanzar a Receta &amp; Mermas');
  });

  it('rehydrates a frozen study version from persistence and enforces v1 CONGELADA immutability', () => {
    const frozenStudyFixture = {
      id: 'study-test-123',
      product_name: 'Tarta de Zanahoria Casera (Audit Fixture)',
      product_category: 'Repostería',
      current_status: 'DECISION',
      active_version_number: 1,
      study_versions: [
        {
          id: 'ver-test-123',
          version_number: 1,
          version_status: 'CONGELADA',
          target_pvp: 4.50,
          batch_unit_name: 'tarta',
          batch_nominal_yield: 12,
          is_fractional_allowed: false,
          surplus_destination: 'STOCK_REFRIGERADO',
          is_frozen: true,
          study_ingredients: [
            {
              id: 'ing-1',
              ingredient_name: 'Zanahorias de auditoría',
              gross_quantity: 0.8,
              gross_unit: 'kg',
              unit_price: 1.10,
              price_provenance: 'OBSERVADO',
              trimming_loss_pct: 15.0,
            },
          ],
          study_decisions: [
            {
              id: 'dec-123',
              decision_verdict: 'APPROVED_FOR_MENU',
              human_decision_status: 'APPROVED',
              decision_notes: 'Fixture de auditoría técnica.',
            },
          ],
        },
      ],
    };

    const html = renderToString(
      <MarketInquiryExplorerModal
        open={true}
        onOpenChange={() => {}}
        marketProducts={[]}
        tenantId="tenant-test"
        initialStudy={frozenStudyFixture}
      />
    );

    // Verify rehydrated product name
    expect(html).toContain('Tarta de Zanahoria Casera (Audit Fixture)');

    // Verify v1 CONGELADA badge is displayed
    expect(html).toContain('v1 CONGELADA');

    // Verify rehydrated ingredient name
    expect(html).toContain('Zanahorias de auditoría');

    // Verify inputs have disabled attribute
    expect(html).toContain('disabled=""');

    // Verify mutating actions (like adding new ingredient input row) are hidden when frozen
    expect(html).not.toContain('Añadir nuevo ingrediente a cotizar...');
  });

  it('rehydrates an unfrozen draft study version with full editability', () => {
    const draftStudyFixture = {
      id: 'study-draft-123',
      product_name: 'Bocadillo de Pollo Asado (Borrador)',
      product_category: 'Bocadillos',
      current_status: 'BORRADOR',
      active_version_number: 1,
      study_versions: [
        {
          id: 'ver-draft-123',
          version_number: 1,
          version_status: 'BORRADOR',
          target_pvp: 6.50,
          batch_unit_name: 'bocadillo',
          batch_nominal_yield: 1,
          is_fractional_allowed: false,
          surplus_destination: 'STOCK_REFRIGERADO',
          is_frozen: false,
          study_ingredients: [
            {
              id: 'ing-draft-1',
              ingredient_name: 'Pechuga de Pollo Fresca',
              gross_quantity: 0.2,
              gross_unit: 'kg',
              unit_price: 6.40,
              price_provenance: 'OBSERVADO',
              trimming_loss_pct: 0,
            },
          ],
        },
      ],
    };

    const html = renderToString(
      <MarketInquiryExplorerModal
        open={true}
        onOpenChange={() => {}}
        marketProducts={[]}
        tenantId="tenant-test"
        initialStudy={draftStudyFixture}
      />
    );

    // Verify draft product name
    expect(html).toContain('Bocadillo de Pollo Asado (Borrador)');

    // Verify v1 CONGELADA is NOT present
    expect(html).not.toContain('v1 CONGELADA');

    // Verify mutating action (adding ingredient) is present
    expect(html).toContain('Añadir nuevo ingrediente a cotizar...');
  });

  it('renders closed when open is false', () => {
    const html = renderToString(
      <MarketInquiryExplorerModal
        open={false}
        onOpenChange={() => {}}
        marketProducts={[]}
      />
    );

    expect(html).toBe('');
  });
});
