/**
 * YOURMEAL-OS · Market Inquiry Explorer Modal ("Preguntar al Mercado") (CR-COST-05 v3.1)
 * Interactive market price inquiry for evaluating preliminary economic viability of proposed dishes.
 * Strictly scoped: Pre-checks observable ingredient prices without implementing heavy CR-COST-07 BOM engine.
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calculator,
} from 'lucide-react';
import { MarketProduct } from '../../domain/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface InquiryIngredientRow {
  id: string;
  name: string;
  amount: number;
  unit: string;
  marketPriceExTax: number | null;
  sourceName?: string;
  isObservable: boolean;
  manualPrice?: number;
}

export interface MarketInquiryExplorerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketProducts: MarketProduct[];
  onSaveInquiry?: (data: any) => void;
}

export function MarketInquiryExplorerModal({
  open,
  onOpenChange,
  marketProducts,
  onSaveInquiry,
}: MarketInquiryExplorerModalProps) {
  const [dishName, setDishName] = useState<string>('Tarta de Zanahoria Casera');
  const [targetSalesPrice, setTargetSalesPrice] = useState<string>('4.00');
  const [monthlyVolume, setMonthlyVolume] = useState<string>('300');

  // Baseline demo ingredients for the inquiry
  const [inquiryLines, setInquiryLines] = useState<InquiryIngredientRow[]>([
    {
      id: 'inq-1',
      name: 'Zanahoria fresca',
      amount: 0.15,
      unit: 'kg',
      marketPriceExTax: 1.15,
      sourceName: 'Makro España',
      isObservable: true,
    },
    {
      id: 'inq-2',
      name: 'Harina de trigo especial repostería',
      amount: 0.08,
      unit: 'kg',
      marketPriceExTax: 0.95,
      sourceName: 'Makro España',
      isObservable: true,
    },
    {
      id: 'inq-3',
      name: 'Huevo fresco clase L',
      amount: 1,
      unit: 'ud',
      marketPriceExTax: 0.22,
      sourceName: 'Mercadona',
      isObservable: true,
    },
    {
      id: 'inq-4',
      name: 'Queso crema para cobertura',
      amount: 0.06,
      unit: 'kg',
      marketPriceExTax: null, // Unobserved reference
      sourceName: undefined,
      isObservable: false,
      manualPrice: 5.40,
    },
    {
      id: 'inq-5',
      name: 'Azúcar blanco y canela',
      amount: 0.05,
      unit: 'kg',
      marketPriceExTax: 1.20,
      sourceName: 'GM Cash',
      isObservable: true,
    },
  ]);

  const [newIngredientQuery, setNewIngredientQuery] = useState<string>('');

  // Calculations
  const calculations = useMemo(() => {
    const pvp = Math.max(0, Number(targetSalesPrice) || 0);
    const volume = Math.max(0, Number(monthlyVolume) || 0);

    let totalRawCost = 0;
    let observableCount = 0;
    let missingCount = 0;

    inquiryLines.forEach((l) => {
      const unitCost = l.isObservable ? (l.marketPriceExTax || 0) : (l.manualPrice || 0);
      totalRawCost += l.amount * unitCost;
      if (l.isObservable) observableCount++;
      else missingCount++;
    });

    const marginEur = Math.max(0, pvp - totalRawCost);
    const marginPct = pvp > 0 ? (marginEur / pvp) * 100 : 0;
    const monthlyProfit = marginEur * volume;

    let viabilityVerdict: 'VIABLE' | 'TIGHT_MARGIN' | 'INSUFFICIENT' = 'VIABLE';
    if (marginPct < 40) viabilityVerdict = 'INSUFFICIENT';
    else if (marginPct < 60) viabilityVerdict = 'TIGHT_MARGIN';

    return {
      pvp,
      volume,
      totalRawCost,
      marginEur,
      marginPct,
      monthlyProfit,
      observableCount,
      missingCount,
      viabilityVerdict,
    };
  }, [targetSalesPrice, monthlyVolume, inquiryLines]);

  const handleAddCustomLine = () => {
    if (!newIngredientQuery.trim()) return;
    const newLine: InquiryIngredientRow = {
      id: `inq-custom-${Date.now()}`,
      name: newIngredientQuery.trim(),
      amount: 0.1,
      unit: 'kg',
      marketPriceExTax: null,
      isObservable: false,
      manualPrice: 2.50,
    };
    setInquiryLines((prev) => [...prev, newLine]);
    setNewIngredientQuery('');
  };

  const handleRemoveLine = (id: string) => {
    setInquiryLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLine = (id: string, patch: Partial<InquiryIngredientRow>) => {
    setInquiryLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const handleSave = () => {
    toast.success(`Estudio preliminar de "${dishName}" registrado.`);
    onSaveInquiry?.({
      dishName,
      pvp: calculations.pvp,
      totalRawCost: calculations.totalRawCost,
      marginPct: calculations.marginPct,
      lines: inquiryLines,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Preguntar al Mercado · Cotización de Nuevo Producto
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Evaluación preliminar de viabilidad económica con precios de mercado observables.
                </DialogDescription>
              </div>
            </div>
            <Badge
              className={cn(
                'text-xs font-mono',
                calculations.viabilityVerdict === 'VIABLE'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : calculations.viabilityVerdict === 'TIGHT_MARGIN'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              )}
            >
              {calculations.viabilityVerdict === 'VIABLE'
                ? '🟢 Viabilidad Preliminar Positiva'
                : calculations.viabilityVerdict === 'TIGHT_MARGIN'
                ? '🟡 Margen Ajustado (<60%)'
                : '🔴 Margen Insuficiente (<40%)'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Target Hypothesis Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-700">Nombre del Plato Propuesto</Label>
              <Input
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="h-8 text-xs font-medium"
                placeholder="ej. Tarta de Zanahoria Casera"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-700">PVP Objetivo (€ / ración)</Label>
              <Input
                type="number"
                step="0.10"
                min="0"
                value={targetSalesPrice}
                onChange={(e) => setTargetSalesPrice(e.target.value)}
                className="h-8 text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-700">Volumen Estimado (raciones/mes)</Label>
              <Input
                type="number"
                step="10"
                min="0"
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Quick Viability KPI Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg border bg-white space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Coste Materia Prima Estimado</span>
              <div className="font-mono text-base font-bold text-slate-900">
                {calculations.totalRawCost.toFixed(2)} € <span className="text-xs font-normal text-slate-500">/ ración</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {calculations.observableCount} fuentes observables · {calculations.missingCount} manuales
              </div>
            </div>

            <div className="p-2.5 rounded-lg border bg-white space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Margen Bruto Proyectado [SIMULADO]</span>
              <div
                className={cn(
                  'font-mono text-base font-bold',
                  calculations.marginPct >= 60 ? 'text-emerald-700' : 'text-amber-700'
                )}
              >
                {calculations.marginPct.toFixed(1)}% <span className="text-xs font-normal text-slate-500">({calculations.marginEur.toFixed(2)} €/u)</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Objetivo estándar: ≥60%
              </div>
            </div>

            <div className="p-2.5 rounded-lg border bg-emerald-50/60 border-emerald-200 space-y-0.5">
              <span className="text-[10px] text-emerald-800 uppercase font-bold">Beneficio Mensual Estimado</span>
              <div className="font-mono text-base font-bold text-emerald-700">
                +{calculations.monthlyProfit.toFixed(2)} €/mes
              </div>
              <div className="text-[10px] text-emerald-600">
                A {calculations.volume} raciones/mes
              </div>
            </div>
          </div>

          {/* Inquiry Ingredients BOM Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Composición de Ingredientes Cotizados en Mercado
              </span>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b text-slate-500 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Ingrediente</th>
                    <th className="p-2.5 w-24">Cantidad</th>
                    <th className="p-2.5">Estado en Mercado</th>
                    <th className="p-2.5 text-right">Precio Unitario</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {inquiryLines.map((line) => {
                    const unitPrice = line.isObservable ? (line.marketPriceExTax || 0) : (line.manualPrice || 0);
                    const subtotal = line.amount * unitPrice;

                    return (
                      <tr key={line.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-sans font-medium text-slate-900">
                          {line.name}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.001"
                              value={line.amount}
                              onChange={(e) =>
                                handleUpdateLine(line.id, { amount: Number(e.target.value) || 0 })
                              }
                              className="h-6 w-16 text-xs font-mono p-1"
                            />
                            <span className="text-[11px] text-slate-400">{line.unit}</span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          {line.isObservable ? (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>{line.sourceName || 'Mercado'}</span>
                              <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">
                                OBSERVADO
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-amber-700">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Sin referencia en catálogo</span>
                              <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                                MANUAL
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          {line.isObservable ? (
                            <span>{unitPrice.toFixed(2)} €/{line.unit}</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.manualPrice}
                                onChange={(e) =>
                                  handleUpdateLine(line.id, { manualPrice: Number(e.target.value) || 0 })
                                }
                                className="h-6 w-16 text-xs font-mono p-1 text-right"
                              />
                              <span className="text-[10px] text-slate-400">€/{line.unit}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {subtotal.toFixed(3)} €
                        </td>
                        <td className="p-2.5 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveLine(line.id)}
                            className="h-6 w-6 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick add custom line */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Añadir otro ingrediente a cotizar..."
                value={newIngredientQuery}
                onChange={(e) => setNewIngredientQuery(e.target.value)}
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomLine()}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddCustomLine}
                disabled={!newIngredientQuery.trim()}
                className="h-7 text-xs gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t flex items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs">
            Cerrar
          </Button>
          <Button
            onClick={handleSave}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Guardar Estudio en Histórico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
