# RELEASE-01 · B-06 · Beta Acceptance · Canonical Runner

**Documento:** `RELEASE_01_BETA_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** (#219 · `3994833`) · live through B1 · runner-only **BLOCKED** at B1 · Gate ✅ READY  
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
# Default live through max certified (B1)
npm run test:release-01-beta
# → PASS through B1 · blocked_at=RELEASE_01_BETA_B2_STARTED · exit 0

# RELEASE-01-BETA-001
npm run test:release-01-beta-001
# → PASS through B1 · BLOCKED at B2 · exit 0

# Historic Gate / Land Check vacío
npm run test:release-01-beta:runner-only
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + B1 · no B2 driver)
npm run test:release-01-beta:unit
```

**BLOCKED (runner-only) no es defecto** — conserva el baseline Gate histórico.

---

## Fuera de alcance (001)

- Drivers B2 / B3 / B4 / B5  
- Implementación de plataforma · Playwright · dominio  
- Infra · CI · GitHub Actions · secretos  
- FLOW-05 · Deploy/Rollback ejecutables  
- Tag `release-01-beta`

---

## Gate

Ver: [RELEASE_01_BETA_GATE](./RELEASE_01_BETA_GATE.md) · Decision: ✅ READY · 001 ▶ [ACTA](./RELEASE_01_BETA_001_B1_ACTA.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-01-beta-canonical.mjs` |
| Pipeline | `scripts/lib/release-01-beta-canonical-pipeline.mjs` |
| Capability driver | `scripts/lib/release-01-beta-capability-driver.mjs` |
| B1 Foundation | `scripts/lib/release-01-beta-b1-foundation.mjs` |
| Unit | `scripts/lib/release-01-beta-*-pipeline.spec.mjs` · `release-01-beta-b1-foundation.spec.mjs` |
| 001 live evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-001-canonical-live.json` |
| Runner-only evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-canonical.json` |

---

## Land Check (001 · from this PR)

```bash
git pull origin main
git fetch --tags --prune
npm run test:release-01-beta-001
# → PASS through B1 · BLOCKED at RELEASE_01_BETA_B2_STARTED · exit 0
npm run test:release-01-beta
# → same
npm run test:release-01-beta:runner-only
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2
```

Next after 001 Land Check: **RELEASE-01-BETA-002** (solo B2).

---

## End of RELEASE-01-BETA Runner
