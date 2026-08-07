# ADR 0090 — Operational Engine v1.0 Declaration

## Estado

**Accepted** — 2026-08-07  
**Track:** OPERATIONAL-ENGINE-001 · Institutional Declaration  
**Detalle:** [OPERATIONAL_ENGINE_V1](../00-status/OPERATIONAL_ENGINE_V1.md)  
**Depends on:** Developer Platform v1.0 · Foundation Laws 001–007 · PRODUCT LAW 001 (ADR 0084) · Capability chain Identity→Billing Engineering Certified · FLOW-001 / FLOW-002 Engineering Certified

## Contexto

La Construction Era del Operational Engine ha cerrado el mapa de Capabilities (Identity→Billing) con Engineering Certification y Capability Completion **100%**. Foundation, Developer Platform y Product Direction están congelados.

Este ADR **no introduce software**. Declara el hito institucional: el motor existe; el foco primario pasa a Tenant Success. Documentation only.

## Decisión

1. Declarar **Operational Engine v1.0** CERTIFIED · Architecture FROZEN.  
2. Declarar **Construction Phase COMPLETE**.  
3. Declarar **Primary Product Focus = Tenant Success**.  
4. Publicar [OPERATIONAL_ENGINE_V1.md](../00-status/OPERATIONAL_ENGINE_V1.md) como documento institucional.  
5. Autorizar tag histórico `operational-engine-v1.0` tras merge a la rama larga del proyecto.  
6. Reabrir arquitectura del Engine **solo** si: Foundation Law rota · producción bloqueada · o ahorro operativo demostrable (PRODUCT LAW 001).  
7. Trabajos restantes (Billing Demo · Flow Demos · FLOW-003 · Field · UX) pertenecen a **Validation / Tenant Success** — no a Construction de nuevas Capabilities de Engine v1.0.  
8. Sin código · sin refactor · sin cambio de comportamiento · sin ADR que altere runtime.

## Consecuencias

- El lenguaje del roadmap pasa de “siguiente módulo” a “minutos devueltos al tenant”.  
- PRODUCT LAW 001 gobierna Product Core.  
- v0.8 permanece como hito histórico; v1.0 es la declaración vigente.  
- Git history marca el límite Construction → Validation → Tenant Success.

## Referencias

- [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md) · [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md)  
- [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md) · [TENANT_TIME_SAVINGS_BACKLOG](../00-status/TENANT_TIME_SAVINGS_BACKLOG.md)  
- ADR [0077](./0077-operational-engine-v08.md) (v0.8) · [0084](./0084-product-law-001.md) · [0089](./0089-billing-engineering-certification.md)
