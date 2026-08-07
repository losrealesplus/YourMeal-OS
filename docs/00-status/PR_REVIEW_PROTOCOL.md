# PR Review Protocol

**Status:** ▶ **ACTIVE** — permanent FOPEBA gate before merge to `main`  
**Declared:** 2026-08-07  
**ADR:** [0097](../adr/0097-pr-review-protocol.md)  
**Companions:** [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md) · [DEFINITION_OF_DONE](./DEFINITION_OF_DONE.md) · [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md) · [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)  
**Report template:** [PR_REVIEW_REPORT_TEMPLATE](./PR_REVIEW_REPORT_TEMPLATE.md)

```text
Cursor develops
        │
        ▼
Commit
        │
        ▼
Pull Request (Draft)
        │
        ▼
Cursor technical review  ← THIS PROTOCOL
        │
        ▼
Fix findings
        │
        ▼
Review PASS
        │
        ▼
Local tests
        │
        ▼
APK / iPhone (when mobile-touched)
        │
        ▼
Merge
```

**GitHub Actions is a second validation — not the first.**  
When Actions is unavailable (billing, outage), this protocol remains the quality gate.

---

## Purpose

No PR reaches `main` without a Cursor review gate that produces an explicit verdict:

| Verdict | Meaning |
|---------|---------|
| 🟢 **READY FOR MERGE** | All required checks PASS · risk acceptable |
| 🟡 **READY WITH WARNINGS** | Merge allowed only with documented residual risk |
| 🔴 **BLOCKED** | Must fix before merge |

The agent must **not** recommend merge while the verdict is BLOCKED.

---

## FOPEBA alignment

```text
Specification → Implementation → Evidence → Merge
```

This protocol sits between **Evidence** and **Merge**.  
Era 2 also requires PRODUCT LAW 001 / 002 · TENANT SUCCESS LAW 001 / 001-A · TEAM LAW 001 when the PR is Product Core / Experience.

---

## Mandatory review chain (every PR)

1. Author (or agent) opens **Draft PR**.  
2. Agent runs this protocol against the PR diff + local workspace.  
3. Agent posts / attaches a **PR Review Report** (see template).  
4. If BLOCKED → fix → re-run until PASS or WARNINGS.  
5. Local tests (and mobile path if applicable).  
6. Only then: mark ready for human merge (or merge if policy allows).

---

## Checklist (fixed)

### Architecture

- [ ] ADRs respected (no silent supersede)  
- [ ] FOUNDATION not violated / not reopened without gate  
- [ ] Developer Platform frozen boundaries respected  
- [ ] Operational Engine Construction not reopened without gate  
- [ ] No new Capability / Foundation Law unless explicitly in scope  
- [ ] Domain contracts not broken (Facade · Commands · Queries · types)  
- [ ] CHANGE_AUTHORITY question answered: consume Core vs redefine Core  

### Code

- [ ] No unnecessary imports  
- [ ] No obvious dead / duplicated code introduced without reason  
- [ ] TypeScript clean on touched paths (or known pre-existing noted)  
- [ ] No obvious race / unsafe async patterns introduced  
- [ ] Performance footguns checked on hot paths touched  
- [ ] Screens use Facades/hooks — not Supabase/repos (LAW 003) when Experience UI  

### Project hygiene

- [ ] CURRENT_PHASE / roadmap / sprint docs updated when phase meaning changes  
- [ ] Evidences / validation notes present when claiming PASS  
- [ ] No temporary junk files committed  
- [ ] No secrets / credentials / `.env` payloads  
- [ ] No accidental migrations  
- [ ] `package-lock` / dependency changes intentional and explained  
- [ ] Contract changes documented (ADR or capability doc)  

### Product / Era 2 (when Product Core or Experience)

- [ ] PRODUCT LAW 001 — time returned stated or N/A justified  
- [ ] PRODUCT LAW 002 — reuse existing knowledge considered  
- [ ] TENANT SUCCESS LAW 001 / 001-A — no fake observation evidence  
- [ ] Experience Sprint metric visible if Experience PR  
- [ ] Operational Impact section filled on PR  

### Web

- [ ] Relevant unit/integration tests PASS locally  
- [ ] Lint on touched files (or documented debt)  
- [ ] App builds / typechecks as required by the change  

### Android / mobile (when mobile-touched or release path)

- [ ] `build:mobile` (or project equivalent) considered  
- [ ] `cap sync` if Capacitor assets/native bridge touched  
- [ ] Gradle / APK path attempted when claiming mobile PASS  
- [ ] `adb install` + logs when device evidence claimed  
- [ ] Verdict PASS or BLOCKED with reason — never silent skip if PR claims mobile  

If the PR does **not** touch mobile, mark Android section **N/A** (not PASS).

### Regresión / evidencia

- [ ] No silent behaviour change without note  
- [ ] Smoke / integrity specs updated when institutional docs change  
- [ ] Risk level stated: LOW · MEDIUM · HIGH  

---

## PR Review Report (required shape)

Agents must emit a report equivalent to:

```text
===========================
PR REVIEW REPORT
===========================

PR:           #
Branch:       …
Base:         …
Reviewer:     Cursor agent
Date:         YYYY-MM-DD

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
- …

Resultado
READY FOR MERGE | READY WITH WARNINGS | BLOCKED
```

Copyable template: [PR_REVIEW_REPORT_TEMPLATE.md](./PR_REVIEW_REPORT_TEMPLATE.md).

---

## Verdict rules

| Condition | Verdict |
|-----------|---------|
| Any Architecture / Foundation / secret / accidental migration FAIL | 🔴 BLOCKED |
| Tests required for the change FAIL | 🔴 BLOCKED |
| Mobile claimed PASS but APK/adb not evidenced | 🔴 BLOCKED |
| Only non-blocking hygiene / known debt | 🟡 READY WITH WARNINGS |
| All required checks PASS · risk LOW/MEDIUM accepted | 🟢 READY FOR MERGE |

Warnings must list residual risk explicitly.  
BLOCKED must list the exact fix required.

---

## After merge (local CI companion)

Optional but recommended on the developer machine after `main` updates:

```text
git pull
→ update local
→ run runners / tests
→ compile
→ install APK (if mobile)
→ smoke test
→ save evidence
→ tag (when closing a phase)
→ close phase docs
```

This is continuous integration from the development environment — Actions remains the second line.

---

## What this protocol is not

* Not a replacement for human product judgment  
* Not permission to reopen Foundation / Engine without CHANGE_AUTHORITY  
* Not a claim that Actions can be ignored forever — restore Actions when billing allows  
* Not an Observation Sprint (LAW 001-A still applies)  

---

## Related

* [ADR 0097](../adr/0097-pr-review-protocol.md)  
* [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
* [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md)  
* [CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md)
