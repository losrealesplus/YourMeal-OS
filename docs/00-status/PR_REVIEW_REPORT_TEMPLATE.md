# PR Review Report Template

**Protocol:** [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md) · ADR [0097](../adr/0097-pr-review-protocol.md)

Copy into the PR comment or `docs/10-validation/pr-reviews/PR-NNNN-review.md`.

```text
===========================
PR REVIEW REPORT
===========================

PR:           #
Branch:
Base:
Reviewer:     Cursor agent
Date:

Arquitectura     PASS | WARN | FAIL | N/A
Contratos        PASS | WARN | FAIL | N/A
Tests            PASS | WARN | FAIL | N/A
TypeScript       PASS | WARN | FAIL | N/A
Lint             PASS | WARN | FAIL | N/A
Android Build    PASS | WARN | FAIL | N/A
APK              PASS | WARN | FAIL | N/A
ADB              PASS | WARN | FAIL | N/A
Regresión        PASS | WARN | FAIL | N/A
Evidencias       PASS | WARN | FAIL | N/A
Era 2 / Laws     PASS | WARN | FAIL | N/A

Riesgo           LOW | MEDIUM | HIGH

Findings
-

Residual warnings (if any)
-

Resultado
READY FOR MERGE | READY WITH WARNINGS | BLOCKED
```

## Notes for the reviewer

* Mark mobile rows **N/A** when the PR does not touch mobile and does not claim mobile PASS.  
* FAIL on Architecture / secrets / accidental migrations → always **BLOCKED**.  
* Do not recommend merge while **BLOCKED**.
