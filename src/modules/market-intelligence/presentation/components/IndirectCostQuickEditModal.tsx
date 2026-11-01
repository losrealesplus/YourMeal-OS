/**
 * YOURMEAL-OS · Indirect Cost Quick Edit In-Situ Modal (CR-COST-05 v3.1)
 * In-situ micro-editor for unconfigured overheads with provenance metadata.
 * Explicit non-retroactivity: Never alters historical WAC, invoices, or past accounting entries.
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sliders, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";

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
  manualCost?: number | null;
  salesPrice?: number | null;
  hasRecipe?: boolean;
  missingReasons?: string[];
  canEdit?: boolean;
  onCostUpdated?: () => void;
}

export function IndirectCostQuickEditModal({
  open,
  onOpenChange,
  tenantId,
  dishId,
  dishName,
  currentOverheads,
  manualCost,
  salesPrice,
  hasRecipe = true,
  missingReasons = [],
  canEdit = true,
  onCostUpdated,
}: IndirectCostQuickEditModalProps) {
  const [laborCost, setLaborCost] = useState<string>(
    currentOverheads.laborCost > 0 ? String(currentOverheads.laborCost) : "",
  );
  const [energyCost, setEnergyCost] = useState<string>(
    currentOverheads.energyCost > 0 ? String(currentOverheads.energyCost) : "",
  );
  const [packagingCost, setPackagingCost] = useState<string>(
    currentOverheads.packagingCost > 0 ? String(currentOverheads.packagingCost) : "",
  );
  const [dishCost, setDishCost] = useState<string>(
    manualCost != null && manualCost >= 0 ? String(manualCost) : "",
  );
  const [price, setPrice] = useState<string>(
    salesPrice != null && salesPrice >= 0 ? String(salesPrice) : "",
  );
  const [rationale, setRationale] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !dishId || !canEdit) return;

    setIsSaving(true);
    try {
      const numLabor = Math.max(0, Number(laborCost) || 0);
      const numEnergy = Math.max(0, Number(energyCost) || 0);
      const numPackaging = Math.max(0, Number(packagingCost) || 0);

      const updatePayload: TablesUpdate<"dishes"> = {
        labor_cost: numLabor,
        energy_cost: numEnergy,
        packaging_cost: numPackaging,
      };

      if (!hasRecipe && dishCost.trim() !== "") {
        updatePayload.cost = Math.max(0, Number(dishCost));
      }

      if (price.trim() !== "") {
        updatePayload.price = Math.max(0, Number(price));
      }

      const { error } = await supabase
        .from("dishes")
        .update(updatePayload)
        .eq("id", dishId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success(`Ficha técnica de "${dishName}" actualizada en catálogo correctamente.`);
      onCostUpdated?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error guardando datos: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isCompleteMode = missingReasons.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSave} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-700">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {!canEdit
                    ? `Consultar Datos de Coste: ${dishName}`
                    : isCompleteMode
                      ? `Completar Datos de Ficha: ${dishName}`
                      : `Imputar Costes de Ficha: ${dishName}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {canEdit
                    ? "Actualización directa de datos y supuestos operativos en catálogo para escandallo y simulación."
                    : "Modo de solo consulta: Permisos insuficientes para editar la ficha de platos."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Missing data alert */}
          {missingReasons.length > 0 && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Información Pendiente para este Plato:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                {missingReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {!canEdit && (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1">
              <p className="text-[11px]">
                No tienes asignada la capacidad <code>dishes.update</code>. Puedes consultar los
                datos pero no modificarlos.
              </p>
            </div>
          )}

          {/* Non-Retroactivity Warning Alert */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Aviso de Procedencia y Alcance</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Estos valores se guardan en el catálogo de platos (Ficha Técnica).{" "}
              <strong>
                No modifican facturas de compra pasadas, albaranes ni liquidaciones históricas de
                Kárdex.
              </strong>
            </p>
          </div>

          <div className="space-y-3 py-1 text-xs">
            {/* Sales Price */}
            <div className="space-y-1.5">
              <Label htmlFor="dish-price">Precio de Venta PVP (€ / ración)</Label>
              <Input
                id="dish-price"
                type="number"
                step="0.01"
                min="0"
                disabled={!canEdit}
                placeholder="ej. 8.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* If no recipe, allow manual raw material cost */}
            {!hasRecipe && (
              <div className="space-y-1.5 p-2.5 rounded-md border border-blue-200 bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dish-cost" className="text-blue-950 font-semibold">
                    Coste Base Materia Prima (€ / ración) [MANUAL]
                  </Label>
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-white text-blue-700 border-blue-200"
                  >
                    SIN RECETA
                  </Badge>
                </div>
                <Input
                  id="dish-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!canEdit}
                  placeholder="ej. 2.50"
                  value={dishCost}
                  onChange={(e) => setDishCost(e.target.value)}
                  className="h-8 text-xs font-mono bg-white"
                />
                <p className="text-[10px] text-blue-800 leading-tight">
                  Este plato no tiene ingredientes en <i>Dish Library</i>. Puedes fijar un coste
                  manual estimado aquí o{" "}
                  <a href="/admin/dishes" className="underline font-semibold hover:text-blue-900">
                    configurar escandallo detallado en Dish Library →
                  </a>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="packaging-cost">Packaging y Envase (€ / ración)</Label>
                <Input
                  id="packaging-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!canEdit}
                  placeholder="ej. 0.35"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="labor-cost">Mano de Obra (€ / ración)</Label>
                <Input
                  id="labor-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!canEdit}
                  placeholder="ej. 1.20"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="energy-cost">Energía y Cocción (€ / ración)</Label>
              <Input
                id="energy-cost"
                type="number"
                step="0.01"
                min="0"
                disabled={!canEdit}
                placeholder="ej. 0.25"
                value={energyCost}
                onChange={(e) => setEnergyCost(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rationale">Motivo / Criterio de Imputación (Opcional)</Label>
              <Input
                id="rationale"
                placeholder="ej. Revisión de ficha técnica según compras Q4 2026"
                disabled={!canEdit}
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
              {canEdit ? "Cancelar" : "Cerrar"}
            </Button>
            {canEdit && (
              <Button
                type="submit"
                disabled={isSaving}
                className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSaving ? "Guardando..." : "Guardar en Catálogo"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
