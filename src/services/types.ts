import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppSupabase = SupabaseClient<Database>;

/**
 * Request-scoped context passed into every Service call.
 * Built by route loaders / server functions — not by React components inventing IDs.
 */
export type ServiceContext = {
  supabase: AppSupabase;
  userId: string;
  tenantId: string;
  /** Client IP when known (Edge / server). */
  ip?: string | null;
};

export type AuditAction =
  | "create"
  | "update"
  | "soft_delete"
  | "restore"
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
  /** Decimal, tenant currency */
  cost?: number;
  price?: number;
  prepMinutes?: number | null;
  prepInstructions?: string | null;
  allergens?: string[];
  status?: "draft" | "active" | "archived";
};

export type DishUpdateInput = Partial<DishCreateInput>;
