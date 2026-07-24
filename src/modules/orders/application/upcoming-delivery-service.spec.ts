import { describe, expect, it } from "vitest";
import {
  actionsForPhase,
  phaseFromStatus,
  selectUpcomingDelivery,
  type UpcomingCandidate,
} from "../domain/upcoming-delivery";

function candidate(
  partial: Partial<UpcomingCandidate> & Pick<UpcomingCandidate, "id" | "status">,
): UpcomingCandidate {
  return {
    weekStart: "2026-07-20",
    total: 42.9,
    deliveryDate: "2026-07-22",
    itemCount: 5,
    address: { label: "Casa", line: "Calle 1", city: "Adeje" },
    timeWindowLabel: null,
    ...partial,
  };
}

describe("upcoming delivery selection", () => {
  it("returns none when empty", () => {
    expect(selectUpcomingDelivery([])).toEqual({ kind: "none" });
  });

  it("skips cancelled and delivered", () => {
    const result = selectUpcomingDelivery([
      candidate({ id: "a", status: "cancelled", deliveryDate: "2026-07-21" }),
      candidate({ id: "b", status: "delivered", deliveryDate: "2026-07-20" }),
      candidate({ id: "c", status: "confirmed", deliveryDate: "2026-07-28" }),
    ]);
    expect(result.kind).toBe("upcoming");
    if (result.kind === "upcoming") {
      expect(result.delivery.orderId).toBe("c");
      expect(result.delivery.phase).toBe("confirmed");
    }
  });

  it("picks earliest delivery date among eligible", () => {
    const result = selectUpcomingDelivery([
      candidate({ id: "later", status: "confirmed", deliveryDate: "2026-07-30" }),
      candidate({
        id: "sooner",
        status: "in_production",
        deliveryDate: "2026-07-22",
      }),
    ]);
    expect(result.kind).toBe("upcoming");
    if (result.kind === "upcoming") {
      expect(result.delivery.orderId).toBe("sooner");
      expect(result.delivery.phase).toBe("preparing");
    }
  });

  it("maps draft to scheduled with modify action", () => {
    expect(phaseFromStatus("draft")).toBe("scheduled");
    expect(actionsForPhase("scheduled")).toEqual(["view", "modify"]);
  });

  it("maps out_for_delivery to track action", () => {
    expect(actionsForPhase("out_for_delivery")).toEqual(["track"]);
  });
});
