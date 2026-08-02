# RELEASE-01 · B-02 · Cross-flow · Canonical Runner

**Documento:** `RELEASE_CROSSFLOW_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ Runner **ACTIVE** · live through C2 · runner-only **BLOCKED** at C1  
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

## Comandos

```bash
# Default live through max certified (C2)
npm run test:release-crossflow
# → PASS through C2 · BLOCKED at C3 · exit 0

# RELEASE-CROSSFLOW-001 · C1 only
npm run test:release-crossflow-001
# → PASS through C1 · BLOCKED at C2 · exit 0

# RELEASE-CROSSFLOW-002 · C2 only
npm run test:release-crossflow-002
# → PASS through C2 · BLOCKED at C3 · exit 0

# Historic Gate / Land Check vacío
npm run test:release-crossflow:runner-only
# → BLOCKED at RELEASE_CROSSFLOW_C1_STARTED · exit 2 · evidence={}

# Unit tests
npm run test:release-crossflow:unit
```

---

## Fuera de alcance hasta C2+

- Drivers C3–C4  
- Playwright · UI · Supabase · CI  
- FLOW-05 · E2E · Deploy · Rollback  

---

## Gate

Ver: [RELEASE_CROSSFLOW_GATE](./RELEASE_CROSSFLOW_GATE.md) · Decision: ✅ **READY** · 001 en curso.
---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-crossflow-canonical.mjs` |
| Pipeline | `scripts/lib/release-crossflow-canonical-pipeline.mjs` |
| Default evidence | `docs/10-validation/release-crossflow/evidence/release-crossflow-canonical.json` |

---

## End of RELEASE Cross-flow Runner
