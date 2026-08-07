# ADR 0084 — PRODUCT LAW 001 (Tenant Time)

## Estado

**Accepted** — 2026-08-07  
**Track:** Product Direction · Strategic Freeze  
**Detalle:** [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md) · [TENANT_TIME_SAVINGS_BACKLOG](../00-status/TENANT_TIME_SAVINGS_BACKLOG.md)

## Contexto

YourMeal OS ha certificado Platform, Foundation, Capabilities, Flows y el Behaviour BH-001. El riesgo siguiente no es falta de arquitectura — es **seguir expandiendo arquitectura por ideas** mientras el producto no demuestra ahorro de tiempo operativo al tenant.

Se declara un cambio de era: Construction → Validation / **Tenant Success**.

## Decisión

1. Declarar **PRODUCT LAW 001**:

```text
Every Product Core feature must demonstrably reduce tenant operational time.
If it does not save operational time, it is not Product Core.
```

2. Publicar [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md) como norte permanente de producto.  
3. Crear [TENANT_TIME_SAVINGS_BACKLOG](../00-status/TENANT_TIME_SAVINGS_BACKLOG.md) como backlog permanente priorizado por impacto operativo.  
4. Mantener Foundation Laws 001–007 congeladas (sin nuevas Laws salvo evidencia tenant / insuficiencia objetiva).  
5. Arquitectura solo se reabre si: Foundation Law rota · Production bloqueada · o un ahorro medible de tiempo lo exige.  
6. Tras Operational Engine v1.0 (Delivery Demo + Billing + Flow completion): **Architecture Frozen** — foco Tenant Success / usabilidad / field.  
7. Métrica de éxito pasa de “Engineering Certified” a “tenant saves time / fewer mistakes / finishes earlier”.

## Consecuencias

- Ideas interesantes sin ahorro de tiempo no entran a Product Core.  
- Engineering Certification sigue siendo necesario — ya no es suficiente.  
- Beta mide fricción operativa, no solo bugs.  
- EatClean valida; el diseño permanece multi-tenant.

## Referencias

- LAW 001–007 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)  
- [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_BEHAVIOUR_BOARD](../00-status/OPERATIONAL_BEHAVIOUR_BOARD.md)
