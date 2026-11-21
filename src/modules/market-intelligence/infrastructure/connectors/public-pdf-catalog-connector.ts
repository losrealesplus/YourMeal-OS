/**
 * CR-COST-05 PR5: Public PDF Catalog Connector
 *
 * Downloads and parses public commercial promotional flyers and price catalogs (PDF),
 * such as Canarian public cash & carry flyers (e.g. Cash Diplo, 5 Océanos).
 *
 * STRICT INVARIANTS:
 * 1. Checks RestrictedSourcePolicy to prevent unauthorized access.
 * 2. Reuses DocumentCatalogExtractor & validateExtractedLine (D-010 anti-hallucination rules).
 * 3. Mandates explicit regional codes (Canarian island or regional) and tax mode (never guesses IGIC/IVA).
 * 4. Separates valid observations from ambiguous lines into quarantined items with Spanish diagnostics.
 */

import {
  ConnectorFetchOptions,
  ConnectorFetchResult,
  IMarketSourceConnector,
  MarketConnectorMetadata,
  QuarantinedConnectorItem,
  RawObservationItem,
} from '../../domain/connector-types';
import { validateExtractedLine } from '../../domain/document-extraction';
import { RegionCode, TaxMode } from '../../domain/types';
import { calculateFileSha256, DocumentCatalogExtractor } from '../document-catalog-extractor';
import { BaseHttpConnector, BaseHttpConnectorOptions } from './base-http-connector';
import { RestrictedSourcePolicy } from './restricted-source-policy';

export interface PublicPdfCatalogConnectorConfig extends BaseHttpConnectorOptions {
  metadata: MarketConnectorMetadata;
  extractor?: DocumentCatalogExtractor;
  defaultPdfUrl?: string;
  defaultFileName?: string;
}

export class PublicPdfCatalogConnector extends BaseHttpConnector implements IMarketSourceConnector {
  public readonly metadata: MarketConnectorMetadata;
  private readonly extractor: DocumentCatalogExtractor;
  private readonly defaultPdfUrl?: string;
  private readonly defaultFileName: string;

  constructor(config: PublicPdfCatalogConnectorConfig) {
    super(config);
    this.metadata = config.metadata;
    this.extractor = config.extractor || new DocumentCatalogExtractor();
    this.defaultPdfUrl = config.defaultPdfUrl || config.metadata.targetUrl;
    this.defaultFileName = config.defaultFileName || `${this.metadata.id}.pdf`;

    // Ensure access mode matches
    if (this.metadata.accessMode !== 'public_pdf') {
      throw new Error(`PublicPdfCatalogConnector requiere accessMode = 'public_pdf' (recibido: ${this.metadata.accessMode})`);
    }
  }

  /**
   * Fetches the public PDF from remote URL or receives local buffer (in test options)
   * and extracts structured line items.
   */
  public async fetchCatalog(
    options: ConnectorFetchOptions & { localPdfBuffer?: Uint8Array } = {},
  ): Promise<ConnectorFetchResult> {
    // 1. Verify anti-scraping policy for gated/private sources
    RestrictedSourcePolicy.assertScrapingAllowed(this.metadata.sourceId);

    const targetUrl = options.customUrl || this.defaultPdfUrl;
    let pdfBuffer: Uint8Array;
    let fileChecksum: string;

    try {
      if (options.localPdfBuffer) {
        pdfBuffer = options.localPdfBuffer;
      } else {
        if (!targetUrl) {
          return {
            success: false,
            items: [],
            failureReason: `No se especificó URL de descarga para el conector PDF '${this.metadata.id}'.`,
          };
        }
        const { buffer } = await this.fetchBuffer(targetUrl, options.signal);
        pdfBuffer = buffer;
      }

      fileChecksum = calculateFileSha256(pdfBuffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        sourceUrl: targetUrl,
        items: [],
        failureReason: `Fallo de descarga o red al obtener el catálogo PDF: ${message}`,
      };
    }

    // 2. Extract lines using DocumentCatalogExtractor
    try {
      const extraction = await this.extractor.extract({
        bufferOrText: pdfBuffer,
        fileName: this.defaultFileName,
        mimeType: 'application/pdf',
      });

      const effectiveRegion: RegionCode = options.region || this.metadata.defaultRegion;
      const effectiveTaxMode: TaxMode = this.metadata.defaultTaxMode;
      const documentDate = extraction.header.documentDate || options.observedAt || new Date().toISOString().slice(0, 10);

      const items: RawObservationItem[] = [];
      const quarantinedItems: QuarantinedConnectorItem[] = [];
      const warnings: string[] = [];

      if (extraction.lines.length === 0) {
        return {
          success: false,
          sourceUrl: targetUrl,
          documentHash: fileChecksum,
          items: [],
          failureReason: `El documento PDF fue descargado pero no contiene líneas legibles ni ofertas comerciales válidas.`,
        };
      }

      for (const line of extraction.lines) {
        const validation = validateExtractedLine(line);
        if (!validation.isValid) {
          quarantinedItems.push({
            rawLine: line.rawText,
            reason: validation.reason || 'Línea de catálogo PDF no cumple los criterios de confianza o integridad física D-010.',
            rejectionCode: 'D010_LINE_VALIDATION_FAILED',
            item: {
              productName: line.productName,
              rawPrice: line.rawPrice,
              quantity: line.quantity,
              unit: line.unit,
              confidence: line.confidence,
            },
          });
          continue;
        }

        items.push({
          productName: line.productName,
          rawPrice: line.rawPrice,
          quantity: line.quantity,
          unit: line.unit,
          gtin: line.gtin,
          sku: line.sku,
          currency: extraction.header.currency || 'EUR',
          taxMode: line.taxMode || effectiveTaxMode,
          taxRate: line.taxRate,
          taxRegime: line.taxRegime,
          aiemStatus: line.aiemStatus,
          aiemRate: line.aiemRate,
          aiemAmountRaw: line.aiemAmountRaw,
          freightInclusion: extraction.header.freightInclusion,
          freightCostRaw: extraction.header.freightCostRaw,
          freeFreightMinOrderAmount: extraction.header.freeFreightMinOrderAmount,
          regionCode: effectiveRegion,
          observedAt: documentDate,
          confidence: line.confidence,
          brand: line.brand,
          thermalState: line.thermalState,
          isCatchWeight: line.isCatchWeight,
          taricCode: line.taricCode,
          rawPayload: {
            rawText: line.rawText,
            lineNumber: line.lineNumber,
            sourceConnectorId: this.metadata.id,
            fileChecksum,
          },
        });
      }

      if (quarantinedItems.length > 0) {
        warnings.push(`${quarantinedItems.length} líneas derivadas a cuarentena por ambigüedad o baja confianza.`);
      }

      return {
        success: items.length > 0,
        sourceUrl: targetUrl,
        documentHash: fileChecksum,
        items,
        quarantinedItems,
        warnings,
        failureReason: items.length === 0 ? 'Todas las líneas del catálogo PDF fueron derivadas a cuarentena.' : undefined,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        sourceUrl: targetUrl,
        documentHash: fileChecksum,
        items: [],
        failureReason: `Error durante el análisis y extracción del documento PDF: ${message}`,
      };
    }
  }
}
