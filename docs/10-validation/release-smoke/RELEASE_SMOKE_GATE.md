# RELEASE-SMOKE · Gate Report

**Documento:** `RELEASE_SMOKE_GATE.md`  
**Fecha:** 2026-08-02  
**Estado:** ❌ **NOT READY** · Gate cerrado (stack Merged ≠ landed on `main`)  
**Nivel:** Release Track B · B-01 Smoke  
**Spec:** [RELEASE_SMOKE_SPEC](../../00-status/RELEASE_SMOKE_SPEC.md)  
**Runner:** [RELEASE_SMOKE_RUNNER](./RELEASE_SMOKE_RUNNER.md)  
**Gobernanza:** [FLOW_GOVERNANCE](../../00-status/FLOW_GOVERNANCE.md) **Regla 9** · [EVIDENCE_BEFORE_IMPLEMENTATION](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Land PR:** → `main` (este PR · patrón #150 / #157)

> Un Gate **nunca** se cierra porque un PR pase.  
> Un Gate solo se cierra cuando el comportamiento esperado se verifica desde **`main`**.  
> `main` certifica; las ramas solo proponen.

---

## RELEASE-SMOKE GATE REPORT

### Current status · Track B

| PR | Contenido | GitHub | Landed on `main`? |
|----|-----------|--------|-------------------|
| **#168** | RELEASE-01 Track B priority | MERGED | ✅ `92b8ac8` |
| **#169** | `RELEASE_SMOKE_SPEC` | MERGED | ❌ base era stack branch |
| **#170** | `RELEASE_SMOKE_RUNNER` | MERGED | ❌ base era stack branch |
| **#171** | `RELEASE_SMOKE_GATE` | MERGED | ❌ base era stack branch |

### Evidencia objetiva (verificación desde `main` · 2026-08-02)

```bash
git pull origin main
npm run test:release-smoke
```

```text
npm ERR! Missing script: "test:release-smoke"
```

| Componente | Estado |
|------------|--------|
| `#168` | ✅ en `main` |
| `#169` / `#170` / `#171` | ❌ no en `main` (Merged a ramas de stack) |
| `package.json` | ❌ sin `test:release-smoke` |
| Runner RELEASE-SMOKE | ❌ ausente en `main` |
| Gate | 🔴 **NOT READY** |

`Missing script` es evidencia FOPEBA válida de Regla 9: el contrato **no ha aterrizado**,  
independientemente del estado MERGED de los PR (mismo patrón FLOW-02 #149→#150 · FLOW-03 #156→#157).

### Gate checklist

```text
☑ #168 merged into main
□ #169 content on main   (GitHub MERGED ≠ landed — land PR)
□ #170 content on main
□ #171 content on main
□ Canonical runner verified from main
    → npm run test:release-smoke
    → BLOCKED at RELEASE_SMOKE_S1_STARTED · exit 2
```

### Expected verification (solo después del land en `main`)

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
NOT READY
RELEASE-SMOKE-001 MUST NOT be opened.
```

### Forbidden until Gate closes

- Playwright · browser · drivers · Supabase · CI  
- S1 / platform Smoke implementation  
- Cross-flow / E2E implementation  

### Allowed work

- Land #169–#171 content onto `main` (este PR)  
- Verify BLOCKED from `main` after merge  
- Spec/DoR docs for later Track B gates (no impl.)  

### Only after successful verification from `main`

```text
READY TO OPEN
RELEASE-SMOKE-001

Scope:   S1 only (preflight)
Contract:
  PASS through S1
  blocked_at=RELEASE_SMOKE_S2_STARTED
No S2 · No S3 · No S4
```

---

## Por qué este Gate existe

| Caso | Lección |
|------|---------|
| FLOW-02 · #149 → #150 | Merged ≠ landed on `main` |
| FLOW-03 · #156 → #157 | Stacking no sustituye land check |
| RELEASE-SMOKE · #169–#171 | `Missing script` demuestra ausencia en `main` |

Referencia política: [FLOW_GOVERNANCE](../../00-status/FLOW_GOVERNANCE.md) Regla 9.

---

## Cómo cerrar este Gate (operador)

1. Merge **este land PR** → `main` (trae Spec · Runner · Gate docs).  
2. En un checkout limpio de `main`:

```bash
git pull origin main
npm run test:release-smoke
# exit 2 · BLOCKED at RELEASE_SMOKE_S1_STARTED · arrays vacíos · evidence={}
```

3. Actualizar este documento: checklist ☑ · Decision → **READY TO OPEN RELEASE-SMOKE-001**.  
4. Solo entonces abrir el PR de implementación S1.

---

## End of RELEASE-SMOKE Gate Report
