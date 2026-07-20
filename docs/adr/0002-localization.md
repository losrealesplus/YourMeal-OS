# ADR 0002 — Centralized localization

## Status

Accepted — permanent

## Context

The product supports language, locale, currency, timezone, date/time formats, and unit systems for weight, volume, distance, and temperature. Ad-hoc `toLocaleString()` in components breaks tenant and user overrides.

## Decision

Localization is centralized.

- Implementation: `src/lib/localization.ts` + `useFmt()` / `useLocalization()`.
- Supported axes: language, locale, currency, timezone, date format, time format, weight, volume, distance, temperature.
- **Never** call `toLocaleString()` (or raw `Intl.*` for display) inside React components.
- **Always** use `useFmt()` in UI; `getFormatter()` in non-React code.

Merge order: user overrides → tenant defaults → country preset → fallback.

## Consequences

- One place to fix formatting bugs.
- Components stay presentation-only.
- Adding a locale does not require hunting scattered formatters.
