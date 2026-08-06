# ADR 0051 — Bootstrap Orchestrator

## Estado

**Accepted** — 2026-08-06  
**Track:** PRODUCT-CORE-002  
**Depends on:** [ADR 0050 — Bootstrap Pipeline](./0050-bootstrap-pipeline.md)  
**Detalle:** [BOOTSTRAP_PIPELINE](../05-architecture/BOOTSTRAP_PIPELINE.md) · [PRODUCT_CORE_001](../00-status/PRODUCT_CORE_001.md)

## Contexto

ADR 0050 congeló la partitura del arranque. El conocimiento seguía **repartido** (router, IdentityProvider, auth routes, branding shells, FCR-008). Faltaba un **director de orquesta** que defina el orden sin mover la lógica de negocio ni los Providers.

`src/bootstrap/` ya aloja **Dev Bootstrap Mode** (`VITE_BOOTSTRAP_MODE`). No se reutiliza esa carpeta raíz para no colisionar vocabulario.

## Decisión

1. Implementar el **Bootstrap Orchestrator** en `src/bootstrap/pipeline/`.  
2. `BootstrapPipeline.ts` es **el único lugar** del repositorio que declara el orden de etapas.  
3. Cada `*Stage.ts` **delega** a facades existentes (o documenta ownership diferido); no reescribe Identity, Branding, Router ni FCR.  
4. El Orchestrator **no conoce** Supabase, React Router, React Query, Branding, Doctor ni Providers.  
5. Publicar eventos de ciclo de vida (`bootstrap:stage_*`) para observabilidad futura — **sin** modificar Doctor / Runtime engines.  
6. Cablear `startBootstrapPipeline({ mode: "cold" })` en el boot cliente (`router.tsx`) **sin gate de UI** (comportamiento de producto idéntico).  
7. Branding sigue NON-BLOCKING; `auth_required` es terminal no-fallido.

## Consecuencias

- El contrato ADR 0050 pasa a ser **ejecutable**.  
- Cambios futuros de orden de arranque tocan `BootstrapPipeline.ts` (+ ADR si cambia el contrato).  
- Migrar ownership real de Session/Tenant/Branding/Navigation a las stages será PRODUCT-CORE-003+; este PR solo centraliza orquestación.  
- Timeline de arranque listo para un Bootstrap Doctor Capability posterior.

## Referencias

- ADR [0050](./0050-bootstrap-pipeline.md) · [0049](./0049-environment-contract.md) · [0004](./0004-authentication-rbac.md)
- Código: `src/bootstrap/pipeline/*`
