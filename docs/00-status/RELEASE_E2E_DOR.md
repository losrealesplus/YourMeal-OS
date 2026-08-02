# RELEASE-01 · B-03 · E2E · Definition of Ready

**Documento:** `RELEASE_E2E_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **DoR OPEN** (este PR · documentation only)  
**Nivel:** Release Track B · B-03 E2E  
**Pregunta operacional (borrador):** ¿La plataforma opera como un todo en una jornada piloto mínima reproducible?  
**Estándar Flow Ready:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) (mismo ciclo FOPEBA)  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) · [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Land Check:** [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Precondiciones certificadas:**

| Hito | Tag |
|------|-----|
| PS-002-C | `ps002c-pass` |
| FLOW-01…04 | `flow01-pass` … `flow04-pass` |
| RELEASE-SMOKE | `release-smoke-pass` → `370628a` |
| RELEASE-CROSSFLOW | `release-crossflow-pass` → `0a0c51b` |

> Este PR responde **solo**: ¿queda definido el marco Ready de RELEASE-E2E?  
> **No** es Specification. **No** Freeze. **No** Runner. **No** Playwright.  
> **No** abre Deploy · Rollback · FLOW-05 · `release-01-beta`.

---

## Goal

Certificar que YourMeal OS, con Smoke y Cross-flow ya PASS, sostiene una  
**jornada piloto de extremo a extremo** (cliente + ops + admin en el alcance  
declarado) con evidencia `RELEASE_E2E_*` reproducible. E2E es un gate DoRl de  
producto (Track B), no un Flow nuevo y no sustituye runners canónicos ni Cross-flow.

---

## Pregunta de capability (borrador · Spec la congela)

> Con FLOW-01…04, Smoke y Cross-flow certificados,  
> ¿una jornada piloto mínima (alcance EatClean declarado)  
> produce Outcomes coherentes de punta a punta  
> con evidencia `RELEASE_E2E_*` reproducible?

No: *¿cada Flow / Smoke / Cross-flow sigue PASS?* (ya lo certifican sus runners)  
Sí: *¿la plataforma como conjunto completa la jornada sin gaps de producto?*

---

## Nivel (regla inmutable)

| Runner | Certifica | No certifica |
|--------|-----------|--------------|
| Flow (`test:flowNN-canonical`) | Entidades / estados de un dominio | Jornada multi-superficie |
| Smoke (`test:release-smoke`) | Capacidades de plataforma | Dominio / jornada completa |
| Cross-flow (`test:release-crossflow`) | Handoffs encadenados entre Flows | UI / jornada piloto E2E |
| **E2E** (futuro `test:release-e2e`) | **Jornada piloto como sistema** | Deploy · Rollback · nuevo dominio |

E2E **complementa** Smoke y Cross-flow; **no los sustituye**.  
Un E2E PASS no reabre ni renegocia tags `-pass` previos.

---

## Scope (permitido en DoR)

| Incluye (propuesto) | Excluye (explícito) |
|---------------------|---------------------|
| Marco Ready · pregunta · alcance jornada · tokens propuestos | Spec prose / Freeze / Runner / scripts |
| Naming · acta path · Gate antes de E2E-001 | Playwright / UI automation (Runner PR) |
| Invariantes y PASS/BLOCKED esperados (borrador) | Deploy · Rollback · `release-01-beta` |
| Land Check desde `main` (Regla 9) | FLOW-05 Order Lifecycle (salvo bloqueador demostrado) |
| Relación con Smoke + Cross-flow ya certificados | Renegociar Specs FROZEN FLOW / Smoke / Cross-flow |

**Ancla:** tags `release-smoke-pass` + `release-crossflow-pass` + FLOW-01…04.  
**No reabre** Cross-flow salvo regresión del tag `release-crossflow-pass`.

---

## Out of scope (explícito · este capability y este PR)

| Fuera | Motivo |
|-------|--------|
| Specification / Freeze / Runner / scripts / tests | Siguientes PRs FOPEBA |
| Implementación Playwright · `src/` · migraciones · Supabase | Evidence before Implementation |
| Deploy · Rollback | B-04 · B-05 |
| `release-01-beta` | DoRl PASS de todos los gates |
| FLOW-05 / FLOW-06 | Track A; solo si Track B lo bloquea |
| Renegociar FLOW-01…04 · Smoke · Cross-flow | Ya certificados con tag `-pass` |

---

## Checklist Definition of Ready

Adaptación del estándar Flow Ready al gate de producto:

```text
RELEASE-E2E (B-03)
☑ SPEC lista (READY FOR FREEZE)           → RELEASE_E2E_SPEC.md (siguiente PR)
☑ Contrato de evidencias (skeleton)       → este DoR § Tokens · Spec congela
□ Runner creado (test:release-e2e)        → tras Spec Freeze
☑ Cadena / jornada propuesta              → este DoR § Jornada
☑ Invariantes propuestos                  → este DoR § Invariantes
☑ PASS esperado                           → Spec fijará; DoR orienta
☑ BLOCKED esperado                        → baseline runner tras Spec
☑ Acta path                               → docs/10-validation/release-e2e/
```

**Ready completo:** Spec FROZEN + Runner en `main` + BLOCKED verificado desde `main`  
→ solo entonces **READY TO OPEN RELEASE-E2E-001**.

---

## Jornada propuesta (no Freeze)

```text
Auth / Session          ← Smoke S2 (ancla)
  ↓
