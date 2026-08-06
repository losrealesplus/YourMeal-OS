# ADR 0056 — Identity Facade

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-001 · Phase 2 (Implement Facade)  
**Depends on:** [ADR 0055](./0055-identity-capability.md)  
**Detalle:** [IDENTITY_CAPABILITY](../05-architecture/IDENTITY_CAPABILITY.md)

## Contexto

ADR 0055 congeló Identity Capability. Faltaba la **fachada** canónica para que Operational Modules no hablen con Supabase Auth, ni coordinen carga de tenant/roles.

## Decisión

1. Implementar `IdentityFacade` + `composeIdentity` + `useIdentity` en `src/identity/`.  
2. **Componer** `AuthState` + `BootstrapIdentityStore` + branding provenance — sin reescribir servicios.  
3. API pública: `currentUser`, `session`, `tenant`, `branding`, `permissions`, `workspace`, `locale`, `flags`, `preferences`, `membership`, `operational`.  
4. React `IdentityProvider` existente **permanece** (observer); no refactor de Providers.  
5. Eventos `identity:*` observe-only.  
6. `useAuth` sigue válido para pantallas legacy; módulos nuevos usan `useIdentity` / Facade.  
7. Declarar **Capability Pattern** en Foundation Lock.

## Consecuencias

- Un solo API operacional de identidad.  
- Implementación de `membershipId` / flags reales queda para fases posteriores (campos ya en contrato, valores parciales hoy).  
- Orders/Kitchen/Delivery deben depender de Identity, no de Supabase directo.

## Referencias

- Código: `src/identity/IdentityFacade.ts` · `composeIdentity.ts` · `useIdentity.ts`
