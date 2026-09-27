/**
 * YOURMEAL-OS · Catalog Ingestion & Quarantine Drawer (CR-COST-05)
 * Real CSV/TSV market catalog ingestion with quarantine inspection and deduplication feedback.
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertTriangle, CheckCircle2, FileText, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { MarketSource } from '../../domain/types';
import {
  MarketCatalogIngestionService,
  IngestionReport,
  QuarantinedRow,
} from '../../application/market-catalog-ingestion-service';

export interface CatalogIngestionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: MarketSource[];
  ingestionService: MarketCatalogIngestionService;
  onIngestionSuccess?: () => void;
}

export function CatalogIngestionDrawer({
  open,
  onOpenChange,
  sources,
  ingestionService,
  onIngestionSuccess,
}: CatalogIngestionDrawerProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>('src-makro');
  const [csvContent, setCsvContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<IngestionReport | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content || '');
      setLastResult(null);
    };
    reader.readAsText(file);
  };

  const handleIngest = async () => {
    if (!csvContent.trim()) {
      toast.error('Por favor, introduce o sube el contenido CSV/TSV del catálogo.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await ingestionService.ingestCsv(csvContent, {
        fileName: 'manual-upload.csv',
        importedBy: 'current-user-session',
      });

      setLastResult(result);

      if (result.createdObservationsCount > 0) {
        toast.success(
          `Importación exitosa: ${result.createdObservationsCount} observaciones creadas (${result.quarantinedCount} en cuarentena).`
        );
        onIngestionSuccess?.();
      } else if (result.quarantinedCount > 0) {
        toast.warning(
          `Atención: 0 filas válidas creadas, ${result.quarantinedCount} filas en cuarentena.`
        );
      }
    } catch (err: any) {
      toast.error(`Error de ingesta: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Upload className="w-5 h-5 text-indigo-600" />
            Ingesta de Catálogo de Precios de Mercado (CSV / TSV)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Importación idempotente de precios observados con deduplicación y cuarentena automática.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Source Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Fuente de Mercado</Label>
            <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Selecciona una fuente" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((src) => (
                  <SelectItem key={src.id} value={src.id}>
                    {src.name} ({getSourceTypeLabel(src.sourceType)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload / Paste */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700">
                Archivo o Contenido CSV / TSV
              </Label>
              <label className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium">
                <span>📁 Cargar archivo .csv / .tsv</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            <Textarea
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                setLastResult(null);
              }}
              placeholder={`sku,producto,precio,unidad,iva,formato\nMK-001,Harina Trigo 1kg,1.20,kg,0.04,1kg\nMK-002,Aceite Girasol 5L,7.50,l,0.10,5L`}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400">
              Soporta delimitadores automáticos (, ; \t) y aliases de cabecera en español/inglés.
            </p>
          </div>

          {/* Ingestion Results Feedback */}
          {lastResult && (
            <div className="p-4 rounded-lg border bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Resultado de Ingesta
                </span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                    {lastResult.createdObservationsCount} Creados
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white text-slate-600">
                    {lastResult.validCount} Válidos
                  </Badge>
                  {lastResult.quarantinedCount > 0 && (
                    <Badge className="bg-rose-100 text-rose-800 text-xs">
                      {lastResult.quarantinedCount} Cuarentena
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quarantine Error Inspector */}
              {lastResult.quarantinedRows.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Filas Rechazadas en Cuarentena ({lastResult.quarantinedRows.length})</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto border rounded bg-white p-2 space-y-1.5 text-xs font-mono">
                    {lastResult.quarantinedRows.map((q: QuarantinedRow, idx: number) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-rose-50/50 border border-rose-100 flex items-start justify-between"
                      >
                        <div>
                          <span className="font-bold text-rose-800">Línea {q.lineNumber}: </span>
                          <span className="text-slate-700">{q.rawLine}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-rose-600 ml-2 whitespace-nowrap">
                          {q.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="text-xs"
          >
            Cerrar
          </Button>
          <Button
            onClick={handleIngest}
            disabled={isProcessing || !csvContent.trim()}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Procesando Ingesta...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Ejecutar Ingesta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
