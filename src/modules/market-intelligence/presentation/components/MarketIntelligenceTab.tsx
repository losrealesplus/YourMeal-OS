/**
 * YOURMEAL-OS · Market Intelligence Cockpit Tab (CR-COST-05)
 * Primary UI surface for Food Market Price Intelligence within /admin/cost-intelligence.
 */

import React, { useState, useMemo } from 'react';
import { PanelCard, SectionTitle } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  TrendingDown,
  TrendingUp,
  Upload,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Building2,
  FileText,
  History,
  Layers,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { MarketBenchmarkBadge } from './MarketBenchmarkBadge';
import { MarketSourceSpreadCard } from './MarketSourceSpreadCard';
import { CatalogIngestionDrawer } from './CatalogIngestionDrawer';
import { ProductMappingQueueDrawer, UnmappedIngredientItem } from './ProductMappingQueueDrawer';
import { PriceObservationHistoryModal } from './PriceObservationHistoryModal';
import { NegotiationBriefModal } from './NegotiationBriefModal';
import {
  StrategicOpportunityCards,
  OpportunityItem,
  ActionabilityGrade,
} from './StrategicOpportunityCards';
import { MarketInquiryExplorerModal } from './MarketInquiryExplorerModal';
import { useMarketIntelligence } from '../hooks/use-market-intelligence';
import {
  MarketProduct,
  MarketPriceObservation,
  NegotiationBrief,
  BenchmarkCalculation,
} from '../../domain/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface MarketIntelligenceTabProps {
  tenantId: string;
  tenantName?: string;
  ingredients: Array<{
    id: string;
    name: string;
    unit: string;
    cost: number;
    category?: string;
    annualVolume?: number;
  }>;
  onInjectSimulation?: (ingredientId: string, simulatedPrice: number, deltaPct: number) => void;
}

