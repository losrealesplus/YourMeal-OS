/**
 * YOURMEAL-OS · Product Mapping Queue Drawer (CR-COST-05)
 * Assisted mapping interface for connecting tenant ingredients to canonical market products.
 * Strictly respects ratified matching thresholds (>=90%, 70-89%, 50-69%, <50%).
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  MarketProduct,
  ProductMapping,
  ComparabilityGrade,
  MatchStatus,
} from '../../domain/types';
import { ProductMatcher } from '../../domain/product-matcher';
import { ProductMappingService } from '../../application/product-mapping-service';
import { cn } from '@/lib/utils';

export interface UnmappedIngredientItem {
  id: string;
  name: string;
  unit: string;
  category?: string;
  currentWac?: number;
}

export interface ProductMappingQueueDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  ingredients: UnmappedIngredientItem[];
  marketProducts: MarketProduct[];
  existingMappings: ProductMapping[];
  mappingService: ProductMappingService;
  onMappingUpdated?: () => void;
}

export function ProductMappingQueueDrawer({
  open,
  onOpenChange,
  tenantId,
  ingredients,
  marketProducts,
  existingMappings,
  mappingService,
  onMappingUpdated,
}: ProductMappingQueueDrawerProps) {
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<ComparabilityGrade>('HIGH');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Map of confirmed mappings by tenantIngredientId
  const confirmedMap = useMemo(() => {
    const map = new Map<string, ProductMapping>();
    for (const m of existingMappings) {
      if (m.matchStatus === 'confirmed') {
        map.set(m.tenantIngredientId, m);
      }
    }
    return map;
  }, [existingMappings]);

  // Currently selected ingredient
  const activeIngredient = useMemo(() => {
    if (!selectedIngredientId && ingredients.length > 0) {
      return ingredients[0];
    }
    return ingredients.find((i) => i.id === selectedIngredientId) || null;
  }, [selectedIngredientId, ingredients]);

  // Candidates for the active ingredient ranked by ProductMatcher
  const rankedCandidates = useMemo(() => {
    if (!activeIngredient) return [];

    const candidates = marketProducts.map((p) => {
      const matchResult = ProductMatcher.evaluateMatch(
        {
          tenantIngredientName: activeIngredient.name,
          tenantUnit: (activeIngredient.unit as any) || 'kg',
        },
        p
      );

      return {
        product: p,
        score: matchResult.confidenceScore,
        suggestedGrade: matchResult.suggestedComparability,
        classification: matchResult.classification,
        breakdown: matchResult.breakdown,
      };
    });

    return candidates.sort((a, b) => b.score - a.score);
  }, [activeIngredient, marketProducts]);

  // Filtered list for manual search
  const filteredCandidates = useMemo(() => {
    if (!searchFilter.trim()) return rankedCandidates.slice(0, 10);
    const q = searchFilter.toLowerCase();
    return rankedCandidates
      .filter((c) => c.product.rawName.toLowerCase().includes(q) || c.product.sourceId.includes(q))
      .slice(0, 10);
  }, [rankedCandidates, searchFilter]);

  const handleConfirmMapping = async (
    productId: string,
    confidence: number,
    grade: ComparabilityGrade
  ) => {
    if (!activeIngredient) return;

    setIsSaving(true);
    try {
      await mappingService.confirmMapping(
        tenantId,
        activeIngredient.id,
        productId,
        {
          overrideComparability: grade,
          verifiedBy: 'user-session',
        }
      );

      toast.success(`Mapeo confirmado para "${activeIngredient.name}"`);
      onMappingUpdated?.();
    } catch (err: any) {
      toast.error(`Error guardando mapeo: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreBadge = (score: number) => {
    const pct = Math.round(score * 100);
    if (pct >= 90) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-xs">
          {pct}% Sugerencia Directa
        </Badge>
      );
    }
    if (pct >= 70) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-mono text-xs">
          {pct}% Revisión Asistida
        </Badge>
      );
    }
    if (pct >= 50) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-xs">
          {pct}% Candidato Secundario
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-slate-500 font-mono text-xs">
        {pct}% Coincidencia Baja
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-5 pb-3 border-b bg-slate-50/50">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Cola de Mapeo de Ingredientes de Mercado
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Enlace asistido entre ingredientes del tenant y productos observados de mercado con evaluación de comparabilidad.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x">
          {/* Left Column: Tenant Ingredients List */}
          <div className="col-span-5 flex flex-col h-[520px] bg-slate-50/30">
            <div className="p-3 border-b">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Ingredientes del Tenant ({ingredients.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {ingredients.map((ing) => {
                const isSelected = activeIngredient?.id === ing.id;
                const isMapped = confirmedMap.has(ing.id);

                return (
                  <button
                    key={ing.id}
                    onClick={() => {
                      setSelectedIngredientId(ing.id);
                      setSelectedProductId(null);
                    }}
                    className={cn(
                      'w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between',
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-semibold shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium leading-tight">{ing.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {ing.category || 'Sin categoría'} · Unidad: {ing.unit}
                      </div>
                    </div>
                    <div>
                      {isMapped ? (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5">
                          Mapeado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 text-[10px] px-1.5">
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Candidates & Matcher View */}
          <div className="col-span-7 flex flex-col h-[520px] bg-white">
            {activeIngredient ? (
              <>
                <div className="p-3.5 border-b bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Candidatos para:
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{activeIngredient.name}</h4>
                  </div>
                  <div className="w-48">
                    <Input
                      placeholder="Buscar producto..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {filteredCandidates.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No se encontraron productos de mercado en el catálogo.
                    </div>
                  ) : (
                    filteredCandidates.map(({ product, score, suggestedGrade }) => {
                      const isHighDirect = score >= 0.90;
                      const isAssisted = score >= 0.70 && score < 0.90;

                      return (
                        <div
                          key={product.id}
                          className={cn(
                            'p-3 rounded-lg border text-xs transition-all space-y-2',
                            isHighDirect
                              ? 'bg-emerald-50/30 border-emerald-200'
                              : isAssisted
                              ? 'bg-blue-50/30 border-blue-200'
                              : 'bg-white border-slate-200'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {product.rawName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Fuente: {product.sourceId} · Formato: {product.standardQuantity}{' '}
                                {product.standardUnit}
                                {product.brand ? ` · Marca: ${product.brand}` : ''}
                              </div>
                            </div>
                            <div>{getScoreBadge(score)}</div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">Comparabilidad:</span>
                              <Select
                                defaultValue={suggestedGrade}
                                onValueChange={(v) => setSelectedGrade(v as ComparabilityGrade)}
                              >
                                <SelectTrigger className="h-6 w-32 text-[11px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="HIGH">Alta (Equivalente)</SelectItem>
                                  <SelectItem value="MEDIUM">Media (Sustituto)</SelectItem>
                                  <SelectItem value="LOW">Baja (Referencia)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button
                              size="sm"
                              disabled={isSaving}
                              onClick={() =>
                                handleConfirmMapping(product.id, score, selectedGrade || suggestedGrade)
                              }
                              className={cn(
                                'h-7 text-xs font-semibold text-white',
                                isHighDirect
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'bg-indigo-600 hover:bg-indigo-700'
                              )}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Confirmar Mapeo
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Selecciona un ingrediente para mapear
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-3 border-t bg-slate-50 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
