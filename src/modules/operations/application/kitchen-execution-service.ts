/**
 * EP-002B.2 — KitchenExecutionService
 * Mutates dish×day production lot status. Board reads = ProductionReportService.
 */
import type { Database } from "@/integrations/supabase/types";
import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { AuditService } from "@/services/audit-service";
import {
  isKitchenBatchStatus,
  nextKitchenBatchStatuses,
  type KitchenBatchStatus,
} from "../domain/kitchen-batch-status";
import { ProductionReportService, type ProductionReportQuery } from "./production-report-service";
import type { ProductionReportModel } from "../domain/production-report";

export type KitchenBatchTransitionCommand = {
  deliveryDate: string;
  dishId: string;
  itemKind?: "dish" | "custom";
  toStatus: KitchenBatchStatus;
};

export const KitchenExecutionService = {
  /** Same day model as the printable sheet (single source). */
  async getDayBoard(
    ctx: ServiceContext,
    query: ProductionReportQuery,
  ): Promise<ProductionReportModel> {
    return ProductionReportService.buildForDay(ctx, query);
  },

  async transitionBatch(
    ctx: ServiceContext,
    command: KitchenBatchTransitionCommand,
  ): Promise<KitchenBatchStatus> {
    requireCapability(ctx.roles, "kitchen.operate");

    if (command.itemKind === "custom" || command.dishId?.startsWith("custom:")) {
      throw new DomainError("UNIMPLEMENTED", "Custom batch writes are not enabled");
    }
    if (!command.deliveryDate || !command.dishId) {
      throw new DomainError("INVALID_STATE", "deliveryDate and dishId are required");
    }
    if (!isKitchenBatchStatus(command.toStatus)) {
      throw new DomainError("INVALID_STATE", `Invalid status: ${command.toStatus}`);
    }

    const db = ctx.supabase;
    const { data: existing, error: findErr } = await db
      .from("kitchen_production_batches")
      .select("id, status")
      .eq("tenant_id", ctx.tenantId)
      .eq("delivery_date", command.deliveryDate)
      .eq("dish_id", command.dishId)
      .maybeSingle();
    if (findErr) throw findErr;

    const fromStatus: KitchenBatchStatus = isKitchenBatchStatus(existing?.status ?? "")
      ? (existing!.status as KitchenBatchStatus)
      : "pending";

    const allowed = nextKitchenBatchStatuses(fromStatus);
    if (!allowed.includes(command.toStatus)) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot transition kitchen batch ${fromStatus} → ${command.toStatus}`,
      );
    }

    const patch: Database["public"]["Tables"]["kitchen_production_batches"]["Update"] = {
      status: command.toStatus,
      updated_by: ctx.userId,
    };
    if (command.toStatus === "preparing" && fromStatus === "pending") {
      patch.started_at = new Date().toISOString();
    }
    if (command.toStatus === "finished") {
      patch.finished_at = new Date().toISOString();
    }

    if (existing?.id) {
      const { error } = await db
        .from("kitchen_production_batches")
        .update(patch)
        .eq("id", existing.id)
        .eq("tenant_id", ctx.tenantId);
      if (error) throw error;
    } else {
      const { error } = await db.from("kitchen_production_batches").insert({
        tenant_id: ctx.tenantId,
        delivery_date: command.deliveryDate,
        dish_id: command.dishId,
        ...patch,
      });
      if (error) throw error;
    }

    try {
      await AuditService.write(ctx, {
        entityType: "kitchen_production_batch",
        entityId: `${command.deliveryDate}:${command.dishId}`,
        action: "status_change",
        oldData: { status: fromStatus },
        newData: {
          status: command.toStatus,
          deliveryDate: command.deliveryDate,
          dishId: command.dishId,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Audit failed";
      throw new DomainError("INVALID_STATE", message);
    }

    return command.toStatus;
  },
};
