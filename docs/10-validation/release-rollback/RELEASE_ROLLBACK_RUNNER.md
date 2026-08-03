# RELEASE-01 · B-05 · Rollback · Canonical Runner

**Documento:** `RELEASE_ROLLBACK_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner **CERTIFIED** (#210 · `a1fbdc3`) · live through R3 · **FULL PASS** · tag `release-rollback-pass` → `0ba856e` · runner-only **BLOCKED** at R1 · Gate ✅ CLOSED  
**Pass acta:** [RELEASE_ROLLBACK_PASS_ACTA](./RELEASE_ROLLBACK_PASS_ACTA.md)  
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
# Default live through max certified (R3)
npm run test:release-rollback
# → FULL PASS · certified_through=R3 · blocked_at=— · exit 0

# RELEASE-ROLLBACK-001…003
npm run test:release-rollback-001   # PASS through R1 · BLOCKED at R2
npm run test:release-rollback-002   # PASS through R2 · BLOCKED at R3
npm run test:release-rollback-003   # FULL PASS · blocked_at=—

# Historic Gate / Land Check vacío
npm run test:release-rollback:runner-only
# → BLOCKED at RELEASE_ROLLBACK_R1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + R1 + R2 + R3)
npm run test:release-rollback:unit
```

**BLOCKED (runner-only) no es defecto** — conserva el baseline Gate histórico.

---

## Fuera de alcance (003)

- Restore remoto · infra · CI · GitHub Actions · secretos  
- FLOW-05 · `release-01-beta`  
- Tag `release-rollback-pass` (solo tras Land Check desde `main`)

---

## Gate

Ver: [RELEASE_ROLLBACK_GATE](./RELEASE_ROLLBACK_GATE.md) ·  
001: [RELEASE_ROLLBACK_001_R1_ACTA](./RELEASE_ROLLBACK_001_R1_ACTA.md) ·  
002: [RELEASE_ROLLBACK_002_R2_ACTA](./RELEASE_ROLLBACK_002_R2_ACTA.md) ·  
003: [RELEASE_ROLLBACK_003_R3_ACTA](./RELEASE_ROLLBACK_003_R3_ACTA.md) ·  
Execute: [RELEASE_ROLLBACK_EXECUTE](./RELEASE_ROLLBACK_EXECUTE.md) ·  
Verify: [RELEASE_ROLLBACK_VERIFY](./RELEASE_ROLLBACK_VERIFY.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-rollback-canonical.mjs` |
| Pipeline | `scripts/lib/release-rollback-canonical-pipeline.mjs` |
| Capability driver | `scripts/lib/release-rollback-capability-driver.mjs` |
| R1 Detect/Decide | `scripts/lib/release-rollback-r1-detect-decide.mjs` |
| R2 Execute/Restore | `scripts/lib/release-rollback-r2-execute-restore.mjs` |
| R3 Post-rollback Verify | `scripts/lib/release-rollback-r3-post-rollback-verify.mjs` |
| Unit | pipeline + r1 + r2 + r3 specs |
| Live 003 | `docs/10-validation/release-rollback/evidence/release-rollback-003-canonical-live.json` |
| FULL PASS live | `docs/10-validation/release-rollback/evidence/release-rollback-canonical-live.json` |
| Runner-only evidence | `docs/10-validation/release-rollback/evidence/release-rollback-canonical.json` |

---

## Land Check (003 · from this PR)

```bash
git pull origin main
npm run test:release-rollback-003
# → FULL PASS · blocked_at=— · exit 0
npm run test:release-rollback
# → same
npm run test:release-rollback:runner-only
# → BLOCKED at RELEASE_ROLLBACK_R1_STARTED · exit 2
```

Next after 003 Land Check: tag **`release-rollback-pass`** ✅ → READY TO OPEN **RELEASE-01-BETA DoR** (docs only).

---

## End of RELEASE ROLLBACK Runner
