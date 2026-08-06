/**
 * Pure composition — AuthState + bootstrap snapshot → IdentityContext.
 * No Supabase calls. No business logic rewrite (ADR 0055 / OPERATIONAL-001 Phase 2).
 */

import type { AuthState } from "@/hooks/use-auth-types";
import { capabilitiesFor } from "@/permissions";
import type { BootstrapIdentitySnapshot } from "@/bootstrap/pipeline/BootstrapIdentityStore";
import { brandConfig } from "@/tenant/brand-config";
import type {
  BrandingContext,
  IdentityContext,
  IdentityState,
  WorkspaceContext,
} from "./IdentityContext";
import type { IdentityError, IdentityResult } from "./IdentityResult";

function workspaceFromHomePath(homePath: string): WorkspaceContext {
  if (homePath.startsWith("/saas")) {
    return { homePath, surface: "saas" };
  }
  if (homePath.startsWith("/admin")) {
    return { homePath, surface: "admin" };
  }
  if (homePath.startsWith("/driver")) {
    return { homePath, surface: "driver" };
  }
  if (homePath.startsWith("/app") || homePath === "/") {
    return { homePath: homePath || "/app", surface: "app" };
  }
  if (!homePath || homePath === "/auth") {
    return { homePath: homePath || "/auth", surface: "public" };
  }
  return { homePath, surface: "unknown" };
}

function deriveState(input: {
  loading: boolean;
  sessionPresent: boolean;
  userId: string | null;
  snapshotStatus: BootstrapIdentitySnapshot["status"] | null;
  hasTenant: boolean;
  isSaasAdmin: boolean;
}): IdentityState {
  if (input.loading && !input.sessionPresent) return "authenticating";
  if (!input.sessionPresent || !input.userId) return "anonymous";
  if (input.snapshotStatus === "loading") return "resolving";
  if (
    input.snapshotStatus === "ready" ||
    (input.sessionPresent && input.userId)
  ) {
    if (!input.hasTenant && !input.isSaasAdmin) {
      // Still operational for some surfaces; flag via errors if needed.
      return "operational_ready";
    }
    return "operational_ready";
  }
  if (input.sessionPresent) return "session_present";
  return "unknown";
}

export type ComposeIdentityInput = {
  auth: AuthState;
  snapshot?: BootstrapIdentitySnapshot | null;
  brandProvenance?: BrandingContext["provenance"];
  correlationId?: string;
};

/**
 * Compose the canonical IdentityResult from existing runtime sources.
 */
export function composeIdentity(input: ComposeIdentityInput): IdentityResult {
  const { auth, snapshot, brandProvenance = "fallback", correlationId } = input;
  const userId = auth.user?.id ?? snapshot?.userId ?? null;
  const sessionPresent = Boolean(auth.session?.user ?? userId);
  const roles = auth.roles.length ? auth.roles : (snapshot?.roles ?? []);
  const profile = auth.profile ?? snapshot?.profile ?? null;
  const tenant = auth.tenant ?? snapshot?.tenant ?? null;
  const homePath =
    auth.homePath ||
    snapshot?.homePath ||
    (sessionPresent ? "/app" : "/auth");
  const caps = [...capabilitiesFor(roles)];
  const isSaasAdmin = auth.isSaasAdmin || roles.includes("saas_admin");

  const state = deriveState({
    loading: auth.loading,
    sessionPresent,
    userId,
    snapshotStatus: snapshot?.status ?? null,
    hasTenant: Boolean(tenant?.id),
    isSaasAdmin,
  });

  const branding: BrandingContext = {
    provenance: brandProvenance,
    tenantSlug: tenant?.slug ?? brandConfig.slug ?? null,
  };

  const context: IdentityContext = {
    state,
    userId,
    sessionPresent,
    currentUser: profile,
    sessionUserId: userId,
    tenant,
    branding,
    permissions: { roles, capabilities: caps },
    workspace: workspaceFromHomePath(homePath),
    locale: { locale: profile?.locale ?? "es" },
    flags: {
      evaluatedAt: new Date().toISOString(),
      flags: {},
    },
    preferences: {
      locale: profile?.locale,
      values: {},
    },
    membership: {
      membershipId: null,
      userId,
      tenantId: tenant?.id ?? null,
      status: tenant?.id ? "approved" : sessionPresent ? "none" : "unknown",
    },
    operational: userId
      ? {
          userId,
          membershipId: null,
          tenantId: tenant?.id ?? null,
          tenantSlug: tenant?.slug ?? null,
          roles,
          capabilities: caps,
        }
      : null,
  };

  const errors: IdentityError[] = [];
  if (!sessionPresent) {
    errors.push({
      code: "AUTH_REQUIRED",
      message: "No authenticated session",
      recoverable: true,
    });
  } else if (!tenant?.id && !isSaasAdmin) {
    errors.push({
      code: "TENANT_MISSING",
      message: "No tenant bound for operational user",
      recoverable: true,
    });
  }

  return {
    ok: Boolean(sessionPresent) && (Boolean(tenant?.id) || isSaasAdmin),
    state,
    context,
    errors: sessionPresent
      ? errors.filter((e) => e.code !== "AUTH_REQUIRED")
      : errors,
    correlationId,
  };
}
