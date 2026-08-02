# RELEASE-01 · B-03 · E2E · Definition of Ready

**Documento:** `RELEASE_E2E_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **DoR CERTIFIED** (`main` · #185 · `48e0c5c`) · Spec ✅ [FROZEN](./RELEASE_E2E_SPEC.md) (#186) · Runner ✅ #188 · Gate ✅ READY  
**Nivel:** Release Track B · B-03 E2E  
**Pregunta (única):** ¿Qué debe certificar RELEASE-E2E antes de considerar la plataforma lista para Release?  
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

> Este PR responde **solo** la pregunta de arriba (marco Ready).  
> **No** es Specification. **No** Freeze. **No** Runner.  
> **No** abre Deploy · Rollback · FLOW-05 · `release-01-beta`.

---

## Goal

Definir qué debe demostrar RELEASE-E2E para declarar que la **plataforma como un todo**  
está lista para seguir hacia Deploy / Rollback / `release-01-beta`.

RELEASE-E2E certifica la **jornada piloto de extremo a extremo** ya anclada por:

- capacidades de plataforma → `release-smoke-pass`
- handoffs encadenados FLOW-01…04 → `release-crossflow-pass`

No certifica un Flow nuevo. No sustituye Smoke ni Cross-flow.

---

## Pregunta de capability (borrador · Spec la congela)

> ¿Qué debe certificar RELEASE-E2E antes de considerar la plataforma lista para Release?

Respuesta de marco (este DoR):

> Que una jornada piloto mínima, construida sobre Smoke + Cross-flow ya certificados,  
> complete la cadena canónica E1→E4 con evidencia `RELEASE_E2E_*` reproducible  
> y sin inventar estados fuera de los contratos FROZEN existentes.

No: *¿Smoke / Cross-flow / cada Flow sigue PASS?* (ya lo certifican sus tags `-pass`)  
Sí: *¿la plataforma completa sostiene la jornada de punta a punta sin gaps?*

---

## Nivel (regla inmutable)

| Nivel | Certifica | No certifica |
|-------|-----------|--------------|
| FLOW | Estados / transiciones de un dominio | Jornada multi-superficie |
| RELEASE-SMOKE | Capacidades mínimas de plataforma | Cadena de negocio / jornada completa |
| RELEASE-CROSSFLOW | Handoffs encadenados entre Flows | Jornada piloto como sistema |
| **RELEASE-E2E** | **Jornada piloto de la plataforma como un todo** | Deploy · Rollback · nuevo dominio |

E2E **complementa** Smoke y Cross-flow; **no los sustituye**.  
Un E2E PASS no reabre ni renegocia tags `-pass` previos.

---

## Scope (permitido en DoR)

| Incluye (propuesto) | Excluye (explícito) |
|---------------------|---------------------|
| Goal · Scope · cadena E1…E4 · invariantes · estados · evidencia · Gate | Spec / Freeze / Runner |
| Ready checklist · out of scope · naming documental | Scripts · package.json · comandos npm · tests · CI |
| Anclas a tags ya certificados | Playwright · browser automation · UI · servicios · dominio nuevo |
| Land Check documental desde `main` (Regla 9) | Deploy · Rollback · FLOW-05 · `release-01-beta` |

**Ancla:** `release-smoke-pass` + `release-crossflow-pass` + `flow01-pass`…`flow04-pass`.  
**No reabre** Smoke ni Cross-flow salvo regresión del tag correspondiente.

---

## Cadena canónica de extremo a extremo (no Freeze)

Cadena de producto ya establecida por el proyecto  
([RELEASE_CROSSFLOW_DOR](./RELEASE_CROSSFLOW_DOR.md) · [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)):

```text
Pedido
  ↓
Producción          ← FLOW-01
  ↓
Packaging
  ↓
Entrega
  ↓
Incidencia          ← FLOW-02
  ↓
Facturación         ← FLOW-03
  ↓
Inventario          ← FLOW-04
  ↓
Cierre
```

Precedida por la entrada de plataforma ya certificada en Smoke  
(Preflight → Auth → Bootstrap → Dashboard).

RELEASE-E2E **reutiliza** esa cadena; **no inventa** implementación ni estados nuevos.

---

## Segmentos propuestos (no Freeze)

Orden inmutable:

```text
E1
 ↓
