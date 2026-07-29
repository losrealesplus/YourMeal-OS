## Summary

<!-- What changed and why (1–3 sentences). -->

## PR category (exactly one)

> [PR_TAXONOMY](../docs/00-status/PR_TAXONOMY.md) — categorías ambiguas (“refactor general”, “mejoras varias”) → ❌

- [ ] Flow Certification
- [ ] Operational Module
- [ ] Operational Service
- [ ] Bug Fix
- [ ] Documentation

## Phase alignment (Flow Certification)

- [ ] Respeta [PLATFORM_BASELINE_v1](../docs/00-status/PLATFORM_BASELINE_v1.md) / [PLATFORM_V1_CLOSED](../docs/00-status/PLATFORM_V1_CLOSED.md)
- [ ] Produce o habilita evidencia operacional (o N/A justificado)
- [ ] Acerca Flow a certificación (o N/A — Module/Service/Bug/Docs)

## Operational Core Compliance

> ¿Consume el Operational Core o lo redefine? Redefine → ❌  
> [CONTRACT](../docs/00-status/OPERATIONAL_CORE_CONTRACT.md) · [CHANGE_AUTHORITY](../docs/00-status/CHANGE_AUTHORITY.md)

- [ ] No redefine Foundation
- [ ] No redefine Auth
- [ ] No redefine Identity
- [ ] No redefine Membership
- [ ] No redefine RBAC
- [ ] Consume el Operational Core
- [ ] Respeta el Operational Core Contract

## Flow discipline (if category = Flow Certification)

- [ ] Cadena Outcome → Handoff → Outcome → Evidence → Certification
- [ ] No certifica pantallas/APIs/componentes como PASS de Flow
- [ ] Alinea con [FLOW_CERTIFICATION_OPEN](../docs/00-status/FLOW_CERTIFICATION_OPEN.md)

## Test plan

- [ ] Tests / checks relevantes pasan (o N/A justificado)
- [ ] Sin cambios a Auth / Identity / Core salvo evidencia + ADR

## Notes

<!-- Optional -->
