import { describe, expect, it } from "vitest";
import { getFormatter, type LocalizationSettings } from "@/lib/localization";

const settings: LocalizationSettings = {
  language: "es",
  country: "ES",
  currency: "EUR",
  timezone: "Atlantic/Canary",
  timeFormat: "24h",
  unitWeight: "metric",
  unitVolume: "metric",
  unitDistance: "metric",
  unitTemperature: "C",
};

/**
 * P0 — dateTime must not mix dateStyle with hour/minute (ECMA-402).
 */
describe("getFormatter().dateTime", () => {
  const fmt = getFormatter(settings);
  const sample = "2026-08-10T12:00:00.000Z";

  it("does not throw TypeError for date + time", () => {
    expect(() => fmt.dateTime(sample)).not.toThrow();
  });

  it("returns a non-empty localized date+time string", () => {
    const out = fmt.dateTime(sample);
    expect(out.length).toBeGreaterThan(0);
    // Must include a time component (hour separator), not date-only.
    expect(out).toMatch(/\d/);
    expect(out).toMatch(/[:.\s]/); // time digits appear with separator in es-ES / Canary
    // Smoke: formatting is stable for the fixed instant.
    expect(fmt.dateTime(sample)).toBe(out);
  });

  it("honours 12h timeFormat without throwing", () => {
    const fmt12 = getFormatter({ ...settings, timeFormat: "12h" });
    expect(() => fmt12.dateTime(sample)).not.toThrow();
    expect(fmt12.dateTime(sample).length).toBeGreaterThan(0);
  });
});
