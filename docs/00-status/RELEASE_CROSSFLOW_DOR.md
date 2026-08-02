# RELEASE-01 · B-02 · Cross-flow · Definition of Ready

**Documento:** `RELEASE_CROSSFLOW_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **DoR CERTIFIED** (`main` · #178) · Spec ✅ [FROZEN](./RELEASE_CROSSFLOW_SPEC.md) · Runner ▶  
**Nivel:** Release Track B · B-02 Cross-flow  
**Pregunta operacional (borrador):** ¿Los contratos FLOW-01…04 encadenan de extremo a extremo sin romper handoffs?  
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

> Este PR responde **solo**: ¿queda definido el marco Ready de Cross-flow?  
> **No** es Specification. **No** Freeze. **No** Runner. **No** dominio nuevo.  
> **No** abre FLOW-05 · E2E · Deploy · Rollback · `release-01-beta`.

---

## Goal

Certificar que los Outcomes de FLOW-01…04 **encadenan** en una cadena operativa mínima  
reproducible, con evidencia `RELEASE_CROSSFLOW_*` y sin inventar estados fuera de las Specs  
ya FROZEN. Cross-flow es un gate DoRl de producto (Track B), no un Flow nuevo.

---

## Pregunta de capability (borrador · Spec la congela)

> Con FLOW-01…04 certificados de forma aislada,  
> ¿una cadena operativa mínima  
> `Pedido → Producción → Packaging → Entrega → Incidencia → Facturación → Inventario → Cierre`  
> produce handoffs coherentes y evidencia `RELEASE_CROSSFLOW_*` reproducible?

No: *¿cada Flow individual sigue PASS?* (eso ya lo certifican los runners canónicos)  
Sí: *¿los Outcomes de un Flow alimentan el siguiente sin inventar estados?*

---

## Nivel (regla inmutable)

| Runner | Certifica | No certifica |
|--------|-----------|--------------|
| Flow (`test:flowNN-canonical`) | Entidades / estados de un dominio | Cadena entre Flows |
| Smoke (`test:release-smoke`) | Capacidades de plataforma | Dominio / handoffs |
| **Cross-flow** (futuro `test:release-crossflow`) | **Handoffs encadenados** entre Flows certificados | UI E2E · Deploy · Rollback |

Cross-flow **complementa** runners canónicos; **no los sustituye**.  
Un Cross-flow PASS no reabre ni renegocia un `flowNN-pass`.

---

## Scope (permitido en DoR)

| Incluye (propuesto) | Excluye (explícito) |
|---------------------|---------------------|
| Cadena happy-path sobre Outcomes ya certificados | Nuevos estados de dominio no presentes en FLOW-01…04 |
| Tokens `RELEASE_CROSSFLOW_C*_STARTED\|COMPLETED` | Playwright E2E completo (B-03) |
| Reutilizar runners / seeds / evidencias de FLOW-01…04 | Deploy · Rollback · `release-01-beta` |
| Gate antes de CROSSFLOW-001 | FLOW-05 Order Lifecycle (salvo bloqueador demostrado) |
| Land Check desde `main` (Regla 9) | Renegociar Specs FROZEN de FLOW-01…04 |

**Ancla:** Outcomes terminales de FLOW-01…04 como insumos.  
**No reabre** RELEASE-SMOKE salvo regresión del tag `release-smoke-pass`.

---

## Out of scope (explícito · este capability y este PR)

| Fuera | Motivo |
|-------|--------|
| Specification / Freeze / Runner / scripts / tests | Siguientes PRs FOPEBA |
| Implementación de dominio · `src/` · migraciones · Supabase | Evidence before Implementation |
| UI · Playwright E2E completo | B-03 E2E |
| Deploy · Rollback | B-04 · B-05 |
| `release-01-beta` | DoRl PASS de todos los gates |
| FLOW-05 / FLOW-06 | Track A; solo si Track B lo bloquea |
| Renegociar FLOW-01…04 o RELEASE-SMOKE | Ya certificados con tag `-pass` |

---

## Checklist Definition of Ready

Adaptación del estándar Flow Ready al gate de producto:

```text
RELEASE-CROSSFLOW (B-02)
☑ SPEC lista (READY FOR FREEZE)           → RELEASE_CROSSFLOW_SPEC.md
☑ Contrato de evidencias (skeleton)       → este DoR § Tokens · Spec congela
□ Runner creado (test:release-crossflow)  → tras Spec Freeze
☑ Cadena / handoffs propuestos            → este DoR § Cadena
☑ Invariantes propuestos                  → este DoR § Invariantes
☑ PASS esperado                           → Spec fijará; DoR orienta
☑ BLOCKED esperado                        → baseline runner tras Spec
☑ Acta path                               → docs/10-validation/release-crossflow/
```

**Ready completo:** Spec FROZEN + Runner en `main` + BLOCKED verificado desde `main`  
→ solo entonces **READY TO OPEN CROSSFLOW-001**.

---

## Cadena propuesta (no Freeze)

```text
Pedido
  ↓
Producción          ← FLOW-01 (Kitchen → Delivery)
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

Spec decide:

1. Si la cadena beta es **completa** o un **subconjunto** medible.  
2. Cuántos segmentos `Cₙ` existen (propuesta abajo: C1–C4).  
3. Qué Outcome de cada Flow es el handoff obligatorio.

---

## Segmentos propuestos (no Freeze)

| Segmento | Intención (borrador) | Ancla Flow |
|----------|----------------------|------------|
| **C1** | Pedido / producción → entrega operable | FLOW-01 |
| **C2** | Entrega con incidencia → recuperación / delivered | FLOW-02 |
| **C3** | Delivered → facturación pagada | FLOW-03 |
| **C4** | Producción → consumo de inventario sellado | FLOW-04 |

