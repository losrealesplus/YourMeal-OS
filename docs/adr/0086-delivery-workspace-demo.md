# ADR 0086 — Delivery Workspace Demo · Operational Experience

## Estado

**Accepted** — 2026-08-07  
**Track:** OPERATIONAL-006 · Phase 4 (Capability Demo)  
**Depends on:** ADR [0078](./0078-delivery-capability.md)–[0080](./0080-delivery-engineering-certification.md) · [0084](./0084-product-law-001.md) · [0085](./0085-delivery-engine-v1-alignment.md)  
**Detalle:** `/admin/delivery-workspace` · [DELIVERY_WORKSPACE](../05-architecture/DELIVERY_WORKSPACE.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md)

## Contexto

Delivery Capability ya está Architecture Frozen · Facade · Engineering Certified (ADR 0078–0080). PRODUCT LAW 001 (ADR 0084) y ADR 0085 alinean el Engine path: **no reabrir Architecture**; demostrar consumo canónico.

Debe demostrarse que Operational Experience consume Delivery vía `useDelivery()` sin lógica de negocio en la pantalla (LAW 003 · 006 · 007) y sin simular gaps UNIMPLEMENTED.

## Decisión

1. Implementar **Delivery Workspace Demo** en `/admin/delivery-workspace`.  
2. Orquesta solo: GetDeliveryContext · GetDeliveryAssignments · GetDeliveryStops · GetCompletedDeliveries · ConfirmDelivery · probes UNIMPLEMENTED (Routes · Assign · Start · Exception · Close).  
3. Prohibido: Supabase, repos, OrderFacade, KitchenExecutionFacade, GPS/maps, nuevos Commands/Queries/Facades.  
4. UNIMPLEMENTED permanece explícito — nunca simulado.  
5. Declarar Delivery **Capability Demo** (Operational Experience).  
6. Delivery = **transferencia controlada de responsabilidad**, no courier.  
7. No es el módulo Delivery definitivo ni Billing ni Product UI.

## Consecuencias

- LAW 003 · 006 · 007 demostradas para Delivery Operational Execution.  
- Registry: Delivery → Capability Demo.  
- Siguiente bloque estructural Engine: **Billing Capability** (Architecture → … → Demo).  
- Tras Billing + cierre Engine → Operational Engine v1.0 COMPLETE.

## Referencias

- `src/routes/_authenticated/admin.delivery-workspace.tsx`  
- `src/delivery/delivery-workspace-demo.spec.ts`  
- [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md) · [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md)
