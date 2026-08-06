/**
 * Identity Capability public types (ADR 0055).
 * Data contracts — not React context.
 */

import type { Capability } from "@/permissions";
import type {
  ActiveTenant,
  AppRole,
  UserProfile,
} from "@/hooks/use-auth-types";

export type IdentityState =
  | "unknown"
  | "authenticating"
  | "anonymous"
  | "session_present"
  | "resolving"
  | "membership_pending"
  | "tenant_missing"
  | "operational_ready"
  | "active"
  | "failed";

export type PermissionModel = {
  roles: readonly AppRole[];
  capabilities: readonly Capability[];
};

export type WorkspaceContext = {
  homePath: string;
  surface: "saas" | "admin" | "app" | "driver" | "public" | "unknown";
};

export type BrandingContext = {
  provenance: "static" | "remote" | "fallback";
  tenantSlug: string | null;
};

export type LocaleContext = {
  locale: string;
};

export type FeatureFlagSnapshot = {
  evaluatedAt: string;
  flags: Record<string, boolean | string | number>;
};

export type UserPreferencesSnapshot = {
  locale?: string;
  values: Record<string, unknown>;
};

export type MembershipContext = {
  /** Preferred operational actor (ADR 0019). Null until store exposes it. */
  membershipId: string | null;
  userId: string | null;
  tenantId: string | null;
  status: "unknown" | "approved" | "pending" | "none";
};

export type OperationalContext = {
  userId: string;
  membershipId: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  roles: readonly AppRole[];
  capabilities: readonly Capability[];
};

/**
 * Canonical answer: who is the current operational user?
 */
export type IdentityContext = {
  state: IdentityState;
  userId: string | null;
  sessionPresent: boolean;
  currentUser: UserProfile | null;
  sessionUserId: string | null;
  tenant: ActiveTenant | null;
  branding: BrandingContext;
  permissions: PermissionModel;
  workspace: WorkspaceContext;
  locale: LocaleContext;
  flags: FeatureFlagSnapshot;
  preferences: UserPreferencesSnapshot;
  membership: MembershipContext;
  operational: OperationalContext | null;
};
