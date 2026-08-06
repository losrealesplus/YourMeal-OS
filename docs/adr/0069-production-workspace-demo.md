# ADR 0069 — Production Workspace Demo · Operational Experience

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-004.5 · Capability Demo  
**Depends on:** ADR [0066](./0066-production-capability.md)–[0068](./0068-production-engineering-certification.md)  
**Detalle:** `/admin/production-workspace` · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE](../00-status/OPERATIONAL_ENGINE.md)

## Contexto

Production está Engineering Certified. Orders + Production forman **Operational Planning**. Antes de Kitchen Execution, hay que demostrar que Operational Experience consume Production vía `useProduction()` sin lógica de negocio en la pantalla (LAW 003 · 004).

## Decisión

1. Implementar **Production Workspace Demo** en `/admin/production-workspace`.  
2. Orquesta solo: GenerateProductionPlan · GetPlan/Queue/Load · MarkBatchReady · CloseBatch · GenerateProductionBatch probe.  
3. Prohibido: Supabase, repos, ProductionReport/KitchenExecution services.  
4. UNIMPLEMENTED (`GenerateProductionBatch`) permanece explícito.  
5. Declarar Operational Planning **fully consumable**.  
6. Congelar tablero oficial del Operational Engine (layers fijas).  
7. Autorizar **Kitchen Execution Capability** (OPERATIONAL-005) solo después de esta demo.  
8. No es el módulo Production definitivo ni Kitchen workflows.

## Consecuencias

- LAW 003 + 004 demostradas para Operational Execution planning.  
- Kitchen se nombra **Kitchen Execution** — ejecuta; no planifica.  
- Capas del Engine quedan fijas: Context → Business Entity → Planning → Execution → Outcome.

## Referencias

- `src/routes/_authenticated/admin.production-workspace.tsx`  
- `src/production/production-workspace-demo.spec.ts`  
- [GITHUB_HOUSEKEEPING](../00-status/GITHUB_HOUSEKEEPING.md)
