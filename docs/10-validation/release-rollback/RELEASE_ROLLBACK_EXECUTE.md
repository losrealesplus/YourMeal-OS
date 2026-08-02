# RELEASE-ROLLBACK · Canonical Execute / Restore Procedure

**Documento:** `RELEASE_ROLLBACK_EXECUTE.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ ACTIVE · contrato R2 (RELEASE-ROLLBACK-002)  
**Spec:** [RELEASE_ROLLBACK_SPEC](../../00-status/RELEASE_ROLLBACK_SPEC.md) · segmento R2  
**Runner:** [RELEASE_ROLLBACK_RUNNER](./RELEASE_ROLLBACK_RUNNER.md)  
**Principio:** Evidence before Implementation · no inventar producto

> Pregunta R2:  
> **¿La recuperación / restore reproducible se completa según el procedimiento congelado?**

---

## Scope

Este procedimiento define el **execute/restore canónico** de la plataforma ya desplegada
(`release-deploy-pass` + R1 Detect/Decide). No es Deploy · no es R3 · no es FLOW-05.

| Incluye | Excluye |
|---------|---------|
| Procedimiento documentado y verificable | CI / GitHub Actions nuevos |
| Ancla a R1 CERTIFIED + tip `release-deploy-pass` | Infraestructura cloud / secretos |
| Tokens `RELEASE_ROLLBACK_R2_*` | Post-rollback verify (R3) |
| Restauración documental del tip certificado | Ejecución remota ad-hoc · `release-01-beta` |

---

## Canonical steps

```text
X1  Confirm R1 CERTIFIED (RELEASE_ROLLBACK_001_R1_ACTA)
X2  Confirm execute procedure present (este documento)
X3  Confirm restore target tip (git tag release-deploy-pass)
X4  Confirm Runner contract still present (RELEASE_ROLLBACK_RUNNER)
X5  Emit RELEASE_ROLLBACK_R2_STARTED → COMPLETED
```

No se ejecuta restore remoto. No se crean secretos. No se reabre Deploy / E2E.

---

## Restore target contract

| Campo | Valor |
|-------|-------|
| Ancla | Tag `release-deploy-pass` |
| Tip certificado | `7896a2a` (RELEASE-DEPLOY FULL PASS) |
| Consumidor | R3 Post-rollback Verify (RELEASE-ROLLBACK-003) |

---

## PASS / FAIL

| Resultado | Condición |
|-----------|-----------|
| **PASS** | X1–X4 verificables · tokens R2 once-only en orden |
| **FAIL** | Acta R1 ausente · procedimiento ausente · tag ancla ausente · Runner ausente |
| **BLOCKED** | Fuera de alcance de este documento (R3+) |

---

## End of RELEASE ROLLBACK Execute Procedure
