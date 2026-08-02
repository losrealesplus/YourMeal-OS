# RELEASE-01 · B-04 · Deploy · Canonical Runner

**Documento:** `RELEASE_DEPLOY_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner **CERTIFIED** (#200 · `1008ffd`) · live through D2 · runner-only **BLOCKED** at D1 · Gate ✅ READY  
**Spec:** [RELEASE_DEPLOY_SPEC](../../00-status/RELEASE_DEPLOY_SPEC.md) (FROZEN · #198 · `ef447e2`)  
**DoR:** [RELEASE_DEPLOY_DOR](../../00-status/RELEASE_DEPLOY_DOR.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Release gate — reproducible deployment · **not** a Flow · **not** Smoke · **not** Cross-flow · **not** E2E

> Pregunta que responde este runner:  
> **¿Existe un contrato ejecutable para RELEASE-DEPLOY (RELEASE-01 · B-04)?**  
> No: ¿infra? · ¿CI Actions? · ¿Rollback? · ¿FLOW-05? · ¿`release-01-beta`?

---

## Regla de nivel

| Nivel | Certifica |
|-------|-----------|
| **FLOW** | Estados / transiciones de un dominio |
| **RELEASE-SMOKE** | Capacidades de plataforma |
| **RELEASE-CROSSFLOW** | Handoffs encadenados entre Flows |
| **RELEASE-E2E** | Jornada piloto de la plataforma como un todo |
| **RELEASE-DEPLOY** | Publicación reproducible de lo ya certificado |

Deploy **publica** la plataforma certificada; **no** re-certifica Smoke / Cross-flow / E2E.

---

## Contrato

```text
RELEASE-DEPLOY
RELEASE_DEPLOY_D1_STARTED      → Deploy Preflight
    ↓
RELEASE_DEPLOY_D1_COMPLETED
    ↓
RELEASE_DEPLOY_D2_STARTED      → Publish / Apply
    ↓
RELEASE_DEPLOY_D2_COMPLETED
    ↓
RELEASE_DEPLOY_D3_STARTED      → Post-deploy Verify
    ↓
RELEASE_DEPLOY_D3_COMPLETED
    ↓
PASS → tag release-deploy-pass
```

---

## Comandos

```bash
# Default live through max certified (D2)
npm run test:release-deploy
# → PASS through D2 · blocked_at=RELEASE_DEPLOY_D3_STARTED · exit 0

# RELEASE-DEPLOY-001…002
npm run test:release-deploy-001   # PASS through D1 · BLOCKED at D2
npm run test:release-deploy-002   # PASS through D2 · BLOCKED at D3

# Historic Gate / Land Check vacío
npm run test:release-deploy:runner-only
# → BLOCKED at RELEASE_DEPLOY_D1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + D1 + D2 · no D3 driver)
npm run test:release-deploy:unit
```

**BLOCKED (runner-only) no es defecto** — conserva el baseline Gate histórico.

---

## Fuera de alcance (002)

- Driver D3 · verify post-deploy  
- Infra · CI · GitHub Actions · secretos · deploy remoto  
- Rollback · FLOW-05 · `release-01-beta`  
- Tag `release-deploy-pass`

---

## Gate

Ver: [RELEASE_DEPLOY_GATE](./RELEASE_DEPLOY_GATE.md) ·  
001: [RELEASE_DEPLOY_001_D1_ACTA](./RELEASE_DEPLOY_001_D1_ACTA.md) ·  
002: [RELEASE_DEPLOY_002_D2_ACTA](./RELEASE_DEPLOY_002_D2_ACTA.md) ·  
Publish: [RELEASE_DEPLOY_PUBLISH](./RELEASE_DEPLOY_PUBLISH.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-deploy-canonical.mjs` |
| Pipeline | `scripts/lib/release-deploy-canonical-pipeline.mjs` |
| D1 driver | `scripts/lib/release-deploy-d1-preflight.mjs` |
| D2 driver | `scripts/lib/release-deploy-d2-publish-apply.mjs` |
| Live 002 | `docs/10-validation/release-deploy/evidence/release-deploy-002-canonical-live.json` |
| Runner-only | `docs/10-validation/release-deploy/evidence/release-deploy-canonical.json` |

---

## End of RELEASE DEPLOY Runner
