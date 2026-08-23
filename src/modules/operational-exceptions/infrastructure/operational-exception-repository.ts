import type { AppSupabase } from "@/services/types";
import type {
  OperationalException,
  OperationalExceptionSeverity,
  OperationalExceptionStatus,
  OperationalExceptionType,
  ResolutionType,
} from "../domain/operational-exception";

export type OperationalExceptionRow = {
  id: string;
  tenant_id: string;
  type: string;
  severity: string;
  status: string;
  version: number;
  source_domain: string;
  source_entity_type: string;
  source_entity_id: string;
  order_id: string | null;
  customer_id: string | null;
  company_id: string | null;
  owner_user_id: string | null;
  resolution_type: string | null;
  resolution_payload: Record<string, unknown> | null;
  resolution_notes: string | null;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export function mapRowToOperationalException(row: OperationalExceptionRow): OperationalException {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    type: row.type as OperationalExceptionType,
    severity: row.severity as OperationalExceptionSeverity,
    status: row.status as OperationalExceptionStatus,
    version: row.version,
    sourceDomain: row.source_domain,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    orderId: row.order_id,
    customerId: row.customer_id,
    companyId: row.company_id,
    ownerUserId: row.owner_user_id,
    resolutionType: (row.resolution_type as ResolutionType) ?? null,
    resolutionPayload: row.resolution_payload,
    resolutionNotes: row.resolution_notes,
    detectedAt: row.detected_at,
    acknowledgedAt: row.acknowledged_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createOperationalExceptionRepository(supabase: AppSupabase, tenantId: string) {
  const untypedDb = supabase as unknown as {
    from: (table: string) => {
      select: (cols?: string) => {
        eq: (
          col: string,
          val: unknown,
        ) => {
          eq: (
            col2: string,
            val2: unknown,
          ) => {
            eq: (
              col3: string,
              val3: unknown,
            ) => {
              maybeSingle: () => Promise<{
                data: unknown;
                error: Error | null;
              }>;
            };
            order: (
              col3: string,
              opts: { ascending: boolean },
            ) => Promise<{
              data: unknown[] | null;
              error: Error | null;
            }>;
            maybeSingle: () => Promise<{
              data: unknown;
              error: Error | null;
            }>;
          };
          order: (
            col2: string,
            opts: { ascending: boolean },
          ) => Promise<{
            data: unknown[] | null;
            error: Error | null;
          }>;
          maybeSingle: () => Promise<{
            data: unknown;
            error: Error | null;
          }>;
        };
      };
      insert: (payload: unknown) => {
        select: () => {
          single: () => Promise<{ data: unknown; error: Error | null }>;
        };
      };
      update: (payload: unknown) => {
        eq: (
          col: string,
          val: unknown,
        ) => {
          eq: (
            col2: string,
            val2: unknown,
          ) => {
            eq: (
              col3: string,
              val3: unknown,
            ) => {
              select: () => {
                maybeSingle: () => Promise<{
                  data: unknown;
                  error: Error | null;
                }>;
              };
            };
          };
        };
      };
    };
  };

  return {
    async create(input: {
      type: string;
      severity?: string;
      sourceDomain: string;
      sourceEntityType: string;
      sourceEntityId: string;
      orderId?: string | null;
      customerId?: string | null;
      companyId?: string | null;
      userId: string;
    }): Promise<OperationalException> {
      const now = new Date().toISOString();
      const insertPayload = {
        tenant_id: tenantId,
        type: input.type,
        severity: input.severity ?? "MEDIUM",
        status: "OPEN",
        version: 1,
        source_domain: input.sourceDomain,
        source_entity_type: input.sourceEntityType,
        source_entity_id: input.sourceEntityId,
        order_id: input.orderId ?? null,
        customer_id: input.customerId ?? null,
        company_id: input.companyId ?? null,
        detected_at: now,
        created_by: input.userId,
        updated_by: input.userId,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await untypedDb
        .from("operational_exceptions")
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return mapRowToOperationalException(data as OperationalExceptionRow);
    },

    async getById(id: string): Promise<OperationalException | null> {
      const { data, error } = await untypedDb
        .from("operational_exceptions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapRowToOperationalException(data as OperationalExceptionRow);
    },

    async listByOrder(orderId: string): Promise<OperationalException[]> {
      const { data, error } = await untypedDb
        .from("operational_exceptions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data ?? []) as OperationalExceptionRow[]).map(mapRowToOperationalException);
    },

    async listByCustomer(customerId: string): Promise<OperationalException[]> {
      const { data, error } = await untypedDb
        .from("operational_exceptions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data ?? []) as OperationalExceptionRow[]).map(mapRowToOperationalException);
    },

    async updateWithVersion(
      id: string,
      expectedVersion: number,
      updates: Partial<OperationalExceptionRow>,
      userId: string,
    ): Promise<OperationalException | null> {
      const now = new Date().toISOString();
      const payload = {
        ...updates,
        version: expectedVersion + 1,
        updated_by: userId,
        updated_at: now,
      };

      const { data, error } = await untypedDb
        .from("operational_exceptions")
        .update(payload)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .eq("version", expectedVersion)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) return null; // Version mismatch / OCC conflict
      return mapRowToOperationalException(data as OperationalExceptionRow);
    },
  };
}
