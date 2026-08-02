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
# → PASS through S1 · BLOCKED at RELEASE_SMOKE_S2_STARTED · exit 0

# Self-test del contrato completo (sintético)
npm run test:release-smoke -- --self-test

# Unit tests
npm run test:release-smoke:unit
```

`--live` sin `--through` = max certificado (`RELEASE_SMOKE_CERTIFIED_THROUGH`, hoy S1).

---

## Fuera de alcance hasta S2+

- Playwright · browser · CI  
- Deployment · Rollback  
- Live Auth / Supabase session (S2)  
- Domain logic / FLOW-05  
- S3 Bootstrap · S4 Dashboard

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
