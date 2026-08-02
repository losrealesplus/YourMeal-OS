# RELEASE-01 · B-01 · Smoke · Canonical Runner

**Documento:** `RELEASE_SMOKE_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ Runner **ACTIVE** · default **BLOCKED** at `RELEASE_SMOKE_S1_STARTED`  
**Spec:** [RELEASE_SMOKE_SPEC](../../00-status/RELEASE_SMOKE_SPEC.md) (Freeze = merge Spec)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Release gate — **not** a Flow

> Pregunta que responde este PR:  
> **¿Existe un contrato ejecutable para Smoke (RELEASE-01 · B-01)?**  
> No: ¿Playwright? · ¿browser? · ¿Supabase? · ¿dominio? · ¿CI?

---

## Regla de nivel (Release ≠ Flow)

| Nivel | Certifica | Ejemplo |
|-------|-----------|---------|
| **FLOW** | Estados / transiciones de **dominio** | `planned` · `applied` · `paid` |
| **RELEASE** | **Capacidades** operativas de plataforma | `preflight` · `auth` · `bootstrap` · `dashboard` |

Los runners de Release **no** emiten ni validan entidades de negocio.  
Mantener esta separación evita mezclar contratos DoRl con lógica funcional.

---

## Contrato

```text
RELEASE-SMOKE
RELEASE_SMOKE_S1_STARTED      → capability: preflight
    ↓
RELEASE_SMOKE_S1_COMPLETED
    ↓
RELEASE_SMOKE_S2_STARTED      → capability: auth
    ↓
RELEASE_SMOKE_S2_COMPLETED
    ↓
RELEASE_SMOKE_S3_STARTED      → capability: bootstrap
    ↓
RELEASE_SMOKE_S3_COMPLETED
    ↓
RELEASE_SMOKE_S4_STARTED      → capability: dashboard
    ↓
RELEASE_SMOKE_S4_COMPLETED
    ↓
PASS → tag release-smoke-pass
```

---

## Comando por defecto (post–001 · live through certified max)

```bash
npm run test:release-smoke
```

Resultado esperado (con S1 certificado):

```text
PASS through S1
blocked_at=RELEASE_SMOKE_S2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

### Runner-only (histórico Gate / Land Check vacío)

```bash
npm run test:release-smoke:runner-only
# → BLOCKED at RELEASE_SMOKE_S1_STARTED · exit 2 · evidence={}
```

---

## Otros modos

```bash
# RELEASE-SMOKE-001 · S1 Preflight
npm run test:release-smoke-001
# → PASS through S1 · BLOCKED at S2 · exit 0

# RELEASE-SMOKE-002 · S2 Auth (PS-002-C mapped · no full Playwright)
npm run test:release-smoke-002
# → PASS through S2 · BLOCKED at S3 · exit 0

# RELEASE-SMOKE-003 · S3 Bootstrap (no Dashboard · no full Playwright E2E)
npm run test:release-smoke-003
# → PASS through S3 · BLOCKED at S4 · exit 0

# Default live through max certified (S3)
npm run test:release-smoke

# Unit tests
npm run test:release-smoke:unit
```

`--live` sin `--through` = max certificado (`RELEASE_SMOKE_CERTIFIED_THROUGH`, hoy S3).

---

## Fuera de alcance hasta S3+

- Playwright · browser · CI  
- Deployment · Rollback  
- Domain logic / FLOW-05  
- S4 Dashboard  

---

## Gate · Abrir RELEASE-SMOKE-001

**Reporte vivo:** [RELEASE_SMOKE_GATE](./RELEASE_SMOKE_GATE.md) · Decision: ✅ **READY**.

| # | Condición | Estado |
|---|-----------|--------|
| 1 | #168 · Track B priority en `main` | ✅ |
| 2 | Spec en `main` (vía #172) | ✅ |
| 3 | Runner en `main` (vía #172) | ✅ |
| 4 | Canonical BLOCKED verificado **desde `main`** | ✅ exit 2 |

> Gate ≠ PR verde. Gate = Land Check desde `main` ([FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)).

**READY TO OPEN RELEASE-SMOKE-001** (solo S1 · preflight).

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| Runner doc | `docs/10-validation/release-smoke/RELEASE_SMOKE_RUNNER.md` |
| Default evidence | `docs/10-validation/release-smoke/evidence/release-smoke-canonical.json` |
| Pipeline lib | `scripts/lib/release-smoke-canonical-pipeline.mjs` |
| CLI | `scripts/release-smoke-canonical.mjs` |

---

## End of RELEASE Smoke Runner
