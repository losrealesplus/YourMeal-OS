# ADR 0049 — Environment Contract

## Estado

**Accepted** — 2026-08-05  
**Track:** HOUSEKEEPING-003  
**Detalle:** [ENVIRONMENT_CONTRACT](../00-status/ENVIRONMENT_CONTRACT.md)

## Contexto

Tras Development Environment drivers (ADR 0048), faltaba un contrato explícito de **variables** (Supabase, flags, analytics opcionales) alineado con lo que un desarrollador debe tener en shell + `.env`. Sin contrato, los fallos por `REPLACE_ME` o claves ausentes se descubren tarde (auth, builds, smoke).

## Decisión

1. Introducir `.env.development.example` como plantilla oficial de desarrollo.  
2. Introducir `ENVIRONMENT_CONTRACT` machine-readable + `contract-driver` en `scripts/development/`.  
3. `npm run doctor:env` muestra checklist ✔/✖ (required → ERROR; optional → WARNING).  
4. Placeholders (`REPLACE_ME`) cuentan como **Missing**.  
5. No auto-escribir `.env` ni secretos.

## Consecuencias

- Onboarding: `cp .env.development.example .env` + `npm run doctor:env`.  
- Cierra la fase de infraestructura de desarrollo antes de PRODUCT-CORE-001.  
- Ampliar el contrato es un cambio versionado (ADR / tests), no folklore.
