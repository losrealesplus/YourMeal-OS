/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { DayPicker } from "./day-picker";

describe("DayPicker component (Real Dates & Multi-Day Badges)", () => {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie"];
  const dates = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"];

  it("renders real calendar day numbers (19..23) instead of artificial indices (01..05)", () => {
    const html = renderToString(
      <DayPicker
        days={days}
        dates={dates}
        activeIndex={0}
        onSelect={vi.fn()}
      />,
    );

    expect(html).toContain("Lun");
    expect(html).toContain("19");
    expect(html).toContain("Mar");
    expect(html).toContain("20");
    expect(html).toContain("Mié");
    expect(html).toContain("21");
    expect(html).toContain("Jue");
    expect(html).toContain("22");
    expect(html).toContain("Vie");
    expect(html).toContain("23");
    expect(html).toContain('aria-pressed="true"');

    // Must NOT contain 01..05 when real dates are supplied
    expect(html).not.toContain(">01<");
    expect(html).not.toContain(">02<");
    expect(html).not.toContain(">03<");
  });

  it("renders selection badge count when day has dishes added", () => {
    const mealCounts = {
      "2026-10-19": 2, // 2 dishes on Monday
      "2026-10-20": 1, // 1 dish on Tuesday
    };

    const html = renderToString(
      <DayPicker
        days={days}
        dates={dates}
        mealCounts={mealCounts}
        activeIndex={0}
        onSelect={vi.fn()}
      />,
    );

    expect(html).toContain("2 platos seleccionados");
    expect(html).toContain("1 platos seleccionados");
    expect(html).toContain(">2<");
    expect(html).toContain(">1<");
  });

  it("marks past days as disabled when isDayDisabled returns true", () => {
    const isDayDisabled = (i: number) => i === 0; // Monday disabled

    const html = renderToString(
      <DayPicker
        days={days}
        dates={dates}
        activeIndex={1}
        onSelect={vi.fn()}
        isDayDisabled={isDayDisabled}
      />,
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-disabled="true"');
  });

  it("falls back to padded index when dates array is not supplied", () => {
    const html = renderToString(
      <DayPicker
        days={["Lun", "Mar"]}
        activeIndex={0}
        onSelect={vi.fn()}
      />,
    );

    expect(html).toContain("01");
    expect(html).toContain("02");
  });
});
