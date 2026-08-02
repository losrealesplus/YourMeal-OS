# RELEASE-01 · B-02 · Cross-flow · Canonical Runner

**Documento:** `RELEASE_CROSSFLOW_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ Runner **ACTIVE** · default **BLOCKED** at `RELEASE_CROSSFLOW_C1_STARTED`  
**Spec:** [RELEASE_CROSSFLOW_SPEC](../../00-status/RELEASE_CROSSFLOW_SPEC.md) (FROZEN · #179)  
**DoR:** [RELEASE_CROSSFLOW_DOR](../../00-status/RELEASE_CROSSFLOW_DOR.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Release gate — chained handoffs · **not** a Flow · **not** Smoke

> Pregunta que responde este PR:  
> **¿Existe un contrato ejecutable para Cross-flow (RELEASE-01 · B-02)?**  
> No: ¿dominio C1? · ¿Playwright? · ¿Supabase? · ¿FLOW-05? · ¿CI?

---

## Regla de nivel

| Nivel | Certifica |
|-------|-----------|
| **FLOW** | Estados / transiciones de un dominio |
| **RELEASE-SMOKE** | Capacidades de plataforma |
| **RELEASE-CROSSFLOW** | Handoffs encadenados entre Flows certificados |

Cross-flow **complementa** runners Flow; **no los sustituye**.

---

## Contrato

```text
RELEASE-CROSSFLOW
RELEASE_CROSSFLOW_C1_STARTED      → FLOW-01 handoff
    ↓
RELEASE_CROSSFLOW_C1_COMPLETED
    ↓
RELEASE_CROSSFLOW_C2_STARTED      → FLOW-02 handoff
    ↓
RELEASE_CROSSFLOW_C2_COMPLETED
    ↓
RELEASE_CROSSFLOW_C3_STARTED      → FLOW-03 handoff
    ↓
RELEASE_CROSSFLOW_C3_COMPLETED
    ↓
RELEASE_CROSSFLOW_C4_STARTED      → FLOW-04 handoff
    ↓
RELEASE_CROSSFLOW_C4_COMPLETED
    ↓
PASS → tag release-crossflow-pass
```

---

## Comando por defecto (este PR)

```bash
npm run test:release-crossflow
```

Resultado esperado (sin drivers de segmento):

```text
RELEASE-CROSSFLOW

BLOCKED

blocked_at=RELEASE_CROSSFLOW_C1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}

exit 2
```

### Unit tests (pipeline only)

```bash
npm run test:release-crossflow:unit
```

### Self-test (synthetic full contract)

```bash
npm run test:release-crossflow -- --self-test
# → PASS through C4 · blocked_at=— · exit 0
```

---

## Fuera de alcance (este PR)

- Drivers C1–C4 / dominio / repositories / services  
- Playwright · UI · Supabase · CI  
- FLOW-05 · E2E · Deploy · Rollback  
- Abrir CROSSFLOW-001  

---

## Gate · CROSSFLOW-001

**CLOSED** hasta Land Check del runner **desde `main`**:

| # | Condición |
|---|-----------|
| 1 | Spec FROZEN en `main` | ✅ #179 |
| 2 | Runner en `main` | ▶ este PR |
| 3 | `npm run test:release-crossflow` → BLOCKED at C1 · exit 2 | ⏳ desde main |
| 4 | Gate report READY | ⏳ |

Ver: [RELEASE_CROSSFLOW_GATE](./RELEASE_CROSSFLOW_GATE.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-crossflow-canonical.mjs` |
| Pipeline | `scripts/lib/release-crossflow-canonical-pipeline.mjs` |
| Default evidence | `docs/10-validation/release-crossflow/evidence/release-crossflow-canonical.json` |

---

## End of RELEASE Cross-flow Runner
