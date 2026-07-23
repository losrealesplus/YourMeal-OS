import { describe, expect, it } from "vitest";
import {
  buildOperationalTimeline,
  nextDeliveryStatuses,
  nextKitchenStatuses,
  timelineReachedIndex,
} from "./operational-status";

describe("operational status transitions", () => {
  it("kitchen spine", () => {
    expect(nextKitchenStatuses("confirmed")).toEqual(["in_production"]);
    expect(nextKitchenStatuses("in_production")).toEqual(["prepared"]);
    expect(nextKitchenStatuses("prepared")).toEqual(["ready_for_delivery"]);
    expect(nextKitchenStatuses("ready_for_delivery")).toEqual([]);
  });

  it("delivery spine", () => {
    expect(nextDeliveryStatuses("ready_for_delivery")).toEqual([
      "out_for_delivery",
    ]);
    expect(nextDeliveryStatuses("out_for_delivery")).toEqual([
      "delivered",
      "delivery_issue",
    ]);
    expect(nextDeliveryStatuses("delivery_issue")).toEqual(["out_for_delivery"]);
  });

  it("timeline index", () => {
    expect(timelineReachedIndex("confirmed")).toBe(0);
    expect(timelineReachedIndex("delivered")).toBe(5);
    expect(timelineReachedIndex("draft")).toBe(-1);
  });

  it("buildOperationalTimeline includes created + spine", () => {
    const steps = buildOperationalTimeline("in_production");
    expect(steps[0]?.key).toBe("created");
    expect(steps[0]?.state).toBe("done");
    expect(steps.find((s) => s.key === "in_production")?.state).toBe("current");
    expect(steps.find((s) => s.key === "delivered")?.state).toBe("upcoming");
  });
});
