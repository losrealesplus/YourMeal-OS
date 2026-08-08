/**
 * Flow001Harness — OPERATIONAL-FLOW-001 Phase 2.
 *
 * Orchestrates certified Facades only. Owns no business behaviour.
 *
 *   OrderFacade → ProductionFacade → KitchenExecutionFacade
 *
 * Capabilities own business logic.
 * Flows own transitions.
 * Harnesses orchestrate certified Facades.
 *
 * Never: repositories · Supabase · GeneratePlan invent · Order mutation logic.
 * @see docs/adr/0075-operational-flow-001-harness.md
 */

import {
  getOrderFacade,
  type OrderFacade,
} from "@/order/OrderFacade";
import {
  getProductionFacade,
  type ProductionFacade,
} from "@/production/ProductionFacade";
import {
  getKitchenExecutionFacade,
  type KitchenExecutionFacade,
} from "@/kitchen/KitchenExecutionFacade";
import type {
  Flow001Context,
  Flow001EvidenceStep,
  Flow001RuntimeIdentity,
  Flow001Scope,
} from "./Flow001Context";
import type { Flow001Error, Flow001Result } from "./Flow001Result";

export type Flow001HarnessDeps = {
  orders: OrderFacade;
  production: ProductionFacade;
  kitchen: KitchenExecutionFacade;
};

const defaultDeps = (): Flow001HarnessDeps => ({
  orders: getOrderFacade(),
  production: getProductionFacade(),
  kitchen: getKitchenExecutionFacade(),
});

function emptyContext(scope: Flow001Scope): Flow001Context {
  return {
    scope,
    tenantId: null,
    operatorId: null,
    orderIds: [],
    productionPlanId: null,
    executionUnitIds: [],
    completedUnitId: null,
  };
}

function fail(
  steps: Flow001EvidenceStep[],
  errors: Flow001Error[],
  context: Flow001Context | null = null,
): Flow001Result {
  return { ok: false, context, steps, errors };
}

function ok(
  steps: Flow001EvidenceStep[],
  context: Flow001Context,
): Flow001Result {
  return { ok: true, context, steps, errors: [] };
}

export class Flow001Harness {
  private readonly deps: Flow001HarnessDeps;

  constructor(deps: Partial<Flow001HarnessDeps> = {}) {
    this.deps = { ...defaultDeps(), ...deps };
  }

  /**
   * Canonical orchestration: commitment → planned work → execution queue
   * → optional CompleteExecution on first unit.
   *
   * Validates transitions only. Does not invent plans or orders.
   */
  async runCommitmentToExecutedWork(
    identity: Flow001RuntimeIdentity,
    scope: Flow001Scope,
  ): Promise<Flow001Result> {
    const steps: Flow001EvidenceStep[] = [];
    const ctx = emptyContext(scope);

    // ── Identity gate ──────────────────────────────────────────────
    const gate = this.identityGate(identity, ctx, steps);
    if (!gate.ok) return gate;

    // ── Order hop ──────────────────────────────────────────────────
    const orderHop = await this.orderHop(identity, ctx, steps);
    if (!orderHop.ok) return orderHop;

    // ── Production hop ─────────────────────────────────────────────
    const productionHop = await this.productionHop(identity, ctx, steps);
    if (!productionHop.ok) return productionHop;

    // ── Kitchen hop ────────────────────────────────────────────────
    const kitchenHop = await this.kitchenHop(identity, ctx, steps);
    if (!kitchenHop.ok) return kitchenHop;

    // ── Complete first unit when present ───────────────────────────
    if (ctx.executionUnitIds.length > 0) {
      const completeHop = await this.executionCompleteHop(
        identity,
        ctx,
        steps,
      );
      if (!completeHop.ok) return completeHop;
    } else {
      steps.push({
        transition: "ExecutionComplete",
        expected: "At least one ExecutionUnit to complete (optional if empty day)",
        observed: "no ExecutionUnits — flow stops at Kitchen queue",
        evidence: "GetExecutionQueue empty",
        ok: true,
      });
    }

    return ok(steps, ctx);
  }

  /** Order → Production transition only. */
  async transitionOrderToProduction(
    identity: Flow001RuntimeIdentity,
    scope: Flow001Scope,
  ): Promise<Flow001Result> {
    const steps: Flow001EvidenceStep[] = [];
    const ctx = emptyContext(scope);
    const gate = this.identityGate(identity, ctx, steps);
    if (!gate.ok) return gate;
    const orderHop = await this.orderHop(identity, ctx, steps);
    if (!orderHop.ok) return orderHop;
    return this.productionHop(identity, ctx, steps);
  }

