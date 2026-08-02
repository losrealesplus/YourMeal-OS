# RELEASE-01 · B-04 · Deploy · Canonical Runner

**Documento:** `RELEASE_DEPLOY_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner **CERTIFIED** desde `main` (#200 · `1008ffd`) · runner-only **BLOCKED** at D1 · Gate ✅ READY  
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
# Default (CERTIFIED_THROUGH = 0) · empty pipeline
npm run test:release-deploy
# → BLOCKED · blocked_at=RELEASE_DEPLOY_D1_STARTED
#   duplicates=[] · missing=[] · out_of_order=[] · evidence={} · exit 2

# Explicit Gate / Land Check
npm run test:release-deploy:runner-only
# → same BLOCKED at D1 · exit 2

# Unit tests (pipeline only · no D1 driver)
npm run test:release-deploy:unit
```

**BLOCKED (runner-only) no es defecto** — es el baseline Gate hasta RELEASE-DEPLOY-001.

---

## Fuera de alcance (este PR)

- Drivers D1 / D2 / D3  
- Infra · CI · GitHub Actions · secretos  
- Rollback · FLOW-05 · `release-01-beta`  
- Tag `release-deploy-pass`

---

## Gate

Ver: [RELEASE_DEPLOY_GATE](./RELEASE_DEPLOY_GATE.md) · Decision: ✅ **READY TO OPEN** · RELEASE-DEPLOY-001 (D1 only).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-deploy-canonical.mjs` |
| Pipeline | `scripts/lib/release-deploy-canonical-pipeline.mjs` |
| Unit | `scripts/lib/release-deploy-canonical-pipeline.spec.mjs` |
| Runner-only evidence | `docs/10-validation/release-deploy/evidence/release-deploy-canonical.json` |

---

## Land Check (certified)

```bash
git pull origin main
npm run test:release-deploy
# → BLOCKED at RELEASE_DEPLOY_D1_STARTED · exit 2 · evidence={}
# verified from main @ 1008ffd (#200)
```

Next: **RELEASE-DEPLOY-001** (solo D1) · PASS through D1 · BLOCKED at D2.

---

## End of RELEASE DEPLOY Runner
