# RELEASE-01 · B-05 · Rollback · Canonical Runner

**Documento:** `RELEASE_ROLLBACK_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner **CERTIFIED** (#210 · `a1fbdc3`) · live through R1 · runner-only **BLOCKED** at R1 · Gate ✅ READY  
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
# Default live through max certified (R1)
npm run test:release-rollback
# → PASS through R1 · blocked_at=RELEASE_ROLLBACK_R2_STARTED · exit 0

# RELEASE-ROLLBACK-001
npm run test:release-rollback-001
# → PASS through R1 · BLOCKED at R2 · exit 0

# Historic Gate / Land Check vacío
npm run test:release-rollback:runner-only
# → BLOCKED at RELEASE_ROLLBACK_R1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + R1 · no R2 driver)
npm run test:release-rollback:unit
```

**BLOCKED (runner-only) no es defecto** — conserva el baseline Gate histórico.

---

## Fuera de alcance (001)

- Drivers R2 / R3  
- Ejecución de rollback / restore  
- Infra · CI · GitHub Actions · secretos  
- FLOW-05 · `release-01-beta`  
- Tag `release-rollback-pass`

---

## Gate

Ver: [RELEASE_ROLLBACK_GATE](./RELEASE_ROLLBACK_GATE.md) · Decision: ✅ READY · 001 ▶ [ACTA](./RELEASE_ROLLBACK_001_R1_ACTA.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-rollback-canonical.mjs` |
| Pipeline | `scripts/lib/release-rollback-canonical-pipeline.mjs` |
| Unit | `scripts/lib/release-rollback-canonical-pipeline.spec.mjs` |
| Runner-only evidence | `docs/10-validation/release-rollback/evidence/release-rollback-canonical.json` |

---

## Land Check (001 · from this PR)

```bash
git pull origin main
npm run test:release-rollback-001
# → PASS through R1 · BLOCKED at RELEASE_ROLLBACK_R2_STARTED · exit 0
npm run test:release-rollback
# → same
npm run test:release-rollback:runner-only
# → BLOCKED at RELEASE_ROLLBACK_R1_STARTED · exit 2
```

Next after 001 Land Check: **RELEASE-ROLLBACK-002** (solo R2).

---

## End of RELEASE ROLLBACK Runner
