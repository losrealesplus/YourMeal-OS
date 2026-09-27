/**
 * YOURMEAL-OS · Market Benchmark Reference Badge (CR-COST-05)
 * Contextual badge displaying market benchmark variance, comparability, and mapping state.
 * 100% Spanish native nomenclature and explicit provenance.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, Minus, HelpCircle } from 'lucide-react';
import { ComparabilityGrade } from '../../domain/types';

export interface MarketBenchmarkBadgeProps {
  benchmarkPriceExTax?: number | null;
  effectiveWacExTax?: number | null;
  unit?: string;
  comparabilityGrade?: ComparabilityGrade;
  isMapped?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MarketBenchmarkBadge({
  benchmarkPriceExTax,
  effectiveWacExTax,
  unit = 'kg',
  comparabilityGrade,
  isMapped = true,
  className,
  onClick,
}: MarketBenchmarkBadgeProps) {
  if (!isMapped || benchmarkPriceExTax === null || benchmarkPriceExTax === undefined) {
    return (
      <Badge
        variant="outline"
        onClick={onClick}
        className={cn(
          'text-xs font-mono font-medium text-slate-500 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 transition-colors',
          onClick && 'cursor-pointer',
          className
        )}
      >
        <HelpCircle className="w-3 h-3 mr-1 text-slate-400" />
        Sin Mapeo
      </Badge>
    );
  }

  if (effectiveWacExTax === null || effectiveWacExTax === undefined || effectiveWacExTax <= 0) {
    return (
      <Badge
        variant="outline"
        onClick={onClick}
        className={cn(
          'text-xs font-mono text-slate-700 bg-slate-50 border-slate-200',
          onClick && 'cursor-pointer',
          className
        )}
      >
        Ref. Mercado: {benchmarkPriceExTax.toFixed(2)} €/{unit}
      </Badge>
    );
  }

  const variancePct = ((effectiveWacExTax - benchmarkPriceExTax) / benchmarkPriceExTax) * 100;
  const isFavorable = variancePct < -2.0; // Buying below market by >2%
  const isAtPar = Math.abs(variancePct) <= 2.0;
  const isUnfavorable = variancePct > 2.0; // Buying above market by >2%

  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Minus;

  if (isFavorable) {
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = TrendingDown;
  } else if (isUnfavorable) {
    badgeColor = variancePct > 10
      ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
      : 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = TrendingUp;
  }

  return (
    <Badge
      variant="outline"
      onClick={onClick}
      title={`Benchmark Observable: ${benchmarkPriceExTax.toFixed(2)} €/${unit} · Comparabilidad: ${comparabilityGrade || 'Estándar'}`}
      className={cn(
        'text-xs font-mono font-medium inline-flex items-center gap-1',
        badgeColor,
        onClick && 'cursor-pointer hover:opacity-90',
        className
      )}
    >
      <Icon className="w-3 h-3" />
      <span>
        {variancePct > 0 ? `+${variancePct.toFixed(1)}%` : `${variancePct.toFixed(1)}%`}
      </span>
      <span className="text-[10px] opacity-75 font-sans">vs Mercado</span>
    </Badge>
  );
}
