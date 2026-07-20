/**
 * Regional presets by ISO 3166-1 alpha-2 country code.
 *
 * These are the DEFAULT regional settings applied when only a country is
 * known (e.g., inferred from the browser locale on first launch). Once a
 * tenant or user saves overrides, those win.
 */
import type { LanguageCode } from "@/i18n/languages";

export type UnitSystem = "metric" | "imperial";
export type TemperatureUnit = "C" | "F";
export type TimeFormat = "12h" | "24h";

export type RegionalDefaults = {
  country: string;
  language: LanguageCode;
  currency: string;
  timezone: string;
  timeFormat: TimeFormat;
  unitWeight: UnitSystem;
  unitVolume: UnitSystem;
  unitDistance: UnitSystem;
  unitTemperature: TemperatureUnit;
};

// Only countries we ship first-class defaults for. Any other country falls
// back to sensible metric defaults (see `getRegionalDefaults`).
export const COUNTRY_DEFAULTS: Record<string, RegionalDefaults> = {
  ES: { country: "ES", language: "es", currency: "EUR", timezone: "Europe/Madrid",       timeFormat: "24h", unitWeight: "metric",   unitVolume: "metric",   unitDistance: "metric",   unitTemperature: "C" },
  US: { country: "US", language: "en", currency: "USD", timezone: "America/New_York",    timeFormat: "12h", unitWeight: "imperial", unitVolume: "imperial", unitDistance: "imperial", unitTemperature: "F" },
  GB: { country: "GB", language: "en", currency: "GBP", timezone: "Europe/London",       timeFormat: "24h", unitWeight: "metric",   unitVolume: "metric",   unitDistance: "imperial", unitTemperature: "C" },
  DE: { country: "DE", language: "de", currency: "EUR", timezone: "Europe/Berlin",       timeFormat: "24h", unitWeight: "metric",   unitVolume: "metric",   unitDistance: "metric",   unitTemperature: "C" },
  FR: { country: "FR", language: "fr", currency: "EUR", timezone: "Europe/Paris",        timeFormat: "24h", unitWeight: "metric",   unitVolume: "metric",   unitDistance: "metric",   unitTemperature: "C" },
  IT: { country: "IT", language: "it", currency: "EUR", timezone: "Europe/Rome",         timeFormat: "24h", unitWeight: "metric",   unitVolume: "metric",   unitDistance: "metric",   unitTemperature: "C" },
  PT: { country: "PT", language: "pt", currency: "EUR", timezone: "Europe/Lisbon",       timeFormat: "24h", unitWeight: "metric",   unitVolume: "metric",   unitDistance: "metric",   unitTemperature: "C" },
  BR: { country: "BR", language: "pt", currency: "BRL", timezone: "America/Sao_Paulo",   timeFormat: "24h", unitWeight: "metric",   unitVolume: "metric",   unitDistance: "metric",   unitTemperature: "C" },
  MX: { country: "MX", language: "es", currency: "MXN", timezone: "America/Mexico_City", timeFormat: "24h", unitWeight: "metric",   unitVolume: "metric",   unitDistance: "metric",   unitTemperature: "C" },
};

export const FALLBACK_DEFAULTS: RegionalDefaults = {
  country: "ES",
  language: "en",
  currency: "EUR",
  timezone: "UTC",
  timeFormat: "24h",
  unitWeight: "metric",
  unitVolume: "metric",
  unitDistance: "metric",
  unitTemperature: "C",
};

export function getRegionalDefaults(country?: string | null): RegionalDefaults {
  if (!country) return FALLBACK_DEFAULTS;
  return COUNTRY_DEFAULTS[country.toUpperCase()] ?? FALLBACK_DEFAULTS;
}

/**
 * Best-effort country inference from a browser locale like "en-US" or "es-ES".
 * Returns undefined when the locale has no region subtag.
 */
export function inferCountryFromLocale(locale: string | undefined): string | undefined {
  if (!locale) return undefined;
  const parts = locale.split("-");
  const region = parts[1]?.toUpperCase();
  if (region && /^[A-Z]{2}$/.test(region)) return region;
  return undefined;
}
