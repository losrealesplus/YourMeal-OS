# ADR 0097 — PR Review Protocol (Cursor gate before merge)

## Estado

**Accepted** — 2026-08-07  
**Track:** FOPEBA · Developer workflow · Quality gate  
**Detalle:** [PR_REVIEW_PROTOCOL](../00-status/PR_REVIEW_PROTOCOL.md) · [PR_REVIEW_REPORT_TEMPLATE](../00-status/PR_REVIEW_REPORT_TEMPLATE.md)  
**Depends on:** CHANGE_AUTHORITY · DEFINITION_OF_DONE · Era 2 laws (when Product Core)

## Contexto

FOPEBA exige especificación → implementación → evidencia → merge. GitHub Actions is valuable but must not be the **first** quality gate — especially when Actions may be unavailable (billing, outage). Cursor can review architecture, contracts, hygiene, Era 2 laws, and (when applicable) mobile build evidence before merge.

## Decisión

1. Publish permanent [PR_REVIEW_PROTOCOL.md](../00-status/PR_REVIEW_PROTOCOL.md).  
2. Require a **PR Review Report** before authorizing merge to `main`.  
3. Verdicts only: **READY FOR MERGE** · **READY WITH WARNINGS** · **BLOCKED**.  
4. Treat GitHub Actions as **second validation**, not first.  
5. Agents must not recommend merge while BLOCKED.  
6. Sin runtime product change required by this ADR — workflow documentation.

## Consecuencias

- Draft PR → Cursor review → fix → local tests → (mobile if needed) → merge.  
- Stronger control when Actions is down.  
- Experience / Product Core PRs also check Era 2 laws and time metrics.  
- After merge, local pull → runners → APK smoke → evidence → tag remains recommended.

## Referencias

- [CHANGE_AUTHORITY](../00-status/CHANGE_AUTHORITY.md)  
- [DEFINITION_OF_DONE](../00-status/DEFINITION_OF_DONE.md)  
- [ERA2_CURSOR_PROMPT](../00-status/ERA2_CURSOR_PROMPT.md)  
- [FOPEBA_LAND_CHECK](../00-status/FOPEBA_LAND_CHECK.md)
