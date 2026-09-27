/**
 * YOURMEAL-OS · Strategic Opportunity Cards & Actionability Engine (CR-COST-05 v3.1)
 * Highlights top overpaying items with explicit Actionability Grades and 1-click execution.
 * Zero fabricated numbers: Annual savings displayed only when verified annual volume exists.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingDown,
  Sparkles,
  ArrowRight,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { BenchmarkCalculation } from '../../domain/types';
import { cn } from '@/lib/utils';

export type ActionabilityGrade = 'DIRECT_ACTION' | 'REVIEW_DATA' | 'INFORMATIONAL' | 'INSUFFICIENT';

export interface OpportunityItem {
  ingredientId: string;
  ingredientName: string;
  category?: string;
  unit: string;
  effectiveWacExTax: number;
  benchmarkPriceExTax: number;
  variancePct: number;
  annualVolume?: number;
  potentialAnnualSavingsEur: number | null;
  actionabilityGrade: ActionabilityGrade;
  calculation: BenchmarkCalculation;
}

export interface StrategicOpportunityCardsProps {
  opportunities: OpportunityItem[];
  onInjectSimulation: (ingredientId: string, simulatedPrice: number, deltaPct: number) => void;
  onOpenBrief: (item: OpportunityItem) => void;
  onOpenSpread: (calc: BenchmarkCalculation) => void;
  onOpenInquiry: () => void;
  className?: string;
}

export function StrategicOpportunityCards({
  opportunities,
  onInjectSimulation,
  onOpenBrief,
  onOpenSpread,
  onOpenInquiry,
  className,
}: StrategicOpportunityCardsProps) {
  const topOpportunities = useMemo(() => {
    return opportunities
      .filter((o) => o.variancePct > 2 && o.actionabilityGrade !== 'INSUFFICIENT')
      .sort((a, b) => (b.potentialAnnualSavingsEur || 0) - (a.potentialAnnualSavingsEur || 0))
      .slice(0, 3);
  }, [opportunities]);

  const getActionabilityBadge = (grade: ActionabilityGrade) => {
    switch (grade) {
      case 'DIRECT_ACTION':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-[10px]">
            🟢 Acción Directa
          </Badge>
        );
      case 'REVIEW_DATA':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-[10px]">
            🟡 Revisar Datos
          </Badge>
        );
      case 'INFORMATIONAL':
        return (
          <Badge variant="outline" className="text-slate-600 font-mono text-[10px]">
            ⚪ Información
          </Badge>
        );
      case 'INSUFFICIENT':
      default:
        return (
          <Badge variant="outline" className="text-slate-400 font-mono text-[10px]">
            🔴 Datos Insuficientes
          </Badge>
        );
    }
  };

  if (topOpportunities.length === 0) {
    return null;
  }

  return (
    <Card className={cn('border-indigo-100 bg-linear-to-br from-indigo-50/40 via-white to-slate-50 shadow-xs', className)}>
      <CardHeader className="pb-3 border-b border-indigo-100/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-600 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Oportunidades Estratégicas de Renegociación & Ahorro
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ingredientes con sobreprecio significativo respecto a benchmarks observables mayoristas.
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenInquiry}
            className="text-xs font-semibold bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Preguntar al Mercado (Nuevo Plato)
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3 space-y-2.5">
        {topOpportunities.map((op) => {
          const deltaPct = ((op.benchmarkPriceExTax - op.effectiveWacExTax) / op.effectiveWacExTax) * 100;
          const wholesaleFloor = Math.min(...op.calculation.components.map((c) => c.normalizedPriceExTax));

          return (
            <div
              key={op.ingredientId}
              className="p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 transition-all shadow-2xs space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{op.ingredientName}</span>
                    {getActionabilityBadge(op.actionabilityGrade)}
                    <Badge variant="outline" className="font-mono text-[10px] text-rose-700 bg-rose-50 border-rose-200">
                      +{op.variancePct.toFixed(1)}% Sobreprecio
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    WAC Actual [REAL]: <span className="font-semibold text-slate-800">{op.effectiveWacExTax.toFixed(2)} €/{op.unit}</span>
                    {' ──► '}
                    Benchmark [OBSERVADO]: <span className="font-semibold text-indigo-700">{op.benchmarkPriceExTax.toFixed(2)} €/{op.unit}</span>
                    {wholesaleFloor < op.benchmarkPriceExTax && (
                      <span className="text-[11px] text-emerald-600 ml-1">
                        (Suelo: {wholesaleFloor.toFixed(2)} €/{op.unit})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Ahorro Anual Estimado [SIMULADO]
                  </span>
                  <div className="font-mono text-sm font-bold text-emerald-700">
                    {op.potentialAnnualSavingsEur !== null && op.potentialAnnualSavingsEur > 0 ? (
                      `${op.potentialAnnualSavingsEur.toFixed(2)} €`
                    ) : (
                      <span className="text-xs text-slate-400 font-normal italic">
                        — (Requiere volumen anual)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1-Click Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="text-[11px] text-slate-400 font-mono">
                  Fuentes observables: {op.calculation.components.length} (Makro, Cash & Carry, Retail)
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenSpread(op.calculation)}
                    className="h-7 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Ver Dispersión
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenBrief(op)}
                    className="h-7 text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    Informe Negociación
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => onInjectSimulation(op.ingredientId, op.benchmarkPriceExTax, deltaPct)}
                    className="h-7 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1" />
                    Simular en Carta E9
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
