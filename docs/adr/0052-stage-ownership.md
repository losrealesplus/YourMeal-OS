# ADR 0052 — Stage Ownership Migration

## Estado

**Accepted** — 2026-08-06  
**Track:** PRODUCT-CORE-003  
**Depends on:** [ADR 0050](./0050-bootstrap-pipeline.md) · [ADR 0051](./0051-bootstrap-orchestrator.md)  
**Detalle:** [BOOTSTRAP_OWNERSHIP](../05-architecture/BOOTSTRAP_OWNERSHIP.md)

## Contexto

Tras el Orchestrator, el orden de arranque tenía un único dueño (`BootstrapPipeline.ts`), pero la **responsabilidad de ejecutar** Auth / Session / Tenant / Branding / Navigation seguía en Providers (sobre todo `SupabaseIdentityProvider`) y rutas.

Eso impedía responder de forma unívoca: «¿Quién arranca Authentication?»

## Decisión

1. **Ownership migration** — cada Bootstrap Stage coordina su dominio.  
2. Extraer Application Services finos (mismas queries / mismas políticas):
   - `SessionBootstrapService`
   - `TenantBootstrapService`
   - `BrandingBootstrapService`
   - `NavigationBootstrapService`
3. Publicar estado en `BootstrapIdentityStore`; **Providers observan** (subscribe / render / realtime).  
4. `SupabaseIdentityProvider` deja de orquestar el ladder de identidad en `useEffect`; ante sesión pide `runOwnedIdentityStages` (Stages).  
5. No reescribir lógica de negocio, no tocar FCR-008, Doctor, ni el orden de `BootstrapPipeline`.  
6. Comportamiento runtime idéntico (single-flight en loads).

## Ownership (DoD)

| Pregunta | Respuesta |
|----------|-----------|
| ¿Quién arranca Authentication? | **AuthenticationStage** |
| ¿Quién arranca Session? | **SessionStage** |
| ¿Quién arranca Tenant? | **TenantStage** |
| ¿Quién arranca Branding? | **BrandingStage** |
| ¿Quién arranca Navigation homePath? | **NavigationStage** |

Providers: exponer contexto, suscribirse, renderizar, reaccionar — **nunca** decidir el flujo de startup.

## Consecuencias

- El Product Core gana responsables claros antes de nuevas features.  
- Ready Gate (siguiente bloque) puede leer el store / `BootstrapResult` sin pelear con Providers.  
- Login UX / FCR-008 siguen en rutas; Stages son dueños del cold / resume identity ladder.

## Referencias

- Código: `src/bootstrap/pipeline/stages/*` · `services/*` · `BootstrapIdentityStore.ts` · `runOwnedIdentityStages.ts`
- Provider observer: `src/identity/supabase-identity-provider.tsx`
