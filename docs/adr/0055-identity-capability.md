# ADR 0055 — Identity Capability

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-001 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [IDENTITY_CAPABILITY](../05-architecture/IDENTITY_CAPABILITY.md)

## Contexto

Product Core Foundation (ADR 0050–0054) congela el ciclo de vida de arranque. El producto entra en **Operational Modules**. Authentication sola no basta: Orders, Kitchen, Delivery y Billing necesitan un único modelo de *usuario operacional* (tenant, roles, permissions, workspace, branding, locale, flags, preferences, `membershipId`).

Hoy ese conocimiento está compuesto pero repartido (`AuthState`, Bootstrap stages, Localization, Branding, FeatureFlagService). Sin capability canónica, cada módulo reinventará “quién soy”.

## Decisión

1. Declarar **Identity Capability** como primera Operational Module.  
2. Identity ≠ Authentication: Identity **compone** Authentication + Session + Tenant + Role + Permissions + Workspace + Branding + Locale + Flags + Preferences + Operational Context.  
3. Congelar contratos públicos: `IdentityContext`, `IdentityState`, `IdentityResult`, `IdentityError`, `PermissionModel`, `WorkspaceContext` (y satélites documentados).  
4. **No** reordenar Bootstrap Pipeline; Identity consume sus resultados.  
5. **No** modificar Developer Platform engines (observe-only).  
6. Respetar ADR 0018/0019 (RI-001, non-goals).  
7. Phase 1 = **solo arquitectura** (sin implementación / UI / Providers / routing).  
8. Toda Operational Module futura sigue: Observe → Design → Freeze → Implement → Validate.

## Consecuencias

- Un solo sitio responde: *¿quién es el usuario operacional actual?*  
- Implementación posterior será fachada sobre lo existente (bajo churn de nombres).  
- Roadmap pasa de “pantallas” a **capabilities** (`OPERATIONAL-00N`).

## Referencias

- ADR [0004](./0004-authentication-rbac.md) · [0018](./0018-identity-membership-lifecycle.md) · [0019](./0019-identity-hardening-v1.md) · [0050](./0050-bootstrap-pipeline.md)–[0054](./0054-product-core-foundation.md)
- [IDENTITY_LIFECYCLE](../05-architecture/IDENTITY_LIFECYCLE.md) · [BOOTSTRAP_PIPELINE](../05-architecture/BOOTSTRAP_PIPELINE.md)
