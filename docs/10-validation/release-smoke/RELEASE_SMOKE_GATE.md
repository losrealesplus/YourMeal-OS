# RELEASE-SMOKE · Gate Report

**Documento:** `RELEASE_SMOKE_GATE.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **READY** · Land Check PASS desde `main` (#172/#173) · RELEASE-SMOKE-001 en curso  
**Nivel:** Release Track B · B-01 Smoke  
**Spec:** [RELEASE_SMOKE_SPEC](../../00-status/RELEASE_SMOKE_SPEC.md)  
**Runner:** [RELEASE_SMOKE_RUNNER](./RELEASE_SMOKE_RUNNER.md)  
**Land Check:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md) · [FLOW_GOVERNANCE](../../00-status/FLOW_GOVERNANCE.md) Regla 9

> Un Gate **nunca** se cierra porque un PR pase.  
> Un Gate solo se cierra cuando el comportamiento esperado se verifica desde **`main`**.  
> `main` certifica; las ramas solo proponen.

---

## RELEASE-SMOKE GATE REPORT

### Track B · land history

| PR | Contenido | Landed on `main`? |
|----|-----------|-------------------|
| **#168** | RELEASE-01 Track B priority | ✅ |
| **#169–#171** | Spec · Runner · Gate (vía #172) | ✅ |
| **#172** | Land → `main` | ✅ `77dfaa8` |
| **#173** | FOPEBA Land Check · Gate READY docs | ✅ |
| **#174** | RELEASE-SMOKE-001 S1 | 🟡 OPEN (este PR) |

### Gate checklist

```text
☑ #168 landed on main
☑ #169–#171 content on main (via #172)
☑ #172 landed on main
☑ Canonical runner verified from main (BLOCKED at S1 · exit 2)
☑ #173 Land Check institutionalizado
```

### Verification that closed the Gate (from `main`)

```bash
git pull origin main
npm run test:release-smoke
```

```text
RELEASE-SMOKE
BLOCKED
blocked_at=RELEASE_SMOKE_S1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
exit 2
```

### Decision

```text
READY
RELEASE-SMOKE-001 may now be opened / is in progress.
```

### Progress

| Delivery | Scope | Status |
|----------|-------|--------|
| RELEASE-SMOKE-001 | S1 Preflight | ▶ este PR |
| RELEASE-SMOKE-002 | S2 Auth | ⏳ |
| RELEASE-SMOKE-003 | S3 Bootstrap | ⏳ |
| RELEASE-SMOKE-004 | S4 Dashboard | ⏳ |
| `release-smoke-pass` | FULL PASS | ⏳ |

### Post–#174 verification (from `main`, after merge)

```bash
git pull origin main
npm run test:release-smoke-001
npm run test:release-smoke
```

Expected both:

```text
PASS through S1
blocked_at=RELEASE_SMOKE_S2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

### Histórico Land Check

Antes de #172: `npm ERR! Missing script: "test:release-smoke"` ⇒ NOT READY.

---

## End of RELEASE-SMOKE Gate Report
