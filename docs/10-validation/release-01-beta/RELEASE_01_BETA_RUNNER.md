# RELEASE-01 · B-06 · Beta Acceptance · Canonical Runner

**Documento:** `RELEASE_01_BETA_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** (#219) · live through B5 · **FULL PASS** · tag `release-01-beta` → `facb917` · runner-only **BLOCKED** at B1 · Gate ✅ CLOSED  
**Spec:** [RELEASE_01_BETA_SPEC](../../00-status/RELEASE_01_BETA_SPEC.md) (FROZEN · #218 · `ed98b3b`)  
**DoR:** [RELEASE_01_BETA_DOR](../../00-status/RELEASE_01_BETA_DOR.md)  
**Pass acta:** [RELEASE_01_BETA_PASS_ACTA](./RELEASE_01_BETA_PASS_ACTA.md)  
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
# Default live through max certified (B5)
npm run test:release-01-beta
# → FULL PASS · certified_through=B5 · blocked_at=— · exit 0

# RELEASE-01-BETA-005
npm run test:release-01-beta-005
# → FULL PASS · certified_through=B5 · blocked_at=— · exit 0

# RELEASE-01-BETA-004 (scoped)
npm run test:release-01-beta-004
# → PASS through B4 · BLOCKED at B5 · exit 0

# Historic Gate / Land Check vacío
npm run test:release-01-beta:runner-only
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + B1–B5)
npm run test:release-01-beta:unit
```

**BLOCKED (runner-only) no es defecto** — conserva el baseline Gate histórico.

---

## Fuera de alcance (histórico · 005)

- FLOW-05 · re-ejecución Deploy/Rollback / Smoke / Cross-flow / E2E  
- Infra · CI · GitHub Actions · secretos · business logic  

---

## Gate

Ver: [RELEASE_01_BETA_GATE](./RELEASE_01_BETA_GATE.md) · Decision: ✅ **CLOSED** · PASS [ACTA](./RELEASE_01_BETA_PASS_ACTA.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-01-beta-canonical.mjs` |
| Pipeline | `scripts/lib/release-01-beta-canonical-pipeline.mjs` |
| Capability driver | `scripts/lib/release-01-beta-capability-driver.mjs` |
| B1–B4 | `scripts/lib/release-01-beta-b{1,2,3,4}-*.mjs` |
| B5 Acceptance | `scripts/lib/release-01-beta-b5-acceptance.mjs` |
| Acceptance checklist | `docs/10-validation/release-01-beta/RELEASE_01_BETA_ACCEPTANCE.md` |
| Unit | `scripts/lib/release-01-beta-*-pipeline.spec.mjs` · `*-b1-*.spec.mjs` … `*-b5-*.spec.mjs` |
| 005 live evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-005-canonical-live.json` |
| Runner-only evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-canonical.json` |

---

## Land Check (PASS · from `main` @ `facb917`)

```bash
git restore docs/10-validation/release-01-beta/evidence/ 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:release-01-beta-005
# → FULL PASS · certified_through=B5 · blocked_at=— · exit 0
npm run test:release-01-beta
# → same
npm run test:release-01-beta:runner-only
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2
```

Tag **`release-01-beta` → `facb917`**. Next: **RELEASE-01 DoR** (docs only).

---

## End of RELEASE-01-BETA Runner
