# FOPEBA Metrics

**Documento:** `FOPEBA_METRICS.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **ACTIVE · v0** (tras FLOW-01…04 CERTIFIED)  
**Propósito:** Medir la **metodología**, no el negocio del cliente  
**Handoff:** [PROJECT_HANDOFF](./PROJECT_HANDOFF.md) · [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)

> Con cuatro ciclos completos (PS-002-C + FLOW-01…04) ya hay evidencia histórica  
> suficiente para instrumentar el proceso — no diseñar métricas en vacío.

---

## Pregunta

> ¿FOPEBA es repetible y predecible a escala,  
> o solo funcionó para los primeros flujos?

---

## Métricas (v0)

| # | Métrica | Definición | Fuente |
|---|---------|------------|--------|
| 1 | DoR → Freeze | Commits/días desde DoR doc merge hasta Spec FROZEN en `main` | Git / PRs |
| 2 | Freeze → Runner | Spec FROZEN → Runner merge + BLOCKED verificado | Git / PRs |
| 3 | Runner → `flowNN-pass` | Runner en `main` → tag FULL PASS | Git tags |
| 4 | PRs por FLOW | Contar DoR + Spec + Runner + T1…Tn (+ close-out docs) | GitHub |
| 5 | Regresiones por runner | FAIL en runners certificados tras cambios posteriores | CI / actas |
| 6 | Spec post-Freeze | PRs que renegocian contrato tras Freeze (ideal: **0**) | GitHub |
| 7 | Cobertura catálogo | `flowNN-pass` / Flows del [FLOW_CATALOG](./FLOW_CATALOG.md) priorizados | Tags + catálogo |

---

## Baseline observado (cualitativo · 2026-08-02)

| Ciclo | Tag | Patrón |
|-------|-----|--------|
| PS-002-C | `ps002c-pass` | Runner → evidencia → PASS |
| FLOW-01 | `flow01-pass` | Spec → Runner → T1…T4 |
| FLOW-02 | `flow02-pass` | Idem T1…T3 |
| FLOW-03 | `flow03-pass` | Idem + I7 / review-as-event |
| FLOW-04 | `flow04-pass` | DoR artefact → Spec → Runner → T1…T3 |

Disciplina estable: **una pregunta / PR** · Evidence before Implementation · BLOCKED ≠ FAIL.

---

## Cómo registrar (proceso ligero)

Tras cada `flowNN-pass`, añadir una fila en la tabla de abajo (manual o script futuro):

| Flow | DoR→Freeze | Freeze→Runner | Runner→PASS | # PRs | Spec post-Freeze | Notas |
|------|------------|---------------|-------------|-------|------------------|-------|
| FLOW-01 | — | — | — | — | 0 | Primer ciclo dominio |
| FLOW-02 | — | — | — | — | 0 | |
| FLOW-03 | — | — | — | — | 0 | I7 + review event |
| FLOW-04 | corto (DoR #162 → Spec #163) | corto (#163 → #164) | T1–T3 (#165–#167) | ~6 | 0 | DoR como artefacto |

*(Rellenar SHAs/días solo con evidencia objetiva de git/PRs/tags — v0 congela el marco.)*

---

## Regla de relleno

**No estimaciones.** Esperar evidencia objetiva de ciclos reales antes de poblar números.

Medir, cuando haya datos:

- Tiempo DoR → Freeze  
- Tiempo Freeze → Runner  
- Tiempo Runner → primer PASS / FULL PASS  
- Tiempo total por FLOW  
- Número de PR por FLOW  
- Número de regresiones detectadas  
- Número de cambios de SPEC tras Freeze (idealmente **0**)  
- Cobertura del catálogo (`flows certificados / flows planificados`)

Las métricas deben describir el **proceso real**, no un objetivo teórico.

---

## Prohibido

- Rellenar filas con estimaciones o targets inventados  
- Usar estas métricas para “acelerar” saltándose DoR / Spec / Runner  
- Optimizar el número de PRs a costa de una pregunta por PR  
- Declarar mejora metodológica sin actualizar esta tabla tras un `flowNN-pass`

---

## Relación con RELEASE-01

DoRl ([DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)) mide **producto**.  
FOPEBA Metrics mide **proceso**. No mezclar.

---

## End of FOPEBA Metrics
