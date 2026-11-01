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
import type {
  InventoryStockItem,
  StockMovementRecord,
  StockMovementFilter,
  PaginatedStockMovements,
  InventorySummary,
} from "../domain/inventory-types";
import { createInventoryRepository } from "../infrastructure/inventory-repository";
import {
  assertFlow04Prefix,
  beginFlow04Pipeline,
  hasFlow04Step,
  isFlow04PipelineActive,
  logFlow04Step,
  resumeFlow04Pipeline,
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

function assertCanReadConsumption(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("inventory.operate") && !ctx.capabilities.has("kitchen.operate")) {
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

    const production = await repo.loadProductionPlanInput(ctx.tenantId, deliveryDate);
    if (!production) {
      throw new DomainError("INVALID_STATE", "No production source for deliveryDate", {
        deliveryDate,
      });
    }

    const lines = buildConsumptionPlanLines(production);
    if (lines.length === 0) {
      throw new DomainError("INVALID_STATE", "Consumption plan requires at least one recipe line", {
        deliveryDate,
      });
    }

    const pipelineId = beginFlow04Pipeline({
      tenantId: ctx.tenantId,
      deliveryDate,
      lineCount: lines.length,
    });
    logFlow04Step(
      "FLOW04_T1_STARTED",
      {
        tenantId: ctx.tenantId,
        deliveryDate,
        lineCount: lines.length,
      },
      pipelineId,
    );

    try {
      const consumption = await repo.createPlanned({
        tenantId: ctx.tenantId,
        deliveryDate,
        lines,
        actorId: ctx.userId,
      });

      if (!["planned", "applied", "sealed"].includes(consumption.status)) {
        throw new DomainError("INVALID_STATE", "T1 returned an invalid consumption status", {
          status: consumption.status,
        });
      }

      logFlow04Step(
        "FLOW04_T1_COMPLETED",
        {
          tenantId: ctx.tenantId,
          deliveryDate,
          consumptionId: consumption.id,
          status: consumption.status,
          lineCount: consumption.lines.length,
        },
        pipelineId,
      );

      return consumption;
    } catch (e) {
      stopFlow04(
        "T1_FAILED",
        {
          tenantId: ctx.tenantId,
          deliveryDate,
          error: e instanceof Error ? e.message : String(e),
        },
        pipelineId,
      );
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
    options?: { sessionRecovery?: boolean },
  ): Promise<InventoryConsumption> {
    assertTenant(ctx);
    assertInventory(ctx);

    const repo = createInventoryRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.findById(ctx.tenantId, consumptionId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Consumption ${consumptionId}`);
    }

    const flowContext = {
      tenantId: ctx.tenantId,
      deliveryDate: current.deliveryDate,
      consumptionId: current.id,
    };

    let pipelineId: string;
    if (
      options?.sessionRecovery &&
      (!isFlow04PipelineActive(flowContext) || !hasFlow04Step("FLOW04_T1_COMPLETED", flowContext))
    ) {
      pipelineId = resumeFlow04Pipeline(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"], {
        ...flowContext,
        source: "session_recovery",
      });
    } else {
      pipelineId = resumeFlow04Pipeline([], flowContext);
    }

    // FLOW04-I2 · Single Apply — never double decrement
    if (current.status === "applied" || current.status === "sealed") {
      try {
        assertFlow04Prefix(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"], flowContext, pipelineId);
      } catch {
        throw new DomainError(
          "INVALID_STATE",
          "FLOW04-002 requires T1 COMPLETED before applyConsumption",
        );
      }
      logFlow04Step(
        "FLOW04_T2_STARTED",
        {
          ...flowContext,
          status: current.status,
          reuse: true,
        },
        pipelineId,
      );
      logFlow04Step(
        "FLOW04_T2_COMPLETED",
        {
          ...flowContext,
          status: current.status,
          reuse: true,
        },
        pipelineId,
      );
      return current;
    }

    if (current.status !== "planned") {
      throw new DomainError(
        "INVALID_STATE",
        `FLOW04-002 requires status planned (got ${current.status})`,
      );
    }

    try {
      assertFlow04Prefix(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"], flowContext, pipelineId);
    } catch {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW04-002 requires T1 COMPLETED before applyConsumption",
      );
    }

    logFlow04Step(
      "FLOW04_T2_STARTED",
      {
        ...flowContext,
        status: current.status,
        lineCount: current.lines.length,
      },
      pipelineId,
    );

    try {
      const applied = await repo.applyConsumption({
        tenantId: ctx.tenantId,
        consumptionId,
        actorId: ctx.userId,
      });

      if (applied.status !== "applied") {
        stopFlow04(
          "T2_STATUS_DRIFT",
          {
            ...flowContext,
            status: applied.status,
          },
          pipelineId,
        );
        throw new DomainError(
          "INVALID_STATE",
          "FLOW04-002 invariant: status must be applied after applyConsumption",
        );
      }

      logFlow04Step(
        "FLOW04_T2_COMPLETED",
        {
          ...flowContext,
          status: applied.status,
          lineCount: applied.lines.length,
        },
        pipelineId,
      );

      return applied;
    } catch (e) {
      if (e instanceof DomainError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "insufficient_stock") {
        stopFlow04(
          "T2_INSUFFICIENT_STOCK",
          {
            ...flowContext,
            ...(e instanceof Error &&
            "details" in e &&
            typeof (e as { details?: unknown }).details === "object"
              ? { details: (e as { details: Record<string, unknown> }).details }
              : {}),
          },
          pipelineId,
        );
        throw new DomainError("INVALID_STATE", "insufficient_stock", {
          consumptionId,
        });
      }
      stopFlow04("T2_FAILED", { ...flowContext, error: msg }, pipelineId);
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
    options?: { sessionRecovery?: boolean },
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

    const flowContext = {
      tenantId: ctx.tenantId,
      deliveryDate: current.deliveryDate,
      consumptionId: current.id,
    };

    let pipelineId: string;
    if (
      options?.sessionRecovery &&
      (!isFlow04PipelineActive(flowContext) || !hasFlow04Step("FLOW04_T2_COMPLETED", flowContext))
    ) {
      pipelineId = resumeFlow04Pipeline(
        ["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED", "FLOW04_T2_STARTED", "FLOW04_T2_COMPLETED"],
        {
          ...flowContext,
          source: "session_recovery",
        },
      );
    } else {
      pipelineId = resumeFlow04Pipeline([], flowContext);
    }

    try {
      assertFlow04Prefix(
        ["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED", "FLOW04_T2_STARTED", "FLOW04_T2_COMPLETED"],
        flowContext,
        pipelineId,
      );
    } catch {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW04-003 requires T2 COMPLETED before sealConsumption",
      );
    }

    logFlow04Step(
      "FLOW04_T3_STARTED",
      {
        ...flowContext,
        status: current.status,
      },
      pipelineId,
    );

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
        actorId: ctx.userId,
      });

      if (sealed.status !== "sealed") {
        stopFlow04(
          "T3_STATUS_DRIFT",
          {
            ...flowContext,
            status: sealed.status,
          },
          pipelineId,
        );
        throw new DomainError(
          "INVALID_STATE",
          "FLOW04-003 invariant: status must be sealed after sealConsumption",
        );
      }

      // Stock must remain stable vs T2 (no mutation in T3)
      for (const snap of stockSnapshot) {
        const after = await repo.getStock(ctx.tenantId, snap.ingredientId);
        if (after !== snap.stock) {
          stopFlow04(
            "T3_STOCK_MUTATION",
            {
              ...flowContext,
              ingredientId: snap.ingredientId,
              before: snap.stock,
              after,
            },
            pipelineId,
          );
          throw new DomainError("INVALID_STATE", "FLOW04-003 forbids stock mutation during seal");
        }
      }

      logFlow04Step(
        "FLOW04_T3_COMPLETED",
        {
          ...flowContext,
          status: sealed.status,
          lineCount: sealed.lines.length,
        },
        pipelineId,
      );

      return sealed;
    } catch (e) {
      if (e instanceof DomainError) throw e;
      stopFlow04(
        "T3_FAILED",
        {
          ...flowContext,
          error: e instanceof Error ? e.message : String(e),
        },
        pipelineId,
      );
      throw e;
    }
  },

  /**
   * Retrieve existing consumption for a production date if present.
   * Resumes the FLOW-04 evidence pipeline from the verified persisted status
   * so that actions after a page reload succeed without failing in-memory prefix checks.
   */
  async getConsumptionByDate(
    ctx: ServiceContext,
    deliveryDate: string,
  ): Promise<InventoryConsumption | null> {
    assertTenant(ctx);
    assertCanReadConsumption(ctx);
    const date = deliveryDate?.trim();
    if (!date) return null;

    const repo = createInventoryRepository(ctx.supabase, ctx.tenantId);
    const consumption = await repo.findBySource(ctx.tenantId, date);
    if (consumption) {
      const flowContext = {
        tenantId: ctx.tenantId,
        deliveryDate: date,
        consumptionId: consumption.id,
      };
      if (consumption.status === "planned") {
        resumeFlow04Pipeline(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"], {
          ...flowContext,
          source: "persisted_planned",
        });
      } else if (consumption.status === "applied") {
        resumeFlow04Pipeline(
          ["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED", "FLOW04_T2_STARTED", "FLOW04_T2_COMPLETED"],
          {
            ...flowContext,
            source: "persisted_applied",
          },
        );
      }
    } else {
      if (isFlow04PipelineActive({ tenantId: ctx.tenantId, deliveryDate: date })) {
        stopFlow04("CONTEXT_SWITCH_NO_CONSUMPTION", { tenantId: ctx.tenantId, deliveryDate: date });
      }
    }
    return consumption;
  },

  /**
   * Pure calculation of inventory summary KPIs from a list of items (single source of truth).
   */
  computeInventorySummary(items: InventoryStockItem[]): InventorySummary {
    const totalIngredients = items.length;
    const inStockCount = items.filter((i) => i.stock > 0).length;
    const outOfStockCount = items.filter((i) => i.stock <= 0).length;
    const totalValuation = items.reduce((sum, i) => sum + (i.totalValue || 0), 0);
    return {
      totalIngredients,
      inStockCount,
      outOfStockCount,
      totalValuation: Math.round(totalValuation * 100) / 100,
    };
  },

  /**
   * List all active inventory ingredients with current stock and WAC valuation.
   * Employs chunked retrieval to guarantee complete catalog coverage without truncation.
   */
  async getInventoryStock(ctx: ServiceContext): Promise<InventoryStockItem[]> {
    assertTenant(ctx);
    assertInventory(ctx);
    const repo = createInventoryRepository(ctx.supabase, ctx.tenantId);
    return repo.listInventoryStock(ctx.tenantId);
  },

  /**
   * List stock movements (Kárdex) with server-side filters, stable ordering, and pagination.
   */
  async getStockMovements(
    ctx: ServiceContext,
    filter?: StockMovementFilter,
  ): Promise<PaginatedStockMovements> {
    assertTenant(ctx);
    assertInventory(ctx);
    const repo = createInventoryRepository(ctx.supabase, ctx.tenantId);
    return repo.listStockMovements(ctx.tenantId, filter);
  },

  /**
   * Compute inventory KPIs and aggregate valuation.
   * If preloadedItems is provided, computes directly without issuing a redundant database query.
   */
  async getInventorySummary(
    ctx: ServiceContext,
    preloadedItems?: InventoryStockItem[],
  ): Promise<InventorySummary> {
    const items = preloadedItems ?? (await this.getInventoryStock(ctx));
    return this.computeInventorySummary(items);
  },
};
