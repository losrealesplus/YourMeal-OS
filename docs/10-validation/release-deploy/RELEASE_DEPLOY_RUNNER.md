# RELEASE-01 · B-04 · Deploy · Canonical Runner

**Documento:** `RELEASE_DEPLOY_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner **CERTIFIED** (#200 · `1008ffd`) · live through D1 · runner-only **BLOCKED** at D1 · Gate ✅ READY  
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
# Default live through max certified (D1)
npm run test:release-deploy
# → PASS through D1 · blocked_at=RELEASE_DEPLOY_D2_STARTED · exit 0

# RELEASE-DEPLOY-001
npm run test:release-deploy-001
# → PASS through D1 · BLOCKED at D2 · exit 0

# Historic Gate / Land Check vacío
npm run test:release-deploy:runner-only
# → BLOCKED at RELEASE_DEPLOY_D1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + D1 · no D2 driver)
npm run test:release-deploy:unit
```

**BLOCKED (runner-only) no es defecto** — conserva el baseline Gate histórico.

---

## Fuera de alcance (001)

- Drivers D2 / D3 · publish/apply real  
- Infra · CI · GitHub Actions · secretos  
- Rollback · FLOW-05 · `release-01-beta`  
- Tag `release-deploy-pass`

---

## Gate

Ver: [RELEASE_DEPLOY_GATE](./RELEASE_DEPLOY_GATE.md) · 001 acta: [RELEASE_DEPLOY_001_D1_ACTA](./RELEASE_DEPLOY_001_D1_ACTA.md).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-deploy-canonical.mjs` |
| Pipeline | `scripts/lib/release-deploy-canonical-pipeline.mjs` |
| D1 driver | `scripts/lib/release-deploy-d1-preflight.mjs` |
| Live 001 | `docs/10-validation/release-deploy/evidence/release-deploy-001-canonical-live.json` |
| Runner-only | `docs/10-validation/release-deploy/evidence/release-deploy-canonical.json` |

---

## End of RELEASE DEPLOY Runner