  /** Production → Kitchen transition only. */
  async transitionProductionToKitchen(
    identity: Flow001RuntimeIdentity,
    scope: Flow001Scope,
  ): Promise<Flow001Result> {
    const steps: Flow001EvidenceStep[] = [];
    const ctx = emptyContext(scope);
    const gate = this.identityGate(identity, ctx, steps);
    if (!gate.ok) return gate;
    const productionHop = await this.productionHop(identity, ctx, steps);
    if (!productionHop.ok) return productionHop;
    return this.kitchenHop(identity, ctx, steps);
  }

  private identityGate(
    identity: Flow001RuntimeIdentity,
    ctx: Flow001Context,
    steps: Flow001EvidenceStep[],
  ): Flow001Result {
    if (!identity.session.present || !identity.session.userId) {
      const step: Flow001EvidenceStep = {
        transition: "IdentityGate",
        expected: "Authenticated session",
        observed: "session missing",
        evidence: "Flow001Harness.identityGate",
        ok: false,
      };
      steps.push(step);
      return fail(steps, [
        {
          code: "PERMISSION_DENIED",
          message: "Authenticated session required for FLOW-001",
          recoverable: true,
          transition: "IdentityGate",
        },
      ]);
    }
    if (!identity.tenant?.id) {
      const step: Flow001EvidenceStep = {
        transition: "IdentityGate",
        expected: "Tenant present",
        observed: "tenant missing",
        evidence: "Flow001Harness.identityGate",
        ok: false,
      };
      steps.push(step);
      return fail(steps, [
        {
          code: "TENANT_MISMATCH",
          message: "Tenant required for FLOW-001",
          recoverable: true,
          transition: "IdentityGate",
        },
      ]);
    }

    ctx.tenantId = identity.tenant.id;
    ctx.operatorId = identity.session.userId;
    steps.push({
      transition: "IdentityGate",
      expected: "session + tenant propagate into flow context",
      observed: `tenant=${ctx.tenantId} operator=${ctx.operatorId}`,
      evidence: "Identity context only — no Supabase",
      ok: true,
    });
    return ok(steps, ctx);
  }

  private async orderHop(
    identity: Flow001RuntimeIdentity,
    ctx: Flow001Context,
    steps: Flow001EvidenceStep[],
  ): Promise<Flow001Result> {
    const result = await this.deps.orders.getOrdersByDeliveryDay(identity, {
      type: "GetOrdersByDeliveryDay",
      deliveryDay: ctx.scope.dayDate,
    });

    if (!result.ok) {
      const err = result.errors[0];
      steps.push({
        transition: "OrderHop",
        expected: "OrderFacade returns commitments for day",
        observed: `${err?.code}: ${err?.message ?? "failed"}`,
        evidence: "OrderFacade.getOrdersByDeliveryDay",
        ok: false,
      });
      return fail(
        steps,
        [
          {
            code: "TRANSITION_FAILED",
            message: err?.message ?? "Order hop failed",
            recoverable: Boolean(err?.recoverable),
            transition: "OrderHop",
            evidence: { orderErrors: result.errors },
          },
        ],
        ctx,
      );
    }

    const orderIds = result.summaries.map((s) => s.id);
    ctx.orderIds = orderIds;
    steps.push({
      transition: "OrderHop",
      expected: "commitments via OrderFacade only (LAW 007)",
      observed: `orderCount=${orderIds.length} tenant=${ctx.tenantId}`,
      evidence: "OrderFacade.getOrdersByDeliveryDay",
      ok: true,
    });

    // Empty day is valid collaboration (honest empty commitment) — Production may still plan.
    return ok(steps, ctx);
  }

  private async productionHop(
    identity: Flow001RuntimeIdentity,
    ctx: Flow001Context,
    steps: Flow001EvidenceStep[],
  ): Promise<Flow001Result> {
    const result = await this.deps.production.generateProductionPlan(
      identity,
      {
        type: "GenerateProductionPlan",
        dayDate: ctx.scope.dayDate,
      },
    );

    if (!result.ok) {
      const err = result.errors[0];
      steps.push({
        transition: "ProductionHop",
        expected: "ProductionFacade consumes Order commitments → Work",
        observed: `${err?.code}: ${err?.message ?? "failed"}`,
        evidence: "ProductionFacade.generateProductionPlan",
        ok: false,
      });
      return fail(
        steps,
        [
          {
            code: "TRANSITION_FAILED",
            message: err?.message ?? "Production hop failed",
            recoverable: Boolean(err?.recoverable),
            transition: "ProductionHop",
            evidence: { productionErrors: result.errors },
          },
        ],
        ctx,
      );
    }

    ctx.productionPlanId = result.planId;
    const batchCount = result.context?.queue.batches.length ?? 0;
    steps.push({
      transition: "ProductionHop",
      expected: "Work plan via ProductionFacade only — never Kitchen bypass",
      observed: `planId=${result.planId} batches=${batchCount}`,
      evidence: "ProductionFacade.generateProductionPlan",
      ok: true,
    });
    return ok(steps, ctx);
  }

