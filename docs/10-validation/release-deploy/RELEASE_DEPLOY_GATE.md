# RELEASE-01 · B-04 · Deploy · Gate

**Documento:** `RELEASE_DEPLOY_GATE.md`  
**Fecha:** 2026-08-02  
**Estado:** ⛔ **NOT READY**  
**Spec:** [RELEASE_DEPLOY_SPEC](../../00-status/RELEASE_DEPLOY_SPEC.md) (FROZEN)  
**Runner:** [RELEASE_DEPLOY_RUNNER](./RELEASE_DEPLOY_RUNNER.md)  
**Principio:** [FOPEBA Land Check](../../00-status/FOPEBA_LAND_CHECK.md) · Regla 9 — solo `main` certifica

---

## Decision

| Campo | Valor |
|-------|-------|
| **Gate** | RELEASE-DEPLOY |
| **Status** | ⛔ **NOT READY** |
| **Blocked reason** | Runner aún no Land-Checked desde `main` |
| **Unblocks** | RELEASE-DEPLOY-001 (D1 Preflight only) |

---

## READY criteria (desde `main`)

```bash
git pull origin main
npm run test:release-deploy
```

Debe emitir:

```text
status=BLOCKED
blocked_at=RELEASE_DEPLOY_D1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code **2**.

Solo entonces: Gate → **READY** · abrir **RELEASE-DEPLOY-001**.

---

## Prohibido mientras NOT READY

- Abrir RELEASE-DEPLOY-001 / 002 / 003  
- Drivers de capacidad D*  
- Tag `release-deploy-pass`  
- Rollback · RELEASE-01-BETA · FLOW-05

---

## End of RELEASE DEPLOY Gate
