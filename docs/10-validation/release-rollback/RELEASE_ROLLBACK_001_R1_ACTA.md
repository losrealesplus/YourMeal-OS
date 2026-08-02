# RELEASE-ROLLBACK · 001 · R1 Detect / Decide · ACTA

**Documento:** `RELEASE_ROLLBACK_001_R1_ACTA.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ este PR · PASS through R1 · BLOCKED at `RELEASE_ROLLBACK_R2_STARTED`  
**Precondición:** Runner CERTIFIED (#210 · `a1fbdc3`) · Gate READY (#211 · `9e9c777`)  
**Gate:** [RELEASE_ROLLBACK_GATE](./RELEASE_ROLLBACK_GATE.md)  
**Spec:** [RELEASE_ROLLBACK_SPEC](../../00-status/RELEASE_ROLLBACK_SPEC.md)  
**Comando:** `npm run test:release-rollback-001`  
**Principio:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)

---

## Pregunta

> ¿El criterio de activación de rollback está definido y verificable?

Segmento: **R1** · ancla `release-deploy-pass` + Spec/Gate Rollback.  
Sin R2 · R3 · restore · CI · infra · FLOW-05 · `release-01-beta`.

---

## Resultado

```text
RELEASE-ROLLBACK-001
PASS through R1
blocked_at=RELEASE_ROLLBACK_R2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

### Tokens emitidos

```text
RELEASE_ROLLBACK_R1_STARTED
RELEASE_ROLLBACK_R1_COMPLETED
```

### Checks R1

- Script `test:release-rollback` presente  
- Pipeline RELEASE-ROLLBACK R1…R3 intacto  
- Tag `release-deploy-pass` presente  
- Acta `RELEASE_DEPLOY_PASS_ACTA.md` presente  
- Spec `RELEASE_ROLLBACK_SPEC.md` presente  
- Gate `RELEASE_ROLLBACK_GATE.md` presente  

Fuente: `release-deploy-pass + Rollback Spec/Gate (no R2+ · no restore · no infra)`.

### Fuera de alcance

- R2 Execute Rollback / Restore · R3 Post-rollback Verify  
- CI · GitHub Actions · infraestructura · secretos  
- RELEASE-01-BETA · FLOW-05  

---

## Evidencia

`docs/10-validation/release-rollback/evidence/release-rollback-001-canonical-live.json`

---

## Canonical / runner-only (mismo PR)

| Comando | Resultado |
|---------|-----------|
| `test:release-rollback` | PASS through R1 · BLOCKED at R2 · exit 0 |
| `test:release-rollback:runner-only` | BLOCKED at `RELEASE_ROLLBACK_R1_STARTED` · exit 2 |

---

## Next

```text
READY TO OPEN
RELEASE-ROLLBACK-002 · R2 only
(after Land Check of 001 from main)
```

---

## End of RELEASE-ROLLBACK-001 Acta
