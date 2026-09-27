/**
 * YOURMEAL-OS · Indirect Cost Quick Edit In-Situ Modal (CR-COST-05 v3.1)
 * In-situ micro-editor for unconfigured overheads with provenance metadata.
 * Explicit non-retroactivity: Never alters historical WAC, invoices, or past accounting entries.
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sliders, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface IndirectCostQuickEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  dishId: string;
  dishName: string;
  currentOverheads: {
    laborCost: number;
    energyCost: number;
    packagingCost: number;
  };
  onCostUpdated?: () => void;
}

export function IndirectCostQuickEditModal({
  open,
  onOpenChange,
  tenantId,
  dishId,
  dishName,
  currentOverheads,
  onCostUpdated,
}: IndirectCostQuickEditModalProps) {
  const [laborCost, setLaborCost] = useState<string>(
    currentOverheads.laborCost > 0 ? String(currentOverheads.laborCost) : ''
  );
  const [energyCost, setEnergyCost] = useState<string>(
    currentOverheads.energyCost > 0 ? String(currentOverheads.energyCost) : ''
  );
  const [packagingCost, setPackagingCost] = useState<string>(
    currentOverheads.packagingCost > 0 ? String(currentOverheads.packagingCost) : ''
  );
  const [rationale, setRationale] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !dishId) return;

    setIsSaving(true);
    try {
      const numLabor = Math.max(0, Number(laborCost) || 0);
      const numEnergy = Math.max(0, Number(energyCost) || 0);
      const numPackaging = Math.max(0, Number(packagingCost) || 0);

      const { error } = await supabase
        .from('dishes')
        .update({
          labor_cost: numLabor,
          energy_cost: numEnergy,
          packaging_cost: numPackaging,
        })
        .eq('id', dishId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success(
        `Costes indirectos [MANUAL] imputados correctamente para "${dishName}".`
      );
      onCostUpdated?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Error guardando costes: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSave} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-700">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Imputar Costes Indirectos: {dishName}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Asignación in-situ de supuestos operativos [MANUAL] para escandallo y simulación.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Non-Retroactivity Warning Alert */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Aviso de Inmutabilidad Económica</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Estos valores se registrarán como supuestos operativos <strong>[MANUAL]</strong> para cálculos futuros y simulaciones de carta. <strong>No modifican facturas de compra, WAC histórico ni transacciones auditadas reales [REAL].</strong>
            </p>
          </div>

          <div className="space-y-3 py-1 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="labor-cost">Mano de Obra Estimada (€ / ración)</Label>
              <Input
                id="labor-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="ej. 1.20"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="energy-cost">Energía y Cocción (€ / ración)</Label>
              <Input
                id="energy-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="ej. 0.35"
                value={energyCost}
                onChange={(e) => setEnergyCost(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="packaging-cost">Packaging y Envase (€ / ración)</Label>
              <Input
                id="packaging-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="ej. 0.25"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rationale">Motivo / Criterio de Imputación</Label>
              <Input
                id="rationale"
                placeholder="ej. Tarifa fija estimada turno cocina Q4 2026"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSaving ? 'Guardando...' : 'Registrar Costes [MANUAL]'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
