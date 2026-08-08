# PRODUCTION EXPERIENCE 005 · Zero Friction Production Alerts & Deadlines

**Status:** ✅ **COMPLETE** (superseded as active by PE006 · surface retained)  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/production-planning` (mode **alerts**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Production · Phase **005 Alerts & Deadlines**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Production Alerts & Deadlines

Production does not fail silently.
Deadlines are visible.
Risks are visible.
Load pressure is visible.
The operator keeps control.

Primary KPI
Time-to-Detect-Production-Risk (TTPR) < 10 seconds

Secondary KPI
Time-to-Understand-Deadline < 5 seconds
```

---

## Context

* Customer · Order · Menu Journeys · **Certified**  
* PE001–004 · **complete**  
* Production Capability · Facade · Engine · **frozen**  
* Experience only  
* Accelerators · **Reserved** (Notify Kitchen · OCC · Bulk · Import · Templates · Smart Suggestions → Future)  

---

## Principle

```text
Not: descubrir el fallo cuando Kitchen ya cocina
Yes: avisar antes — retraso · sobrecarga · prep vencida · hueco · handoff sucio
```

Warn early. Prioritize clearly. Do not over-alert.  
Do not block without reason. Always explain. Always next step.

---

## Alert types (v1)

| Code | Meaning |
|------|---------|
| Missing / incomplete planning | Huecos o datos insuficientes |
| Incomplete preparation | Prep bloqueada o inconsistente |
| Overdue preparation | Prep vencida |
| Deadline approaching | Prep o cocción cerca |
| Overloaded day / capacity | Carga excesiva |
| Incomplete handoff | Avisos abiertos sin Ready for Kitchen |

Future: Ingredient shortage · Kitchen conflict · Notify Kitchen  

---

## Deadline visibility

What is due · When · How urgent · What it affects · What next  

At a glance: Week · Day · Load · Work summary · Deadline · Reason · Severity · Kitchen impact · Affected preps  

---

## Quick actions

Resolve (session) · Reschedule / adapt · Open related work · Open preps · Open Kitchen handoff / Planning · Print · Export  

Future: Notify Kitchen  

---

## Empty state

**No hay alertas activas.**  
Clear. No noise. Planning continuity preserved.

---

## Sequence

```text
001 Production Planning        ✅
002 Production Search          ✅
003 Production Adaptation      ✅
004 Pre-Preparations           ✅
005 Alerts & Deadlines         ✅ THIS (complete)
006 Kitchen Handoff            ▶ next
↓
Review → Journey Certification → Freeze
```

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 60–180 s (scan plan · ask kitchen · miss overdue prep · **Estimated**) |
| **New workflow** | ≈ 5–10 s (open alerts · top risk · act · **Estimated**) |
| **Estimated saving** | ≈ **50–170 s per risk scan** |
| **Mission KPI** | TTPR &lt; 10 s · deadline clarity &lt; 5 s |
| **Measurement** | Stopwatch · 15 risk scans · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Non-goals

* No Production Capability / Facade / Engine  
* No Kitchen Experience (PE006 handoff next)  
* No OCC / Bulk / Import / Templates / Smart Suggestions  

---

## Acceptance

No changes to Production Capability.  
No changes to Production Facade.  
No changes to Operational Engine.  
No architectural work.  
Experience only.

---

## Definition of Done

Production risks are visible early.  
Deadlines are understandable instantly.  
The operator knows what to fix next.  
The software disappears.

---

## Related

* [PRODUCTION_EXPERIENCE_004](./PRODUCTION_EXPERIENCE_004.md)  
* [PRODUCTION_EXPERIENCE_003](./PRODUCTION_EXPERIENCE_003.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
