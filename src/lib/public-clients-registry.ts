/**
 * YOURMEAL OS — PUBLIC CLIENT REGISTRY
 *
 * Canonical registry of tenant brands operated on YourMeal OS.
 * Governs public directory listings on clientes.yourmealos.com and /clientes.
 *
 * STRICT INVARIANT:
 * A tenant is ONLY displayed in the public directory if `isPublicDirectory === true`.
 * Private or unlisted client instances are completely invisible.
 */

export interface PublicClientEntry {
  slug: string;
  publicName: string;
  description: string;
  category: string;
  areaServed: string;
  logoUrl?: string;
  appUrl: string;
  isPublicDirectory: boolean;
}

/**
 * Global registry of tenant configurations for public listing.
 * In a future phase, this can also sync with database-backed tenant configurations.
 */
export const CLIENT_REGISTRY: readonly PublicClientEntry[] = [
  {
    slug: "eatclean",
    publicName: "EatClean",
    description:
      "Comida preparada saludable con ingredientes naturales y reparto a domicilio y empresas.",
    category: "Meal Prep & Catering Saludable",
    areaServed: "Tenerife, España",
    logoUrl: "/tenant/eatclean-logo.svg",
    appUrl: "https://eatclean.yourmealos.com",
    isPublicDirectory: true,
  },
  {
    slug: "internal-lab-private",
    publicName: "Private Catering Co",
    description: "Private test client not for public directory.",
    category: "Corporate Catering",
    areaServed: "Madrid, España",
    appUrl: "https://private.yourmealos.com",
    isPublicDirectory: false,
  },
] as const;

/**
 * Returns only explicitly authorized public clients.
 */
export function getPublicClientsDirectory(): PublicClientEntry[] {
  return CLIENT_REGISTRY.filter((client) => client.isPublicDirectory === true);
}

/**
 * Resolves public client metadata by slug if publicly listed.
 */
export function getPublicClientBySlug(slug: string): PublicClientEntry | null {
  const cleanSlug = (slug || "").toLowerCase().trim();
  const found = CLIENT_REGISTRY.find(
    (c) => c.slug.toLowerCase() === cleanSlug && c.isPublicDirectory === true,
  );
  return found ? { ...found } : null;
}
