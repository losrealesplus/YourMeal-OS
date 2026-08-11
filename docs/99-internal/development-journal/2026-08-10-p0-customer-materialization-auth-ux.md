# 2026-08-10 — P0 Customer materialization + Auth error UX

## Qué

Cierre del hueco post-approval: `ActiveTenant` → `ensure_individual_customer` → `customers`.
Clasificación humana de errores de `signInWithPassword` en Customer App.

## Por qué

E2E min-indispensable demostró Auth→Deployment→pending→approved→ActiveTenant GREEN,
pero `customers` ausente (RED). Auth inválido no daba feedback usable.

## Cómo

- `CustomerMaterializationService.ensureCustomerForActiveTenant` (RPC existente).
- Llamada desde `TenantStage` solo con `tenantId` (ActiveTenant = approved).
- `classifyCustomerAuthError` + i18n + alert inline en `/auth`.

## Evidencia

`docs/99-internal/evidence/p0-customer-mat-20260810181016/`

## Verdict

CUSTOMER GREEN — no continuar a Menu/Order en esta unidad.
