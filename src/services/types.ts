import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole } from "@/hooks/use-auth";
import type { Capability } from "@/permissions";
import { capabilitiesFor } from "@/permissions";
import type { LocalizationSettings } from "@/lib/localization";
import { DomainError } from "@/domain/errors";

export type AppSupabase = SupabaseClient<Database>;

/**
 * Single request-scoped context for every Service.
 * @see docs/05-architecture/FOUNDATION_LOCK.md
 */
export type ServiceContext = {
  supabase: AppSupabase;
  userId: string;
  tenantId: string;
  roles: readonly AppRole[];
  capabilities: ReadonlySet<Capability>;
  localization?: LocalizationSettings | null;
  ip?: string | null;
};

export type AuditAction =
  | "create"
  | "update"
  | "archive"
  | "restore"
  | "purge"
  | "status_change";

export type AuditWriteInput = {
  tenantId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ip?: string | null;
};

export type DishCreateInput = {
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  kcal?: number | null;
  /** Canonical: grams */
  weightG?: number | null;
  macros?: Record<string, unknown>;
  cost?: number;
  price?: number;
  prepMinutes?: number | null;
  prepInstructions?: string | null;
  allergens?: string[];
  /** draft | active(published) | archived */
  status?: "draft" | "active" | "archived";
};

export type DishUpdateInput = Partial<DishCreateInput>;

export type CreateServiceContextInput = {
  supabase: AppSupabase;
  userId: string;
  /** Prefer explicit tenant; otherwise first membership is used. */
  tenantId?: string | null;
  roles?: readonly AppRole[];
  localization?: LocalizationSettings | null;
  ip?: string | null;
};

/**
 * Build the unified ServiceContext. Call from route loaders / server functions.
 */
export async function createServiceContext(
  input: CreateServiceContextInput,
): Promise<ServiceContext> {
  let roles = input.roles;
  if (!roles) {
    const { data, error } = await input.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", input.userId);
    if (error) {
      throw new DomainError("NOT_FOUND", `Failed to load roles: ${error.message}`);
    }
    roles = (data ?? []).map((r) => r.role as AppRole);
  }

  let tenantId = input.tenantId ?? null;
  if (!tenantId) {
    const { data, error } = await input.supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", input.userId)
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new DomainError("TENANT_MISMATCH", `Failed to resolve tenant: ${error.message}`);
    }
    tenantId = data?.tenant_id ?? null;
  }

  if (!tenantId) {
    throw new DomainError(
      "TENANT_MISMATCH",
      "No tenant membership for user — cannot build ServiceContext",
    );
  }

  return {
    supabase: input.supabase,
    userId: input.userId,
    tenantId,
    roles,
    capabilities: capabilitiesFor(roles),
    localization: input.localization ?? null,
    ip: input.ip ?? null,
  };
}
