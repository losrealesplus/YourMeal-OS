/**
 * YOURMEAL OS — HOST & DOMAIN TOPOLOGY RESOLVER
 *
 * Single Source of Truth for resolving the surface to render based on hostname:
 * - www.yourmealos.com / yourmealos.com -> public_marketing (YourMeal OS SaaS site)
 * - clientes.yourmealos.com -> client_portal (Public client directory & access gateway)
 * - eatclean.yourmealos.com / eatclean-staging.yourmealos.com -> tenant (EatClean operational environment)
 * - demo.yourmealos.com -> demo (Reserved demo environment)
 * - <slug>.yourmealos.com -> tenant (Dynamic tenant resolution)
 *
 * Pure function: works identically in SSR, Browser, and Cloudflare Workers.
 */

import { getPublicClientsDirectory } from "./public-clients-registry";

export type HostType = "public_marketing" | "client_portal" | "demo" | "tenant";

export interface HostTopologyContext {
  hostType: HostType;
  tenantSlug: string | null;
  hostname: string;
}

/**
 * Pure hostname resolution.
 */
export function resolveHostTopology(hostname: string): HostTopologyContext {
  const cleanHost = (hostname || "").toLowerCase().split(":")[0].trim();

  // 1. Client Portal
  if (cleanHost === "clientes.yourmealos.com" || cleanHost.startsWith("clientes.")) {
    return {
      hostType: "client_portal",
      tenantSlug: null,
      hostname: cleanHost,
    };
  }

  // 2. Demo environment
  if (cleanHost === "demo.yourmealos.com" || cleanHost.startsWith("demo.")) {
    return {
      hostType: "demo",
      tenantSlug: "demo",
      hostname: cleanHost,
    };
  }

  // 3. Explicit EatClean subdomain (production or staging)
  if (
    cleanHost === "eatclean.yourmealos.com" ||
    cleanHost === "eatclean-staging.yourmealos.com" ||
    cleanHost.startsWith("eatclean.") ||
    cleanHost.startsWith("eatclean-staging.")
  ) {
    return {
      hostType: "tenant",
      tenantSlug: "eatclean",
      hostname: cleanHost,
    };
  }

  // 4. Wildcard tenant resolution on yourmealos.com (e.g. singular.yourmealos.com or singular-staging.yourmealos.com)
  if (cleanHost.endsWith(".yourmealos.com")) {
    const rawSubdomain = cleanHost.replace(".yourmealos.com", "");
    const subdomain = rawSubdomain.replace(/-staging$/, "");
    if (subdomain !== "www" && subdomain !== "app" && subdomain !== "api") {
      return {
        hostType: "tenant",
        tenantSlug: subdomain,
        hostname: cleanHost,
      };
    }
  }

  // 5. Default: Public marketing site for www.yourmealos.com, yourmealos.com, localhost, or preview URLs
  return {
    hostType: "public_marketing",
    tenantSlug: null,
    hostname: cleanHost,
  };
}

export function getClientPortalUrl(hostname?: string): string {
  const host = hostname?.toLowerCase() || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return "/clientes";
  }
  return "https://clientes.yourmealos.com";
}

export function getTenantAppUrl(slug: string, hostname?: string): string {
  const host = hostname?.toLowerCase() || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return `/?tenant=${slug}`;
  }
  return `https://${slug}.yourmealos.com`;
}

export { getPublicClientsDirectory };
