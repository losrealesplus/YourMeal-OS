# RELEASE-01 · B-05 · Rollback · Canonical Runner

**Documento:** `RELEASE_ROLLBACK_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ este PR · runner vacío → **BLOCKED** at R1 · Gate ⛔ NOT READY hasta Land Check desde `main`  
**Spec:** [RELEASE_ROLLBACK_SPEC](../../00-status/RELEASE_ROLLBACK_SPEC.md) (FROZEN · #208 · `4d109f7`)  
**DoR:** [RELEASE_ROLLBACK_DOR](../../00-status/RELEASE_ROLLBACK_DOR.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Release gate — controlled recovery · **not** a Flow · **not** Deploy · **not** Smoke · **not** Cross-flow · **not** E2E

> Pregunta que responde este runner:  
> **¿Existe un contrato ejecutable para RELEASE-ROLLBACK (RELEASE-01 · B-05)?**  
> No: ¿infra? · ¿CI Actions? · ¿restore real? · ¿FLOW-05? · ¿`release-01-beta`?

---

## Regla de nivel

| Nivel | Certifica |
|-------|-----------|
| **FLOW** | Estados / transiciones de un dominio |
| **RELEASE-SMOKE** | Capacidades de plataforma |
| **RELEASE-CROSSFLOW** | Handoffs encadenados entre Flows |
| **RELEASE-E2E** | Jornada piloto de la plataforma como un todo |
| **RELEASE-DEPLOY** | Publicación reproducible de lo ya certificado |
| **RELEASE-ROLLBACK** | Recuperación controlada post-deploy |

Rollback **recupera** la plataforma desplegada; **no** re-certifica Deploy / Smoke / Cross-flow / E2E.

---

## Contrato

```text
RELEASE-ROLLBACK
RELEASE_ROLLBACK_R1_STARTED      → Detect / Decide
    ↓
RELEASE_ROLLBACK_R1_COMPLETED
    ↓
RELEASE_ROLLBACK_R2_STARTED      → Execute Rollback / Restore
    ↓
RELEASE_ROLLBACK_R2_COMPLETED
    ↓
RELEASE_ROLLBACK_R3_STARTED      → Post-rollback Verify
    ↓
RELEASE_ROLLBACK_R3_COMPLETED
    ↓
PASS → tag release-rollback-pass
```

---

## Comandos

```bash
# Default (CERTIFIED_THROUGH = 0) · empty pipeline
npm run test:release-rollback
# → BLOCKED · blocked_at=RELEASE_ROLLBACK_R1_STARTED
#   duplicates=[] · missing=[] · out_of_order=[] · evidence={} · exit 2

# Explicit Gate / Land Check
npm run test:release-rollback:runner-only
# → same BLOCKED at R1 · exit 2

# Unit tests (pipeline only · no R1 driver)
npm run test:release-rollback:unit
```

**BLOCKED (runner-only) no es defecto** — es el baseline Gate hasta RELEASE-ROLLBACK-001.

---

## Fuera de alcance (este PR)

- Drivers R1 / R2 / R3  
- Ejecución de rollback / restore  
- Infra · CI · GitHub Actions · secretos  
- FLOW-05 · `release-01-beta`  
- Tag `release-rollback-pass`

---

## Gate

Ver: [RELEASE_ROLLBACK_GATE](./RELEASE_ROLLBACK_GATE.md) · Decision: ⛔ **NOT READY** hasta Land Check desde `main`.

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-rollback-canonical.mjs` |
| Pipeline | `scripts/lib/release-rollback-canonical-pipeline.mjs` |
| Unit | `scripts/lib/release-rollback-canonical-pipeline.spec.mjs` |
| Runner-only evidence | `docs/10-validation/release-rollback/evidence/release-rollback-canonical.json` |

---

## After merge

```bash
git pull origin main
npm run test:release-rollback
# → BLOCKED at RELEASE_ROLLBACK_R1_STARTED · exit 2 · evidence={}
```

Si cumple → Gate **READY** → abrir **RELEASE-ROLLBACK-001** (solo R1).

---

## End of RELEASE ROLLBACK Runner
