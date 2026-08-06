# ADR 0065 — Order Workspace Demo · Operational Experience

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-003.5 · Capability Demo  
**Depends on:** ADR [0062](./0062-order-capability.md)–[0064](./0064-order-validation.md)  
**Detalle:** `/admin/order-workspace` · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [OPERATIONAL_ROADMAP](../00-status/OPERATIONAL_ROADMAP.md)

## Contexto

Orders está Engineering Certified. Antes de Production Capability, hay que demostrar que **OrderFacade** y **LAW 004** no son teoría: Operational Experience puede consumir el proceso semanal sin lógica de negocio en la pantalla.

## Decisión

1. Implementar **Order Workspace Demo** en `/admin/order-workspace`.  
2. La demo solo orquesta vía `useOrder()`: Week · Search · Get · ByCustomer · Plan→Complete · Close/Cancel probes.  
3. Prohibido: Supabase, repositories, Intake/Orders/Operations services directos.  
4. UNIMPLEMENTED (`CloseOrder` · `CancelOrder`) permanece explícito.  
5. Declarar Orders **Capability Demo ✅** — Operational Experience consume Order.  
6. Autorizar **Production Capability** solo después de esta demo.  
7. No es el módulo Orders definitivo ni un CRUD polish — es prueba del método (tercera Capability Demo tras Customer).

## Consecuencias

- LAW 003 + LAW 004 quedan demostradas para un **Operational Process**.  
- Legacy `/admin/orders` sigue hasta migración; el camino canónico es la demo.  
- Production empieza sobre una capability ya utilizada por una interfaz real.  
- Lenguaje interno: “certificar Production Capability”, no “desarrollar Producción”.

## Referencias

- `src/routes/_authenticated/admin.order-workspace.tsx`  
- `src/order/order-workspace-demo.spec.ts`  
- [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · Law 002 · 003 · 004  
- [OPERATIONAL_EXPERIENCE](../00-status/OPERATIONAL_EXPERIENCE.md)
