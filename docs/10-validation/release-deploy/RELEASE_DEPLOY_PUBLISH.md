# RELEASE-DEPLOY · Canonical Publish / Apply Procedure

**Documento:** `RELEASE_DEPLOY_PUBLISH.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ ACTIVE · contrato D2 (RELEASE-DEPLOY-002)  
**Spec:** [RELEASE_DEPLOY_SPEC](../../00-status/RELEASE_DEPLOY_SPEC.md) · segmento D2  
**Runner:** [RELEASE_DEPLOY_RUNNER](./RELEASE_DEPLOY_RUNNER.md)  
**Principio:** Evidence before Implementation · no inventar producto

> Pregunta D2:  
> **¿La publicación / apply reproducible se completa según el procedimiento congelado?**

---

## Scope

Este procedimiento define el **publish/apply canónico** de la plataforma ya certificada
(`release-e2e-pass` + D1 Preflight). No es Rollback · no es D3 · no es FLOW-05.

| Incluye | Excluye |
|---------|---------|
| Artefacto web reproducible (`build:web`) | CI / GitHub Actions nuevos |
| Procedimiento documentado y verificable | Infraestructura cloud / secretos |
| Ancla a D1 CERTIFIED | Post-deploy verify (D3) |
| Tokens `RELEASE_DEPLOY_D2_*` | Rollback · `release-01-beta` |

---

## Canonical steps

```text
P1  Confirm D1 CERTIFIED (RELEASE_DEPLOY_001_D1_ACTA)
P2  Confirm publish procedure present (este documento)
P3  Confirm build:web script (artefacto publicable)
P4  Confirm Vite web build entry (vite.config)
P5  Emit RELEASE_DEPLOY_D2_STARTED → COMPLETED
```

No se ejecuta deploy remoto. No se crean secretos. No se reabre E2E.

---

## Artifact contract

| Campo | Valor |
|-------|-------|
| Script | `npm run build:web` |
| Tooling | Vite (`vite build`) |
| Entry | `vite.config.ts` (o equivalente en raíz) |
| Consumidor | D3 Post-deploy Verify (RELEASE-DEPLOY-003) |

---

## PASS / FAIL

| Resultado | Condición |
|-----------|-----------|
| **PASS** | P1–P4 verificables · tokens D2 once-only en orden |
| **FAIL** | Acta D1 ausente · procedimiento ausente · `build:web` ausente · entry ausente |
| **BLOCKED** | Fuera de alcance de este documento (D3+) |

---

## End of RELEASE DEPLOY Publish Procedure
