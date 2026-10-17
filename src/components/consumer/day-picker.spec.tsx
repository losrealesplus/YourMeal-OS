import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DayPicker } from "./day-picker";

describe("DayPicker", () => {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  it("renders all days and indicates active day", () => {
    const onSelect = vi.fn();
    const html = renderToStaticMarkup(
      <DayPicker days={days} activeIndex={2} onSelect={onSelect} />,
    );
    expect(html).toContain("Lun");
    expect(html).toContain("Mar");
    expect(html).toContain("Mié");
    expect(html).toContain('aria-pressed="true"');
  });

  it("disables days when isDayDisabled returns true", () => {
    const onSelect = vi.fn();
    // Disable first two days (Lun, Mar)
    const isDayDisabled = (i: number) => i < 2;

    const html = renderToStaticMarkup(
      <DayPicker
        days={days}
        activeIndex={2}
        onSelect={onSelect}
        isDayDisabled={isDayDisabled}
      />,
    );

    // Should have disabled attributes on disabled buttons
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("opacity-30 cursor-not-allowed");
  });
});
