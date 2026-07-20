import type { Json } from "@/integrations/supabase/types";
import type { AuditWriteInput, ServiceContext } from "./types";
import { DomainError } from "@/domain/errors";

/**
 * Global audit logging — who, what, when, old/new, tenant, IP.
 * @see docs/adr/0006-soft-delete-audit.md
 */
export const AuditService = {
  async write(
    ctx: ServiceContext,
    input: Omit<AuditWriteInput, "actorId" | "tenantId" | "ip"> & {
      tenantId?: string;
      actorId?: string;
      ip?: string | null;
    },
  ): Promise<void> {
    const row = {
      tenant_id: input.tenantId ?? ctx.tenantId,
      actor_id: input.actorId ?? ctx.userId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      old_data: (input.oldData ?? null) as Json | null,
      new_data: (input.newData ?? null) as Json | null,
      ip: input.ip ?? ctx.ip ?? null,
    };

    const { error } = await ctx.supabase.from("audit_log").insert(row);
    if (error) {
      throw new DomainError(
        "INVALID_STATE",
        `AuditService.write failed: ${error.message}`,
      );
    }
  },
};