  private async kitchenHop(
    identity: Flow001RuntimeIdentity,
    ctx: Flow001Context,
    steps: Flow001EvidenceStep[],
  ): Promise<Flow001Result> {
    const result = await this.deps.kitchen.getExecutionQueue(identity, {
      type: "GetExecutionQueue",
      dayDate: ctx.scope.dayDate,
    });

    if (!result.ok || !result.context) {
      const err = result.errors[0];
      steps.push({
        transition: "KitchenHop",
        expected: "KitchenExecutionFacade consumes ProductionFacade only",
        observed: `${err?.code}: ${err?.message ?? "failed"}`,
        evidence: "KitchenExecutionFacade.getExecutionQueue",
        ok: false,
      });
      return fail(
        steps,
        [
          {
            code: "TRANSITION_FAILED",
            message: err?.message ?? "Kitchen hop failed",
            recoverable: Boolean(err?.recoverable),
            transition: "KitchenHop",
            evidence: { kitchenErrors: result.errors },
          },
        ],
        ctx,
      );
    }

    ctx.executionUnitIds = result.context.queue.units.map((u) => u.id);
    steps.push({
      transition: "KitchenHop",
      expected: "ExecutionUnits from Production work — never Order bypass",
      observed: `units=${ctx.executionUnitIds.length} day=${ctx.scope.dayDate}`,
      evidence: "KitchenExecutionFacade.getExecutionQueue",
      ok: true,
    });
    return ok(steps, ctx);
  }

  private async executionCompleteHop(
    identity: Flow001RuntimeIdentity,
    ctx: Flow001Context,
    steps: Flow001EvidenceStep[],
  ): Promise<Flow001Result> {
    const unitId = ctx.executionUnitIds[0];
    const ready = await this.deps.kitchen.markExecutionReady(identity, {
      type: "MarkExecutionReady",
      dayDate: ctx.scope.dayDate,
      unitId,
    });

    if (!ready.ok) {
      // Ready may fail if already released — try complete anyway when UNIMPLEMENTED/INVALID not blocking
      const complete = await this.deps.kitchen.completeExecution(identity, {
        type: "CompleteExecution",
        dayDate: ctx.scope.dayDate,
        unitId,
      });
      if (!complete.ok) {
        steps.push({
          transition: "ExecutionComplete",
          expected: "MarkExecutionReady then CompleteExecution via Kitchen Facade",
          observed: `ready=${ready.errors[0]?.code} complete=${complete.errors[0]?.code}`,
          evidence: "KitchenExecutionFacade Mark/Complete",
          ok: false,
        });
        return fail(
          steps,
          [
            {
              code: "TRANSITION_FAILED",
              message:
                complete.errors[0]?.message ??
                ready.errors[0]?.message ??
                "Execution complete hop failed",
              recoverable: true,
              transition: "ExecutionComplete",
            },
          ],
          ctx,
        );
      }
      ctx.completedUnitId = unitId;
      steps.push({
        transition: "ExecutionComplete",
        expected: "ExecutionUnit reaches COMPLETED via Kitchen Facade",
        observed: `unit=${unitId} status=${complete.status}`,
        evidence: "KitchenExecutionFacade.completeExecution (ready skipped)",
        ok: true,
      });
      return ok(steps, ctx);
    }

    const complete = await this.deps.kitchen.completeExecution(identity, {
      type: "CompleteExecution",
      dayDate: ctx.scope.dayDate,
      unitId,
    });

    if (!complete.ok) {
      steps.push({
        transition: "ExecutionComplete",
        expected: "CompleteExecution after MarkExecutionReady",
        observed: `${complete.errors[0]?.code}: ${complete.errors[0]?.message ?? ""}`,
        evidence: "KitchenExecutionFacade.completeExecution",
        ok: false,
      });
      return fail(
        steps,
        [
          {
            code: "TRANSITION_FAILED",
            message: complete.errors[0]?.message ?? "CompleteExecution failed",
            recoverable: Boolean(complete.errors[0]?.recoverable),
            transition: "ExecutionComplete",
          },
        ],
        ctx,
      );
    }

    ctx.completedUnitId = unitId;
    steps.push({
      transition: "ExecutionComplete",
      expected: "commitment → work → executed without Law violation",
      observed: `unit=${unitId} status=${complete.status}`,
      evidence: "MarkExecutionReady + CompleteExecution",
      ok: true,
    });
    return ok(steps, ctx);
  }
}

let singleton: Flow001Harness | null = null;

export function getFlow001Harness(): Flow001Harness {
  if (!singleton) singleton = new Flow001Harness();
  return singleton;
}

export function resetFlow001Harness(): void {
  singleton = null;
}
