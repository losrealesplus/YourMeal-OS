# RELEASE-01 · B-06 · Beta Acceptance · Canonical Runner

**Documento:** `RELEASE_01_BETA_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ▶ este PR · runner vacío → **BLOCKED** at B1 · Gate ⛔ NOT READY hasta Land Check desde `main`  
**Spec:** [RELEASE_01_BETA_SPEC](../../00-status/RELEASE_01_BETA_SPEC.md) (FROZEN · #218 · `ed98b3b`)  
**DoR:** [RELEASE_01_BETA_DOR](../../00-status/RELEASE_01_BETA_DOR.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Release gate — beta acceptance · **not** a Flow · **not** Smoke · **not** Cross-flow · **not** E2E · **not** Deploy · **not** Rollback

> Pregunta que responde este runner:  
> **¿Existe un contrato ejecutable para RELEASE-01-BETA (RELEASE-01 · B-06)?**  
> No: ¿infra? · ¿CI Actions? · ¿FLOW-05? · ¿capacidades nuevas?

---

## Regla de nivel

| Nivel | Certifica |
|-------|-----------|
| **FLOW** | Estados / transiciones de un dominio |
| **RELEASE-SMOKE…ROLLBACK** | Capacidades individuales de plataforma / recovery |
| **RELEASE-01-BETA** | Acceptance del **producto como conjunto** |

Beta **compone** tags `-pass` ya certificados; **no** inventa producto ni reabre gates previos.

---

## Contrato

```text
RELEASE-01-BETA
RELEASE_01_BETA_B1_STARTED      → Foundation
    ↓
RELEASE_01_BETA_B1_COMPLETED
    ↓
RELEASE_01_BETA_B2_STARTED      → Canonical Flows
    ↓
RELEASE_01_BETA_B2_COMPLETED
    ↓
RELEASE_01_BETA_B3_STARTED      → Platform Capabilities
    ↓
RELEASE_01_BETA_B3_COMPLETED
    ↓
RELEASE_01_BETA_B4_STARTED      → Release Stack
    ↓
RELEASE_01_BETA_B4_COMPLETED
    ↓
RELEASE_01_BETA_B5_STARTED      → Beta Acceptance
    ↓
RELEASE_01_BETA_B5_COMPLETED
    ↓
PASS → tag release-01-beta
```

---

## Comandos

```bash
# Default (CERTIFIED_THROUGH = 0) · empty pipeline
npm run test:release-01-beta
# → BLOCKED · blocked_at=RELEASE_01_BETA_B1_STARTED
#   duplicates=[] · missing=[] · out_of_order=[] · evidence={} · exit 2

# Explicit Gate / Land Check
npm run test:release-01-beta:runner-only
# → same BLOCKED at B1 · exit 2

# Unit tests (pipeline only · no B1 driver)
npm run test:release-01-beta:unit
```

**BLOCKED (runner-only) no es defecto** — es el baseline Gate hasta RELEASE-01-BETA-001.

---

## Fuera de alcance (este PR)

- Drivers B1 / B2 / B3 / B4 / B5  
- Implementación de plataforma · Playwright · dominio  
- Infra · CI · GitHub Actions · secretos  
- FLOW-05 · Deploy/Rollback ejecutables  
- Tag `release-01-beta`

---

## Gate

Ver: [RELEASE_01_BETA_GATE](./RELEASE_01_BETA_GATE.md) · Decision: ⛔ **NOT READY** hasta Land Check desde `main`.

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-01-beta-canonical.mjs` |
| Pipeline | `scripts/lib/release-01-beta-canonical-pipeline.mjs` |
| Unit | `scripts/lib/release-01-beta-canonical-pipeline.spec.mjs` |
| Runner-only evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-canonical.json` |

---

## After merge

```bash
git pull origin main
git fetch --tags --prune
npm run test:release-01-beta
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2
```

Solo entonces: Gate → **READY** · abrir **RELEASE-01-BETA-001** (B1 only).

---

## End of RELEASE-01-BETA Runner
