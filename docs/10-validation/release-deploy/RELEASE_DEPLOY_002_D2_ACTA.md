# RELEASE-DEPLOY · 002 · D2 Publish / Apply · ACTA

**Documento:** `RELEASE_DEPLOY_002_D2_ACTA.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **CERTIFIED desde `main`** · PASS through D2 · BLOCKED at `RELEASE_DEPLOY_D3_STARTED`  
**Tip:** `28ddb83` (Merge #204)  
**Precondición:** D1 CERTIFIED (#202 · `a0daf82`) · cert docs (#203 · `8e1fc8e`)  
**Gate:** [RELEASE_DEPLOY_GATE](./RELEASE_DEPLOY_GATE.md)  
**Publish:** [RELEASE_DEPLOY_PUBLISH](./RELEASE_DEPLOY_PUBLISH.md)  
**Spec:** [RELEASE_DEPLOY_SPEC](../../00-status/RELEASE_DEPLOY_SPEC.md)  
**Comando:** `npm run test:release-deploy-002`  
**Principio:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)

---

## Pregunta

> ¿La publicación / apply reproducible se completa según el procedimiento congelado?

Segmento: **D2** · ancla D1 CERTIFIED + `RELEASE_DEPLOY_PUBLISH` + `build:web`.  
Sin D3 · deploy remoto · CI · infra · Rollback · FLOW-05.

---

## Resultado

```text
RELEASE-DEPLOY-002
PASS through D2
blocked_at=RELEASE_DEPLOY_D3_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

### Tokens emitidos

```text
RELEASE_DEPLOY_D1_STARTED
RELEASE_DEPLOY_D1_COMPLETED
RELEASE_DEPLOY_D2_STARTED
RELEASE_DEPLOY_D2_COMPLETED
```

### Checks D2

- Acta D1 CERTIFIED desde `main`  
- Procedimiento `RELEASE_DEPLOY_PUBLISH.md` completo  
- Script `build:web` presente  
- `vite.config.*` presente  

Fuente: `D1 CERTIFIED + RELEASE_DEPLOY_PUBLISH + build:web (no D3 · no remote deploy · no infra)`.

### Fuera de alcance

- D3 Post-deploy Verify  
- CI · GitHub Actions · infraestructura · secretos · deploy remoto  
- Rollback · RELEASE-01-BETA · FLOW-05  

---

## Evidencia

`docs/10-validation/release-deploy/evidence/release-deploy-002-canonical-live.json`

---

## Canonical / runner-only (mismo PR)

| Comando | Resultado |
|---------|-----------|
| `test:release-deploy` | PASS through D2 · BLOCKED at D3 · exit 0 |
| `test:release-deploy-001` | PASS through D1 · BLOCKED at D2 · exit 0 |
| `test:release-deploy:runner-only` | BLOCKED at `RELEASE_DEPLOY_D1_STARTED` · exit 2 |

---

## Land Check (desde `main` @ `28ddb83`)

| Comando | Resultado |
|---------|-----------|
| `test:release-deploy-002` | PASS through D2 · BLOCKED at D3 · exit 0 |
| `test:release-deploy` | PASS through D2 · BLOCKED at D3 · exit 0 |
| `test:release-deploy:runner-only` | BLOCKED at D1 · exit 2 |

## Next

```text
READY TO OPEN
RELEASE-DEPLOY-003 · D3 only
Post-deploy Verify
Nothing beyond D3.
```

---

## End of RELEASE-DEPLOY-002 Acta
