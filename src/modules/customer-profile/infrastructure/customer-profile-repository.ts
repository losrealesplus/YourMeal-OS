import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerPhoneRow = Database["public"]["Tables"]["customer_phones"]["Row"];

export interface CustomerProfileRepository {
  getCustomerByUserId(tenantId: string, userId: string): Promise<CustomerRow | null>;

  getPrimaryPhone(tenantId: string, customerId: string): Promise<CustomerPhoneRow | null>;

  updateDisplayName(
    tenantId: string,
    customerId: string,
    userId: string,
    displayName: string,
  ): Promise<CustomerRow>;

  upsertPrimaryPhone(
    tenantId: string,
    customerId: string,
    phone: string,
  ): Promise<CustomerPhoneRow>;

  ensureCustomer(
    tenantId: string,
    userId: string,
    displayName: string,
    email?: string,
  ): Promise<CustomerRow>;
}

export function createCustomerProfileRepository(
  supabase: SupabaseClient<Database>,
): CustomerProfileRepository {
  return {
    async getCustomerByUserId(tenantId: string, userId: string): Promise<CustomerRow | null> {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },

    async getPrimaryPhone(tenantId: string, customerId: string): Promise<CustomerPhoneRow | null> {
      const { data, error } = await supabase
        .from("customer_phones")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("customer_id", customerId)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },

    async updateDisplayName(
      tenantId: string,
      customerId: string,
      userId: string,
      displayName: string,
    ): Promise<CustomerRow> {
      const { data, error } = await supabase
        .from("customers")
        .update({ display_name: displayName })
        .eq("id", customerId)
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },

    async upsertPrimaryPhone(
      tenantId: string,
      customerId: string,
      phone: string,
    ): Promise<CustomerPhoneRow> {
      // Check existing primary phone
      const existing = await this.getPrimaryPhone(tenantId, customerId);
      if (existing) {
        const { data, error } = await supabase
          .from("customer_phones")
          .update({ phone, is_primary: true })
          .eq("id", existing.id)
          .eq("tenant_id", tenantId)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      }

      const { data, error } = await supabase
        .from("customer_phones")
        .insert({
          tenant_id: tenantId,
          customer_id: customerId,
          phone,
          is_primary: true,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },

    async ensureCustomer(
      tenantId: string,
      userId: string,
      displayName: string,
      email?: string,
    ): Promise<CustomerRow> {
      try {
        const { data: rpcId, error: rpcErr } = await supabase.rpc("ensure_individual_customer", {
          p_tenant_id: tenantId,
          p_user_id: userId,
          p_display_name: displayName,
          p_email: email || undefined,
        });
        if (!rpcErr && rpcId) {
          const created = await this.getCustomerByUserId(tenantId, userId);
          if (created) return created;
        }
      } catch {
        // Fallback to direct table insert
      }

      const { data, error } = await supabase
        .from("customers")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          kind: "individual",
          display_name: displayName,
          email: email || null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  };
}
