## Summary

<!-- What changed and why (1–3 sentences). -->

## Cursor PR Review Gate

> [PR_REVIEW_PROTOCOL](../docs/00-status/PR_REVIEW_PROTOCOL.md) · ADR [0097](../docs/adr/0097-pr-review-protocol.md)  
> GitHub Actions is the **second** validation. Cursor review is the **first**.

- [ ] PR Review Report attached / commented ([template](../docs/00-status/PR_REVIEW_REPORT_TEMPLATE.md))
- [ ] Verdict: READY FOR MERGE · READY WITH WARNINGS · BLOCKED
- [ ] Not recommending merge while BLOCKED

## Operational Impact (PRODUCT LAW 001)

> [PRODUCT_DIRECTION](../docs/00-status/PRODUCT_DIRECTION.md) · ADR [0084](../docs/adr/0084-product-law-001.md)  
> Product Core PRs must show time recovered — not only code shipped.

| Field | Value |
|-------|-------|
| Problem (operator friction) | |
| Current workflow | |
| Estimated duration (before) | |
| Workflow after this PR | |
| Estimated duration (after) | |
| Expected time saved | |
| Affected tenant roles | e.g. Admin · Kitchen · Logistics · Support |
| Evidence planned / captured | stopwatch · field · OPPO · N/A docs-only |

- [ ] Saves tenant operational time (or N/A: docs / infra / Foundation / non-Product-Core justified)
- [ ] Does **not** invent Product Core without time-savings rationale

## PR category (exactly one)

> [FLOW_GOVERNANCE](../docs/00-status/FLOW_GOVERNANCE.md) Regla 1 · [PR_TAXONOMY](../docs/00-status/PR_TAXONOMY.md) — sin PRs huérfanas; categorías ambiguas → ❌

- [ ] Flow Certification (`FLOW-XX`)
- [ ] Operational Module
- [ ] Operational Service
- [ ] Bug Fix
- [ ] Documentation

## Feature declaration (Reglas 2–3)

> [PLATFORM_FLOW_TRANSITION_DECLARED](../docs/00-status/PLATFORM_FLOW_TRANSITION_DECLARED.md) — antes de comenzar:

| Campo | Valor |
|-------|-------|
| ¿A qué Flow pertenece? | `FLOW-NN` / nuevo / N/A justificado |
| ¿Qué Outcome produce? | |
| ¿Qué Handoff mejora? | *(si ninguno: justificar)* |
| ¿Qué evidencia permitirá certificarlo? | |
| Journey implicado | p. ej. Kitchen → Delivery |

## Phase alignment (Flow Certification)

- [ ] Respeta [PLATFORM_BASELINE_v1](../docs/00-status/PLATFORM_BASELINE_v1.md) / [PLATFORM_V1_CLOSED](../docs/00-status/PLATFORM_V1_CLOSED.md)
- [ ] Cumple [FLOW_GOVERNANCE](../docs/00-status/FLOW_GOVERNANCE.md) · [FLOW_FIRST](../docs/00-status/FLOW_FIRST.md) · [FLOW_CATALOG](../docs/00-status/FLOW_CATALOG.md)
- [ ] Evidencia pertenece al **Flow**, no a la pantalla (Regla 5)
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
- [ ] Done = Handoff → Evidence → Certification ([FLOW_DEFINITION_OF_DONE](../docs/00-status/FLOW_DEFINITION_OF_DONE.md))
- [ ] No certifica pantallas/APIs/componentes como PASS de Flow
- [ ] Alinea con [FLOW_CERTIFICATION_OPEN](../docs/00-status/FLOW_CERTIFICATION_OPEN.md) · jerarquía [FLOW_WORK_HIERARCHY](../docs/00-status/FLOW_WORK_HIERARCHY.md)

## Test plan

- [ ] Tests / checks relevantes pasan (o N/A justificado)
- [ ] Sin cambios a Auth / Identity / Core salvo evidencia + ADR

## Notes

<!-- Optional -->
