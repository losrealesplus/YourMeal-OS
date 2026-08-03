# RELEASE-01 · B-06 · Beta Acceptance · Canonical Runner

**Documento:** `RELEASE_01_BETA_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** (#219) · live through B4 · runner-only **BLOCKED** at B1 · Gate ✅ READY  
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
# Default live through max certified (B4)
npm run test:release-01-beta
# → PASS through B4 · blocked_at=RELEASE_01_BETA_B5_STARTED · exit 0

# RELEASE-01-BETA-004
npm run test:release-01-beta-004
# → PASS through B4 · BLOCKED at B5 · exit 0

# RELEASE-01-BETA-003 (scoped)
npm run test:release-01-beta-003
# → PASS through B3 · BLOCKED at B4 · exit 0

# Historic Gate / Land Check vacío
npm run test:release-01-beta:runner-only
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + B1–B4 · no B5 driver)
npm run test:release-01-beta:unit
```

**BLOCKED (runner-only) no es defecto** — conserva el baseline Gate histórico.

---

## Fuera de alcance (004)

- Driver B5 · Acceptance · tag `release-01-beta`  
- FLOW-05 · re-ejecución Deploy/Rollback  
- Infra · CI · GitHub Actions · secretos · business logic  

---

## Gate

Ver: [RELEASE_01_BETA_GATE](./RELEASE_01_BETA_GATE.md) · Decision: ✅ READY · 004 ▶ [ACTA](./RELEASE_01_BETA_004_B4_ACTA.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-01-beta-canonical.mjs` |
| Pipeline | `scripts/lib/release-01-beta-canonical-pipeline.mjs` |
| Capability driver | `scripts/lib/release-01-beta-capability-driver.mjs` |
| B1–B3 | `scripts/lib/release-01-beta-b{1,2,3}-*.mjs` |
| B4 Release Stack | `scripts/lib/release-01-beta-b4-release-stack.mjs` |
| Unit | `scripts/lib/release-01-beta-*-pipeline.spec.mjs` · `*-b1-*.spec.mjs` … `*-b4-*.spec.mjs` |
| 004 live evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-004-canonical-live.json` |
| Runner-only evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-canonical.json` |

---

## Land Check (004 · from this PR)

```bash
git restore docs/10-validation/release-01-beta/evidence/ 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:release-01-beta-004
# → PASS through B4 · BLOCKED at RELEASE_01_BETA_B5_STARTED · exit 0
npm run test:release-01-beta
# → same
npm run test:release-01-beta:runner-only
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2
```

Next after 004 Land Check: **RELEASE-01-BETA-005** (solo B5).

---

## End of RELEASE-01-BETA Runner
