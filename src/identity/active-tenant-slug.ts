/**
 * YOURMEAL OS — ACTIVE TENANT SLUG RESOLVER & HOOK
 *
 * Canonical resolver for determining active tenant commercial identity:
 * 1. Authenticated session ActiveTenant (auth.tenant.slug)
 * 2. Hostname topology context (resolveHostTopology(hostname).tenantSlug)
 * 3. FAIL-SAFE: null (Strict multi-tenant boundary — NEVER defaults to "eatclean" or "yourmeal-os")
 *
 * brandConfig is strictly preserved for visual branding / styling, not commercial identity.
 */

import { resolveHostTopology } from "@/lib/host-topology";
import { useAuth } from "@/hooks/use-auth";

export interface TenantIdentitySource {
  tenant?: {
    slug?: string | null;
  } | null;
}

/**
 * Pure function to resolve active tenant slug from session or host topology.
 */
export function resolveActiveTenantSlug(
  authSource?: TenantIdentitySource | null,
  hostname?: string,
): string | null {
  // 1. Authenticated session tenant slug
  if (authSource?.tenant?.slug && typeof authSource.tenant.slug === "string") {
    const slug = authSource.tenant.slug.trim();
    if (slug.length > 0) {
      return slug;
    }
  }

  // 2. Hostname-based topology resolution
  if (hostname && typeof hostname === "string") {
    const topology = resolveHostTopology(hostname);
    if (topology.tenantSlug && topology.tenantSlug.trim().length > 0) {
      return topology.tenantSlug.trim();
    }
  }

  // 3. Browser environment hostname fallback (if hostname wasn't explicitly passed)
  if (typeof window !== "undefined" && window.location?.hostname) {
    const topology = resolveHostTopology(window.location.hostname);
    if (topology.tenantSlug && topology.tenantSlug.trim().length > 0) {
      return topology.tenantSlug.trim();
    }
  }

  // 4. Strict fail-safe — no unknown tenant gets pricing or implicit brand defaults
  return null;
}

/**
 * Reactive hook for consuming active tenant slug in React components.
 */
export function useActiveTenantSlug(): string | null {
  const auth = useAuth();
  const host = typeof window !== "undefined" ? window.location.hostname : undefined;
  return resolveActiveTenantSlug(auth, host);
}
