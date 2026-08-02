# RELEASE-ROLLBACK · 002 · R2 Execute Rollback / Restore · ACTA

**Documento:** `RELEASE_ROLLBACK_002_R2_ACTA.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **CERTIFIED desde `main`** · PASS through R2 · BLOCKED at `RELEASE_ROLLBACK_R3_STARTED`  
**Tip:** `2838138` (Merge #214)  
**Precondición:** R1 CERTIFIED (#212 · `9c52d01`) · cert docs (#213 · `8dc7ce3`)  
**Gate:** [RELEASE_ROLLBACK_GATE](./RELEASE_ROLLBACK_GATE.md)  
**Execute:** [RELEASE_ROLLBACK_EXECUTE](./RELEASE_ROLLBACK_EXECUTE.md)  
**Spec:** [RELEASE_ROLLBACK_SPEC](../../00-status/RELEASE_ROLLBACK_SPEC.md)  
**Comando:** `npm run test:release-rollback-002`  
**Principio:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)

---

## Pregunta

> ¿La recuperación / restore reproducible se completa según el procedimiento congelado?

Segmento: **R2** · ancla R1 CERTIFIED + `RELEASE_ROLLBACK_EXECUTE` + `release-deploy-pass`.  
Sin R3 · restore remoto · CI · infra · FLOW-05 · `release-01-beta`.

---

## Resultado

```text
RELEASE-ROLLBACK-002
PASS through R2
blocked_at=RELEASE_ROLLBACK_R3_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

### Tokens emitidos

```text
RELEASE_ROLLBACK_R1_STARTED
RELEASE_ROLLBACK_R1_COMPLETED
RELEASE_ROLLBACK_R2_STARTED
RELEASE_ROLLBACK_R2_COMPLETED
```

### Checks R2

- Acta R1 CERTIFIED desde `main`  
- Procedimiento `RELEASE_ROLLBACK_EXECUTE.md` completo  
- Tag `release-deploy-pass` presente (restore target)  
- Runner `RELEASE_ROLLBACK_RUNNER.md` presente  

Fuente: `R1 CERTIFIED + RELEASE_ROLLBACK_EXECUTE + release-deploy-pass (no R3 · no remote restore · no infra)`.

### Fuera de alcance

- R3 Post-rollback Verify  
- CI · GitHub Actions · infraestructura · secretos · restore remoto  
- RELEASE-01-BETA · FLOW-05  

---

## Evidencia

`docs/10-validation/release-rollback/evidence/release-rollback-002-canonical-live.json`

---

## Canonical / runner-only (mismo PR)

| Comando | Resultado |
|---------|-----------|
| `test:release-rollback` | PASS through R2 · BLOCKED at R3 · exit 0 |
| `test:release-rollback-001` | PASS through R1 · BLOCKED at R2 · exit 0 |
| `test:release-rollback:runner-only` | BLOCKED at `RELEASE_ROLLBACK_R1_STARTED` · exit 2 |

---

## Land Check (desde `main` @ `2838138`)

| Comando | Resultado |
|---------|-----------|
| `test:release-rollback-002` | PASS through R2 · BLOCKED at R3 · exit 0 |
| `test:release-rollback` | PASS through R2 · BLOCKED at R3 · exit 0 |
| `test:release-rollback:runner-only` | BLOCKED at R1 · exit 2 |

## Next

```text
READY TO OPEN
RELEASE-ROLLBACK-003 · R3 only
Post-rollback Verify
Nothing beyond R3.
```

---

## End of RELEASE-ROLLBACK-002 Acta
