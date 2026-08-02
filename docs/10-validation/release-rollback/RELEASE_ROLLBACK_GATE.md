# RELEASE-01 · B-05 · Rollback · Gate

**Documento:** `RELEASE_ROLLBACK_GATE.md`  
**Fecha:** 2026-08-02  
**Estado:** ⛔ **NOT READY**  
**Spec:** [RELEASE_ROLLBACK_SPEC](../../00-status/RELEASE_ROLLBACK_SPEC.md) (FROZEN)  
**Runner:** [RELEASE_ROLLBACK_RUNNER](./RELEASE_ROLLBACK_RUNNER.md)  
**Principio:** [FOPEBA Land Check](../../00-status/FOPEBA_LAND_CHECK.md) · Regla 9 — solo `main` certifica

---

## Decision

| Campo | Valor |
|-------|-------|
| **Gate** | RELEASE-ROLLBACK |
| **Status** | ⛔ **NOT READY** |
| **Blocked reason** | Runner aún no Land-Checked desde `main` |
| **Unblocks** | RELEASE-ROLLBACK-001 (R1 Detect/Decide only) |

---

## READY criteria (desde `main`)

```bash
git pull origin main
npm run test:release-rollback
```

Debe emitir:

```text
status=BLOCKED
blocked_at=RELEASE_ROLLBACK_R1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code **2**.

Solo entonces: Gate → **READY** · abrir **RELEASE-ROLLBACK-001**.

---

## Prohibido mientras NOT READY

- Abrir RELEASE-ROLLBACK-001 / 002 / 003  
- Drivers de capacidad R*  
- Ejecución de rollback / restore  
- Tag `release-rollback-pass`  
- RELEASE-01-BETA · FLOW-05

---

## End of RELEASE ROLLBACK Gate
