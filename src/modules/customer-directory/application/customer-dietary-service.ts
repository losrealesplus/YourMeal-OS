/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError, permissionDenied } from "@/domain/errors";
import type {
  CustomerDietaryProfile,
  SaveCustomerDietaryProfileDTO,
} from "@/types/dietary";

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function assertCanReadCustomers(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("customers.read") && !ctx.capabilities.has("support.read")) {
    throw permissionDenied("customers.read");
  }
}

function assertCanWriteCustomers(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("customers.write")) {
    throw permissionDenied("customers.write");
  }
}

function mapRowToProfile(row: any): CustomerDietaryProfile {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    customAllergens: Array.isArray(row.custom_allergens) ? row.custom_allergens : [],
    restrictions: Array.isArray(row.restrictions) ? row.restrictions : [],
    preferences: Array.isArray(row.preferences) ? row.preferences : [],
    dietaryNotes: row.dietary_notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const CustomerDietaryService = {
  /**
   * Retrieves the dietary profile for a given customer.
   * Returns null if no profile exists yet.
   */
  async getDietaryProfile(
    ctx: ServiceContext,
    customerId: string
  ): Promise<CustomerDietaryProfile | null> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);

    const { data, error } = await (ctx.supabase as any)
      .from("customer_dietary_profiles")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (error) {
      throw new DomainError("INVALID_STATE", `Failed to get customer dietary profile: ${error.message}`);
    }

    if (!data) return null;
    return mapRowToProfile(data);
  },

  /**
   * Saves or updates a customer's dietary profile (allergens, restrictions, preferences, notes).
   * Fully audited and tenant-scoped.
   */
  async saveDietaryProfile(
    ctx: ServiceContext,
    input: SaveCustomerDietaryProfileDTO
  ): Promise<CustomerDietaryProfile> {
    assertTenant(ctx);
    assertCanWriteCustomers(ctx);

    if (!input.customerId) {
      throw new DomainError("INVALID_STATE", "customerId is required");
    }

    const payload = {
      tenant_id: ctx.tenantId,
      customer_id: input.customerId,
      allergens: input.allergens ?? [],
      custom_allergens: input.customAllergens ?? [],
      restrictions: input.restrictions ?? [],
      preferences: input.preferences ?? [],
      dietary_notes: input.dietaryNotes ? input.dietaryNotes.trim() : null,
      updated_at: new Date().toISOString(),
    };

    // Upsert by (tenant_id, customer_id)
    const { data, error } = await (ctx.supabase as any)
      .from("customer_dietary_profiles")
      .upsert(payload, { onConflict: "tenant_id,customer_id" })
      .select("*")
      .single();

    if (error) {
      throw new DomainError("INVALID_STATE", `Failed to save customer dietary profile: ${error.message}`);
    }

    await AuditService.write(ctx, {
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      entityType: "customer_dietary_profile",
      entityId: input.customerId,
      action: "update",
      newData: payload,
    });

    return mapRowToProfile(data);
  },

  /**
   * Batch resolves dietary profiles for multiple customer IDs (e.g. for listing/bulk views).
   */
  async getBatchDietaryProfiles(
    ctx: ServiceContext,
    customerIds: string[]
  ): Promise<Map<string, CustomerDietaryProfile>> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);

    const map = new Map<string, CustomerDietaryProfile>();
    if (!customerIds.length) return map;

    const { data, error } = await (ctx.supabase as any)
      .from("customer_dietary_profiles")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .in("customer_id", customerIds);

    if (error) {
      throw new DomainError("INVALID_STATE", `Failed to load batch dietary profiles: ${error.message}`);
    }

    if (data) {
      for (const row of data) {
        map.set(row.customer_id, mapRowToProfile(row));
      }
    }

    return map;
  },
};
