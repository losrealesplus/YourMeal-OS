# ADR 0073 — Kitchen Workspace Demo · Operational Experience

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-005 · Phase 4 (Capability Demo)  
**Depends on:** ADR [0070](./0070-kitchen-execution-capability.md)–[0072](./0072-kitchen-execution-engineering-certification.md)  
**Detalle:** `/admin/kitchen-workspace` · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE](../00-status/OPERATIONAL_ENGINE.md)

## Contexto

Kitchen Execution está Engineering Certified. Es la primera **Operational Execution Capability** certificada. Este Demo es el **último Capability Demo aislado** antes de pasar a **Operational Flow Validation** (Phase B).

Debe demostrarse que Operational Experience consume Kitchen vía `useKitchenExecution()` sin lógica de negocio en la pantalla (LAW 003 · 004 · 005 · 006 · 006-A).

Se adopta **FOUNDATION LAW 007**: los flujos operativos nunca bypassean Capabilities; toda transición entre etapas ocurre vía Facades certificadas.

## Decisión

1. Implementar **Kitchen Workspace Demo** en `/admin/kitchen-workspace`.  
2. Orquesta solo: GetExecutionQueue · GetExecutionUnits · GetExecutionProgress · MarkExecutionReady · CompleteExecution · StartExecution probe.  
3. Prohibido: Supabase, repos, ProductionFacade, KitchenExecutionService, OrderFacade.  
4. UNIMPLEMENTED (`StartExecution`) permanece explícito.  
5. Declarar Kitchen **Operational Experience Certified** (Capability Demo).  
6. Declarar fin de **Phase A — Capability Certification** para la cadena Identity→Kitchen.  
7. Autorizar **OPERATIONAL-FLOW-001** (Orders → Production → Kitchen) solo después de esta demo.  
8. Congelar roadmap Phase A / B / C + LAW 007.  
9. No es el módulo Kitchen definitivo ni Delivery / Billing.

## Consecuencias

- LAW 003–006-A demostradas para Operational Execution.  
- Delivery espera Flow Validation — no otro demo aislado primero.  
- El lenguaje del proyecto pasa de “certificar capabilities” a “validar flujos”.

## Referencias

- `src/routes/_authenticated/admin.kitchen-workspace.tsx`  
- `src/kitchen/kitchen-workspace-demo.spec.ts`  
- [OPERATIONAL_ROADMAP](../00-status/OPERATIONAL_ROADMAP.md) · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)
