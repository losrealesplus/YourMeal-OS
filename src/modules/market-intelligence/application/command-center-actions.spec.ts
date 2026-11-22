import { describe, it, expect, vi } from "vitest";
import {
  executeCatalogCsvIngestion,
  executeCatalogDocumentIngestion,
} from "./command-center-actions";
import type {
  IngestionReport,
  MarketCatalogIngestionService,
} from "./market-catalog-ingestion-service";
import type { DocumentCatalogExtractor } from "../infrastructure/document-catalog-extractor";

describe("command-center-actions · Document & CSV Ingestion (CR-COST-05)", () => {
  const validUserId = "11111111-1111-4111-8111-111111111111";
  const validTenantId = "22222222-2222-4222-8222-222222222222";

  describe("executeCatalogDocumentIngestion", () => {
    it("throws when rawPayload is empty", async () => {
      const mockService = {} as MarketCatalogIngestionService;

      await expect(
        executeCatalogDocumentIngestion({
          ingestionService: mockService,
          rawPayload: new Uint8Array([]),
          fileName: "factura.pdf",
          mimeType: "application/pdf",
          userId: validUserId,
          visibilityScope: "private",
          tenantId: validTenantId,
        }),
      ).rejects.toThrow("Por favor, selecciona un archivo PDF o imagen válido con contenido.");
    });

    it("throws when userId is not a valid UUID", async () => {
      const mockService = {} as MarketCatalogIngestionService;

      await expect(
        executeCatalogDocumentIngestion({
          ingestionService: mockService,
          rawPayload: new Uint8Array([1, 2, 3]),
          fileName: "factura.pdf",
          mimeType: "application/pdf",
          userId: "not-a-uuid",
          visibilityScope: "private",
          tenantId: validTenantId,
        }),
      ).rejects.toThrow("Se requiere una sesión autenticada válida (UUID) para auditar la ingesta.");
    });

    it("throws when non-admin user attempts to publish to public scope", async () => {
      const mockService = {} as MarketCatalogIngestionService;

      await expect(
        executeCatalogDocumentIngestion({
          ingestionService: mockService,
          rawPayload: new Uint8Array([1, 2, 3]),
          fileName: "factura.pdf",
          mimeType: "application/pdf",
          userId: validUserId,
          visibilityScope: "public",
          tenantId: validTenantId,
          canPublishPublic: false,
        }),
      ).rejects.toThrow(
        "Solo administradores de plataforma pueden publicar observaciones públicas globales; selecciona tarifa privada del tenant.",
      );
    });

    it("throws when file extension is not an accepted format", async () => {
      const mockService = {} as MarketCatalogIngestionService;

      await expect(
        executeCatalogDocumentIngestion({
          ingestionService: mockService,
          rawPayload: new Uint8Array([1, 2, 3]),
          fileName: "documento.exe",
          mimeType: "application/octet-stream",
          userId: validUserId,
          visibilityScope: "private",
          tenantId: validTenantId,
        }),
      ).rejects.toThrow(
        "Tipo de archivo no soportado (application/octet-stream). Formatos admitidos: PDF, PNG, JPEG, WEBP.",
      );
    });

    it("successfully delegates PDF extraction and ingestion with tenant isolation", async () => {
      const mockReport: IngestionReport = {
        batchId: "batch-123",
        batchStatus: "completed",
        fileChecksumSha256: "sha256-abc",
        totalRows: 2,
        validCount: 2,
        quarantinedCount: 0,
        createdObservationsCount: 2,
        updatedObservationsCount: 0,
        quarantinedRows: [],
      };

      const mockIngestDocument = vi.fn().mockResolvedValue(mockReport);
      const mockService = {
        ingestDocument: mockIngestDocument,
      } as unknown as MarketCatalogIngestionService;

      const mockExtractor = {
        extract: vi.fn().mockResolvedValue({
          header: { sourceNameOrId: "src-makro" },
          lines: [{ productName: "Harina", rawPrice: 1.2, quantity: 1, unit: "kg" }],
          rawText: "RAW_PDF_TEXT",
          fileChecksumSha256: "sha256-abc",
          fileName: "factura_proveedor.pdf",
          mimeType: "application/pdf" as const,
        }),
      } as unknown as DocumentCatalogExtractor;

      const payload = new Uint8Array([37, 80, 68, 70]); // %PDF
      const result = await executeCatalogDocumentIngestion({
        ingestionService: mockService,
        documentExtractor: mockExtractor,
        rawPayload: payload,
        fileName: "factura_proveedor.pdf",
        mimeType: "application/pdf",
        userId: validUserId,
        selectedSourceId: "src-makro",
        visibilityScope: "private",
        tenantId: validTenantId,
      });

      expect(result).toEqual(mockReport);
      expect(mockExtractor.extract).toHaveBeenCalledWith({
        bufferOrText: payload,
        fileName: "factura_proveedor.pdf",
        mimeType: "application/pdf",
      });
      expect(mockIngestDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: "factura_proveedor.pdf",
          fileChecksumSha256: "sha256-abc",
        }),
        expect.objectContaining({
          fileName: "factura_proveedor.pdf",
          fileMimeType: "application/pdf",
          fileChecksumSha256: "sha256-abc",
          importedBy: validUserId,
          defaultSourceId: "src-makro",
          ownerTenantId: validTenantId,
        }),
      );
    });

    it("resolves image mime type from file extension if generic image mime is provided", async () => {
      const mockReport: IngestionReport = {
        batchId: "batch-img",
        batchStatus: "completed",
        totalRows: 1,
        validCount: 1,
        quarantinedCount: 0,
        createdObservationsCount: 1,
        updatedObservationsCount: 0,
        quarantinedRows: [],
      };

      const mockIngestDocument = vi.fn().mockResolvedValue(mockReport);
      const mockService = {
        ingestDocument: mockIngestDocument,
      } as unknown as MarketCatalogIngestionService;

      const mockExtractor = {
        extract: vi.fn().mockResolvedValue({
          header: {},
          lines: [],
          rawText: "",
          fileChecksumSha256: "sha256-img",
          fileName: "foto_albaran.jpg",
          mimeType: "image/jpeg" as const,
        }),
      } as unknown as DocumentCatalogExtractor;

      const payload = new Uint8Array([255, 216, 255]); // JPEG magic bytes
      await executeCatalogDocumentIngestion({
        ingestionService: mockService,
        documentExtractor: mockExtractor,
        rawPayload: payload,
        fileName: "foto_albaran.jpg",
        mimeType: "",
        userId: validUserId,
        visibilityScope: "public",
        canPublishPublic: true,
      });

      expect(mockExtractor.extract).toHaveBeenCalledWith({
        bufferOrText: payload,
        fileName: "foto_albaran.jpg",
        mimeType: "image/jpeg",
      });
      expect(mockIngestDocument).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ownerTenantId: null, // Public scope correctly sets null
        }),
      );
    });
  });

  describe("executeCatalogCsvIngestion", () => {
    it("throws when csvContent is empty", async () => {
      const mockService = {} as MarketCatalogIngestionService;

      await expect(
        executeCatalogCsvIngestion({
          ingestionService: mockService,
          csvContent: "   ",
          fileName: "catalogo.csv",
          userId: validUserId,
          visibilityScope: "private",
          tenantId: validTenantId,
        }),
      ).rejects.toThrow("Por favor, introduce o sube el contenido CSV/TSV del catálogo.");
    });
  });
});
