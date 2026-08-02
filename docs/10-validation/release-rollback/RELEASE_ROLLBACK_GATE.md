# RELEASE-01 · B-05 · Rollback · Gate

**Documento:** `RELEASE_ROLLBACK_GATE.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **READY** · 001 CERTIFIED desde `main` · READY TO OPEN 002  
**Nivel:** Release Track B · B-05 Rollback  
**Spec:** [RELEASE_ROLLBACK_SPEC](../../00-status/RELEASE_ROLLBACK_SPEC.md) ✅ FROZEN #208  
**Runner:** [RELEASE_ROLLBACK_RUNNER](./RELEASE_ROLLBACK_RUNNER.md) ✅ #210 · `a1fbdc3`  
**Land Check:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)

> `main` certifica; las ramas solo proponen.

---

## Checklist

```text
☑ DoR certified (#207 · e7f51a8)
☑ Spec FROZEN (#208 · 4d109f7 · freeze #209)
☑ Runner certified (#210 → a1fbdc3)
☑ Gate READY (#211 → 9e9c777)
☑ R1 certified (#212 → 9c52d01)
☑ Canonical PASS through R1 verified from main
☑ runner-only BLOCKED at R1 verified from main
```

### Land Check evidence (from `main` @ `9c52d01`)

```bash
git pull origin main
npm run test:release-rollback-001
npm run test:release-rollback
npm run test:release-rollback:runner-only
```

| Comando | Resultado |
|---------|-----------|
| `test:release-rollback-001` | PASS through R1 · `blocked_at=RELEASE_ROLLBACK_R2_STARTED` · exit 0 |
| `test:release-rollback` | PASS through R1 · BLOCKED at R2 · exit 0 |
| `test:release-rollback:runner-only` | BLOCKED at `RELEASE_ROLLBACK_R1_STARTED` · exit 2 |

### Decision

```text
READY TO OPEN
RELEASE-ROLLBACK-002 · R2 only
Execute Rollback / Restore
Nothing beyond R2.
```

### Progress

| Delivery | Scope | Status |
|----------|-------|--------|
| DoR | Ready framework | ✅ #207 |
| Spec | Contract R1–R3 | ✅ FROZEN #208 |
| Runner | BLOCKED at R1 | ✅ CERTIFIED #210 |
| Gate | READY | ✅ #211 |
| RELEASE-ROLLBACK-001 | R1 Detect/Decide | ✅ CERTIFIED #212 |
| RELEASE-ROLLBACK-002 | R2 Execute Rollback/Restore | ⏳ READY TO OPEN |
| RELEASE-ROLLBACK-003 | R3 Post-rollback Verify | ⏳ |
| `release-rollback-pass` | FULL PASS | ⏳ |

Acta 001: [RELEASE_ROLLBACK_001_R1_ACTA](./RELEASE_ROLLBACK_001_R1_ACTA.md).

---

## End of RELEASE-ROLLBACK Gate Report
