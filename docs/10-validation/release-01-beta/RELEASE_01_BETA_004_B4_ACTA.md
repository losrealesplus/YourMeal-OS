# RELEASE-01-BETA · 004 · B4 Release Stack · ACTA

**Documento:** `RELEASE_01_BETA_004_B4_ACTA.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **CERTIFIED desde `main`** · PASS through B4 · BLOCKED at `RELEASE_01_BETA_B5_STARTED`  
**Tip:** `a75efb1` (Merge #225)  
**Precondición:** B3 CERTIFIED (#224 · `8d2c748`)  
**Gate:** [RELEASE_01_BETA_GATE](./RELEASE_01_BETA_GATE.md)  
**Spec:** [RELEASE_01_BETA_SPEC](../../00-status/RELEASE_01_BETA_SPEC.md)  
**Comando:** `npm run test:release-01-beta-004`  
**Principio:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)

---

## Pregunta

> ¿Deploy · Rollback permanecen certificados como pila de publicación / recuperación de la beta?

Segmento: **B4** · ancla `release-deploy-pass` · `release-rollback-pass`.  
Sin B5 · Acceptance · FLOW-05 · re-ejecución Deploy/Rollback · tag `release-01-beta`.

---

## Resultado

```text
RELEASE-01-BETA-004
PASS through B4
blocked_at=RELEASE_01_BETA_B5_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

### Tokens emitidos

```text
RELEASE_01_BETA_B1_STARTED
RELEASE_01_BETA_B1_COMPLETED
RELEASE_01_BETA_B2_STARTED
RELEASE_01_BETA_B2_COMPLETED
RELEASE_01_BETA_B3_STARTED
RELEASE_01_BETA_B3_COMPLETED
RELEASE_01_BETA_B4_STARTED
RELEASE_01_BETA_B4_COMPLETED
```

### Checks B4

- Acta B3 CERTIFIED desde `main`  
- Tags `release-deploy-pass` · `release-rollback-pass` presentes  
- Actas `RELEASE_DEPLOY_PASS_ACTA` · `RELEASE_ROLLBACK_PASS_ACTA` presentes  

Fuente: `deploy · rollback-pass + PASS actas · B3 CERTIFIED (no B5 · no FLOW-05 · no Deploy/Rollback re-run)`.

### Fuera de alcance

- B5 Beta Acceptance · tag `release-01-beta`  
- FLOW-05 · re-ejecución Deploy/Rollback · Smoke/Cross-flow/E2E · business logic  

---

## Evidencia

`docs/10-validation/release-01-beta/evidence/release-01-beta-004-canonical-live.json`

---

## Land Check (desde `main` @ `a75efb1`)

```bash
git restore docs/10-validation/release-01-beta/evidence/ 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:release-01-beta-004
npm run test:release-01-beta
npm run test:release-01-beta:runner-only
```

| Comando | Resultado |
|---------|-----------|
| `test:release-01-beta-004` | PASS through B4 · BLOCKED at B5 · exit 0 |
| `test:release-01-beta` | PASS through B4 · BLOCKED at B5 · exit 0 |
| `test:release-01-beta:runner-only` | BLOCKED at `RELEASE_01_BETA_B1_STARTED` · exit 2 |

---

## Next

```text
OPEN
RELEASE-01-BETA-005 · B5 only · este PR
```

---

## End of RELEASE-01-BETA-004 Acta
