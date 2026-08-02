/**
 * FLOW-04 · InventoryService
 * Spec: docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md (FROZEN)
 *
 * FLOW04-001: planConsumptionFromProduction → status=planned (no stock mutation)
 * FLOW04-002: applyConsumption → status=applied (+ stock · I2 / I3)
 * FLOW04-003: sealConsumption → status=sealed (terminal · no stock mutation)
 */
import type { ServiceContext } from "@/services/types";
import { DomainError, permissionDenied } from "@/domain/errors";
import {
  buildConsumptionPlanLines,
  type InventoryConsumption,
} from "../domain/inventory-consumption";
import { createInventoryRepository } from "../infrastructure/inventory-repository";
import {
  assertFlow04Prefix,
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

  /**
   * T2 · Apply planned consumption to stock.
   * Emits FLOW04_T2_* · status=applied · FLOW04-I2 Single Apply · FLOW04-I3 no negative stock.
   */
  async applyConsumption(
    ctx: ServiceContext,
    consumptionId: string,
  ): Promise<InventoryConsumption> {
    assertTenant(ctx);
    assertInventory(ctx);

    const repo = createInventoryRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.findById(ctx.tenantId, consumptionId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Consumption ${consumptionId}`);
    }

    // FLOW04-I2 · Single Apply — never double decrement
    if (current.status === "applied" || current.status === "sealed") {
      try {
        assertFlow04Prefix(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"]);
      } catch {
        throw new DomainError(
          "INVALID_STATE",
          "FLOW04-002 requires T1 COMPLETED before applyConsumption",
        );
      }
      logFlow04Step("FLOW04_T2_STARTED", {
        consumptionId,
        status: current.status,
        reuse: true,
      });
      logFlow04Step("FLOW04_T2_COMPLETED", {
        consumptionId,
        status: current.status,
        reuse: true,
      });
      return current;
    }

    if (current.status !== "planned") {
      throw new DomainError(
        "INVALID_STATE",
        `FLOW04-002 requires status planned (got ${current.status})`,
      );
    }

    try {
      assertFlow04Prefix(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"]);
    } catch {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW04-002 requires T1 COMPLETED before applyConsumption",
      );
    }

    logFlow04Step("FLOW04_T2_STARTED", {
      consumptionId,
      status: current.status,
      lineCount: current.lines.length,
    });

    try {
      const applied = await repo.applyConsumption({
        tenantId: ctx.tenantId,
        consumptionId,
      });

      if (applied.status !== "applied") {
        stopFlow04("T2_STATUS_DRIFT", {
          consumptionId,
          status: applied.status,
        });
        throw new DomainError(
          "INVALID_STATE",
          "FLOW04-002 invariant: status must be applied after applyConsumption",
        );
      }

      logFlow04Step("FLOW04_T2_COMPLETED", {
        consumptionId: applied.id,
        status: applied.status,
        lineCount: applied.lines.length,
      });

      return applied;
    } catch (e) {
      if (e instanceof DomainError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "insufficient_stock") {
        stopFlow04("T2_INSUFFICIENT_STOCK", {
          consumptionId,
          ...(e instanceof Error &&
          "details" in e &&
          typeof (e as { details?: unknown }).details === "object"
            ? { details: (e as { details: Record<string, unknown> }).details }
            : {}),
        });
        throw new DomainError("INVALID_STATE", "insufficient_stock", {
          consumptionId,
        });
      }
      stopFlow04("T2_FAILED", { consumptionId, error: msg });
      throw e;
    }
  },

  /**
   * T3 · Seal applied consumption (terminal).
   * Emits FLOW04_T3_* · status=sealed · no stock mutation.
   */
  async sealConsumption(
    ctx: ServiceContext,
    consumptionId: string,
  ): Promise<InventoryConsumption> {
    assertTenant(ctx);
    assertInventory(ctx);

    const repo = createInventoryRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.findById(ctx.tenantId, consumptionId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Consumption ${consumptionId}`);
    }

    // Terminal: idempotent return (pipeline may already be closed after T3_COMPLETED)
    if (current.status === "sealed") {
      return current;
    }

    if (current.status !== "applied") {
      throw new DomainError(
        "INVALID_STATE",
        `FLOW04-003 requires status applied (got ${current.status})`,
      );
    }

    try {
      assertFlow04Prefix([
        "FLOW04_T1_STARTED",
        "FLOW04_T1_COMPLETED",
        "FLOW04_T2_STARTED",
        "FLOW04_T2_COMPLETED",
      ]);
    } catch {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW04-003 requires T2 COMPLETED before sealConsumption",
      );
    }

    logFlow04Step("FLOW04_T3_STARTED", {
      consumptionId,
      status: current.status,
    });

    try {
      const stockSnapshot = await Promise.all(
        current.lines.map(async (line) => ({
          ingredientId: line.ingredientId,
          stock: await repo.getStock(ctx.tenantId, line.ingredientId),
        })),
      );

      const sealed = await repo.sealConsumption({
        tenantId: ctx.tenantId,
        consumptionId,
      });

      if (sealed.status !== "sealed") {
        stopFlow04("T3_STATUS_DRIFT", {
          consumptionId,
          status: sealed.status,
        });
        throw new DomainError(
          "INVALID_STATE",
          "FLOW04-003 invariant: status must be sealed after sealConsumption",
        );
      }

      // Stock must remain stable vs T2 (no mutation in T3)
      for (const snap of stockSnapshot) {
        const after = await repo.getStock(ctx.tenantId, snap.ingredientId);
        if (after !== snap.stock) {
          stopFlow04("T3_STOCK_MUTATION", {
            consumptionId,
            ingredientId: snap.ingredientId,
            before: snap.stock,
            after,
          });
          throw new DomainError(
            "INVALID_STATE",
            "FLOW04-003 forbids stock mutation during seal",
          );
        }
      }

      logFlow04Step("FLOW04_T3_COMPLETED", {
        consumptionId: sealed.id,
        status: sealed.status,
        lineCount: sealed.lines.length,
      });

      return sealed;
    } catch (e) {
      if (e instanceof DomainError) throw e;
      stopFlow04("T3_FAILED", {
        consumptionId,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  },
};
