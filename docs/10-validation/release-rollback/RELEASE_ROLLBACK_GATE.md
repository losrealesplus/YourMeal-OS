# RELEASE-01 · B-05 · Rollback · Gate

**Documento:** `RELEASE_ROLLBACK_GATE.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **READY** · 001 CERTIFIED · 002 ▶ este PR (R2)  
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
☑ R1 certified (#212 → 9c52d01 · cert #213)
☑ Canonical PASS through R1 verified from main
☑ runner-only BLOCKED at R1 verified from main
☑ R2 OPEN (este PR) · PASS through R2 · BLOCKED at R3
```

### Land Check evidence (expected after 002 merge)

```bash
git pull origin main
npm run test:release-rollback-002
npm run test:release-rollback
npm run test:release-rollback:runner-only
```

| Comando | Resultado |
|---------|-----------|
| `test:release-rollback-002` | PASS through R2 · `blocked_at=RELEASE_ROLLBACK_R3_STARTED` · exit 0 |
| `test:release-rollback` | PASS through R2 · BLOCKED at R3 · exit 0 |
| `test:release-rollback:runner-only` | BLOCKED at `RELEASE_ROLLBACK_R1_STARTED` · exit 2 |

### Decision

```text
RELEASE-ROLLBACK-002 · R2 OPEN (este PR)
PASS through R2 · BLOCKED at RELEASE_ROLLBACK_R3_STARTED
    ↓
Land Check from main → READY TO OPEN 003
```

### Progress

| Delivery | Scope | Status |
|----------|-------|--------|
| DoR | Ready framework | ✅ #207 |
| Spec | Contract R1–R3 | ✅ FROZEN #208 |
| Runner | BLOCKED at R1 | ✅ CERTIFIED #210 |
| Gate | READY | ✅ #211 |
| RELEASE-ROLLBACK-001 | R1 Detect/Decide | ✅ CERTIFIED #212 |
| RELEASE-ROLLBACK-002 | R2 Execute Rollback/Restore | ▶ este PR |
| RELEASE-ROLLBACK-003 | R3 Post-rollback Verify | ⏳ |
| `release-rollback-pass` | FULL PASS | ⏳ |

Acta 001: [RELEASE_ROLLBACK_001_R1_ACTA](./RELEASE_ROLLBACK_001_R1_ACTA.md) ·  
Acta 002: [RELEASE_ROLLBACK_002_R2_ACTA](./RELEASE_ROLLBACK_002_R2_ACTA.md).

---

## End of RELEASE-ROLLBACK Gate Report
