# RELEASE-01 · B-01 · Smoke Tests · Specification

**Documento:** `RELEASE_SMOKE_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **FROZEN** (Spec) · Runner ▶ [ACTIVE · BLOCKED](../10-validation/release-smoke/RELEASE_SMOKE_RUNNER.md)  
**Gate DoRl:** Smoke Tests · Track B · RELEASE-01  
**Nivel:** Release Contract — **no** es un Flow  
**Precondiciones:** FOUNDATION ✅ · `ps002c-pass` · `flow01-pass`…`flow04-pass`  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Estrategia:** [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Tags (convención):** `release-smoke-pass` → … → `release-01-beta` · [GIT_MILESTONE_TAGS](./GIT_MILESTONE_TAGS.md)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md)

> Este PR responde **solo**: ¿queda especificado el contrato Smoke de RELEASE-01?  
> **No** Runner. **No** `npm run test:release-smoke`. **No** Playwright. **No** CI. **No** dominio.

---

## Pregunta del gate

> ¿La plataforma mínima funciona de extremo a extremo sin errores?

No: *¿pasan los FLOW-01…04?* (ya certificados con sus runners)  
No: *¿la cadena Pedido→…→Inventario encaja?* (eso es Cross-flow)  
Sí: *¿tras arrancar, un operador puede autenticarse y alcanzar la superficie operativa canónica sin fallo duro?*

---

## Propósito

Convertir **Smoke Tests** en un gate DoRl certificable con la misma disciplina que un Flow:

```text
Spec (este documento)
    ↓
Freeze (merge en main)
    ↓
Runner → npm run test:release-smoke → BLOCKED (baseline)
    ↓
Implementación incremental de escenarios
    ↓
