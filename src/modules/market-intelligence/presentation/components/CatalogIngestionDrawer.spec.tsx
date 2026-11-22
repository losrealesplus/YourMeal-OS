import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CatalogIngestionDrawer } from './CatalogIngestionDrawer';
import type { MarketCatalogIngestionService } from '../../application/market-catalog-ingestion-service';
import type { MarketSource } from '../../domain/types';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children?: React.ReactNode; open?: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
  DialogDescription: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <p className={className}>{children}</p>
  ),
  DialogFooter: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}));

describe('CatalogIngestionDrawer Component (CR-COST-05 UI PDF & Image)', () => {
  const mockSources: MarketSource[] = [
    {
      id: 'src-makro',
      name: 'Makro Mayorista',
      sourceType: 'b2b_wholesale',
      regionCode: 'ES-TF',
      defaultRegion: 'ES-TF',
      isPublic: true,
      createdAt: '2026-11-12T00:00:00Z',
      updatedAt: '2026-11-12T00:00:00Z',
    },
    {
      id: 'src-mercadona',
      name: 'Mercadona',
      sourceType: 'retail_ceiling',
      regionCode: 'ES-GC',
      defaultRegion: 'ES-GC',
      isPublic: true,
      createdAt: '2026-11-12T00:00:00Z',
      updatedAt: '2026-11-12T00:00:00Z',
    },
  ];

  const mockService = {} as MarketCatalogIngestionService;

  it('renders drawer with file input accepting CSV, TSV, PDF and images', () => {
    const html = renderToString(
      <CatalogIngestionDrawer
        open={true}
        onOpenChange={vi.fn()}
        sources={mockSources}
        ingestionService={mockService}
        userId="11111111-1111-4111-8111-111111111111"
        tenantId="22222222-2222-4222-8222-222222222222"
      />
    );

    expect(html).toContain('Ingesta de Catálogo y Documentos de Mercado');
    expect(html).toContain('accept=".csv,.tsv,.txt,.pdf,image/png,image/jpeg,image/webp"');
    expect(html).toContain('Makro Mayorista');
    expect(html).toContain('Mayorista B2B');
    expect(html).toContain('Visibilidad de Precios');
    expect(html).toContain('Tarifa privada del tenant');
    expect(html).toContain('Cero invención de datos');
  });

  it('allows public core option only when canPublishPublic is true', () => {
    const htmlPrivateOnly = renderToString(
      <CatalogIngestionDrawer
        open={true}
        onOpenChange={vi.fn()}
        sources={mockSources}
        ingestionService={mockService}
        userId="11111111-1111-4111-8111-111111111111"
        tenantId="22222222-2222-4222-8222-222222222222"
        canPublishPublic={false}
      />
    );
    expect(htmlPrivateOnly).not.toContain('Público (Core compartido)');

    const htmlPublicAllowed = renderToString(
      <CatalogIngestionDrawer
        open={true}
        onOpenChange={vi.fn()}
        sources={mockSources}
        ingestionService={mockService}
        userId="11111111-1111-4111-8111-111111111111"
        tenantId="22222222-2222-4222-8222-222222222222"
        canPublishPublic={true}
      />
    );
    expect(htmlPublicAllowed).toContain('Público (Core compartido)');
  });
});
