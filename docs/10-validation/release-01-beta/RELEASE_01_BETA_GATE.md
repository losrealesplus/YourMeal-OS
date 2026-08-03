# RELEASE-01 · B-06 · Beta Acceptance · Gate

**Documento:** `RELEASE_01_BETA_GATE.md`  
**Fecha:** 2026-08-03  
**Estado:** ⛔ **NOT READY**  
**Spec:** [RELEASE_01_BETA_SPEC](../../00-status/RELEASE_01_BETA_SPEC.md) (FROZEN)  
**Runner:** [RELEASE_01_BETA_RUNNER](./RELEASE_01_BETA_RUNNER.md)  
**Principio:** [FOPEBA Land Check](../../00-status/FOPEBA_LAND_CHECK.md) · Regla 9 — solo `main` certifica

---

## Decision

| Campo | Valor |
|-------|-------|
| **Gate** | RELEASE-01-BETA |
| **Status** | ⛔ **NOT READY** |
| **Blocked reason** | Runner aún no Land-Checked desde `main` |
| **Unblocks** | RELEASE-01-BETA-001 (B1 Foundation only) |

---

## READY criteria (desde `main`)

```bash
git pull origin main
git fetch --tags --prune
npm run test:release-01-beta
```

Debe emitir:

```text
status=BLOCKED
blocked_at=RELEASE_01_BETA_B1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code **2**.

Solo entonces: Gate → **READY** · abrir **RELEASE-01-BETA-001**.

---

## Prohibido mientras NOT READY

- Abrir RELEASE-01-BETA-001 / 002 / 003 / 004 / 005  
- Drivers de capacidad B*  
- Tag `release-01-beta`  
- FLOW-05 · implementación de dominio

---

## End of RELEASE-01-BETA Gate