Bootstrap / Role        ← Smoke S3
  ↓
Dashboard / Hub         ← Smoke S4
  ↓
Operación de cadena     ← Cross-flow C1…C4 (handoffs FLOW-01…04)
  ↓
Cierre de jornada       ← evidencia RELEASE_E2E_* (alcance Spec)
```

Spec congelará superficies (cliente / ops / admin), datos y desviaciones  
permitidas. Este DoR **no** inventa estados de dominio nuevos.

---

## Invariantes propuestos (no Freeze)

| ID | Invariante |
|----|------------|
| E2E-I1 | No se abre E2E-001 sin Spec FROZEN + Runner BLOCKED desde `main` |
| E2E-I2 | E2E no renegocia `flowNN-pass` · `release-smoke-pass` · `release-crossflow-pass` |
| E2E-I3 | Tokens `RELEASE_E2E_*` en orden · sin duplicates / missing / out_of_order en PASS |
| E2E-I4 | Una capacidad / PR (`RELEASE-E2E-00n`) · Land Check desde `main` (Regla 9) |
| E2E-I5 | Fuera de alcance: Deploy · Rollback · FLOW-05 · `release-01-beta` |

Spec puede añadir E2E-I6+; no eliminar E2E-I1–I4 sin acta de renegociación.

---

## Contrato de evidencias propuesto (no Freeze)

```text
RELEASE_E2E_E1_STARTED
RELEASE_E2E_E1_COMPLETED
…
RELEASE_E2E_En_STARTED
RELEASE_E2E_En_COMPLETED
```

Prefijo de entrega: `RELEASE-E2E-001`…`00n` (una capacidad / PR),  
igual disciplina que RELEASE-SMOKE / RELEASE-CROSSFLOW.  
El número exacto de segmentos lo congela la Spec.

---

## PASS / BLOCKED / FAIL (expectativas)

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · jornada coherente |
| **FAIL** | Contrato implementado roto (orden / duplicates / invariante / gap de jornada) |
| **BLOCKED** | Siguiente segmento aún no implementado — **no es defecto** |

### Baseline runner (tras Spec + Runner · no este PR)

```bash
npm run test:release-e2e
# o test:release-e2e:runner-only — nombre exacto lo fija el Runner PR
```

```text
RELEASE-E2E
BLOCKED
blocked_at=RELEASE_E2E_E1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico esperado: **2** (BLOCKED), igual que Smoke / Cross-flow / Flows.

### FULL PASS (futuro)

```text
RELEASE-E2E
FULL PASS
certified_through=En
blocked_at=—
duplicates=[]
missing=[]
out_of_order=[]
```

Tag: `release-e2e-pass` — solo tras Land Check desde `main` + acta.

---

## Naming convention (Track B)

Documentación futura — **solo DoR en este PR**:

```text
docs/00-status/RELEASE_E2E_DOR.md          ← este documento
docs/00-status/RELEASE_E2E_SPEC.md         ← siguiente

docs/10-validation/release-e2e/
  RELEASE_E2E_RUNNER.md
  RELEASE_E2E_GATE.md
  RELEASE_E2E_001_…_ACTA.md
  RELEASE_E2E_PASS_ACTA.md
  evidence/

tag: release-e2e-pass
npm (futuro): test:release-e2e · test:release-e2e-001…
```

---

## Evidence contract (ubicación)

| Artefacto | Path |
|-----------|------|
| DoR (este) | `docs/00-status/RELEASE_E2E_DOR.md` |
| Spec (siguiente) | `docs/00-status/RELEASE_E2E_SPEC.md` |
| Runner / Gate / Actas | `docs/10-validation/release-e2e/` (tras Spec) |

---

## Gate · Abrir RELEASE-E2E-001

E2E-001 **solo** cuando se cumplen las cuatro:

| # | Condición |
|---|-----------|
| 1 | Spec mergeada en `main` → E2E **FROZEN** |
| 2 | Runner mergeado en `main` |
| 3 | Desde `main`: runner → BLOCKED at `RELEASE_E2E_E1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `RELEASE_E2E_*` sin renegociación abierta |

Hasta entonces: **prohibido** Playwright de certificación · drivers E2E · Deploy · Rollback · FLOW-05.

---

## Plan de trabajo B-03

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ▶ este PR |
| 1 | Spec | ⏳ |
| 2 | Freeze (merge Spec → main) | ⏳ |
| 3 | Runner only · BLOCKED at E1 | ⏳ |
| 4 | Gate E2E-001 (Land Check) | ⏳ |
| 5 | RELEASE-E2E-001…00n (un segmento / PR) | ⏳ |
| 6 | FULL PASS · tag `release-e2e-pass` | ⏳ |

---

## Relación con Track A

```text
Track B (prioridad): B-03 E2E → B-04 Deploy → B-05 Rollback → release-01-beta
Track A:             FLOW-05 solo si Track B encuentra un bloqueador que lo exija
```

No abrir FLOW-05 / Deploy / Rollback por inercia tras `release-crossflow-pass`.

---

## Fuera de este PR

- Specification prose / Freeze  
- `scripts/release-e2e-*.mjs` · Playwright · drivers  
- Cualquier cambio en `src/` o migraciones  
- Deploy · Rollback · `release-01-beta`  
- FLOW-05 / FLOW-06  

---

## End of RELEASE E2E DoR
