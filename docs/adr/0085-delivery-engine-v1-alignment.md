# ADR 0085 — Delivery Capability · Engine v1.0 Alignment

## Estado

**Accepted** — 2026-08-07  
**Track:** OPERATIONAL-006 · Product Alignment (post PRODUCT LAW 001)  
**Depends on:** ADR [0078](./0078-delivery-capability.md)–[0080](./0080-delivery-engineering-certification.md) · [0084](./0084-product-law-001.md)  
**Detalle:** [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md) · [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md)

## Contexto

Delivery **Architecture / Facade / Engineering Certification** ya existen (ADR 0078–0080). PRODUCT LAW 001 (ADR 0084) cambia el eje: no “hacer Delivery”, sino **cerrar Operational Engine v1.0**.

Riesgo: reabrir Architecture Freeze o pensar Delivery como “el repartidor / courier”.

## Decisión

1. **No** reiniciar OPERATIONAL-006 Phase 1 Architecture. Congelación 0078 permanece.  
2. Delivery se interpreta como **transferencia controlada de responsabilidad** desde la operación interna del tenant hacia el cliente — no como app de logística.  
3. Matiz LAW 006 (sin cambiar la pregunta canónica certificada):

```text
Kitchen  → ¿Qué trabajo debe ejecutarse ahora? (responsabilidad interna)
Delivery → ¿Qué compromisos deben salir del tenant y cómo aseguramos
           que llegan correctamente? (transferencia de responsabilidad)
```

4. Lenguaje prohibido en dominio: Shipment · Parcel · Package · Courier (pertenecen a sistemas logísticos externos).  
5. Siguiente fase de Engine path: **Delivery Capability Demo** (`useDelivery` only) — no nuevo Facade, no CRUD, no DB.  
6. Tras Delivery Demo + Billing cycle + Flow completion → declarar **Operational Engine v1.0 · Architecture Frozen**.  
7. Toda Demo / Product UI de Delivery debe poder justificar ahorro de tiempo (PRODUCT LAW 001).

## Consecuencias

- Roadmap habla de **cerrar el Engine**, no de “empezar Delivery”.  
- Demo es el siguiente ticket Delivery; Billing sigue siendo Outcome pendiente.  
- Evita migrar comportamiento de Kitchen / Orders / Billing hacia Delivery.

## Referencias

- `src/delivery/` · [DELIVERY_VALIDATION_REPORT](../10-validation/DELIVERY_VALIDATION_REPORT.md)  
- [OPERATIONAL_LANGUAGE_DICTIONARY](../00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md) · LAW 006-A
