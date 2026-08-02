/**
 * FLOW-04 · InventoryService
 * Spec: docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md (FROZEN)
 *
 * FLOW04-001: planConsumptionFromProduction → status=planned (no stock mutation)
 */
import type { ServiceContext } from "@/services/types";
import { DomainError, permissionDenied } from "@/domain/errors";
import {
  buildConsumptionPlanLines,
  type InventoryConsumption,
} from "../domain/inventory-consumption";
import { createInventoryRepository } from "../infrastructure/inventory-repository";
import {
  beginFlow04Pipeline,
  logFlow04Step,
  stopFlow04,
} from "./flow04-evidence";

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function assertInventory(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("inventory.operate")) {
    throw permissionDenied("inventory.operate");
  }
}

export const InventoryService = {
  /**
   * T1 · Plan consumption from production day.
   * Emits FLOW04_T1_* · status=planned · does NOT mutate stock.
   */
  async planConsumptionFromProduction(
    ctx: ServiceContext,
    input: { deliveryDate: string },
  ): Promise<InventoryConsumption> {
    assertTenant(ctx);
    assertInventory(ctx);

    const deliveryDate = input.deliveryDate?.trim();
    if (!deliveryDate) {
      throw new DomainError("INVALID_STATE", "deliveryDate is required");
    }

    const repo = createInventoryRepository(ctx.supabase, ctx.tenantId);

    const existing = await repo.findBySource(ctx.tenantId, deliveryDate);
    if (existing) {
      // Idempotent plan: return existing (any status) — never create a second
      beginFlow04Pipeline({
        tenantId: ctx.tenantId,
        deliveryDate,
        reuse: existing.id,
      });
      logFlow04Step("FLOW04_T1_STARTED", {
        tenantId: ctx.tenantId,
        deliveryDate,
        reuse: true,
      });
      logFlow04Step("FLOW04_T1_COMPLETED", {
        consumptionId: existing.id,
        status: existing.status,
        lineCount: existing.lines.length,
        reuse: true,
      });
      return existing;
    }

    const production = await repo.loadProductionPlanInput(
      ctx.tenantId,
      deliveryDate,
    );
    if (!production) {
      throw new DomainError(
        "INVALID_STATE",
        "No production source for deliveryDate",
        { deliveryDate },
      );
    }

    const lines = buildConsumptionPlanLines(production);
    if (lines.length === 0) {
      throw new DomainError(
        "INVALID_STATE",
        "Consumption plan requires at least one recipe line",
        { deliveryDate },
      );
    }

    beginFlow04Pipeline({
      tenantId: ctx.tenantId,
      deliveryDate,
      lineCount: lines.length,
    });
    logFlow04Step("FLOW04_T1_STARTED", {
      tenantId: ctx.tenantId,
      deliveryDate,
      lineCount: lines.length,
    });

    try {
      const consumption = await repo.createPlanned({
        tenantId: ctx.tenantId,
        deliveryDate,
        lines,
      });

      if (consumption.status !== "planned") {
        throw new DomainError(
          "INVALID_STATE",
          "T1 must create status=planned",
          { status: consumption.status },
        );
      }

      logFlow04Step("FLOW04_T1_COMPLETED", {
        consumptionId: consumption.id,
        status: consumption.status,
        lineCount: consumption.lines.length,
        deliveryDate,
      });

      return consumption;
    } catch (e) {
      stopFlow04("T1_FAILED", {
        deliveryDate,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  },
};
