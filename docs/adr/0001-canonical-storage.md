# ADR 0001 — Canonical storage

## Status

Accepted — permanent

## Context

YourMeal OS serves multiple locales, unit systems, and currencies. Storing presentation formats in the database causes drift, buggy conversions, and broken analytics.

## Decision

The database always stores canonical values:

| Domain | Canonical form |
|--------|----------------|
| Weight | grams |
| Volume | milliliters |
| Distance | kilometers |
| Temperature | Celsius |
| Date / time | UTC (`timestamptz` / ISO-8601 at boundaries) |
| Currency | `numeric` decimal + ISO currency code (settings) |

Localization happens only at presentation via the Localization service / `useFmt()`.

## Consequences

- Services read/write grams, ml, km, °C, UTC, decimals.
- UI never persists localized strings as source of truth.
- Reporting and AI features can assume a single unit system.