Si Spec reduce o reordena, se congela **en el Freeze**, no en implementación ad hoc.

---

## Invariantes propuestos (no Freeze)

| ID | Invariante |
|----|------------|
| CF-I1 | Tenant isolation — nunca cruzar `tenant_id` entre handoffs |
| CF-I2 | No inventar estados fuera de las Specs FROZEN de FLOW-01…04 |
| CF-I3 | Cada segmento consume un Outcome certificado del Flow ancla (o seed equivalente documentado) |
| CF-I4 | Cross-flow no modifica el contrato de un Flow runner aislado |
| CF-I5 | Evidence tokens once-only · orden estricto · `duplicates/missing/out_of_order = []` en PASS |
| CF-I6 | Fallo en un segmento → FAIL del Cross-flow; no “PASS parcial silencioso” del gate completo |

Spec puede añadir CF-I7+; no eliminar CF-I1–I4 sin acta de renegociación.

---

## Contrato de evidencias propuesto (no Freeze)

```text
RELEASE_CROSSFLOW_C1_STARTED
RELEASE_CROSSFLOW_C1_COMPLETED
RELEASE_CROSSFLOW_C2_STARTED
RELEASE_CROSSFLOW_C2_COMPLETED
RELEASE_CROSSFLOW_C3_STARTED
RELEASE_CROSSFLOW_C3_COMPLETED
RELEASE_CROSSFLOW_C4_STARTED
RELEASE_CROSSFLOW_C4_COMPLETED
```

Prefijo de entrega: `RELEASE-CROSSFLOW-001`…`004` (una capacidad / PR),  
igual disciplina que RELEASE-SMOKE-001…004.

---

## PASS / BLOCKED / FAIL (expectativas)

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · handoffs coherentes |
| **FAIL** | Contrato implementado roto (orden / duplicates / invariante / handoff inválido) |
| **BLOCKED** | Siguiente segmento aún no implementado — **no es defecto** |

### Baseline runner (tras Spec + Runner · no este PR)

```bash
npm run test:release-crossflow
# o test:release-crossflow:runner-only — nombre exacto lo fija el Runner PR
```

```text
RELEASE-CROSSFLOW
BLOCKED
blocked_at=RELEASE_CROSSFLOW_C1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico esperado: **2** (BLOCKED), igual que Smoke / Flows.

### FULL PASS (futuro)

```text
RELEASE-CROSSFLOW
FULL PASS
certified_through=C4
blocked_at=—
duplicates=[]
missing=[]
out_of_order=[]
```

Tag: `release-crossflow-pass` — solo tras Land Check desde `main` + acta.

---

## Naming convention (Track B · igual que RELEASE-SMOKE)

Documentación futura — **no creada en este PR**:

```text
docs/00-status/RELEASE_CROSSFLOW_DOR.md          ← este documento
docs/00-status/RELEASE_CROSSFLOW_SPEC.md

docs/10-validation/release-crossflow/
  RELEASE_CROSSFLOW_RUNNER.md
  RELEASE_CROSSFLOW_GATE.md
  RELEASE_CROSSFLOW_001_C1_ACTA.md
  RELEASE_CROSSFLOW_002_C2_ACTA.md
  RELEASE_CROSSFLOW_003_C3_ACTA.md
  RELEASE_CROSSFLOW_004_C4_ACTA.md
  RELEASE_CROSSFLOW_PASS_ACTA.md
  evidence/

tag: release-crossflow-pass
npm (futuro): test:release-crossflow · test:release-crossflow-001…
```

---

## Evidence contract (ubicación)

| Artefacto | Path |
|-----------|------|
| DoR (este) | `docs/00-status/RELEASE_CROSSFLOW_DOR.md` |
| Spec (siguiente) | `docs/00-status/RELEASE_CROSSFLOW_SPEC.md` |
| Runner / Gate / Actas | `docs/10-validation/release-crossflow/` (ver Naming) |

---


## Gate · Abrir CROSSFLOW-001

CROSSFLOW-001 **solo** cuando se cumplen las cuatro:

| # | Condición |
|---|-----------|
| 1 | Spec mergeada en `main` → Cross-flow **FROZEN** |
| 2 | Runner mergeado en `main` |
| 3 | Desde `main`: runner → BLOCKED at `RELEASE_CROSSFLOW_C1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `RELEASE_CROSSFLOW_C*` sin renegociación abierta |

Hasta entonces: **prohibido** drivers de cadena · nuevos servicios de dominio · UI E2E · Deploy · Rollback.

---

## Plan de trabajo B-02

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ✅ #178 · `e55e2a1` |
| 1 | Spec | ✅ FROZEN #179 · `dbfe917` |
| 2 | Freeze (merge Spec → main) | ✅ |
| 3 | Runner only · BLOCKED at C1 | ✅ #180 · `73df12b` |
| 4 | Gate CROSSFLOW-001 (Land Check) | ✅ READY |
| 5 | CROSSFLOW-001…00n (un segmento / PR) | ✅ 001–002 · ▶ 003 C3 |
| 6 | FULL PASS · tag `release-crossflow-pass` | ⏳ |

---

## Relación con Track A

```text
Track B (prioridad): B-02 Cross-flow → … → release-01-beta
Track A:             FLOW-05 solo si Track B encuentra un bloqueador que lo exija
```

No abrir FLOW-05 por inercia tras `release-smoke-pass`.

---

## Fuera de este PR

- Specification prose / Freeze  
- `scripts/release-crossflow-*.mjs` · drivers  
- Cualquier cambio en `src/` o migraciones  
- E2E · Deploy · Rollback · `release-01-beta`  
- FLOW-05 / FLOW-06  

---

## End of RELEASE Cross-flow DoR
