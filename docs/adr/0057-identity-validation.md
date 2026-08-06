# ADR 0057 — Identity Validation

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-001 · Phase 3 (Validation)  
**Depends on:** ADR [0055](./0055-identity-capability.md) · [0056](./0056-identity-facade.md)  
**Detalle:** [IDENTITY_VALIDATION_REPORT](../10-validation/IDENTITY_VALIDATION_REPORT.md)

## Contexto

Identity Capability + Facade existen. Antes de Customers / Orders / Kitchen, Identity debe **demostrarse** (no asumirse).

## Decisión

1. Ejecutar matriz de validación automatizada (`identity-validation.spec.ts`) cubriendo unauthenticated → Doctor observe-only.  
2. Publicar acta FOPEBA con Expected / Observed / Evidence / PASS|WARNING|FAIL.  
3. Declarar Identity **engineering-certified** (14 PASS · 2 WARNING · 0 FAIL).  
4. WARNING no bloqueantes: flags live eval · `membershipId` wire.  
5. Field smoke OPPO = checklist de operador (no inventar PASS).  
6. Autorizar inicio de **OPERATIONAL-002+** (architecture) tras esta certificación engineering.  
7. Sin features, sin refactors, sin cambios Doctor.

## Consecuencias

- Operational Modules pueden comenzar el ciclo Observe→Design→Freeze.  
- Módulos que necesiten `membershipId` o flags en Identity deben cerrar V09/V10 antes de depender de ellos.  
- Tag de foundation / field smoke siguen siendo hitos de operador separados.

## Referencias

- `src/identity/identity-validation.spec.ts`  
- [IDENTITY_SMOKE_CHECKLIST](../10-validation/IDENTITY_SMOKE_CHECKLIST.md)
