# RELEASE-01 · B-05 · Rollback · Gate

**Documento:** `RELEASE_ROLLBACK_GATE.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **CLOSED** · RELEASE-ROLLBACK CERTIFIED · tag `release-rollback-pass` → `0ba856e`  
**Nivel:** Release Track B · B-05 Rollback  
**Spec:** [RELEASE_ROLLBACK_SPEC](../../00-status/RELEASE_ROLLBACK_SPEC.md) ✅ FROZEN #208  
**Runner:** [RELEASE_ROLLBACK_RUNNER](./RELEASE_ROLLBACK_RUNNER.md) ✅ #210 · `a1fbdc3`  
**Pass acta:** [RELEASE_ROLLBACK_PASS_ACTA](./RELEASE_ROLLBACK_PASS_ACTA.md)  
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
☑ R2 certified (#214 → 2838138 · cert #215)
☑ R3 certified (#216 → 0ba856e)
☑ Canonical FULL PASS verified from main
☑ runner-only BLOCKED at R1 verified from main
☑ tag release-rollback-pass → 0ba856e
```

### Land Check evidence (from `main` @ `0ba856e`)

```bash
git pull origin main
git fetch --tags --prune
npm run test:release-rollback-003
npm run test:release-rollback
npm run test:release-rollback:runner-only
```

| Comando | Resultado |
|---------|-----------|
| `test:release-rollback-003` | FULL PASS · `certified_through=R3` · `blocked_at=—` · exit 0 |
| `test:release-rollback` | FULL PASS · certified_through=R3 · blocked_at=— · exit 0 |
| `test:release-rollback:runner-only` | BLOCKED at `RELEASE_ROLLBACK_R1_STARTED` · exit 2 |

### Decision

```text
RELEASE-ROLLBACK CERTIFIED
tag release-rollback-pass → 0ba856e
    ↓
READY TO OPEN
RELEASE-01-BETA DoR
Documentation only.
```

### Progress

| Delivery | Scope | Status |
|----------|-------|--------|
| DoR | Ready framework | ✅ #207 |
| Spec | Contract R1–R3 | ✅ FROZEN #208 |
| Runner | BLOCKED at R1 | ✅ CERTIFIED #210 |
| Gate | READY → CLOSED | ✅ #211…#216 |
| RELEASE-ROLLBACK-001 | R1 Detect/Decide | ✅ CERTIFIED #212 |
| RELEASE-ROLLBACK-002 | R2 Execute Rollback/Restore | ✅ CERTIFIED #214 |
| RELEASE-ROLLBACK-003 | R3 Post-rollback Verify | ✅ CERTIFIED #216 |
| `release-rollback-pass` | FULL PASS | ✅ → `0ba856e` |

Acta 001: [RELEASE_ROLLBACK_001_R1_ACTA](./RELEASE_ROLLBACK_001_R1_ACTA.md) ·  
Acta 002: [RELEASE_ROLLBACK_002_R2_ACTA](./RELEASE_ROLLBACK_002_R2_ACTA.md) ·  
Acta 003: [RELEASE_ROLLBACK_003_R3_ACTA](./RELEASE_ROLLBACK_003_R3_ACTA.md) ·  
PASS: [RELEASE_ROLLBACK_PASS_ACTA](./RELEASE_ROLLBACK_PASS_ACTA.md).

---

## End of RELEASE-ROLLBACK Gate Report
