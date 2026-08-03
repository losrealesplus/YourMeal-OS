# RELEASE-01-BETA · 001 · B1 Foundation · ACTA

**Documento:** `RELEASE_01_BETA_001_B1_ACTA.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **CERTIFIED desde `main`** · PASS through B1 · BLOCKED at `RELEASE_01_BETA_B2_STARTED`  
**Tip:** `edc6acf` (Merge #222)  
**Precondición:** Runner CERTIFIED (#219 · `3994833`) · Gate READY (#220 → `2997031`)  
**Gate:** [RELEASE_01_BETA_GATE](./RELEASE_01_BETA_GATE.md)  
**Spec:** [RELEASE_01_BETA_SPEC](../../00-status/RELEASE_01_BETA_SPEC.md)  
**Comando:** `npm run test:release-01-beta-001`  
**Principio:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)

---

## Pregunta

> ¿La base de plataforma (Foundation · Identity · Operational Core · PS-002C) permanece certificada como ancla de la beta?

Segmento: **B1** · ancla Foundation locks · `ps002c-pass` · Spec/Gate Beta.  
Sin B2 · B3 · B4 · B5 · FLOW-05 · tag `release-01-beta`.

---

## Resultado

```text
RELEASE-01-BETA-001
PASS through B1
blocked_at=RELEASE_01_BETA_B2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

### Tokens emitidos

```text
RELEASE_01_BETA_B1_STARTED
RELEASE_01_BETA_B1_COMPLETED
```

### Checks B1

- Script `test:release-01-beta` presente  
- Pipeline RELEASE-01-BETA B1…B5 intacto  
- Foundation locks (`PLATFORM_V1_CLOSED.md` · `IDENTITY_FOUNDATION_LOCK_v1.md`) presentes  
- Tag `ps002c-pass` presente  
- Acta `PS002C_PASS_ACTA.md` presente  
- Spec `RELEASE_01_BETA_SPEC.md` presente  
- Gate `RELEASE_01_BETA_GATE.md` presente  

Fuente: `foundation locks · ps002c-pass · Beta Spec/Gate (no B2+ · no FLOW-05 · no tag)`.

### Fuera de alcance

- B2 Canonical Flows · B3 Platform · B4 Release Stack · B5 Acceptance  
- FLOW-05 · Deploy/Rollback ejecutables · plataforma nueva · business logic  
- Tag `release-01-beta`  

---

## Evidencia

`docs/10-validation/release-01-beta/evidence/release-01-beta-001-canonical-live.json`

---

## Land Check (desde `main` @ `edc6acf`)

```bash
git pull origin main
git fetch --tags --prune
npm run test:release-01-beta-001
npm run test:release-01-beta
npm run test:release-01-beta:runner-only
```

| Comando | Resultado |
|---------|-----------|
| `test:release-01-beta-001` | PASS through B1 · BLOCKED at B2 · exit 0 |
| `test:release-01-beta` | PASS through B1 · BLOCKED at B2 · exit 0 |
| `test:release-01-beta:runner-only` | BLOCKED at `RELEASE_01_BETA_B1_STARTED` · exit 2 |

---

## Next

```text
READY TO OPEN
RELEASE-01-BETA-002 · B2 only
```

---

## End of RELEASE-01-BETA-001 Acta
