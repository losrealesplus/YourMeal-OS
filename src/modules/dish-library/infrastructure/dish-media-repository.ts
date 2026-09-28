/**
 * DishMediaRepository — Supabase-backed Storage integration for Dish catalog media.
 * CR-OPS-04 · Canonical Dish Image Management.
 *
 * Enforces strict MIME validation, timestamped immutable paths, and tenant isolation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const DISH_MEDIA_BUCKET = "tenant-media";
export const MAX_DISH_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_DISH_PHOTO_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedDishPhotoMime = (typeof ALLOWED_DISH_PHOTO_MIMES)[number];

export function isAllowedDishPhotoMime(mime: string): mime is AllowedDishPhotoMime {
  return (ALLOWED_DISH_PHOTO_MIMES as readonly string[]).includes(mime);
}

export function extensionForDishPhotoMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error(`Unsupported image MIME type: ${mime}. Allowed: JPG, PNG, WebP.`);
  }
}

export type UploadDishPhotoResult = {
  path: string;
  publicUrl: string;
};

export function createDishMediaRepository(supabase: SupabaseClient<Database>) {
  return {
    async uploadDishPhoto(
      tenantId: string,
      dishId: string,
      file: File,
    ): Promise<UploadDishPhotoResult> {
      if (!isAllowedDishPhotoMime(file.type)) {
        throw new Error(
          `Tipo de archivo no permitido (${file.type}). Solo se permiten imágenes JPG, PNG o WebP.`,
        );
      }

      if (file.size > MAX_DISH_PHOTO_SIZE_BYTES) {
        throw new Error(
          `La imagen excede el límite máximo de 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
        );
      }

      const ext = extensionForDishPhotoMime(file.type);
      // Canonical timestamped path convention: {tenant_id}/dishes/{dish_id}/photo-{timestamp}.{ext}
      const path = `${tenantId}/dishes/${dishId}/photo-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(DISH_MEDIA_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw new Error(`Error al subir la imagen al almacenamiento: ${error.message}`);
      }

      const { data } = supabase.storage.from(DISH_MEDIA_BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      return {
        path,
        publicUrl,
      };
    },

    getPublicUrl(path: string): string {
      const { data } = supabase.storage.from(DISH_MEDIA_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    },
  };
}

export type DishMediaRepository = ReturnType<typeof createDishMediaRepository>;
