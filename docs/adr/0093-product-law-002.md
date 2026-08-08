# ADR 0093 — PRODUCT LAW 002 (Reuse Existing Knowledge)

## Estado

**Accepted** — 2026-08-07  
**Track:** Product Direction · Era 2 · Product Discovery 001  
**Detalle:** [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md) · [ERA2_PRODUCT_DISCOVERY_001](../00-status/ERA2_PRODUCT_DISCOVERY_001.md)  
**Depends on:** PRODUCT LAW 001 (ADR 0084) · TENANT SUCCESS LAW 001 (ADR 0092)

## Contexto

La primera reunión de Product Discovery de la Era 2 consolidó un principio maduro:

> Los tenants ya tienen información. Nuestro trabajo es darle soluciones.

YourMeal OS no es un ERP que obliga a recrear la realidad desde cero. Es el sistema que **adopta el trabajo existente con la menor fricción posible**. Eso acelera la implantación y está alineado con devolver tiempo (PRODUCT LAW 001).

## Decisión

1. Declarar **PRODUCT LAW 002**:

```text
YourMeal OS never forces tenants
to recreate information
they already own.

Existing operational knowledge
must be reusable whenever possible.
```

2. Publicar la ley en [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md).  
3. Aplicarla a clientes · menús · recetas · Excel · PDF · etiquetas · rutas · producción · cualquier fuente operativa.  
4. Orientar Accelerators futuros (Operational Import Pipeline · Operational Capture · Templates · Bulk Import) bajo esta ley — **sin** abrir Construction de nuevas Capabilities ahora.  
5. Sin código · sin schema · sin Facade nueva en este ADR.

## Consecuencias

- “Módulo de Excel” deja de ser el framing; el framing es **reutilizar conocimiento existente**.  
- Import Pipeline (futuro) es un único pipeline (entrada → parser → preview → validation → import), no imports aislados por formato.  
- Product Core que obligue a reescribir lo que el tenant ya tiene viola PRODUCT LAW 002.  
- Companion de PRODUCT LAW 001: tiempo + reutilización.

## Referencias

- [ERA2_PRODUCT_DISCOVERY_001](../00-status/ERA2_PRODUCT_DISCOVERY_001.md)  
- [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md)  
- ADR [0084](./0084-product-law-001.md) · [0092](./0092-tenant-success-law-001.md)
