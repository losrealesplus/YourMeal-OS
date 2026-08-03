# RELEASE-01 · B-06 · Beta Acceptance · Canonical Runner

**Documento:** `RELEASE_01_BETA_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** (#219) · live through B3 · runner-only **BLOCKED** at B1 · Gate ✅ READY  
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
# Default live through max certified (B3)
npm run test:release-01-beta
# → PASS through B3 · blocked_at=RELEASE_01_BETA_B4_STARTED · exit 0

# RELEASE-01-BETA-003
npm run test:release-01-beta-003
# → PASS through B3 · BLOCKED at B4 · exit 0

# RELEASE-01-BETA-002 (scoped)
npm run test:release-01-beta-002
# → PASS through B2 · BLOCKED at B3 · exit 0

# Historic Gate / Land Check vacío
npm run test:release-01-beta:runner-only
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + B1–B3 · no B4 driver)
npm run test:release-01-beta:unit
```

**BLOCKED (runner-only) no es defecto** — conserva el baseline Gate histórico.

---

## Fuera de alcance (003)

- Drivers B4 / B5  
- Deploy · Rollback (B4) · FLOW-05  
- Re-ejecución Smoke/Cross-flow/E2E  
- Infra · CI · GitHub Actions · secretos · business logic  
- Tag `release-01-beta`

---

## Gate

Ver: [RELEASE_01_BETA_GATE](./RELEASE_01_BETA_GATE.md) · Decision: ✅ READY · 003 ▶ [ACTA](./RELEASE_01_BETA_003_B3_ACTA.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-01-beta-canonical.mjs` |
| Pipeline | `scripts/lib/release-01-beta-canonical-pipeline.mjs` |
| Capability driver | `scripts/lib/release-01-beta-capability-driver.mjs` |
| B1 Foundation | `scripts/lib/release-01-beta-b1-foundation.mjs` |
| B2 Canonical Flows | `scripts/lib/release-01-beta-b2-canonical-flows.mjs` |
| B3 Platform Capabilities | `scripts/lib/release-01-beta-b3-platform-capabilities.mjs` |
| Unit | `scripts/lib/release-01-beta-*-pipeline.spec.mjs` · `*-b1-*.spec.mjs` · `*-b2-*.spec.mjs` · `*-b3-*.spec.mjs` |
| 003 live evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-003-canonical-live.json` |
| Runner-only evidence | `docs/10-validation/release-01-beta/evidence/release-01-beta-canonical.json` |

---

## Land Check (003 · from this PR)

```bash
git pull origin main
git fetch --tags --prune
npm run test:release-01-beta-003
# → PASS through B3 · BLOCKED at RELEASE_01_BETA_B4_STARTED · exit 0
npm run test:release-01-beta
# → same
npm run test:release-01-beta:runner-only
# → BLOCKED at RELEASE_01_BETA_B1_STARTED · exit 2
```

Next after 003 Land Check: **RELEASE-01-BETA-004** (solo B4).

---

## End of RELEASE-01-BETA Runner
