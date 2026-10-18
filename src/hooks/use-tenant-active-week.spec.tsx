/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { useTenantActiveWeek } from "./use-tenant-active-week";

vi.mock("@/identity/active-tenant-slug", () => ({
  useActiveTenantSlug: () => "eatclean",
}));

describe("useTenantActiveWeek hook", () => {
  it("renders active week and active delivery days for EatClean", () => {
    let captured: any = null;

    function Probe() {
      const activeWeek = useTenantActiveWeek();
      captured = activeWeek;
      return (
        <div data-testid="week">
          <span>{activeWeek.weekStart}</span>
          <span>{activeWeek.activeDeliveryDates.join(",")}</span>
        </div>
      );
    }

    const html = renderToString(<Probe />);
    expect(html).toContain(captured.weekStart);
    expect(captured.tenantSlug).toBe("eatclean");
    expect(captured.config.timezone).toBe("Atlantic/Canary");
    expect(captured.config.activeDeliveryDays).toEqual([1, 2, 3, 4, 5]);

    // Active delivery dates should have 5 items (Monday to Friday)
    expect(captured.activeDeliveryDates).toHaveLength(5);
    expect(captured.allWeekDates).toHaveLength(7);
    expect(captured.weekOffset).toBe(0);
    expect(captured.canGoPrev).toBe(false);
    expect(captured.canGoNext).toBe(true);
  });
});
