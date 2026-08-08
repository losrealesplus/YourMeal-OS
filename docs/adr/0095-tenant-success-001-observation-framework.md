# ADR 0095 — TENANT-SUCCESS-001 · Operational Observation Framework

## Estado

**Accepted** — 2026-08-07  
**Track:** Tenant Success · Era 2 methodology  
**Detalle:** [OBSERVATION_FRAMEWORK](../tenant-success/OBSERVATION_FRAMEWORK.md)  
**Depends on:** PRODUCT LAW 001 · 002 · TENANT SUCCESS LAW 001 · TEAM LAW 001 · Era Declaration

## Contexto

El primer impulso de Sprint 001 fue abrir Customer Experience. TENANT SUCCESS LAW 001 exige medición antes de aceptar observaciones. Sin instrumento oficial de observación, el backlog seguiría siendo idea-driven.

## Decisión

1. Declarar **TENANT-SUCCESS-001 · Operational Observation Framework** as the first official Era 2 track deliverable.  
2. Publish under `docs/tenant-success/`:
   - OBSERVATION_FRAMEWORK.md  
   - TENANT_OBSERVATION_TEMPLATE.md  
   - FRICTION_CATALOG.md  
   - TIME_SAVINGS_SCORE.md  
3. Sequence: Framework → Isabella session → Sara session → evidence backlog → Experience sprints.  
4. Allow **hybrid parallel** Customer Experience development on known daily jobs **without** claiming observation evidence until sessions are measured.  
5. No code · no UI · no DB · no Architecture · no new Capabilities for the Framework itself.

## Consecuencias

- Product decisions cite observation + score cards.  
- Accelerators remain registered until scored.  
- Playbook points to `docs/tenant-success/` as the official observation method.

## Referencias

- [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md)  
- [SPRINT_001_TENANT_SUCCESS](../00-status/SPRINT_001_TENANT_SUCCESS.md)  
- ADR [0092](./0092-tenant-success-law-001.md) · [0093](./0093-product-law-002.md) · [0094](./0094-team-law-001.md)