export function MarketIntelligenceTab({
  tenantId,
  tenantName = 'Restaurante',
  ingredients,
  onInjectSimulation,
}: MarketIntelligenceTabProps) {
  const {
    sources,
    marketProducts,
    mappings,
    benchmarksByIngredient,
    isLoading,
    error,
    refetch,
    ingestionService,
    mappingService,
    repository,
    generateNegotiationBrief,
  } = useMarketIntelligence(tenantId);

  // Modals & Drawers state
  const [isIngestionOpen, setIsIngestionOpen] = useState<boolean>(false);
  const [isMappingQueueOpen, setIsMappingQueueOpen] = useState<boolean>(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState<boolean>(false);
  const [historyProduct, setHistoryProduct] = useState<MarketProduct | null>(null);
  const [historyObservations, setHistoryObservations] = useState<MarketPriceObservation[]>([]);
  const [activeBrief, setActiveBrief] = useState<NegotiationBrief | null>(null);
  const [selectedSpreadCalc, setSelectedSpreadCalc] = useState<BenchmarkCalculation | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>('all');

  // Mapped ingredients table data
  const benchmarkRows = useMemo(() => {
    return ingredients.map((ing) => {
      const calc = benchmarksByIngredient.get(ing.id) || null;
      const mapping = mappings.find(
        (m) => m.tenantIngredientId === ing.id && m.matchStatus === 'confirmed'
      );

      const benchmarkExTax = calc ? calc.benchmarkPriceExTax : null;
      const variancePct =
        benchmarkExTax && ing.cost > 0
          ? ((ing.cost - benchmarkExTax) / benchmarkExTax) * 100
          : null;

      // Deterministic Actionability Grade Evaluation
      let actionabilityGrade: ActionabilityGrade = 'INSUFFICIENT';
      if (mapping && calc && calc.components.length > 0) {
        if (variancePct !== null && variancePct > 5 && ing.annualVolume && ing.annualVolume > 0) {
          actionabilityGrade = 'DIRECT_ACTION';
        } else if (!ing.annualVolume || ing.annualVolume === 0) {
          actionabilityGrade = 'REVIEW_DATA';
        } else {
          actionabilityGrade = 'INFORMATIONAL';
        }
      }

      return {
        ingredient: ing,
        mapping: mapping || null,
        calculation: calc,
        benchmarkExTax,
        variancePct,
        actionabilityGrade,
        isMapped: Boolean(mapping),
      };
    });
  }, [ingredients, benchmarksByIngredient, mappings]);

  // Opportunities list for StrategicOpportunityCards
  const strategicOpportunities: OpportunityItem[] = useMemo(() => {
    return benchmarkRows
      .filter((r) => r.calculation && r.benchmarkExTax !== null && (r.variancePct || 0) > 0)
      .map((r) => {
        const potentialAnnualSavingsEur =
          r.ingredient.annualVolume && r.ingredient.annualVolume > 0 && r.benchmarkExTax
            ? (r.ingredient.cost - r.benchmarkExTax) * r.ingredient.annualVolume
            : null;

        return {
          ingredientId: r.ingredient.id,
          ingredientName: r.ingredient.name,
          category: r.ingredient.category,
          unit: r.ingredient.unit,
          effectiveWacExTax: r.ingredient.cost,
          benchmarkPriceExTax: r.benchmarkExTax!,
          variancePct: r.variancePct || 0,
          annualVolume: r.ingredient.annualVolume,
          potentialAnnualSavingsEur,
          actionabilityGrade: r.actionabilityGrade,
          calculation: r.calculation!,
        };
      });
  }, [benchmarkRows]);

  // Filtered rows
  const filteredBenchmarkRows = useMemo(() => {
    if (!searchQuery.trim()) return benchmarkRows;
    const q = searchQuery.toLowerCase();
    return benchmarkRows.filter(
      (r) =>
        r.ingredient.name.toLowerCase().includes(q) ||
        (r.ingredient.category && r.ingredient.category.toLowerCase().includes(q))
    );
  }, [benchmarkRows, searchQuery]);

  // Overall KPI Metrics
  const kpiMetrics = useMemo(() => {
    const totalMapped = benchmarkRows.filter((r) => r.isMapped).length;
    const itemsWithVariance = benchmarkRows.filter((r) => r.variancePct !== null);
    const avgVariance =
      itemsWithVariance.length > 0
        ? itemsWithVariance.reduce((acc, r) => acc + (r.variancePct || 0), 0) /
          itemsWithVariance.length
        : 0;

    return {
      totalSources: sources.length,
      totalProducts: marketProducts.length,
      totalMapped,
      mappingCoveragePct: ingredients.length > 0 ? (totalMapped / ingredients.length) * 100 : 0,
      avgVariance,
    };
  }, [sources, marketProducts, benchmarkRows, ingredients]);

  const handleOpenHistory = async (product: MarketProduct) => {
    setHistoryProduct(product);
    try {
      const obs = await repository.getObservationsByProduct(product.id);
      setHistoryObservations(obs);
    } catch (err: any) {
      toast.error('Error cargando historial de observaciones');
    }
  };

  const handleOpenBrief = async (row: typeof benchmarkRows[0] | OpportunityItem) => {
    const calc = 'calculation' in row ? row.calculation : null;
    const ingredient = 'ingredient' in row ? row.ingredient : {
      id: row.ingredientId,
      name: row.ingredientName,
      category: row.category,
      unit: row.unit,
      cost: row.effectiveWacExTax,
      annualVolume: row.annualVolume,
    };

    if (!calc) {
      toast.error('Se requiere un benchmark de mercado activo para generar el informe.');
      return;
    }

    try {
      const brief = await generateNegotiationBrief(tenantName, {
        id: ingredient.id,
        tenantId,
        name: ingredient.name,
        category: ingredient.category || 'General',
        unit: (ingredient.unit as any) || 'kg',
        effectiveWacExTax: ingredient.cost || 1.0,
        annualVolume: ingredient.annualVolume || 0,
      });

      if (brief) {
        setActiveBrief(brief);
      }
    } catch (err: any) {
      toast.error(`Error generando informe: ${err.message || 'Error'}`);
    }
  };

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Error en Inteligencia de Mercado</span>
        </div>
        <p className="text-xs text-rose-700">{error}</p>
        <Button size="sm" variant="outline" onClick={refetch} className="text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Reintentar Carga
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Inteligencia de Precios de Mercado</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Observación de precios mayoristas y minoristas (Makro, GM Cash, 5 Océanos, Mercadona),
            cálculo de benchmarks y cockpit de negociación con proveedores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsInquiryOpen(true)}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Preguntar al Mercado
          </Button>

          <Button
            size="sm"
            onClick={() => setIsIngestionOpen(true)}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Importar Catálogo (CSV)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMappingQueueOpen(true)}
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Cola de Mapeo ({kpiMetrics.totalMapped}/{ingredients.length})
          </Button>
        </div>
      </div>

      {/* Strategic Opportunity Cards (Actionability Engine) */}
      <StrategicOpportunityCards
        opportunities={strategicOpportunities}
        onInjectSimulation={(id, price, delta) => {
          if (onInjectSimulation) {
            onInjectSimulation(id, price, delta);
          } else {
            toast.info(`Inyección de hipótesis: ${id} a ${price} € (${delta.toFixed(1)}%)`);
          }
        }}
        onOpenBrief={handleOpenBrief}
        onOpenSpread={(calc) => setSelectedSpreadCalc(calc)}
        onOpenInquiry={() => setIsInquiryOpen(true)}
      />

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PanelCard className="p-4 bg-white border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Fuentes Registradas
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {kpiMetrics.totalSources}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Makro, GM Cash, 5 Océanos, Mercadona
          </div>
        </PanelCard>

        <PanelCard className="p-4 bg-white border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Catálogo Observable
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            {kpiMetrics.totalProducts}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            SKUs de mercado normalizados
          </div>
        </PanelCard>

        <PanelCard className="p-4 bg-white border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Cobertura de Mapeo
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {kpiMetrics.mappingCoveragePct.toFixed(0)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {kpiMetrics.totalMapped} de {ingredients.length} ingredientes enlazados
          </div>
        </PanelCard>

        <PanelCard className="p-4 bg-white border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Eficiencia vs Mercado
          </span>
          <div
            className={cn(
              'text-2xl font-bold font-mono mt-1',
              kpiMetrics.avgVariance > 0 ? 'text-amber-600' : 'text-emerald-600'
            )}
          >
            {kpiMetrics.avgVariance > 0
              ? `+${kpiMetrics.avgVariance.toFixed(1)}%`
              : `${kpiMetrics.avgVariance.toFixed(1)}%`}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Desviación media del portfolio vs benchmark
          </div>
        </PanelCard>
      </div>

      {/* Selected Dispersion Spread Card (if opened) */}
      {selectedSpreadCalc && (
        <div className="relative">
          <MarketSourceSpreadCard
            ingredientName={selectedSpreadCalc.tenantIngredientName}
            components={selectedSpreadCalc.components}
            benchmarkPriceExTax={selectedSpreadCalc.benchmarkPriceExTax}
            unit={selectedSpreadCalc.canonicalUnit.replace('EUR_PER_', '').toLowerCase()}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedSpreadCalc(null)}
            className="absolute top-3 right-3 text-xs text-slate-400 hover:text-slate-600"
          >
            Cerrar Vista
          </Button>
        </div>
      )}

      {/* Main Table: Market Benchmarks vs WAC */}
      <PanelCard className="border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <SectionTitle
              title="Benchmarks de Mercado del Portfolio"
              subtitle="Comparación directa entre el coste actual (WAC) y los precios observables de mercado."
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                placeholder="Filtrar ingrediente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredBenchmarkRows.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No se encontraron ingredientes para los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Ingrediente</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">Coste WAC [REAL]</th>
                  <th className="p-3 text-right">Benchmark [OBSERVADO]</th>
                  <th className="p-3 text-center">Variación vs Mercado</th>
                  <th className="p-3 text-center">Fuentes Observadas</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredBenchmarkRows.map((row) => (
                  <tr key={row.ingredient.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-sans font-medium text-slate-900">
                      {row.ingredient.name}
                    </td>
                    <td className="p-3 font-sans text-slate-500">
                      {row.ingredient.category || '—'}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {row.ingredient.cost.toFixed(2)} €/{row.ingredient.unit}
                    </td>
                    <td className="p-3 text-right">
                      {row.benchmarkExTax !== null ? (
                        <span className="font-bold text-indigo-700">
                          {row.benchmarkExTax.toFixed(2)} €/{row.ingredient.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans italic">Sin calcular</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <MarketBenchmarkBadge
                        benchmarkPriceExTax={row.benchmarkExTax}
                        effectiveWacExTax={row.ingredient.cost}
                        unit={row.ingredient.unit}
                        comparabilityGrade={row.mapping?.comparabilityGrade}
                        isMapped={row.isMapped}
                        onClick={() => {
                          if (!row.isMapped) setIsMappingQueueOpen(true);
                          else if (row.calculation) setSelectedSpreadCalc(row.calculation);
                        }}
                      />
                    </td>
                    <td className="p-3 text-center">
                      {row.calculation ? (
                        <Badge variant="outline" className="text-[10px] bg-slate-50">
                          {row.calculation.components.length} fuentes
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {row.calculation ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSpreadCalc(row.calculation)}
                            className="h-7 text-xs text-slate-600 hover:text-slate-900"
                          >
                            Dispersión
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenBrief(row)}
                            className="h-7 text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Informe
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsMappingQueueOpen(true)}
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Mapear
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>

      {/* Drawers & Modals */}
      <CatalogIngestionDrawer
        open={isIngestionOpen}
        onOpenChange={setIsIngestionOpen}
        sources={sources}
        ingestionService={ingestionService}
        onIngestionSuccess={refetch}
      />

      <ProductMappingQueueDrawer
        open={isMappingQueueOpen}
        onOpenChange={setIsMappingQueueOpen}
        tenantId={tenantId}
        ingredients={ingredients}
        marketProducts={marketProducts}
        existingMappings={mappings}
        mappingService={mappingService}
        onMappingUpdated={refetch}
      />

      <PriceObservationHistoryModal
        open={Boolean(historyProduct)}
        onOpenChange={(open) => !open && setHistoryProduct(null)}
        product={historyProduct}
        observations={historyObservations}
      />

      <NegotiationBriefModal
        open={Boolean(activeBrief)}
        onOpenChange={(open) => !open && setActiveBrief(null)}
        brief={activeBrief}
      />

      <MarketInquiryExplorerModal
        open={isInquiryOpen}
        onOpenChange={setIsInquiryOpen}
        marketProducts={marketProducts}
      />
    </div>
  );
}
