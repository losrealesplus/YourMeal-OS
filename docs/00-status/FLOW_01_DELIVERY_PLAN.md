# FLOW-01 · Delivery Plan (incremental)

**Documento:** `FLOW_01_DELIVERY_PLAN.md`  
**Fecha:** 2026-08-02  
**Status:** ACTIVE · post Spec freeze (#141) · post Runner (#142)  
**Spec:** [FLOW_01_KITCHEN_DELIVERY_SPEC](./FLOW_01_KITCHEN_DELIVERY_SPEC.md) **FROZEN**  
**Runner:** [FLOW01_CANONICAL_RUNNER](../10-validation/flow-01/FLOW01_CANONICAL_RUNNER.md)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md)

---

## Cambio de naturaleza

```text
Antes: certificar la plataforma
Ahora: certificar el dominio
```

Contrato `FLOW01_T*` **inmutable** salvo necesidad real de cambiar la Spec.

---

## Disciplina

1. No ampliar el alcance de FLOW-01 mientras `--live` no llegue a **PASS** completo.  
2. Cada transición (T1…T4) alcanza estado estable **antes** de abrir la siguiente.  
3. Un PR por entrega — misma granularidad que la estabilización Auth.  
4. PASS / FAIL / BLOCKED se interpretan así:

| Estado | Significa |
|--------|-----------|
| **PASS** | El contrato (o el prefijo de la entrega) se cumple |
| **FAIL** | La implementación incumple el contrato |
| **BLOCKED** | Aún no existe la implementación de la siguiente transición |

---

## Entregas

| ID | Transición | Tokens | Runner objetivo |
|----|------------|--------|-----------------|
| **FLOW01-001** | Kitchen → Production | `T1_STARTED` · `T1_COMPLETED` | ✅ CERTIFIED · [acta](../10-validation/flow-01/FLOW01_001_T1_ACTA.md) |
| **FLOW01-002** | Production → Packaging | `T2_*` | ▶ **PASS through T2 · BLOCKED at T3** · [acta](../10-validation/flow-01/FLOW01_002_T2_ACTA.md) |
| **FLOW01-003** | Packaging → Delivery handoff | `T3_*` | ⏳ PASS through T3 · BLOCKED at T4 |
| **FLOW01-004** | Delivery confirmado (`delivered`) | `T4_*` | ⏳ **FLOW-01 PASS** |

```text
Sprint / PR     Runner live
─────────────────────────────────────
FLOW01-001   →  PASS hasta T1 → BLOCKED en T2
FLOW01-002   →  PASS hasta T2 → BLOCKED en T3
FLOW01-003   →  PASS hasta T3 → BLOCKED en T4
FLOW01-004   →  FLOW01 PASS
```

### Comandos por entrega

```bash
# Entrega n (ejemplo T1)
npm run test:flow01-canonical -- --pipeline=FLOW01_T1_STARTED,FLOW01_T1_COMPLETED --through=T1
# → exit 0 · delivery PASS · flow_status BLOCKED at FLOW01_T2_STARTED

# Progreso live (cuando exista domain driver)
npm run test:flow01-canonical -- --live
```

---

## Metodología institucionalizada

```text
Observación
    ↓
FOPEBA
    ↓
SPEC
    ↓
Freeze
    ↓
Runner
    ↓
Implementación (FLOW01-00n)
    ↓
PASS
    ↓
Acta
```

FLOW-02 / FLOW-03 deben repetir el mismo patrón sin reinventar el proceso.

---

## Estado

| Área | Estado |
|------|--------|
| FLOW-01 SPEC | ✅ FROZEN (#141) |
| FLOW-01 Runner | ✅ MERGED (#142) |
| FLOW01-001 | ✅ CERTIFIED (#143) |
| FLOW01-002 | ▶ este PR · `npm run test:flow01-002` |
| FLOW01-003…004 | ⏳ secuencial (un PR / transición) |
| FLOW-01 PASS completo | ⏳ tras FLOW01-004 |
