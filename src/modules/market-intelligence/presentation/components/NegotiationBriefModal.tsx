/**
 * YOURMEAL-OS · Supplier Negotiation Brief Modal (CR-COST-05)
 * Interactive, printable negotiation brief cockpit for procurement managers.
 * Strictly analytical; zero automatic mutations to active contracts or WAC.
 */

import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Printer,
  TrendingDown,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { NegotiationBrief } from '../../domain/types';

export interface NegotiationBriefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brief: NegotiationBrief | null;
}

export function NegotiationBriefModal({
  open,
  onOpenChange,
  brief,
}: NegotiationBriefModalProps) {
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!brief) return null;

  const handlePrint = () => {
    window.print();
  };

  const variancePct = brief.varianceAnalysis.marketVariancePct;
  const isOverpaying = variancePct > 0;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-full print:p-0">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Informe Ejecutivo de Negociación: {brief.ingredientName}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Resumen ejecutivo para renegociación de compras con proveedores · {brief.tenantName}
                </DialogDescription>
              </div>
            </div>
            <Badge
              className={
                isOverpaying
                  ? 'bg-rose-100 text-rose-800 text-xs font-mono border-rose-200'
                  : 'bg-emerald-100 text-emerald-800 text-xs font-mono border-emerald-200'
              }
            >
              {isOverpaying ? `+${variancePct.toFixed(1)}% Sobreprecio vs Mercado` : `${variancePct.toFixed(1)}% en Rango de Mercado`}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-sm">
          {/* Executive Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Coste Actual (WAC)</span>
                <Badge variant="outline" className="text-[9px] uppercase font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
                  REAL
                </Badge>
              </div>
              <div className="font-mono text-lg font-bold text-slate-900">
                {brief.effectiveWacExTax.toFixed(2)} €/{brief.unit}
              </div>
              <div className="text-[11px] text-slate-400">
                Proveedor: {brief.targetSupplierName || 'Principal'}
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Benchmark Mercado</span>
                <Badge variant="outline" className="text-[9px] uppercase font-mono bg-blue-50 text-blue-700 border-blue-200">
                  OBSERVADO
                </Badge>
              </div>
              <div className="font-mono text-lg font-bold text-indigo-700">
                {brief.benchmarkPriceExTax.toFixed(2)} €/{brief.unit}
              </div>
              <div className="text-[11px] text-slate-400">
                Comparabilidad: {brief.varianceAnalysis.confidenceSummary}
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-emerald-50/60 border-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-800 uppercase font-semibold">Ahorro Anual Estimado</span>
                <Badge variant="outline" className="text-[9px] uppercase font-mono bg-purple-50 text-purple-700 border-purple-200">
                  SIMULADO
                </Badge>
              </div>
              <div className="font-mono text-lg font-bold text-emerald-700">
                {brief.potentialAnnualSavingsEur > 0
                  ? `${brief.potentialAnnualSavingsEur.toFixed(2)} €`
                  : '0,00 €'}
              </div>
              <div className="text-[11px] text-emerald-600">
                Consumo: {brief.consumptionVolume} {brief.unit}/año
              </div>
            </div>
          </div>

          {/* Strategic Talking Points */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Argumentos Clave para la Negociación
            </h4>
            <div className="divide-y border rounded-lg bg-white overflow-hidden">
              {brief.talkingPoints.map((tp, idx) => (
                <div key={idx} className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">{tp.topic}</span>
                    {tp.impactEur && (
                      <Badge variant="secondary" className="font-mono text-[10px] bg-emerald-50 text-emerald-700">
                        Impacto estimado: {tp.impactEur.toFixed(2)} €
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-700">{tp.point}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Evidencia: {tp.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Component Evidence */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Precios Observados en Mercado
            </h4>
            <div className="border rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b text-slate-500">
                  <tr>
                    <th className="p-2.5">Fuente</th>
                    <th className="p-2.5">Tipo de Canal</th>
                    <th className="p-2.5">Producto Observado</th>
                    <th className="p-2.5 text-right">Precio Sin IVA [OBSERVADO]</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {brief.observableComponents.map((comp) => (
                    <tr key={comp.observationId} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-sans font-semibold">{comp.sourceName}</td>
                      <td className="p-2.5 text-slate-500 uppercase text-[10px]">{getSourceTypeLabel(comp.sourceType)}</td>
                      <td className="p-2.5">{comp.rawName}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {comp.normalizedPriceExTax.toFixed(2)} €/{comp.normalizedUnit.replace('EUR_PER_', '').toLowerCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Target Price Strategy (Human Decision Form) */}
          <div className="p-3.5 rounded-lg border bg-slate-50/80 space-y-2 print:hidden">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <span>Estrategia y Precio Objetivo (Decisión de Gestión Humana)</span>
              <Badge variant="outline" className="text-[9px] uppercase font-mono bg-purple-50 text-purple-700 border-purple-200">
                SIMULADO
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-slate-600">Precio Objetivo Deseado (€/{brief.unit})</Label>
                <Input
                  type="number"
                  placeholder={brief.targetRenegotiationPriceExTax.toFixed(2)}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-600">Notas / Contrapartidas Estratégicas</Label>
                <Input
                  placeholder="Ej: Aumentar volumen trimestral a cambio de dto."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              * Nota: Los datos ingresados en este informe son de apoyo estratégico para la negociación; no alteran automáticamente contratos vigentes ni escandallos.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t flex items-center justify-between print:hidden">
          <Button variant="outline" onClick={handlePrint} className="text-xs">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Imprimir Informe
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
