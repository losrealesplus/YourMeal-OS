/**
 * Tenant Brand — domain value object.
 *
 * Capability: Tenant Brand Management
 * Core Object: Tenant (branding facet)
 * OM Reference: docs/adr/0014-tenant-branded-surfaces.md
 *
 * All fields are optional at rest — a tenant that never set brand data
 * falls back to platform defaults in the presentation layer.
 */

export type TenantBrandColors = {
  /** HEX #RRGGBB — dominant brand color (buttons, links, accents). */
  primary: string;
  /** HEX #RRGGBB — foreground drawn on top of primary (usually white/dark). */
  primaryForeground: string;
  /** HEX #RRGGBB — soft accent surfaces (chips, subtle backgrounds). */
  accent: string;
};

export type TenantBrand = {
  colors: Partial<TenantBrandColors>;
  /** Storage path in bucket `tenant-branding` — never a URL. */
  logoPath: string | null;
  updatedAt: string | null;
};

export const EMPTY_BRAND: TenantBrand = {
  colors: {},
  logoPath: null,
  updatedAt: null,
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value);
}

export function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (!isValidHex(trimmed)) {
    throw new Error(`Invalid HEX color: ${value}`);
  }
  return `#${trimmed.slice(1).toLowerCase()}`;
}

// --- Logo asset validation ------------------------------------------------

export const LOGO_MAX_BYTES = 512 * 1024; // 512 KB
export const LOGO_ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export type LogoValidationError =
  | { kind: "too_large"; sizeBytes: number }
  | { kind: "invalid_type"; type: string };

export function validateLogoFile(file: File): LogoValidationError | null {
  if (!LOGO_ALLOWED_MIME.includes(file.type as (typeof LOGO_ALLOWED_MIME)[number])) {
    return { kind: "invalid_type", type: file.type };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { kind: "too_large", sizeBytes: file.size };
  }
  return null;
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}
