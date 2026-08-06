/**
 * Flow002Harness — OPERATIONAL-FLOW-002 Phase 2.
 *
 * Orchestrates certified Facades only. Owns no business behaviour.
 *
 *   OrderFacade → ProductionFacade → KitchenExecutionFacade → DeliveryFacade
 *
 * Capabilities own business logic.
 * Flows own transitions.
 * Harnesses orchestrate certified Facades.
 * Behaviour (semantic): Fulfill Weekly Commitment → Confirmation.
 *
 * Answers: which transition failed?
 * Never answers: why did the business fail?
 *
 * Never: repositories · Supabase · Billing · invent Delivery routes.
 * @see docs/adr/0082-operational-flow-002-harness.md
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
import {
  getDeliveryFacade,
  type DeliveryFacade,
} from "@/delivery/DeliveryFacade";
import type {
  Flow002Context,
  Flow002EvidenceStep,
  Flow002RuntimeIdentity,
  Flow002Scope,
} from "./Flow002Context";
import type { Flow002Error, Flow002Result } from "./Flow002Result";

export type Flow002HarnessDeps = {
  orders: OrderFacade;
  production: ProductionFacade;
  kitchen: KitchenExecutionFacade;
  delivery: DeliveryFacade;
};

const defaultDeps = (): Flow002HarnessDeps => ({
  orders: getOrderFacade(),
  production: getProductionFacade(),
  kitchen: getKitchenExecutionFacade(),
  delivery: getDeliveryFacade(),
});

function emptyContext(scope: Flow002Scope): Flow002Context {
  return {
    scope,
    tenantId: null,
    operatorId: null,
    orderIds: [],
    productionPlanId: null,
    executionUnitIds: [],
    completedUnitId: null,
    assignmentIds: [],
    confirmationId: null,
  };
}

function fail(
  steps: Flow002EvidenceStep[],
  errors: Flow002Error[],
  context: Flow002Context | null = null,
): Flow002Result {
  return { ok: false, context, steps, errors };
}

function ok(
  steps: Flow002EvidenceStep[],
  context: Flow002Context,
): Flow002Result {
  return { ok: true, context, steps, errors: [] };
}

export class Flow002Harness {
  private readonly deps: Flow002HarnessDeps;

  constructor(deps: Partial<Flow002HarnessDeps> = {}) {
    this.deps = { ...defaultDeps(), ...deps };
  }

  /**
   * Canonical orchestration: commitment → plan → execution → delivery → confirmation.
   * Ends at Delivery Confirmation. Never Billing.
   */
  async runCommitmentToConfirmedDelivery(
    identity: Flow002RuntimeIdentity,
    scope: Flow002Scope,
  ): Promise<Flow002Result> {
    const steps: Flow002EvidenceStep[] = [];
    const ctx = emptyContext(scope);

    const gate = this.identityGate(identity, ctx, steps);
    if (!gate.ok) return gate;

    const orderHop = await this.orderHop(identity, ctx, steps);
    if (!orderHop.ok) return orderHop;

    const productionHop = await this.productionHop(identity, ctx, steps);
    if (!productionHop.ok) return productionHop;

    const kitchenHop = await this.kitchenHop(identity, ctx, steps);
    if (!kitchenHop.ok) return kitchenHop;

    if (ctx.executionUnitIds.length > 0) {
      const completeHop = await this.executionCompleteHop(identity, ctx, steps);
      if (!completeHop.ok) return completeHop;
    } else {
      steps.push({
        transition: "ExecutionComplete",
        expected: "ExecutionUnit to complete when queue non-empty",
        observed: "no ExecutionUnits — continue to Delivery hop honestly",
        evidence: "GetExecutionQueue empty",
        ok: true,
      });
    }

    const deliveryHop = await this.deliveryHop(identity, ctx, steps);
    if (!deliveryHop.ok) return deliveryHop;

    if (ctx.assignmentIds.length > 0) {
      return this.confirmationHop(identity, ctx, steps);
    }

    steps.push({
      transition: "ConfirmationHop",
      expected: "ConfirmDelivery on at least one assignment (optional if empty day)",
      observed: "no DeliveryAssignments — flow stops at Delivery context",
      evidence: "GetDeliveryContext empty assignments",
      ok: true,
    });
    return ok(steps, ctx);
  }

  /** Kitchen → Delivery transition only (after Identity). */
  async transitionKitchenToDelivery(
    identity: Flow002RuntimeIdentity,
    scope: Flow002Scope,
  ): Promise<Flow002Result> {
    const steps: Flow002EvidenceStep[] = [];
    const ctx = emptyContext(scope);
    const gate = this.identityGate(identity, ctx, steps);
    if (!gate.ok) return gate;
    const kitchenHop = await this.kitchenHop(identity, ctx, steps);
    if (!kitchenHop.ok) return kitchenHop;
    return this.deliveryHop(identity, ctx, steps);
  }

  /** Delivery → Confirmation transition only (after Identity). */
  async transitionDeliveryToConfirmation(
    identity: Flow002RuntimeIdentity,
    scope: Flow002Scope,
  ): Promise<Flow002Result> {
    const steps: Flow002EvidenceStep[] = [];
    const ctx = emptyContext(scope);
    const gate = this.identityGate(identity, ctx, steps);
    if (!gate.ok) return gate;
    const deliveryHop = await this.deliveryHop(identity, ctx, steps);
    if (!deliveryHop.ok) return deliveryHop;
    if (ctx.assignmentIds.length === 0) {
      steps.push({
        transition: "ConfirmationHop",
        expected: "assignment present to confirm",
        observed: "empty assignments",
        evidence: "GetDeliveryContext",
        ok: true,
      });
      return ok(steps, ctx);
    }
    return this.confirmationHop(identity, ctx, steps);
  }

  private identityGate(
    identity: Flow002RuntimeIdentity,
    ctx: Flow002Context,
    steps: Flow002EvidenceStep[],
  ): Flow002Result {
    if (!identity.session.present || !identity.session.userId) {
      steps.push({
        transition: "IdentityGate",
        expected: "Authenticated session",
        observed: "session missing",
        evidence: "Flow002Harness.identityGate",
        ok: false,
      });
      return fail(steps, [
        {
          code: "PERMISSION_DENIED",
          message: "Authenticated session required for FLOW-002",
          recoverable: true,
          transition: "IdentityGate",
        },
      ]);
    }
    if (!identity.tenant?.id) {
      steps.push({
        transition: "IdentityGate",
        expected: "Tenant present",
        observed: "tenant missing",
        evidence: "Flow002Harness.identityGate",
        ok: false,
      });
      return fail(steps, [
        {
          code: "TENANT_MISMATCH",
          message: "Tenant required for FLOW-002",
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
    identity: Flow002RuntimeIdentity,
    ctx: Flow002Context,
    steps: Flow002EvidenceStep[],
  ): Promise<Flow002Result> {
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

    ctx.orderIds = (result.orders ?? []).map((o) => o.id);
    steps.push({
      transition: "OrderHop",
      expected: "commitments via OrderFacade only (LAW 007)",
      observed: `orderCount=${ctx.orderIds.length} tenant=${ctx.tenantId}`,
      evidence: "OrderFacade.getOrdersByDeliveryDay",
      ok: true,
    });
    return ok(steps, ctx);
  }

  private async productionHop(
    identity: Flow002RuntimeIdentity,
    ctx: Flow002Context,
    steps: Flow002EvidenceStep[],
  ): Promise<Flow002Result> {
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
      expected: "Work plan via ProductionFacade only — never Kitchen/Delivery bypass",
      observed: `planId=${result.planId} batches=${batchCount}`,
      evidence: "ProductionFacade.generateProductionPlan",
      ok: true,
    });
    return ok(steps, ctx);
  }

  private async kitchenHop(
    identity: Flow002RuntimeIdentity,
    ctx: Flow002Context,
    steps: Flow002EvidenceStep[],
  ): Promise<Flow002Result> {
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
      expected: "ExecutionUnits from Production work — never Order/Delivery bypass",
      observed: `units=${ctx.executionUnitIds.length} day=${ctx.scope.dayDate}`,
      evidence: "KitchenExecutionFacade.getExecutionQueue",
      ok: true,
    });
    return ok(steps, ctx);
  }

  private async executionCompleteHop(
    identity: Flow002RuntimeIdentity,
    ctx: Flow002Context,
    steps: Flow002EvidenceStep[],
  ): Promise<Flow002Result> {
    const unitId = ctx.executionUnitIds[0];
    const ready = await this.deps.kitchen.markExecutionReady(identity, {
      type: "MarkExecutionReady",
      dayDate: ctx.scope.dayDate,
      unitId,
    });

    if (!ready.ok) {
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
      expected: "executed work ready for fulfillment hop",
      observed: `unit=${unitId} status=${complete.status}`,
      evidence: "MarkExecutionReady + CompleteExecution",
      ok: true,
    });
    return ok(steps, ctx);
  }

  private async deliveryHop(
    identity: Flow002RuntimeIdentity,
    ctx: Flow002Context,
    steps: Flow002EvidenceStep[],
  ): Promise<Flow002Result> {
    const result = await this.deps.delivery.getDeliveryContext(identity, {
      type: "GetDeliveryContext",
      operationalDay: ctx.scope.dayDate,
    });

    if (!result.ok || !result.context) {
      const err = result.errors[0];
      steps.push({
        transition: "DeliveryHop",
        expected: "DeliveryFacade returns assignments for operational day",
        observed: `${err?.code}: ${err?.message ?? "failed"}`,
        evidence: "DeliveryFacade.getDeliveryContext",
        ok: false,
      });
      return fail(
        steps,
        [
          {
            code: "TRANSITION_FAILED",
            message: err?.message ?? "Delivery hop failed",
            recoverable: Boolean(err?.recoverable),
            transition: "DeliveryHop",
            evidence: { deliveryErrors: result.errors },
          },
        ],
        ctx,
      );
    }

    ctx.assignmentIds = result.context.assignments.map((a) => a.id);
    steps.push({
      transition: "DeliveryHop",
      expected: "assignments via DeliveryFacade only — never Billing / GPS",
      observed: `assignments=${ctx.assignmentIds.length} day=${ctx.scope.dayDate}`,
      evidence: "DeliveryFacade.getDeliveryContext",
      ok: true,
    });
    return ok(steps, ctx);
  }

  private async confirmationHop(
    identity: Flow002RuntimeIdentity,
    ctx: Flow002Context,
    steps: Flow002EvidenceStep[],
  ): Promise<Flow002Result> {
    const assignmentId = ctx.assignmentIds[0];
    const result = await this.deps.delivery.confirmDelivery(identity, {
      type: "ConfirmDelivery",
      operationalDay: ctx.scope.dayDate,
      assignmentId,
    });

    if (!result.ok) {
      const err = result.errors[0];
      steps.push({
        transition: "ConfirmationHop",
        expected: "ConfirmDelivery via DeliveryFacade — end of FLOW-002",
        observed: `${err?.code}: ${err?.message ?? "failed"}`,
        evidence: "DeliveryFacade.confirmDelivery",
        ok: false,
      });
      return fail(
        steps,
        [
          {
            code: "TRANSITION_FAILED",
            message: err?.message ?? "Confirmation hop failed",
            recoverable: Boolean(err?.recoverable),
            transition: "ConfirmationHop",
            evidence: { deliveryErrors: result.errors },
          },
        ],
        ctx,
      );
    }

    ctx.confirmationId = result.confirmation?.id ?? `confirmation:${assignmentId}`;
    steps.push({
      transition: "ConfirmationHop",
      expected:
        "commitment → confirmed delivery without Law violation · never Billing",
      observed: `assignment=${assignmentId} confirmation=${ctx.confirmationId} status=${result.status}`,
      evidence: "DeliveryFacade.confirmDelivery",
      ok: true,
    });
    return ok(steps, ctx);
  }
}

let singleton: Flow002Harness | null = null;

export function getFlow002Harness(): Flow002Harness {
  if (!singleton) singleton = new Flow002Harness();
  return singleton;
}

export function resetFlow002Harness(): void {
  singleton = null;
}