E2
 ↓
E3
 ↓
E4
```

| Segmento | Intención (borrador) | Ancla ya certificada |
|----------|----------------------|----------------------|
| **E1** | Entrada de plataforma operable (sesión → rol → dashboard) | RELEASE-SMOKE · S1…S4 · `release-smoke-pass` |
| **E2** | Pedido / producción → entrega operable | FLOW-01 · CROSSFLOW C1 · `flow01-pass` |
| **E3** | Incidencia → facturación pagada | FLOW-02…03 · CROSSFLOW C2…C3 · `flow02-pass` · `flow03-pass` |
| **E4** | Inventario sellado → cierre de jornada | FLOW-04 · CROSSFLOW C4 · `flow04-pass` |

Si Spec reduce, divide o renombra segmentos, se congela **en el Freeze**, no en implementación ad hoc.  
Prohibido saltar, reordenar o completar Eₙ₊₁ sin Eₙ `COMPLETED`.

---

## Invariantes canónicos (no Freeze)

| ID | Invariante |
|----|------------|
| E2E-I1 | No se abre RELEASE-E2E-001 sin Spec FROZEN + Runner BLOCKED verificado desde `main` |
| E2E-I2 | E2E no renegocia `flowNN-pass` · `release-smoke-pass` · `release-crossflow-pass` |
| E2E-I3 | No inventar estados fuera de Specs FROZEN de FLOW / Smoke / Cross-flow |
| E2E-I4 | Cada segmento Eₙ consume Outcomes / capacidades ya ancladas (tabla de segmentos) |
| E2E-I5 | Tokens `RELEASE_E2E_*` once-only · orden estricto · `duplicates/missing/out_of_order = []` en PASS |
| E2E-I6 | Fallo en un segmento → FAIL del gate E2E; no “PASS parcial silencioso” del gate completo |
| E2E-I7 | Una capacidad / PR (`RELEASE-E2E-00n`) · Land Check desde `main` (Regla 9) |
| E2E-I8 | Fuera de alcance hasta PASS: Deploy · Rollback · FLOW-05 · `release-01-beta` |

Spec puede añadir E2E-I9+; no eliminar E2E-I1–I5 sin acta de renegociación.

---

## Estados canónicos (no Freeze)

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado E1…Eₙ en orden · arrays vacíos · jornada coherente |
| **FAIL** | Contrato roto (orden · duplicates · invariante · gap de jornada) |
| **BLOCKED** | Siguiente segmento aún no certificado — **no es defecto** |

Tokens de evidencia por segmento (skeleton; Spec congela):

```text
RELEASE_E2E_E1_STARTED
RELEASE_E2E_E1_COMPLETED
RELEASE_E2E_E2_STARTED
RELEASE_E2E_E2_COMPLETED
RELEASE_E2E_E3_STARTED
RELEASE_E2E_E3_COMPLETED
RELEASE_E2E_E4_STARTED
RELEASE_E2E_E4_COMPLETED
```

### Baseline esperado (tras Spec + Runner · no este PR)

```text
RELEASE-E2E
BLOCKED
blocked_at=RELEASE_E2E_E1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

### FULL PASS (futuro)

```text
RELEASE-E2E
FULL PASS
certified_through=E4
blocked_at=—
duplicates=[]
missing=[]
out_of_order=[]
```

Tag: `release-e2e-pass` — solo tras Land Check desde `main` + acta.

---

## Evidence policy

| Regla | Política |
|-------|----------|
| Principio | Evidence before Implementation |
| Certifica | `main` (Regla 9) — las ramas solo proponen |
| Forma | Tokens `RELEASE_E2E_E*_STARTED\|COMPLETED` en orden |
| Entrega | Una capacidad / PR: `RELEASE-E2E-001`…`004` (E1…E4) |
| Acta path (futuro) | `docs/10-validation/release-e2e/` |
| Close-out | `RELEASE_E2E_PASS_ACTA.md` + tag `release-e2e-pass` |
| Prohibido en evidencia | Secretos · pantallas como PASS · renegociar tags previos |

Este DoR **no** crea runners, scripts ni evidencias ejecutables.

---

## Gate · Abrir RELEASE-E2E-001

