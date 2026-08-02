# RELEASE-ROLLBACK · Canonical Post-rollback Verify Procedure

**Documento:** `RELEASE_ROLLBACK_VERIFY.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ ACTIVE · contrato R3 (RELEASE-ROLLBACK-003)  
**Spec:** [RELEASE_ROLLBACK_SPEC](../../00-status/RELEASE_ROLLBACK_SPEC.md) · segmento R3  
**Runner:** [RELEASE_ROLLBACK_RUNNER](./RELEASE_ROLLBACK_RUNNER.md)  
**Principio:** Evidence before Implementation · no reabrir E2E / Deploy

> Pregunta R3:  
> **¿Tras recuperar, la verificación mínima confirma superficie operable?**

---

## Scope

Verificación mínima post-restore de la plataforma ya recuperada
(R2 Execute/Restore + `release-deploy-pass`). No re-ejecuta E2E / Deploy completo.
No es RELEASE-01-BETA · no es CI · no es restore remoto.

| Incluye | Excluye |
|---------|---------|
| Ancla a R2 CERTIFIED | Reabrir jornada E2E / Playwright |
| Procedimiento verify documentado | Infraestructura cloud / secretos |
| Superficie mínima operable (`preview`) | RELEASE-01-BETA · FLOW-05 |
| Tokens `RELEASE_ROLLBACK_R3_*` | Deploy nuevo |

---

## Canonical steps

```text
V1  Confirm R2 CERTIFIED (RELEASE_ROLLBACK_002_R2_ACTA)
V2  Confirm verify procedure present (este documento)
V3  Confirm preview script (superficie post-restore)
V4  Confirm app entry (src/ / index) operable en repo
V5  Confirm release-deploy-pass still anchors certified Deploy tip
V6  Emit RELEASE_ROLLBACK_R3_STARTED → COMPLETED
```

No se reabre Smoke / Cross-flow / E2E / Deploy. No se inventa producto.

---

## Surface contract

| Campo | Valor |
|-------|-------|
| Preview | `npm run preview` |
| App entry | `src/` o `index.html` en raíz |
| Platform anchor | tag `release-deploy-pass` |
| Close-out | FULL PASS → tag `release-rollback-pass` (tras Land Check) |

---

## PASS / FAIL

| Resultado | Condición |
|-----------|-----------|
| **PASS** | V1–V5 verificables · tokens R1–R3 once-only en orden · FULL PASS |
| **FAIL** | Acta R2 ausente · procedimiento ausente · preview/entry/tag ausente |
| **BLOCKED** | Fuera de alcance (BETA+) |

---

## End of RELEASE ROLLBACK Verify Procedure
