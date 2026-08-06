# ADR 0077 — Operational Engine v0.8 Freeze

## Estado

**Accepted** — 2026-08-06  
**Track:** Operational Engine milestone  
**Detalle:** [OPERATIONAL_ENGINE_V08](../00-status/OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md)

## Contexto

Phase A (Capability Certification) está COMPLETE. FLOW-001 está Engineering Certified (ADR 0076). Platform y Foundation son Stable. LAW 001–007 forman una constitución completa.

La tentación natural es abrir Delivery. El mayor valor ahora no es más arquitectura: es validar que el núcleo certificado soporta operación real en dispositivos.

## Decisión

1. Declarar oficialmente **Operational Engine v0.8**.  
2. Congelar el núcleo certificado: Platform · Foundation · Identity · Customers · Orders · Production · Kitchen · FLOW-001.  
3. Declarar cambio de era: **Construction → Validation**.  
4. Congelar roadmap inmediato sin reordenar: Flow Demo → Engine Review → Android → OPPO → iPhone → Real Tenant → Delivery.  
5. Mantener **No Delivery until** gate (Demo · Review · Android · OPPO · iPhone).  
6. No abrir nuevas Capabilities / Flows / Foundation Laws en esta era salvo evidencia de campo que lo exija.  
7. v1.0 sigue requiriendo Delivery · Billing (+ flows) certificados — v0.8 no es v1.0.

## Consecuencias

- El foco pasa a experiencia usable (Flow Demo · móvil · EatClean).  
- Las reuniones cambian de “¿está bien diseñada?” a “¿funciona cuando alguien la usa?”.  
- Delivery espera a propósito — disciplina, no bloqueo accidental.

## Referencias

- ADR [0070](./0070-kitchen-execution-capability.md)–[0076](./0076-operational-flow-001-engineering-certification.md)  
- [OPERATIONAL_ENGINE_REVIEW](../00-status/OPERATIONAL_ENGINE_REVIEW.md) · [OPERATIONAL_ROADMAP](../00-status/OPERATIONAL_ROADMAP.md)  
- LAW 001–007 · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)
