# RELEASE-01 · Product SaaS · Canonical Runner

**Documento:** `RELEASE_01_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** (este PR) · runner-only **BLOCKED** at P1 · Gate ✅ READY · **sin** drivers P1–P5  
**Spec:** [RELEASE_01_SPEC](../../00-status/RELEASE_01_SPEC.md) ✅ FROZEN  
**DoR:** [RELEASE_01_DOR](../../00-status/RELEASE_01_DOR.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Product release — **not** a Flow · **not** Smoke · **not** Deploy · **not** Rollback · **not** Beta re-run

> Pregunta que responde este runner:  
> **¿Existe un contrato ejecutable para RELEASE-01 (producto SaaS)?**  
> No: ¿infra? · ¿CI Actions? · ¿FLOW-05? · ¿Capacitor? · ¿re-certificar Track B?

---

## Regla de nivel

| Nivel | Certifica |
|-------|-----------|
| **FLOW** | Estados / transiciones de un dominio |
| **RELEASE-SMOKE…BETA** | Framework de validación (ya cerrado · `release-01-beta`) |
| **RELEASE-01** | YourMeal OS como **plataforma SaaS operable** |

RELEASE-01 **no** re-ejecuta Smoke / Cross-flow / E2E / Deploy / Rollback.

---

## Contrato

```text
RELEASE-01
RELEASE_01_P1_STARTED      → Platform Foundation
    ↓
RELEASE_01_P1_COMPLETED
    ↓
RELEASE_01_P2_STARTED      → Core Business
    ↓
RELEASE_01_P2_COMPLETED
    ↓
RELEASE_01_P3_STARTED      → Operations
    ↓
RELEASE_01_P3_COMPLETED
    ↓
RELEASE_01_P4_STARTED      → Administration
    ↓
RELEASE_01_P4_COMPLETED
    ↓
RELEASE_01_P5_STARTED      → Product Acceptance
    ↓
RELEASE_01_P5_COMPLETED
    ↓
PASS → RELEASE-01 PASS acta / tag de producto
```

---

## Comandos

```bash
# Default = runner-only mientras CERTIFIED_THROUGH = 0
npm run test:release-01
# → BLOCKED at RELEASE_01_P1_STARTED · exit 2

npm run test:release-01:runner-only
# → BLOCKED at RELEASE_01_P1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline only · no drivers)
npm run test:release-01:unit
```

**BLOCKED (runner-only) no es defecto** — baseline Gate / Evidence before Implementation.

`CERTIFIED_THROUGH = 0` en este PR: **no** hay drivers P1–P5.  
LIVE / `--through=P1…` requieren drivers en entregas `RELEASE-01-001…`.

---

## Fuera de alcance (este PR)

- Drivers P1–P5 · actas 001…005  
- FLOW-05 · Capacitor · Stores · producción  
- Re-certificar Track B  
- UI / migraciones / business logic de producto  

---

## Gate

Ver: [RELEASE_01_GATE](./RELEASE_01_GATE.md) · Decision: ✅ READY · next **RELEASE-01-001** (P1 only).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-01-canonical.mjs` |
| Pipeline | `scripts/lib/release-01-canonical-pipeline.mjs` |
| Unit | `scripts/lib/release-01-canonical-pipeline.spec.mjs` |
| Runner-only evidence | `docs/10-validation/release-01/evidence/release-01-canonical.json` |

---

## Land Check (from this PR / after merge)

```bash
git restore docs/10-validation/release-01/evidence/ 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:release-01:runner-only
# → BLOCKED at RELEASE_01_P1_STARTED · exit 2
npm run test:release-01:unit
# → pass
```

Next: **RELEASE-01-001** (P1 Platform Foundation only).

---

## End of RELEASE-01 Runner
