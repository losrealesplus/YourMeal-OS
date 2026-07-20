/**
 * Centralized Localization Service.
 *
 * Every price, date, quantity, temperature or distance displayed anywhere in
 * the app MUST go through this service. Never call `toLocaleString`, `Date`
 * math, `Intl.*` or hardcoded string concatenation from components — request
 * a formatter from `useLocalization()` (or `getFormatter()` in non-React
 * code) so tenant + user overrides always take effect.
 */
import type { LanguageCode } from "@/i18n/languages";
import type {
  RegionalDefaults,
  TemperatureUnit,
  TimeFormat,
  UnitSystem,
} from "@/i18n/regional-defaults";

export type LocalizationSettings = {
  language: LanguageCode;
  country: string;
  currency: string;
  timezone: string;
  timeFormat: TimeFormat;
  unitWeight: UnitSystem;
  unitVolume: UnitSystem;
  unitDistance: UnitSystem;
  unitTemperature: TemperatureUnit;
};

export type DateStyle = "short" | "medium" | "long" | "full";

// ---------------------------------------------------------------------------
// Merge helpers
// ---------------------------------------------------------------------------

type PartialSettings = Partial<Record<keyof LocalizationSettings, string | null | undefined>>;

/**
 * Merge order (highest priority wins):
 *   user overrides → tenant defaults → country preset → fallback
 * Any NULL / undefined field defers to the next layer.
 */
export function mergeSettings(
  user: PartialSettings | null | undefined,
  tenant: PartialSettings | null | undefined,
  countryPreset: RegionalDefaults,
): LocalizationSettings {
  const pick = <K extends keyof LocalizationSettings>(
    key: K,
    presetKey: keyof RegionalDefaults,
  ): LocalizationSettings[K] => {
    const u = user?.[key];
    if (u) return u as LocalizationSettings[K];
    const t = tenant?.[key];
    if (t) return t as LocalizationSettings[K];
    return countryPreset[presetKey] as LocalizationSettings[K];
  };

  return {
    language: pick("language", "language"),
    country: pick("country", "country"),
    currency: pick("currency", "currency"),
    timezone: pick("timezone", "timezone"),
    timeFormat: pick("timeFormat", "timeFormat"),
    unitWeight: pick("unitWeight", "unitWeight"),
    unitVolume: pick("unitVolume", "unitVolume"),
    unitDistance: pick("unitDistance", "unitDistance"),
    unitTemperature: pick("unitTemperature", "unitTemperature"),
  };
}

// ---------------------------------------------------------------------------
// BCP 47 locale
// ---------------------------------------------------------------------------

export function toBcp47(s: LocalizationSettings): string {
  return `${s.language}-${s.country}`;
}

// ---------------------------------------------------------------------------
// Formatter factory
// ---------------------------------------------------------------------------

export type Formatter = ReturnType<typeof getFormatter>;

