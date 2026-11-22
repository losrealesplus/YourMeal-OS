/**
 * YOURMEAL-OS · Catalog Ingestion & Quarantine Drawer (CR-COST-05)
 * Real CSV/TSV market catalog ingestion with quarantine inspection and deduplication feedback.
 */

import React, { useState, useEffect } from 'react';
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
import { Upload, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { MarketSource } from '../../domain/types';
import {
  MarketCatalogIngestionService,
  IngestionReport,
  QuarantinedRow,
} from '../../application/market-catalog-ingestion-service';
import {
  executeCatalogCsvIngestion,
  executeCatalogDocumentIngestion,
} from '../../application/command-center-actions';

export interface CatalogIngestionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: MarketSource[];
  ingestionService: MarketCatalogIngestionService;
  userId?: string;
  tenantId?: string;
  canPublishPublic?: boolean;
  onIngestionSuccess?: () => void;
}

export function CatalogIngestionDrawer({
  open,
  onOpenChange,
  sources,
  ingestionService,
  userId,
  tenantId,
  canPublishPublic = false,
  onIngestionSuccess,
}: CatalogIngestionDrawerProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(sources[0]?.id || '');
  const [visibilityScope, setVisibilityScope] = useState<'public' | 'private'>(
    canPublishPublic ? 'public' : 'private'
  );
  const [fileName, setFileName] = useState<string>('manual-upload.csv');
  const [filePayload, setFilePayload] = useState<Uint8Array | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('text/csv');
  const [ingestionMode, setIngestionMode] = useState<'csv' | 'document'>('csv');
  const [csvContent, setCsvContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<IngestionReport | null>(null);

  useEffect(() => {
    if (!canPublishPublic && visibilityScope === 'public') {
      setVisibilityScope('private');
    }
  }, [canPublishPublic, visibilityScope]);

  useEffect(() => {
    if (sources.length > 0 && !sources.some((s) => s.id === selectedSourceId)) {
      setSelectedSourceId(sources[0].id);
    }
  }, [sources, selectedSourceId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLastResult(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isDoc =
      ext === 'pdf' ||
      ext === 'png' ||
      ext === 'jpg' ||
      ext === 'jpeg' ||
      ext === 'webp' ||
      file.type === 'application/pdf' ||
      file.type.startsWith('image/');

    if (isDoc) {
      const resolvedMime =
        file.type === 'application/pdf' || ext === 'pdf'
          ? 'application/pdf'
          : file.type === 'image/png' || ext === 'png'
            ? 'image/png'
            : file.type === 'image/webp' || ext === 'webp'
              ? 'image/webp'
              : 'image/jpeg';

      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          const uint8 = new Uint8Array(buffer);
          setFilePayload(uint8);
          setFileMimeType(resolvedMime);
          setIngestionMode('document');
          setCsvContent(
            `[Documento comercial cargado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\n` +
            `Tipo MIME: ${resolvedMime}\n` +
            `Listo para extracción estructurada, normalización de precios e ingesta auditable.`
          );
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFilePayload(null);
        setFileMimeType('text/csv');
        setIngestionMode('csv');
        setCsvContent(content || '');
      };
      reader.readAsText(file);
    }
  };

  const handleIngest = async () => {
    setIsProcessing(true);
    try {
      let result: IngestionReport;

      if (ingestionMode === 'document' && filePayload) {
        result = await executeCatalogDocumentIngestion({
          ingestionService,
          rawPayload: filePayload,
          fileName,
          mimeType: fileMimeType,
          userId,
          selectedSourceId,
          visibilityScope,
          tenantId,
          canPublishPublic,
        });
      } else {
        result = await executeCatalogCsvIngestion({
          ingestionService,
          csvContent,
          fileName,
          userId,
          selectedSourceId,
          visibilityScope,
          tenantId,
          canPublishPublic,
        });
      }

      setLastResult(result);

      if (result.createdObservationsCount > 0 || result.updatedObservationsCount > 0) {
        toast.success(
          `Importación completada: ${result.createdObservationsCount} creadas, ${result.updatedObservationsCount} actualizadas (${result.quarantinedCount} en cuarentena).`
        );
        onIngestionSuccess?.();
      } else if (result.quarantinedCount > 0) {
        toast.warning(
          `Atención: 0 filas válidas procesadas, ${result.quarantinedCount} filas en cuarentena.`
        );
      } else {
        toast.info('Proceso completado sin observaciones creadas o modificadas.');
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
            Ingesta de Catálogo y Documentos de Mercado
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Importación estructurada de catálogos (CSV/TSV) y documentos comerciales (PDF/facturas/fotos) con deduplicación y cuarentena anti-alucinación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Source Selector & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Fuente de Mercado (por defecto)</Label>
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

            {tenantId && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Visibilidad de Precios</Label>
                <Select
                  value={visibilityScope}
                  onValueChange={(v) => setVisibilityScope(v as 'public' | 'private')}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {canPublishPublic && (
                      <SelectItem value="public">Público (Core compartido)</SelectItem>
                    )}
                    <SelectItem value="private">Tarifa privada del tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* File Upload / Paste */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-700">
                  {ingestionMode === 'document'
                    ? 'Documento Comercial (PDF / Imagen)'
                    : 'Archivo o Contenido CSV / TSV'}
                </Label>
                {ingestionMode === 'document' && (
                  <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                    {fileMimeType === 'application/pdf' ? 'Factura / Albarán PDF' : 'Foto Documental'}
                  </Badge>
                )}
              </div>
              <label className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium flex items-center gap-1">
                <span>📁 Cargar archivo (.csv, .tsv, .pdf, imágenes)</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt,.pdf,image/png,image/jpeg,image/webp"
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
                if (ingestionMode === 'document') {
                  setIngestionMode('csv');
                  setFilePayload(null);
                  setFileMimeType('text/csv');
                }
              }}
              placeholder={`sku,producto,precio,unidad,iva,formato\nMK-001,Harina Trigo 1kg,1.20,kg,0.04,1kg\nMK-002,Aceite Girasol 5L,7.50,l,0.10,5L`}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400">
              Formatos admitidos: CSV/TSV delimitados o archivos PDF/PNG/JPEG/WEBP de facturas y albaranes. Cero invención de datos.
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
                  {lastResult.updatedObservationsCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {lastResult.updatedObservationsCount} Actualizados
                    </Badge>
                  )}
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

              {/* Audit Meta: Batch ID & SHA-256 Checksum */}
              {(lastResult.batchId || lastResult.fileChecksumSha256) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono border-t border-slate-200/80 pt-2">
                  {lastResult.batchId && (
                    <span>
                      Lote: <strong className="text-slate-700 font-semibold">{lastResult.batchId.slice(0, 8)}...</strong>
                    </span>
                  )}
                  {lastResult.batchStatus && (
                    <span>
                      Estado: <strong className="text-slate-700 font-semibold">{lastResult.batchStatus}</strong>
                    </span>
                  )}
                  {lastResult.fileChecksumSha256 && (
                    <span>
                      SHA-256:{" "}
                      <strong className="text-slate-700 font-semibold" title={lastResult.fileChecksumSha256}>
                        {lastResult.fileChecksumSha256.slice(0, 16)}...
                      </strong>
                    </span>
                  )}
                </div>
              )}

              {/* Anti-Hallucination Warning when 0 rows are valid */}
              {lastResult.validCount === 0 && lastResult.quarantinedCount > 0 && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Documento enviado a cuarentena sin observaciones válidas</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      El documento no contiene texto estructurado legible o líneas de artículos reconocibles. En YourMeal-OS Core rige principio anti-alucinación estricto: cero invención de datos.
                    </p>
                  </div>
                </div>
              )}

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
            disabled={
              isProcessing ||
              (ingestionMode === 'document' ? !filePayload : !csvContent.trim())
            }
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
