/**
 * OPERATIONAL-006 Phase 3 — Delivery Engineering Certification Matrix.
 * No UI. No FLOW-002. No Billing. Asserts DeliveryFacade + Laws 001–006-A.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DeliveryFacade,
  resetDeliveryFacade,
} from "./DeliveryFacade";
import {
  assignDeliveryCommand,
  closeDeliveryCommand,
  confirmDeliveryCommand,
  reportDeliveryExceptionCommand,
  startDeliveryCommand,
} from "./DeliveryCommands";
import {
  getCompletedDeliveriesQuery,
  getDeliveryAssignmentsQuery,
  getDeliveryContextQuery,
  getDeliveryRoutesQuery,
  getDeliveryStopsQuery,
} from "./DeliveryQueries";
import type { DeliveryRuntimeIdentity } from "./deliveryServiceContext";
import type { OrderFacade } from "@/order/OrderFacade";
import type { OrderSummary } from "@/order/OrderContext";
import type { KitchenExecutionFacade } from "@/kitchen/KitchenExecutionFacade";

export type ValidationVerdict =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "UNIMPLEMENTED";

export type ValidationRow = {
  id: string;
  name: string;
  expected: string;
  observed: string;
  evidence: string;
  verdict: ValidationVerdict;
};

/** Filled by tests — acta / report source of truth. */
export const DELIVERY_VALIDATION_MATRIX: ValidationRow[] = [];

function record(row: ValidationRow) {
  DELIVERY_VALIDATION_MATRIX.push(row);
  expect(row.verdict).not.toBe("FAIL");
}

function identity(
  partial: Partial<DeliveryRuntimeIdentity> = {},
): DeliveryRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["logistics", "company_admin"],
      capabilities: ["logistics.operate", "orders.read", "orders.write"],
    },
    currentUser: {
      id: "u1",
      fullName: "Alex",
      avatarUrl: null,
      locale: "es",
      phone: null,
    },
    ...partial,
  };
}

function summary(partial: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: "o1",
    week: { weekStart: "2026-08-03" },
    status: "ready_for_delivery",
    demandChannel: "individual",
    orderSource: "app",
    partyRef: {
      kind: "individual",
      id: "c1",
      displayName: "Cliente Uno",
    },
    deliveryDayPrimary: "2026-08-06",
    itemCount: 2,
    total: 20,
    currency: "EUR",
    tenantId: "t1",
    ...partial,
  };
}

function mockOrders(overrides: Partial<OrderFacade> = {}): OrderFacade {
  return {
    getOrdersReadyForDelivery: vi.fn(async () => ({
      ok: true,
      summaries: [summary()],
      errors: [],
    })),
    completeDelivery: vi.fn(async () => ({
      ok: true,
      orderId: "o1",
      status: "delivered",
      context: null,
      errors: [],
    })),
    searchOrders: vi.fn(async () => ({
      ok: true,
      summaries: [summary({ status: "delivered" })],
      errors: [],
    })),
    ...overrides,
  } as unknown as OrderFacade;
}

function mockKitchen(
  overrides: Partial<KitchenExecutionFacade> = {},
): KitchenExecutionFacade {
  return {
    getCompletedExecution: vi.fn(async () => ({
      ok: true,
      context: null,
      errors: [],
    })),
    ...overrides,
  } as unknown as KitchenExecutionFacade;
}

