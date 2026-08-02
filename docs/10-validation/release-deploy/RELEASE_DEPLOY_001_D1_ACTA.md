# RELEASE-DEPLOY · 001 · D1 Preflight · ACTA

**Documento:** `RELEASE_DEPLOY_001_D1_ACTA.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ este PR · PASS through D1 · BLOCKED at `RELEASE_DEPLOY_D2_STARTED`  
**Precondición:** Runner CERTIFIED (#200 · `1008ffd`) · Gate READY (#201 · `9de2893`)  
**Gate:** [RELEASE_DEPLOY_GATE](./RELEASE_DEPLOY_GATE.md)  
**Spec:** [RELEASE_DEPLOY_SPEC](../../00-status/RELEASE_DEPLOY_SPEC.md)  
**Comando:** `npm run test:release-deploy-001`  
**Principio:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)

---

## Pregunta

> ¿El entorno / artefacto mínimo para publicar está definido y verificable?

Segmento: **D1** · ancla `release-e2e-pass` + Spec/Gate Deploy.  
Sin D2 · D3 · publish/apply · CI · infra · Rollback · FLOW-05.

---

## Resultado

```text
RELEASE-DEPLOY-001
PASS through D1
blocked_at=RELEASE_DEPLOY_D2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

### Tokens emitidos

```text
RELEASE_DEPLOY_D1_STARTED
RELEASE_DEPLOY_D1_COMPLETED
```

### Checks D1

- Script `test:release-deploy` presente  
- Pipeline RELEASE-DEPLOY D1…D3 intacto  
- Tag `release-e2e-pass` presente  
- Acta `RELEASE_E2E_PASS_ACTA.md` presente  
- Spec `RELEASE_DEPLOY_SPEC.md` presente  
- Gate `RELEASE_DEPLOY_GATE.md` presente  

Fuente: `release-e2e-pass + Deploy Spec/Gate (no D2+ · no publish/apply · no infra)`.

### Fuera de alcance

- D2 Publish / Apply · D3 Post-deploy Verify  
- CI · GitHub Actions · infraestructura · secretos  
- Rollback · RELEASE-01-BETA · FLOW-05  

---

## Evidencia

`docs/10-validation/release-deploy/evidence/release-deploy-001-canonical-live.json`

---

## Canonical / runner-only (mismo PR)

| Comando | Resultado |
|---------|-----------|
| `test:release-deploy` | PASS through D1 · BLOCKED at D2 · exit 0 |
| `test:release-deploy:runner-only` | BLOCKED at `RELEASE_DEPLOY_D1_STARTED` · exit 2 |

---

## Next

```text
READY TO OPEN
RELEASE-DEPLOY-002 · D2 only
(after Land Check of 001 from main)
```

---

## End of RELEASE-DEPLOY-001 Acta
