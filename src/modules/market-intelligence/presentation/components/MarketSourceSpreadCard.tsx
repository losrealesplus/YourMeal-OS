/**
 * YOURMEAL-OS · Market Source Spread & Dispersion Card (CR-COST-05)
 * Displays wholesale floor vs retail ceiling dispersion and source-by-source comparison.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BenchmarkComponent } from '../../domain/types';
import { Building2, Store, ShoppingCart, Tag, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MarketSourceSpreadCardProps {
  ingredientName: string;
  components: BenchmarkComponent[];
  benchmarkPriceExTax: number;
  effectiveWacExTax?: number;
  unit?: string;
  className?: string;
}

export function MarketSourceSpreadCard({
  ingredientName,
  components,
  benchmarkPriceExTax,
  effectiveWacExTax,
  unit = 'kg',
  className,
}: MarketSourceSpreadCardProps) {
  const sortedComponents = [...components].sort(
    (a, b) => a.normalizedPriceExTax - b.normalizedPriceExTax
  );

  const minPrice = sortedComponents.length > 0 ? sortedComponents[0].normalizedPriceExTax : 0;
  const maxPrice = sortedComponents.length > 0 ? sortedComponents[sortedComponents.length - 1].normalizedPriceExTax : 0;
  const spreadPct = minPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0;

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'b2b_wholesale':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'cash_carry':
        return <Store className="w-4 h-4 text-indigo-600" />;
      case 'regional_specialist':
        return <Tag className="w-4 h-4 text-amber-600" />;
      case 'retail_ceiling':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'b2b_wholesale':
        return 'Mayorista B2B';
      case 'cash_carry':
        return 'Cash & Carry';
      case 'regional_specialist':
        return 'Especialista Regional';
      case 'retail_ceiling':
        return 'Techo Minorista';
      default:
        return type;
    }
  };

  return (
    <Card className={cn('border-slate-200 shadow-sm', className)}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>Dispersión de Precios: {ingredientName}</span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 border-blue-200">
                OBSERVADO
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Comparativa de fuentes observables ({components.length} fuentes activas)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs bg-slate-50">
              Dispersión: {spreadPct.toFixed(1)}%
            </Badge>
            <Badge className="font-mono text-xs bg-slate-900 text-white">
              Benchmark [OBSERVADO]: {benchmarkPriceExTax.toFixed(2)} €/{unit}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {components.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">
            No hay observaciones de mercado registradas para este ingrediente.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedComponents.map((comp) => {
              const isFloor = comp.normalizedPriceExTax === minPrice;
              const isCeiling = comp.normalizedPriceExTax === maxPrice;
              const diffVsBenchmark =
                benchmarkPriceExTax > 0
                  ? ((comp.normalizedPriceExTax - benchmarkPriceExTax) / benchmarkPriceExTax) * 100
                  : 0;

              return (
                <div
                  key={comp.observationId}
                  className={cn(
                    'p-3 rounded-lg border flex items-center justify-between text-sm transition-colors',
                    comp.sourceType === 'retail_ceiling'
                      ? 'bg-slate-50/50 border-slate-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-slate-100/80">
                      {getSourceIcon(comp.sourceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{comp.sourceName}</span>
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                          ({getSourceTypeLabel(comp.sourceType)})
                        </span>
                        {isFloor && (
                          <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Suelo Mayorista
                          </Badge>
                        )}
                        {isCeiling && comp.sourceType === 'retail_ceiling' && (
                          <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                            Techo Minorista
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {comp.rawName} · Obs: {new Date(comp.observedAt).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-semibold text-slate-900 text-base">
                      {comp.normalizedPriceExTax.toFixed(2)} €/{unit}
                      <span className="text-[11px] text-slate-400 ml-1 font-normal">(sin IVA) [OBSERVADO]</span>
                    </div>
                    <div className="text-xs font-mono">
                      <span
                        className={cn(
                          diffVsBenchmark < 0 ? 'text-emerald-600' : 'text-slate-600'
                        )}
                      >
                        {diffVsBenchmark > 0
                          ? `+${diffVsBenchmark.toFixed(1)}%`
                          : `${diffVsBenchmark.toFixed(1)}%`}{' '}
                        vs benchmark observable
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
