/**
 * YOURMEAL OS — PUBLIC CLIENT REGISTRY
 *
 * Canonical registry of tenant brands and official showcase on YourMeal OS.
 * Governs public directory listings on clientes.yourmealos.com and /clientes.
 *
 * ORDERING POLICY:
 * 1. YourMeal OS Demo (Official platform showcase / Demo oficial)
 * 2. Real public customers (e.g. EatClean)
 * 3. Future customers
 */

export type PublicClientType = "platform_demo" | "customer";

export interface PublicClientEntry {
  slug: string;
  type: PublicClientType;
  label: string; // e.g. "Demo oficial" | "Cliente de YourMeal OS"
  publicName: string;
  description: string;
  category: string;
  areaServed: string;
  logoUrl?: string;
  appUrl: string;
  isPublicDirectory: boolean;
  isFeatured?: boolean;
}

/**
 * Global registry of tenant configurations for public listing.
 */
export const CLIENT_REGISTRY: readonly PublicClientEntry[] = [
  {
    slug: "yourmeal-os",
    type: "platform_demo",
    label: "Demo oficial",
    publicName: "YourMeal OS",
    description:
      "Demostración interactiva de la plataforma completa YourMeal OS. Descubre cómo se adaptan los módulos de cocina, entregas y menús para cada modelo de catering.",
    category: "Plataforma SaaS (Demostración)",
    areaServed: "Entorno Interactivo",
    logoUrl: "/assets/yourmeal-os-logo.png",
    appUrl: "https://www.yourmealos.com/app",
    isPublicDirectory: true,
    isFeatured: true,
  },
  {
    slug: "eatclean",
    type: "customer",
    label: "Cliente de YourMeal OS",
    publicName: "EatClean",
    description:
      "Comida preparada saludable con ingredientes naturales, cocina al horno y grill, y reparto a domicilio y empresas.",
    category: "Meal Prep & Catering Saludable",
    areaServed: "Tenerife, España",
    logoUrl: "/assets/eatclean-logo.png",
    appUrl: "https://eatclean.yourmealos.com",
    isPublicDirectory: true,
    isFeatured: false,
  },
] as const;

/**
 * Returns only explicitly authorized public clients in canonical order.
 */
export function getPublicClientsDirectory(): PublicClientEntry[] {
  return CLIENT_REGISTRY.filter((client) => client.isPublicDirectory === true);
}

/**
 * Resolves public client metadata by slug if publicly listed.
 */
export function getPublicClientBySlug(slug: string): PublicClientEntry | null {
  const found = CLIENT_REGISTRY.find((client) => client.slug === slug);
  if (!found || !found.isPublicDirectory) return null;
  return found;
}
