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
