import { describe, expect, it } from "vitest";
import {
  buildOperationalTimeline,
  nextDeliveryStatuses,
  nextKitchenStatuses,
  timelineReachedIndex,
  operationalStatusLabel,
  STATUS_LABEL_ES,
  isOperationalRollbackEnabled,
  setOperationalRollbackEnabledForTests,
  FEATURE_OPERATIONAL_ROLLBACK_ENABLED,
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

  it("status labels in Spanish: confirmed is Confirmado", () => {
    expect(operationalStatusLabel("confirmed")).toBe("Confirmado");
    expect(STATUS_LABEL_ES.confirmed).toBe("Confirmado");
  });

  describe("operational rollback environment isolation", () => {
    it("defaults to disabled even in test environment", () => {
      expect(isOperationalRollbackEnabled()).toBe(false);
      expect(FEATURE_OPERATIONAL_ROLLBACK_ENABLED).toBe(false);
    });

    it("allows toggling rollback in test environment", () => {
      setOperationalRollbackEnabledForTests(true);
      expect(isOperationalRollbackEnabled()).toBe(true);
      setOperationalRollbackEnabledForTests(false);
      expect(isOperationalRollbackEnabled()).toBe(false);
    });

    it("reads the explicit Vite test environment flag", () => {
      const originalEnv = process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED;
      const originalNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";
        process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED = "true";
        expect(isOperationalRollbackEnabled()).toBe(true);

        process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED = "false";
        expect(isOperationalRollbackEnabled()).toBe(false);
      } finally {
        if (originalEnv !== undefined) {
          process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED = originalEnv;
        } else {
          delete process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED;
        }
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it("strictly prevents activation and throws when called in production environment", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";
        // Attempting to invoke setter in production must throw
        expect(() => setOperationalRollbackEnabledForTests(true)).toThrow(
          /estrictamente restringido a entornos de prueba/,
        );
        // Even if state was somehow true, isOperationalRollbackEnabled returns false in production
        expect(isOperationalRollbackEnabled()).toBe(false);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        setOperationalRollbackEnabledForTests(false);
      }
    });
  });
});
