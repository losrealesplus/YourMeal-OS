# ADR 0058 — Customer Capability

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-002 · Phase 1 (Observe → Design → Freeze)  
**Detalle:** [CUSTOMER_CAPABILITY](../05-architecture/CUSTOMER_CAPABILITY.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md)

## Contexto

Identity está Engineering Certified (ADR 0055–0057). Comienza el primer módulo de negocio. EatClean opera particulares + empresas en un ciclo semanal de menú → pedido → producción → reparto. Ya existen Party/B2B/B2C (ADR 0015/0016) y servicios Directory / CompanyAccount, pero no una **Customer Capability** canónica.

## Decisión

1. Declarar **Customer Capability** como OPERATIONAL-002.  
2. Customer ≠ pantalla ≠ CRUD: es la capability de **demand Party** (Individual Customer · Company Account).  
3. Congelar contratos: `CustomerContext`, `CustomerSummary`, `CustomerProfile`, `CustomerStatus`, `CustomerError`, `DeliveryLocationRef`.  
4. Respetar UL existente (Party · Company Account · Site · Delivery Group · Demand Channel).  
5. **No** requerir tabla `parties` en esta fase (ADR 0016 Option C).  
6. Depender de **IdentityFacade** para auth/tenant/permisos/`membershipId`.  
7. Diseñar para EatClean (tiempo / errores en catering semanal), no un CRM genérico.  
8. Phase 1 = solo arquitectura (sin UI / CRUD / migraciones / implementación).  
9. Introducir **Capability Registry** como panel de control del producto.

## Consecuencias

- Una sola respuesta a: *¿qué es un Customer en YourMeal OS?*  
- Orders / Delivery / Billing consumirán esta capability.  
- Facade (Phase 2) compondrá servicios existentes sin fork de vocabulario.

## Referencias

- ADR [0015](./0015-b2b-b2c-customer-model.md) · [0016](./0016-party-model-demand-actors.md) · [0055](./0055-identity-capability.md)–[0057](./0057-identity-validation.md)
- [OPERATIONAL_MODULES](../00-status/OPERATIONAL_MODULES.md)