describe("OPERATIONAL-006 Delivery Engineering Certification Matrix", () => {
  afterEach(() => {
    resetDeliveryFacade();
  });

  it("V01 Delivery Context", async () => {
    const orders = mockOrders();
    const facade = new DeliveryFacade({
      orders,
      kitchen: mockKitchen(),
    });
    const result = await facade.getDeliveryContext(
      identity(),
      getDeliveryContextQuery({ operationalDay: "2026-08-06" }),
    );
    const ok =
      result.ok &&
      result.context?.operationalDay === "2026-08-06" &&
      result.context.assignments.length === 1 &&
      result.context.assignments[0]?.id === "assignment:o1" &&
      result.context.assignments[0]?.commitmentRef === "o1" &&
      (orders.getOrdersReadyForDelivery as ReturnType<typeof vi.fn>).mock.calls
        .length === 1;
    record({
      id: "V01",
      name: "Delivery Context",
      expected: "ok · DeliveryAssignments from OrderFacade · not Order rows",
      observed: `ok=${result.ok} assignments=${result.context?.assignments.length} id=${result.context?.assignments[0]?.id}`,
      evidence: "getDeliveryContext → OrderFacade.getOrdersReadyForDelivery",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V02 Delivery Assignments", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders({
        getOrdersReadyForDelivery: vi.fn(async () => ({
          ok: true,
          summaries: [
            summary({ id: "o1", status: "ready_for_delivery" }),
            summary({ id: "o2", status: "out_for_delivery" }),
          ],
          errors: [],
        })),
      }),
      kitchen: mockKitchen(),
    });
    const all = await facade.getDeliveryAssignments(
      identity(),
      getDeliveryAssignmentsQuery({ operationalDay: "2026-08-06" }),
    );
    const filtered = await facade.getDeliveryAssignments(
      identity(),
      getDeliveryAssignmentsQuery({
        operationalDay: "2026-08-06",
        status: "InTransit",
      }),
    );
    const ok =
      all.ok &&
      all.context?.assignments.length === 2 &&
      filtered.ok &&
      filtered.context?.assignments.length === 1 &&
      filtered.context.assignments[0]?.commitmentRef === "o2";
    record({
      id: "V02",
      name: "Delivery Assignments",
      expected: "assignment list · filter by DeliveryStatus",
      observed: `all=${all.context?.assignments.length} inTransit=${filtered.context?.assignments.length}`,
      evidence: "getDeliveryAssignments",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V03 Delivery Stops", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const result = await facade.getDeliveryStops(
      identity(),
      getDeliveryStopsQuery({ operationalDay: "2026-08-06" }),
    );
    const ok =
      result.ok &&
      result.context?.stops.length === 1 &&
      result.context.stops[0]?.destinationLabel === "Cliente Uno" &&
      result.context.stops[0]?.assignmentIds[0] === "assignment:o1";
    record({
      id: "V03",
      name: "Delivery Stops",
      expected: "stops from assignments · destination labels · not GPS",
      observed: `stops=${result.context?.stops.length} label=${result.context?.stops[0]?.destinationLabel}`,
      evidence: "getDeliveryStops",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V04 ConfirmDelivery", async () => {
    const orders = mockOrders();
    const facade = new DeliveryFacade({
      orders,
      kitchen: mockKitchen(),
    });
    const result = await facade.confirmDelivery(
      identity(),
      confirmDeliveryCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
        note: "ok",
      }),
    );
    const ok =
      result.ok &&
      result.status === "Confirmed" &&
      result.confirmation?.outcome === "success" &&
      (orders.completeDelivery as ReturnType<typeof vi.fn>).mock.calls
        .length === 1;
    record({
      id: "V04",
      name: "ConfirmDelivery",
      expected: "ok · Confirmed · composes OrderFacade.completeDelivery",
      observed: `ok=${result.ok} status=${result.status} outcome=${result.confirmation?.outcome}`,
      evidence: "confirmDelivery",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V05 GetCompletedDeliveries", async () => {
    const orders = mockOrders();
    const kitchen = mockKitchen();
    const facade = new DeliveryFacade({ orders, kitchen });
    const result = await facade.getCompletedDeliveries(
      identity(),
      getCompletedDeliveriesQuery({ operationalDay: "2026-08-06" }),
    );
    const ok =
      result.ok &&
      result.context?.assignments[0]?.status === "Confirmed" &&
      (orders.searchOrders as ReturnType<typeof vi.fn>).mock.calls.length ===
        1 &&
      (kitchen.getCompletedExecution as ReturnType<typeof vi.fn>).mock.calls
        .length === 1;
    record({
      id: "V05",
      name: "GetCompletedDeliveries",
      expected: "ok · searchOrders(delivered) + Kitchen completed touch",
      observed: `ok=${result.ok} status=${result.context?.assignments[0]?.status} kitchenTouch=${(kitchen.getCompletedExecution as ReturnType<typeof vi.fn>).mock.calls.length}`,
      evidence: "getCompletedDeliveries",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V06 AssignDelivery (expected UNIMPLEMENTED)", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const result = await facade.assignDelivery(
      identity(),
      assignDeliveryCommand({
        operationalDay: "2026-08-06",
        commitmentRef: "o1",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V06",
      name: "AssignDelivery",
      expected: "UNIMPLEMENTED (assignment substrate gap)",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "assignDelivery",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V07 StartDelivery (expected UNIMPLEMENTED)", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const result = await facade.startDelivery(
      identity(),
      startDeliveryCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V07",
      name: "StartDelivery",
      expected: "UNIMPLEMENTED (InTransit-only substrate gap)",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "startDelivery",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V08 ReportDeliveryException (expected UNIMPLEMENTED)", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const result = await facade.reportDeliveryException(
      identity(),
      reportDeliveryExceptionCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
        code: "REFUSED",
        message: "customer absent",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V08",
      name: "ReportDeliveryException",
      expected: "UNIMPLEMENTED",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "reportDeliveryException",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V09 CloseDelivery (expected UNIMPLEMENTED)", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const result = await facade.closeDelivery(
      identity(),
      closeDeliveryCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V09",
      name: "CloseDelivery",
      expected: "UNIMPLEMENTED",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "closeDelivery",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V10 GetDeliveryRoutes (expected UNIMPLEMENTED)", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const result = await facade.getDeliveryRoutes(
      identity(),
      getDeliveryRoutesQuery({ operationalDay: "2026-08-06" }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V10",
      name: "GetDeliveryRoutes",
      expected: "UNIMPLEMENTED (route planning substrate gap)",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "getDeliveryRoutes",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V11 OrderFacade integration", async () => {
    const orders = mockOrders();
    const facade = new DeliveryFacade({
      orders,
      kitchen: mockKitchen(),
    });
    await facade.getDeliveryContext(
      identity(),
      getDeliveryContextQuery({ operationalDay: "2026-08-06" }),
    );
    await facade.confirmDelivery(
      identity(),
      confirmDeliveryCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
      }),
    );
    await facade.getCompletedDeliveries(
      identity(),
      getCompletedDeliveriesQuery({ operationalDay: "2026-08-06" }),
    );
    const readyCalls = (
      orders.getOrdersReadyForDelivery as ReturnType<typeof vi.fn>
    ).mock.calls.length;
    const completeCalls = (orders.completeDelivery as ReturnType<typeof vi.fn>)
      .mock.calls.length;
    const searchCalls = (orders.searchOrders as ReturnType<typeof vi.fn>).mock
      .calls.length;
    const ok = readyCalls >= 2 && completeCalls === 1 && searchCalls === 1;
    record({
      id: "V11",
      name: "OrderFacade integration",
      expected: "Context/Confirm/Completed only via OrderFacade",
      observed: `ready=${readyCalls} complete=${completeCalls} search=${searchCalls}`,
      evidence: "injected OrderFacade spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V12 KitchenExecutionFacade integration", async () => {
    const kitchen = mockKitchen();
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen,
    });
    await facade.getCompletedDeliveries(
      identity(),
      getCompletedDeliveriesQuery({ operationalDay: "2026-08-06" }),
    );
    const touch = (kitchen.getCompletedExecution as ReturnType<typeof vi.fn>)
      .mock.calls.length;
    const ok = touch === 1;
    record({
      id: "V12",
      name: "KitchenExecutionFacade integration",
      expected: "Completed deliveries touch KitchenExecutionFacade",
      observed: `getCompletedExecution=${touch}`,
      evidence: "injected KitchenExecutionFacade spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V13 Identity integration", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const denied = await facade.getDeliveryContext(
      identity({ session: { present: false, userId: null } }),
      getDeliveryContextQuery({ operationalDay: "2026-08-06" }),
    );
    const mismatch = await facade.getDeliveryContext(
      identity({ tenant: null }),
      getDeliveryContextQuery({ operationalDay: "2026-08-06" }),
    );
    const ok =
      !denied.ok &&
      denied.errors[0]?.code === "PERMISSION_DENIED" &&
      !mismatch.ok &&
      mismatch.errors[0]?.code === "TENANT_MISMATCH";
    record({
      id: "V13",
      name: "Identity integration",
      expected: "AUTH / TENANT errors via Facade",
      observed: `denied=${denied.errors[0]?.code} mismatch=${mismatch.errors[0]?.code}`,
      evidence: "requireSession",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V14 Permission model", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const reader = identity({
      permissions: {
        roles: ["support"],
        capabilities: ["orders.read"],
      },
    });
    const ctx = await facade.getDeliveryContext(
      reader,
      getDeliveryContextQuery({ operationalDay: "2026-08-06" }),
    );
    const ok =
      ctx.ok &&
      ctx.context?.permissions.canViewEvidence === true &&
      ctx.context.permissions.canAssign === false &&
      ctx.context.permissions.canConfirm === false;
    record({
      id: "V14",
      name: "Permission model",
      expected: "canAssign / canConfirm / canViewEvidence from Identity caps",
      observed: `assign=${ctx.context?.permissions.canAssign} confirm=${ctx.context?.permissions.canConfirm} evidence=${ctx.context?.permissions.canViewEvidence}`,
      evidence: "deliveryCapabilityBitsFromIdentity",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V15 Repository delegation (Order + Kitchen Facades only)", async () => {
    const orders = mockOrders();
    const kitchen = mockKitchen();
    const facade = new DeliveryFacade({ orders, kitchen });
    await facade.getDeliveryContext(
      identity(),
      getDeliveryContextQuery({ operationalDay: "2026-08-06" }),
    );
    await facade.getCompletedDeliveries(
      identity(),
      getCompletedDeliveriesQuery({ operationalDay: "2026-08-06" }),
    );
    const src = readFileSync(
      resolve(process.cwd(), "src/delivery/DeliveryFacade.ts"),
      "utf8",
    );
    const ok =
      (orders.getOrdersReadyForDelivery as ReturnType<typeof vi.fn>).mock.calls
        .length >= 1 &&
      (kitchen.getCompletedExecution as ReturnType<typeof vi.fn>).mock.calls
        .length === 1 &&
      src.includes("OrderFacade") &&
      src.includes("KitchenExecutionFacade") &&
      !src.includes("ProductionFacade") &&
      !src.includes("supabase") &&
      !src.includes(".from(") &&
      !src.includes("@/modules/");
    record({
      id: "V15",
      name: "Repository delegation",
      expected: "OrderFacade + KitchenExecutionFacade · no Production · no storage",
      observed: `order=${src.includes("OrderFacade")} kitchen=${src.includes("KitchenExecutionFacade")} noProd=${!src.includes("ProductionFacade")} noStorage=${!src.includes("supabase")}`,
      evidence: "DeliveryFacade.ts + spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V16 Foundation Laws 001–006-A", async () => {
    const indexSrc = readFileSync(
      resolve(process.cwd(), "src/delivery/index.ts"),
      "utf8",
    );
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/delivery/DeliveryFacade.ts"),
      "utf8",
    );
    const lockSrc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    const dictSrc = readFileSync(
      resolve(
        process.cwd(),
        "docs/00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md",
      ),
      "utf8",
    );
    const ok =
      indexSrc.includes("LAW") &&
      facadeSrc.includes("OrderFacade") &&
      facadeSrc.includes("LAW 006") &&
      facadeSrc.includes("compromisos operativos deben entregarse") &&
      lockSrc.includes("FOUNDATION LAW 006") &&
      dictSrc.includes("Delivery never drives") &&
      dictSrc.includes("drives / cooks / bills");
    record({
      id: "V16",
      name: "Foundation Laws 001–006-A",
      expected: "Facade-only · one Delivery question · dictionary lock",
      observed: `facadeQ=${facadeSrc.includes("entregarse")} dict=${dictSrc.includes("Delivery never drives")}`,
      evidence: "index · facade · FOUNDATION_LOCK · LANGUAGE_DICTIONARY",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V17 Capability dependency integrity", async () => {
    const registry = readFileSync(
      resolve(process.cwd(), "docs/00-status/CAPABILITY_REGISTRY.md"),
      "utf8",
    );
    const capability = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/DELIVERY_CAPABILITY.md"),
      "utf8",
    );
    const canonicalBlock = capability.slice(
      capability.indexOf("Canonical question"),
      capability.indexOf("Canonical question") + 500,
    );
    const ok =
      registry.includes("### 006 · Delivery") &&
      (registry.includes("OrderFacade") ||
        registry.includes("KitchenExecutionFacade")) &&
      capability.includes("OrderFacade") &&
      capability.includes("KitchenExecutionFacade") &&
      capability.includes(
        "¿Qué compromisos operativos deben entregarse ahora",
      ) &&
      canonicalBlock.includes("entregarse ahora") &&
      !canonicalBlock.includes("¿Qué trabajo debe ejecutarse ahora?") &&
      !canonicalBlock.includes("¿Qué trabajo puede cerrarse y facturarse?");
    record({
      id: "V17",
      name: "Capability dependency integrity",
      expected: "Consumes Order+Kitchen · provides Billing · one question",
      observed: `registry=${registry.includes("### 006 · Delivery")} canonicalDelivery=${canonicalBlock.includes("entregarse ahora")}`,
      evidence: "CAPABILITY_REGISTRY · DELIVERY_CAPABILITY",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V18 LAW 006-A — Delivery never answers Kitchen / Billing questions", async () => {
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/delivery/DeliveryFacade.ts"),
      "utf8",
    );
    const commandsSrc = readFileSync(
      resolve(process.cwd(), "src/delivery/DeliveryCommands.ts"),
      "utf8",
    );
    const ok =
      !facadeSrc.includes("calculateInvoice") &&
      !facadeSrc.includes("prepareMeals") &&
      !facadeSrc.includes("assignKitchen") &&
      !facadeSrc.includes("GenerateProductionPlan") &&
      !commandsSrc.includes("CreateOrder") &&
      !commandsSrc.includes("CompleteExecution") &&
      facadeSrc.includes("Never drives") &&
      facadeSrc.includes("Never cooks") &&
      facadeSrc.includes("Never bills") &&
      facadeSrc.includes("compromisos operativos deben entregarse");
    record({
      id: "V18",
      name: "LAW 006-A question boundary",
      expected: "Delivery never drives / cooks / bills · never Kitchen/Billing Q",
      observed: `neverDrives=${facadeSrc.includes("Never drives")} hasDeliveryQ=${facadeSrc.includes("entregarse")}`,
      evidence: "DeliveryFacade · DeliveryCommands",
      verdict: ok ? "PASS" : "FAIL",
    });
  });
});
