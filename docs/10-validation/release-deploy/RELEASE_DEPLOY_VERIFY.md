# RELEASE-DEPLOY · Canonical Post-deploy Verify Procedure

**Documento:** `RELEASE_DEPLOY_VERIFY.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ ACTIVE · contrato D3 (RELEASE-DEPLOY-003)  
**Spec:** [RELEASE_DEPLOY_SPEC](../../00-status/RELEASE_DEPLOY_SPEC.md) · segmento D3  
**Runner:** [RELEASE_DEPLOY_RUNNER](./RELEASE_DEPLOY_RUNNER.md)  
**Principio:** Evidence before Implementation · no reabrir E2E

> Pregunta D3:  
> **¿Tras publicar, la verificación mínima confirma superficie operable?**

---

## Scope

Verificación mínima post-publish de la plataforma ya certificada
(D2 Publish/Apply + `release-e2e-pass`). No re-ejecuta E2E completo.
No es Rollback · no es CI · no es deploy remoto.

| Incluye | Excluye |
|---------|---------|
| Ancla a D2 CERTIFIED | Reabrir jornada E2E / Playwright |
| Procedimiento verify documentado | Infraestructura cloud / secretos |
| Superficie mínima operable (`preview`) | Rollback · `release-01-beta` |
| Tokens `RELEASE_DEPLOY_D3_*` | FLOW-05 |

---

## Canonical steps

```text
V1  Confirm D2 CERTIFIED (RELEASE_DEPLOY_002_D2_ACTA)
V2  Confirm verify procedure present (este documento)
V3  Confirm preview script (superficie post-publish)
V4  Confirm app entry (src/ / index) operable en repo
V5  Confirm release-e2e-pass still anchors certified platform
V6  Emit RELEASE_DEPLOY_D3_STARTED → COMPLETED
```

No se reabre Smoke / Cross-flow / E2E. No se inventa producto.

---

## Surface contract

| Campo | Valor |
|-------|-------|
| Preview | `npm run preview` |
| App entry | `src/` o `index.html` en raíz |
| Platform anchor | tag `release-e2e-pass` |
| Close-out | FULL PASS → tag `release-deploy-pass` (tras Land Check) |

---

## PASS / FAIL

| Resultado | Condición |
|-----------|-----------|
| **PASS** | V1–V5 verificables · tokens D1–D3 once-only en orden · FULL PASS |
| **FAIL** | Acta D2 ausente · procedimiento ausente · preview/entry/tag ausente |
| **BLOCKED** | Fuera de alcance (Rollback+) |

---

## End of RELEASE DEPLOY Verify Procedure
