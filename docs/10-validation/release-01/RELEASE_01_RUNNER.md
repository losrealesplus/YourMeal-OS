# RELEASE-01 · Product SaaS · Canonical Runner

**Documento:** `RELEASE_01_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** (#229) · live through P2 · runner-only **BLOCKED** at P1 · Gate ✅ READY  
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
# Default live through max certified (P2)
npm run test:release-01
# → PASS through P2 · blocked_at=RELEASE_01_P3_STARTED · exit 0

# RELEASE-01-002
npm run test:release-01-002
# → PASS through P2 · BLOCKED at P3 · exit 0

# RELEASE-01-001 (scoped)
npm run test:release-01-001
# → PASS through P1 · BLOCKED at P2 · exit 0

npm run test:release-01:runner-only
# → BLOCKED at RELEASE_01_P1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + P1)
npm run test:release-01:unit
```

**BLOCKED (runner-only) no es defecto** — baseline Gate / Evidence before Implementation.

`CERTIFIED_THROUGH = 2` · drivers P1–P2. No P3–P5.

---

## Fuera de alcance (002)

- Drivers P3–P5 · actas 003…005  
- FLOW-05 · Capacitor · Stores · producción  
- Re-certificar Track B  
- Nueva lógica de negocio  

---

## Gate

Ver: [RELEASE_01_GATE](./RELEASE_01_GATE.md) · Decision: ✅ READY · 002 ▶ [ACTA](./RELEASE_01_002_P2_ACTA.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-01-canonical.mjs` |
| Pipeline | `scripts/lib/release-01-canonical-pipeline.mjs` |
| Capability driver | `scripts/lib/release-01-capability-driver.mjs` |
| P1 Platform Foundation | `scripts/lib/release-01-p1-platform-foundation.mjs` |
| P2 Core Business | `scripts/lib/release-01-p2-core-business.mjs` |
| Unit | `scripts/lib/release-01-*-pipeline.spec.mjs` · `*-p1-*.spec.mjs` · `*-p2-*.spec.mjs` |
| 002 live evidence | `docs/10-validation/release-01/evidence/release-01-002-canonical-live.json` |
| Runner-only evidence | `docs/10-validation/release-01/evidence/release-01-canonical.json` |

---

## Land Check (from this PR / after merge)

```bash
git restore docs/10-validation/release-01/evidence/ 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:release-01-002
# → PASS through P2 · BLOCKED at RELEASE_01_P3_STARTED · exit 0
npm run test:release-01
# → same
npm run test:release-01:runner-only
# → BLOCKED at RELEASE_01_P1_STARTED · exit 2
```

Next after 002 Land Check: **RELEASE-01-003** (solo P3).

---

## End of RELEASE-01 Runner