E2E-001 **solo** cuando se cumplen las cuatro:

| # | Condición |
|---|-----------|
| 1 | Spec mergeada en `main` → E2E **FROZEN** |
| 2 | Runner mergeado en `main` |
| 3 | Desde `main`: runner → BLOCKED at `RELEASE_E2E_E1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `RELEASE_E2E_E*` sin renegociación abierta |

Hasta entonces: **prohibido** automatización de certificación · drivers E2E · Deploy · Rollback · FLOW-05.

---

## Ready checklist

```text
RELEASE-E2E (B-03)
☑ Goal definido                            → este DoR
☑ Scope / Out of scope                     → este DoR
☑ Cadena canónica E1…E4 propuesta          → este DoR
☑ Invariantes canónicos propuestos         → este DoR
☑ Estados canónicos propuestos             → este DoR
☑ Evidence policy                          → este DoR
☑ Gate antes de E2E-001                    → este DoR
☑ SPEC lista (READY FOR FREEZE)            → [RELEASE_E2E_SPEC](./RELEASE_E2E_SPEC.md)
☑ Spec FROZEN en main                      → #186 · `6d11ae8`
☑ Runner creado (BLOCKED at E1)            → [RUNNER](../10-validation/release-e2e/RELEASE_E2E_RUNNER.md)
☑ Runner en main · BLOCKED at E1 verificado → #188 · `d2a4047`
☑ READY TO OPEN RELEASE-E2E-001            → [GATE](../10-validation/release-e2e/RELEASE_E2E_GATE.md)
```

**DoR CERTIFIED** · Spec ✅ FROZEN · Runner ✅ · Gate ✅ READY →  
**abrir RELEASE-E2E-001 (E1 only)**. Nada más.

---

## Out of scope (explícito · este capability y este PR)

| Fuera | Motivo |
|-------|--------|
| Specification / Freeze / Runner | Siguientes PRs FOPEBA |
| package.json · scripts · npm · tests · CI | Evidence before Implementation |
| Playwright · browser automation · UI · `src/` · servicios · migraciones | No es DoR |
| Deploy · Rollback | B-04 · B-05 |
| `release-01-beta` | DoRl PASS de todos los gates |
| FLOW-05 / FLOW-06 | Track A; solo si Track B lo bloquea |
| Renegociar FLOW-01…04 · Smoke · Cross-flow | Ya certificados con tag `-pass` |

---

## Naming convention (Track B · documental)

Solo nombres — **ningún artefacto ejecutable en este PR**:

```text
docs/00-status/RELEASE_E2E_DOR.md          ← este documento
docs/00-status/RELEASE_E2E_SPEC.md         ← siguiente

docs/10-validation/release-e2e/            ← tras Spec / Runner
  RELEASE_E2E_RUNNER.md
  RELEASE_E2E_GATE.md
  RELEASE_E2E_001_E1_ACTA.md … 004
  RELEASE_E2E_PASS_ACTA.md
  evidence/

tag (futuro): release-e2e-pass
```

---

## Plan de trabajo B-03

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ✅ #185 · `48e0c5c` |
| 1 | Spec | ✅ FROZEN #186 · [RELEASE_E2E_SPEC](./RELEASE_E2E_SPEC.md) |
| 2 | Freeze (merge Spec → main) | ✅ |
| 3 | Runner only · BLOCKED at E1 | ✅ #188 · `d2a4047` |
| 4 | Gate E2E-001 (Land Check) | ✅ READY |
| 5 | RELEASE-E2E-001…004 (un segmento / PR) | ✅ 001 · ✅ 002 · ⏳ READY TO OPEN 003 |
| 6 | FULL PASS · tag `release-e2e-pass` | ⏳ |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-03 E2E → B-04 Deploy → B-05 Rollback → release-01-beta
Track A:             FLOW-05 solo si Track B encuentra un bloqueador que lo exija
```

No abrir FLOW-05 / Deploy / Rollback / Spec+Runner juntos por inercia tras este DoR.

---

## Fuera de este PR

- `RELEASE_E2E_SPEC.md`  
- Runner · automatización · cualquier ejecutable  
- Deploy · Rollback · `release-01-beta`  
- FLOW-05 / FLOW-06  

---

## End of RELEASE E2E DoR
