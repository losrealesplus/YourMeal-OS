import { describe, it, expect, vi } from "vitest";
import {
  createDishMediaRepository,
  isAllowedDishPhotoMime,
  extensionForDishPhotoMime,
  MAX_DISH_PHOTO_SIZE_BYTES,
  DISH_MEDIA_BUCKET,
} from "./dish-media-repository";

describe("CR-OPS-04 · DishMediaRepository Unit & Security Tests", () => {
  describe("MIME Validation & Extension Resolution", () => {
    it("accepts JPG, PNG, and WebP MIME types", () => {
      expect(isAllowedDishPhotoMime("image/jpeg")).toBe(true);
      expect(isAllowedDishPhotoMime("image/png")).toBe(true);
      expect(isAllowedDishPhotoMime("image/webp")).toBe(true);
    });

    it("rejects dangerous or disallowed MIME types (SVG, PDF, EXE, GIF)", () => {
      expect(isAllowedDishPhotoMime("image/svg+xml")).toBe(false);
      expect(isAllowedDishPhotoMime("application/pdf")).toBe(false);
      expect(isAllowedDishPhotoMime("application/x-msdownload")).toBe(false);
      expect(isAllowedDishPhotoMime("image/gif")).toBe(false);
      expect(isAllowedDishPhotoMime("text/html")).toBe(false);
    });

    it("resolves correct extension for valid MIME types", () => {
      expect(extensionForDishPhotoMime("image/jpeg")).toBe("jpg");
      expect(extensionForDishPhotoMime("image/png")).toBe("png");
      expect(extensionForDishPhotoMime("image/webp")).toBe("webp");
    });

    it("throws for unsupported MIME types in extension resolution", () => {
      expect(() => extensionForDishPhotoMime("image/svg+xml")).toThrow(
        "Unsupported image MIME type",
      );
    });
  });

  describe("Upload Functionality and Contract", () => {
    const mockUpload = vi.fn();
    const mockGetPublicUrl = vi.fn();

    const mockSupabase = {
      storage: {
        from: vi.fn((bucket: string) => {
          expect(bucket).toBe(DISH_MEDIA_BUCKET);
          return {
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl,
          };
        }),
      },
    } as any;

    const repo = createDishMediaRepository(mockSupabase);

    it("enforces max size limit <= 5 MB", async () => {
      const largeFile = new File([new ArrayBuffer(MAX_DISH_PHOTO_SIZE_BYTES + 1)], "big.jpg", {
        type: "image/jpeg",
      });

      await expect(
        repo.uploadDishPhoto("tenant-123", "dish-456", largeFile),
      ).rejects.toThrow("La imagen excede el límite máximo de 5 MB");
    });

    it("enforces valid MIME on upload", async () => {
      const svgFile = new File(["<svg></svg>"], "malicious.svg", {
        type: "image/svg+xml",
      });

      await expect(
        repo.uploadDishPhoto("tenant-123", "dish-456", svgFile),
      ).rejects.toThrow("Tipo de archivo no permitido (image/svg+xml)");
    });

    it("uploads with timestamped immutable path and returns public URL", async () => {
      mockUpload.mockResolvedValueOnce({ data: { path: "ok" }, error: null });
      mockGetPublicUrl.mockReturnValueOnce({
        data: {
          publicUrl:
            "https://nhirlpkuvonggctdzzad.supabase.co/storage/v1/object/public/tenant-media/tenant-123/dishes/dish-456/photo-12345.webp",
        },
      });

      const validFile = new File([new ArrayBuffer(1024)], "dish.webp", {
        type: "image/webp",
      });

      const tenantId = "tenant-123";
      const dishId = "dish-456";

      const beforeTime = Date.now();
      const result = await repo.uploadDishPhoto(tenantId, dishId, validFile);
      const afterTime = Date.now();

      expect(mockUpload).toHaveBeenCalledTimes(1);
      const [calledPath, calledFile, calledOptions] = mockUpload.mock.calls[0];

      expect(calledPath.startsWith(`${tenantId}/dishes/${dishId}/photo-`)).toBe(true);
      expect(calledPath.endsWith(".webp")).toBe(true);
      expect(calledOptions.contentType).toBe("image/webp");
      expect(calledOptions.upsert).toBe(false);

      expect(result.publicUrl).toContain("photo-12345.webp");
    });

    it("propagates Supabase Storage error clearly", async () => {
      mockUpload.mockResolvedValueOnce({
        data: null,
        error: { message: "Storage permission denied" },
      });

      const validFile = new File([new ArrayBuffer(1024)], "dish.jpg", {
        type: "image/jpeg",
      });

      await expect(
        repo.uploadDishPhoto("tenant-123", "dish-456", validFile),
      ).rejects.toThrow("Error al subir la imagen al almacenamiento: Storage permission denied");
    });
  });
});
