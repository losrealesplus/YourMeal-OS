# ADR 0061 — Customer Workspace Demo · Operational Experience

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-002.5 · Capability Demo  
**Depends on:** ADR [0058](./0058-customer-capability.md)–[0060](./0060-customer-validation.md)  
**Detalle:** `/admin/customer-workspace` · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md)

## Contexto

Customers está Engineering Certified. Antes de Orders, hace falta demostrar que **FOUNDATION LAW 003** no es teoría: una pantalla mínima puede consumir solo `useCustomer()` / `CustomerFacade`.

Foundation deja de ser el centro del proyecto. El centro pasa a **Operational Experience → Tenant Success**.

## Decisión

1. Introducir **Capability Demo** como paso entre Validation y UI definitiva.  
2. Implementar **Customer Workspace Demo** en `/admin/customer-workspace`.  
3. La demo solo orquesta: Search · Get · List · Create(ensure) · Archive · probes UNIMPLEMENTED.  
4. Prohibido en la demo: Supabase, repositories, Directory/Company services directos.  
5. Declarar fin de la **Era Foundation** como centro (Foundation permanece; ya no es el foco).  
6. Nombrar la siguiente etapa **Operational Experience**.  
7. No es el CRM definitivo ni un CRUD polish — es prueba del método.

## Consecuencias

- LAW 003 queda demostrada en código ejecutable.  
- Legacy `/admin/customers` sigue hasta migración; apunta a la demo.  
- Orders Architecture puede comenzar después de esta demo.  
- Cada Capability futura debería tener un Capability Demo mínimo.

## Referencias

- `src/routes/_authenticated/admin.customer-workspace.tsx`  
- [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · Law 002 · Law 003  
- [OPERATIONAL_EXPERIENCE](../00-status/OPERATIONAL_EXPERIENCE.md)
