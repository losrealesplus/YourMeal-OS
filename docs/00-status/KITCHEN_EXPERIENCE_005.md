# KITCHEN EXPERIENCE 005 · Zero Friction Kitchen Execution Progress

**Status:** ✅ **COMPLETE** (superseded as active by KE006 · surface retained)  
**Declared:** 2026-08-08  
**Era:** 2 · Return Time  
**Surface:** `/admin/kitchen-today` (mode **progress**)  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Kitchen · Phase **005 Execution Progress**  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A  

```text
Mission
Zero Friction Kitchen Execution Progress

Progress must be visible.
Unknown progress must remain honest.

Primary KPI
Time-to-Understand-Execution-Progress (TTEP) < 5 seconds

Secondary KPI
Time-to-Identify-Remaining-Work < 5 seconds
```

---

## Context

* Customer · Order · Menu · Production Journeys · **Certified** (Production **Frozen**)  
* KE001–004 · **complete**  
* Kitchen Capability · Facade · **frozen**  
* Experience only  
* Start / Pause / Resume / Block / Assign · **Future**  
* Accelerators · **Reserved**  

---

## Principle

```text
Not: inventar Start/Complete durable · porcentajes falsos · Capability encubierta
Yes: total handoff · completados de sesión · restantes · avisos · unknown explícito
```

---

## Progress model

| Signal | Source | Honesty |
|--------|--------|---------|
| Total work | Production Handoff | Trustworthy |
| Completed | Session marks (`ymos.ke.exec_status.v1`) | **Sesión** — not Capability Complete |
| In progress | Session marks | **Sesión** |
| Remaining | Total − session completed | Trustworthy count |
| Blocked | Prep infer or session blocked | Labeled · not Capability Block |
| Available / unknown durable | Handoff without session mark | **"Execution progress not yet available"** |

Never imply an item is completed because it was opened or displayed.

---

## Completion indicator

```text
Completados (sesión) 12 / 30 · Restantes 18
```

Session ratio may be shown only as **session** progress.  
No durable Capability percentage.

---

## Sequence

```text
001 Today's Work               ✅
002 Execution Search           ✅
003 Execution Adaptation       ✅
004 Labels & Special Info      ✅
005 Execution Progress         ✅
006 Completion / Handoff       ▶ next
↓
Kitchen Experience Review → Journey Certification → Freeze
```

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current workflow** | ≈ 30–120 s (recontar mentalmente · preguntar · reabrir cola · **Estimated**) |
| **New workflow** | ≈ 3–8 s (abrir Progreso · ver resumen · filtrar restantes · **Estimated**) |
| **Estimated saving** | ≈ **25–110 s per progress check** |
| **Mission KPI** | TTEP &lt; 5 s · Remaining &lt; 5 s |
| **Measurement** | Stopwatch · 20 checks · Escape-to-Capability-assumption rate · Observation Sprint |
| **Evidence label** | **Estimated** until Observation |

---

## Substrate gaps (registered · not simulated)

| Gap | Why |
|-----|-----|
| Durable Start / Pause / Resume / Complete | Capability frozen — session marks only |
| Durable Block / Assign | Future |
| Trustworthy cross-device progress | Session storage is browser-local |

If Observation proves Kitchen needs real Start/Pause/Complete → Product decides Capability. Experience does not invent it.

---

## Non-goals

* No Kitchen / Production / Order Capability · Facade · Engine  
* No durable execution state inside Experience  
* No Production reopen  
* No Accelerators  

---

## Definition of Done

Operator understands the execution situation using only trustworthy data. Remaining work and warnings are visible. Unknown durable progress stays explicit. No fake Capability state. Software disappears.

---

## Related

* [KITCHEN_EXPERIENCE_004](./KITCHEN_EXPERIENCE_004.md)  
* [KITCHEN_EXPERIENCE_001](./KITCHEN_EXPERIENCE_001.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)
