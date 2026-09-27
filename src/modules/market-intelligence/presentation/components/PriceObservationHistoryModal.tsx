/**
 * YOURMEAL-OS · Price Observation History Modal (CR-COST-05)
 * Append-only time-series timeline of observed market prices and volume tiers.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, ShieldCheck, Tag, Layers } from 'lucide-react';
import { MarketPriceObservation, MarketProduct } from '../../domain/types';

export interface PriceObservationHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: MarketProduct | null;
  observations: MarketPriceObservation[];
}

export function PriceObservationHistoryModal({
  open,
  onOpenChange,
  product,
  observations,
}: PriceObservationHistoryModalProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <History className="w-5 h-5 text-indigo-600" />
            Historial de Observaciones de Precio: {product.rawName}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-mono">
            Fuente: {product.sourceId} · SKU: {product.externalSku || 'N/A'} · Formato: {product.standardQuantity} {product.standardUnit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {observations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay observaciones registradas para este producto.
            </div>
          ) : (
            <div className="divide-y border rounded-lg bg-white overflow-hidden">
              {observations.map((obs) => {
                const obsDate = new Date(obs.observedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div key={obs.id} className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{obsDate}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {obs.captureMethod}
                        </Badge>
                        <Badge
                          className={
                            obs.qualityStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                              : 'bg-slate-100 text-slate-700 text-[10px]'
                          }
                        >
                          {obs.qualityStatus}
                        </Badge>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {obs.normalizedPriceExTax.toFixed(2)} €/{obs.normalizedUnit.replace('EUR_PER_', '').toLowerCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">(sin IVA)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Precio Bruto: {obs.priceRaw.toFixed(2)} € ({obs.taxMode}, IVA: {(obs.taxRate * 100).toFixed(0)}%)</span>
                      <span>Región: {obs.regionCode}</span>
                    </div>

                    {/* Volume Tiers */}
                    {obs.volumeTiers && obs.volumeTiers.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                          <Layers className="w-3 h-3" />
                          <span>Escalados por Volumen</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          {obs.volumeTiers.map((tier) => (
                            <div key={tier.id} className="flex justify-between bg-white px-2 py-1 rounded border">
                              <span>Desde {tier.minQuantity} uds:</span>
                              <span className="font-bold text-indigo-700">{tier.tierNormalizedPriceExTax.toFixed(2)} €</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