release-smoke-pass
```

Smoke **reutiliza** la evidencia de plataforma ya certificada (PS-002-C / FCR-008)  
como ancla; no la reescribe ni reabre FCR-008.

---

## Scope

### Dentro (v1)

| Incluye | Notas |
|---------|-------|
| Preflight de entorno mínimo para smoke | Variables / proyecto necesarios documentados |
| Login → sesión canónica → bootstrap → home path | Alineado con pipeline PS-002-C |
| Superficie operativa canónica renderizada | Dashboard / home path resuelto sin error fatal |
| Evidencia ordenada `RELEASE_SMOKE_*` | Once-only · sin duplicados |
| Resultado PASS / FAIL / BLOCKED | Semántica FOPEBA |

### Fuera (explícito · v1)

| Excluye | Motivo |
|---------|--------|
| Cadena Pedido → Producción → … → Inventario | B-02 Cross-flow |
| Jornada piloto completa cliente+ops+admin | B-03 E2E |
| Deploy / migraciones / rollback | B-04 · B-05 |
| Beta Acceptance / tag `release-01-beta` | B-06 |
| FLOW-05+ DoR / Spec / dominio | Track A |
| Playwright UI exploratorio / visual regression | Fuera de contrato v1 |
| Performance / load / security deep audit | Gates DoRl aparte (o N/A) |
| Reabrir FCR-008 / PS-002-C | Solo regresión con evidencia |
| Nuevos módulos de negocio | Smoke no inventa dominio |

---

## Relación con otros gates

| Artefacto | Relación |
|-----------|----------|
| `ps002c-pass` | Ancla de Auth/sesión; Smoke **exige** que ese contrato siga vigente |
| `flow01`…`flow04-pass` | Precondiciones de producto; Smoke **no** re-ejecuta runners de Flow |
| B-02 Cross-flow | Encadena dominios; Smoke solo prueba plataforma mínima |
| B-03 E2E | Jornada piloto; más ancho que Smoke |
| SMOKE_HP-001 | Evidencia histórica ORR; **no** sustituye este contrato Release |

---

## Escenarios canónicos

Cada escenario emite exactamente un par `STARTED` / `COMPLETED`  
(o deja el gate **BLOCKED** si aún no está implementado en el runner).

### S1 · Preflight

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿El entorno mínimo para smoke está definido y verificable? |
| **Incluye** | Proyecto Supabase / keys publicables / flags documentados para el comando smoke |
| **No incluye** | Deploy a producción · rotación de secretos |
| **Evidencia** | `RELEASE_SMOKE_S1_STARTED` · `RELEASE_SMOKE_S1_COMPLETED` |
| **PASS** | Preflight OK · sin secretos inventados en el repo |
| **FAIL** | Preflight falla con entorno declarado “listo” |

### S2 · Auth → Canonical Session

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Login produce sesión canónica usable? |
| **Incluye** | Tokens alineados con PS-002-C: `LOGIN` → `LOGIN_OK` → `CANONICAL_SESSION` (o equivalentes smoke que el runner mapee 1:1) |
| **No incluye** | Signup · recovery · multi-tenant switching avanzado |
| **Evidencia** | `RELEASE_SMOKE_S2_STARTED` · `RELEASE_SMOKE_S2_COMPLETED` |
| **PASS** | Sesión canónica establecida once-only |
| **FAIL** | Login OK ausente · sesión no canónica · tokens duplicados/fuera de orden |

### S3 · Bootstrap → Identity ready

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Bootstrap deja identidad/membresía/rol listos? |
| **Incluye** | `BOOTSTRAP_START` → `IDENTITY_READY` → `PROFILE_READY` → `MEMBERSHIP_READY` → `ROLE_READY` (o mapeo smoke 1:1) |
| **No incluye** | Mutaciones de membership · invitaciones |
| **Evidencia** | `RELEASE_SMOKE_S3_STARTED` · `RELEASE_SMOKE_S3_COMPLETED` |
| **PASS** | Cadena bootstrap completa sin error fatal |
| **FAIL** | Bootstrap incompleto · rol/membresía ausentes cuando el contrato los exige |

### S4 · Home path → Dashboard rendered

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La superficie operativa canónica renderiza sin error duro? |
| **Incluye** | `HOME_PATH_RESOLVED` → `NAVIGATE` → `DASHBOARD_RENDERED` (o mapeo smoke 1:1) |
| **No incluye** | Operaciones de cocina/entrega/facturación/inventario |
| **Evidencia** | `RELEASE_SMOKE_S4_STARTED` · `RELEASE_SMOKE_S4_COMPLETED` |
| **PASS** | Dashboard/home canónico observado · sin crash |
| **FAIL** | Home path irresoluble · superficie canónica no renderiza · error fatal en ruta smoke |

---

## Pipeline de evidencia (orden canónico)

```text
RELEASE_SMOKE_S1_STARTED
RELEASE_SMOKE_S1_COMPLETED
RELEASE_SMOKE_S2_STARTED
RELEASE_SMOKE_S2_COMPLETED
RELEASE_SMOKE_S3_STARTED
RELEASE_SMOKE_S3_COMPLETED
RELEASE_SMOKE_S4_STARTED
RELEASE_SMOKE_S4_COMPLETED
```

Reglas:

- Once-only por token  
- Orden estricto S1 → S4  
- `duplicates=[]` · `missing=[]` · `out_of_order=[]` para PASS completo  
- El runner podrá reutilizar salida de `test:ps002-canonical-auth` **solo** si el mapeo a `RELEASE_SMOKE_*` queda documentado en el Runner doc (PR siguiente)

---

## Semántica PASS / FAIL / BLOCKED

| Estado | Significa |
|--------|-----------|
| **PASS** | Contrato cumplido hasta el escenario pedido (o Smoke completo) |
| **FAIL** | Brecha de contrato / evidencia / error fatal en ruta smoke |
| **BLOCKED** | Escenario o runner aún no implementado — **no** es defecto |

### Esperado por fase (post-Freeze)

| Fase | Resultado esperado |
|------|-------------------|
| Tras Spec Freeze · **antes** de Runner | Sin comando — este doc basta |
| Runner merge (PR siguiente) | `npm run test:release-smoke` → **BLOCKED** · exit 2 · arrays vacíos o `blocked_at=RELEASE_SMOKE_S1_STARTED` |
| Implementación S1…Sn | PASS through Sn · BLOCKED at siguiente |
| Smoke completo | **FULL PASS** · tag `release-smoke-pass` |

### FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| Login sin `CANONICAL_SESSION` | Auth rota en ruta smoke |
| Dashboard no renderiza | Superficie canónica rota |
| Tokens duplicados / fuera de orden | Evidencia inválida |
| Crash / uncaught en ruta S1…S4 | Plataforma mínima no operable |

---

## Evidencia (artefactos)

| Artefacto | Ubicación (prevista) |
|-----------|----------------------|
| Spec (este) | `docs/00-status/RELEASE_SMOKE_SPEC.md` |
| Runner doc | `docs/10-validation/release-smoke/RELEASE_SMOKE_RUNNER.md` |
| Evidence JSON | `docs/10-validation/release-smoke/evidence/` |
| Acta parcial / PASS | `docs/10-validation/release-smoke/RELEASE_SMOKE_*_ACTA.md` |
| Tag | `release-smoke-pass` |

---

## Comandos (contrato · aún no existen)

| Comando | Fase | Resultado esperado |
|---------|------|-------------------|
| `npm run test:release-smoke` | Runner | Inicialmente **BLOCKED** · exit 2 |
| `npm run test:release-smoke -- --self-test` | Runner | Contrato sintético PASS |
| Drivers / `--live` | Tras RELEASE-SMOKE-001… | PASS parcial / FULL PASS |

**Prohibido hasta Gate verde:** Playwright · browser · CI · Supabase drivers · dominio.

---

## Definition of Done (gate Smoke)

```text
RELEASE-01 · B-01 Smoke
☑ Spec FROZEN                            → este documento
☑ Runner + test:release-smoke            → BLOCKED at S1 (runner PR)
□ Canonical BLOCKED verificado en main
□ Escenarios S1…S4 implementados         → RELEASE-SMOKE-001… (tras Gate)
□ duplicates=[] missing=[] out_of_order=[]
□ Acta RELEASE_SMOKE_PASS
□ Tag release-smoke-pass
```

Sin `release-smoke-pass` → fila Smoke de DoRl permanece ⏳.

---

## Regla de nivel (Release ≠ Flow)

| Nivel | Certifica |
|-------|-----------|
| FLOW | Estados de **dominio** (`planned`, `applied`, `paid`, …) |
| RELEASE | **Capacidades** de plataforma (`preflight`, `auth`, `bootstrap`, `dashboard`, …) |

---

## Checklist Spec

| Ítem | Estado |
|------|--------|
| Purpose · Scope · S1…S4 · PASS/FAIL/BLOCKED | ✅ |
| Evidence tokens · Commands · DoD | ✅ |
| Runner BLOCKED | ▶ runner PR |
| Scenario drivers / Playwright / CI / dominio | ❌ hasta Gate |

**Estado del documento:** ✅ **FROZEN** (con Spec merge)

---

## Prohibido

- Mezclar entidades de dominio en el runner Smoke  
- Mezclar Cross-flow / E2E / Deploy / Rollback  
- Abrir FLOW-05 “porque Smoke lo necesita” sin bloqueador demostrado  
- Declarar `release-smoke-pass` o `release-01-beta` sin evidencia  
- Abrir RELEASE-SMOKE-001 antes de Gate (Spec + Runner en `main` + BLOCKED verificado)

---

## Next

```text
release-smoke-pass ✅
    ↓
B-02 Cross-flow DoR → Spec → Freeze → Runner → …
→ RELEASE_CROSSFLOW_DOR.md
```

---

## End of RELEASE Smoke Specification
