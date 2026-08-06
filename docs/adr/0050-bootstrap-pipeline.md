# ADR 0050 — Bootstrap Pipeline

## Estado

**Accepted** — 2026-08-06  
**Track:** PRODUCT-CORE-001 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [BOOTSTRAP_PIPELINE](../05-architecture/BOOTSTRAP_PIPELINE.md)

> **Nota de numeración:** el prompt de kickoff pedía ADR-0049, pero **0049** ya es [Environment Contract](./0049-environment-contract.md). Este ADR es **0050**.

## Contexto

Developer Platform v1.0 e infraestructura de desarrollo (HOUSEKEEPING-001…003) están cerradas. El Product Core necesita un **contrato de arranque** único: hoy el startup está repartido entre TanStack Start, IdentityProvider, rutas de auth, FCR-008, branding en shells y `resolveHomePath`, sin latch `Application Ready`.

Sin contrato congelado, Authentication / Session / Tenant / Navigation se implementarán con direcciones distintas y EatClean seguirá viendo arranques no deterministas.

## Decisión

1. Declarar el **Bootstrap Pipeline** canónico:

   `App Launch → Environment → Services → Authentication → Session → Tenant → Branding → Navigation → Ready`

2. Congelar el contrato público: `BootstrapStage`, `BootstrapStatus`, `BootstrapError`, `BootstrapResult` (ver documento de arquitectura).

3. Clasificar etapas **BLOCKING** vs **NON-BLOCKING** (Branding y analytics opcionales con fallback).

4. Desambiguar vocabulario: App Bootstrap ≠ Post-Login (FCR-008) ≠ Dev Bootstrap Mode ≠ Operational Bootstrap (OP-001).

5. **Phase 1 = solo arquitectura.** Sin implementación, sin refactor de Runtime / Doctor / engines congelados.

6. FCR-008 / PS-002 se **mapean** al pipeline; no se invalidan.

## Consecuencias

- Toda implementación posterior de PRODUCT-CORE-001 debe cumplir este orden y estos tipos.
- Cambiar el orden de etapas o el significado de Ready requiere ADR que superseda a este.
- El Doctor podrá observar el pipeline como evidencia FOPEBA sin ser dueño del Product Core.
- EatClean gana un Happy Path de arranque medible antes de ampliar pantallas.

## Referencias

- ADR [0004](./0004-authentication-rbac.md) · [0014](./0014-customer-application-is-tenant-branded.md) · [0018](./0018-identity-membership-lifecycle.md) · [0019](./0019-identity-hardening-v1.md) · [0049](./0049-environment-contract.md)
- [BOOTSTRAP_STATE_MACHINE](../05-architecture/BOOTSTRAP_STATE_MACHINE.md) (Operational — distinto)
- [DEVELOPER_PLATFORM_ROADMAP](../05-architecture/DEVELOPER_PLATFORM_ROADMAP.md) · Fase 2 Product Core