export function getFormatter(settings: LocalizationSettings) {
  const bcp47 = toBcp47(settings);

  // Cache Intl instances — they're expensive to construct in hot paths.
  const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
  const memo = <T extends Intl.NumberFormat | Intl.DateTimeFormat>(
    key: string,
    build: () => T,
  ): T => {
    const hit = cache.get(key);
    if (hit) return hit as T;
    const v = build();
    cache.set(key, v);
    return v;
  };

  // ---- Numbers -----------------------------------------------------------
  const number = (value: number, opts?: Intl.NumberFormatOptions) =>
    memo(`n:${JSON.stringify(opts ?? {})}`, () =>
      new Intl.NumberFormat(bcp47, opts),
    ).format(value);

  const percent = (value: number, fractionDigits = 0) =>
    number(value, {
      style: "percent",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });

  // ---- Currency ----------------------------------------------------------
  const currency = (
    value: number,
    opts?: { currency?: string; fractionDigits?: number },
  ) => {
    const cur = opts?.currency ?? settings.currency;
    const key = `c:${cur}:${opts?.fractionDigits ?? "d"}`;
    return memo(key, () =>
      new Intl.NumberFormat(bcp47, {
        style: "currency",
        currency: cur,
        minimumFractionDigits: opts?.fractionDigits,
        maximumFractionDigits: opts?.fractionDigits,
      }),
    ).format(value);
  };

  // ---- Dates & times -----------------------------------------------------
  const dateOpts = (style: DateStyle): Intl.DateTimeFormatOptions => ({
    dateStyle: style,
    timeZone: settings.timezone,
  });

  const timeOpts = (withSeconds = false): Intl.DateTimeFormatOptions => ({
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: settings.timeFormat === "12h",
    timeZone: settings.timezone,
  });

  const toDate = (input: Date | string | number): Date =>
    input instanceof Date ? input : new Date(input);

  const date = (value: Date | string | number, style: DateStyle = "medium") =>
    memo(`d:${style}`, () => new Intl.DateTimeFormat(bcp47, dateOpts(style))).format(toDate(value));

  const time = (value: Date | string | number, withSeconds = false) =>
    memo(`t:${withSeconds}`, () => new Intl.DateTimeFormat(bcp47, timeOpts(withSeconds))).format(toDate(value));

  const dateTime = (
    value: Date | string | number,
    style: DateStyle = "medium",
  ) =>
    memo(`dt:${style}`, () =>
      new Intl.DateTimeFormat(bcp47, {
        ...dateOpts(style),
        ...timeOpts(false),
      }),
    ).format(toDate(value));

  const relativeTime = (
    value: Date | string | number,
    now: Date = new Date(),
  ) => {
    const rtf = new Intl.RelativeTimeFormat(bcp47, { numeric: "auto" });
    const diffMs = toDate(value).getTime() - now.getTime();
    const abs = Math.abs(diffMs);
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ["year", 1000 * 60 * 60 * 24 * 365],
      ["month", 1000 * 60 * 60 * 24 * 30],
      ["day", 1000 * 60 * 60 * 24],
      ["hour", 1000 * 60 * 60],
      ["minute", 1000 * 60],
      ["second", 1000],
    ];
    for (const [unit, ms] of units) {
      if (abs >= ms || unit === "second") {
        return rtf.format(Math.round(diffMs / ms), unit);
      }
    }
    return rtf.format(0, "second");
  };

  // ---- Units -------------------------------------------------------------
  // Canonical storage assumption: grams, milliliters, kilometers, Celsius.
  const weight = (grams: number, opts?: { fractionDigits?: number }) => {
    const digits = opts?.fractionDigits;
    if (settings.unitWeight === "imperial") {
      const oz = grams / 28.3495;
      return oz >= 16
        ? number(oz / 16, { style: "unit", unit: "pound", unitDisplay: "short", maximumFractionDigits: digits ?? 2 })
        : number(oz, { style: "unit", unit: "ounce", unitDisplay: "short", maximumFractionDigits: digits ?? 1 });
    }
    return grams >= 1000
      ? number(grams / 1000, { style: "unit", unit: "kilogram", unitDisplay: "short", maximumFractionDigits: digits ?? 2 })
      : number(grams, { style: "unit", unit: "gram", unitDisplay: "short", maximumFractionDigits: digits ?? 0 });
  };

  const volume = (milliliters: number, opts?: { fractionDigits?: number }) => {
    const digits = opts?.fractionDigits;
    if (settings.unitVolume === "imperial") {
      const flOz = milliliters / 29.5735;
      return number(flOz, { style: "unit", unit: "fluid-ounce", unitDisplay: "short", maximumFractionDigits: digits ?? 1 });
    }
    return milliliters >= 1000
      ? number(milliliters / 1000, { style: "unit", unit: "liter", unitDisplay: "short", maximumFractionDigits: digits ?? 2 })
      : number(milliliters, { style: "unit", unit: "milliliter", unitDisplay: "short", maximumFractionDigits: digits ?? 0 });
  };

  const distance = (kilometers: number, opts?: { fractionDigits?: number }) => {
    const digits = opts?.fractionDigits ?? 1;
    if (settings.unitDistance === "imperial") {
      return number(kilometers * 0.621371, { style: "unit", unit: "mile", unitDisplay: "short", maximumFractionDigits: digits });
    }
    return number(kilometers, { style: "unit", unit: "kilometer", unitDisplay: "short", maximumFractionDigits: digits });
  };

  const temperature = (celsius: number, opts?: { fractionDigits?: number }) => {
    const digits = opts?.fractionDigits ?? 0;
    if (settings.unitTemperature === "F") {
      return number(celsius * 9 / 5 + 32, { style: "unit", unit: "fahrenheit", unitDisplay: "short", maximumFractionDigits: digits });
    }
    return number(celsius, { style: "unit", unit: "celsius", unitDisplay: "short", maximumFractionDigits: digits });
  };

  return {
    settings,
    bcp47,
    number,
    percent,
    currency,
    date,
    time,
    dateTime,
    relativeTime,
    weight,
    volume,
    distance,
    temperature,
  };
}
