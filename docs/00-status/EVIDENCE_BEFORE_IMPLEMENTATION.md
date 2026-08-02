# Evidence before Implementation

**Documento:** `EVIDENCE_BEFORE_IMPLEMENTATION.md`  
**Fecha:** 2026-08-02  
**Status:** **ACTIVE** · Principio operativo **Fase 1 · Domain / Flow**  
**No sustituye FOPEBA.** Complementa [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) Regla 7 · [FLOW_FIRST](./FLOW_FIRST.md) · [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md)

---

## Principio

```text
Evidence before Implementation
```

Ningún flujo operativo entra en código de dominio sin contrato de evidencia y runner canónico.

---

## Por qué

Con PS-002-C / FCR-008 el runner desde el principio aceleró el diagnóstico y evitó rediseños tardíos.

En Fase 1 el mismo estándar aplica a Kitchen → Delivery y a los Flows siguientes.

---

## Checklist obligatorio antes de Implementation PRs

Checklist completo (incluye PASS/BLOCKED esperados y acta):  
**[FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)**.

Mínimo:

| # | Artefacto | Congelado |
|---|-----------|-----------|
| 1 | SPEC (plantilla de transiciones) | ☐ |
| 2 | Estados / ciclo de vida de entidades | ☐ |
| 3 | Invariantes | ☐ |
| 4 | Contrato de evidencias (`FLOWNN_*` tokens) | ☐ |
| 5 | Runner canónico (`test:flownn-canonical`) | ☐ |
| 6 | PASS / BLOCKED esperados + acta | ☐ |

Sin Definition of Ready → ❌ no abrir Implementation del happy path.

---

## Cadena de trabajo (oficial Fase 1)

```text
Observación
    ↓
FOPEBA
    ↓
SPEC
    ↓
Contrato de evidencia
    ↓
Runner
    ↓
Código
    ↓
PASS
```

---

## Criterios del runner (mínimo)

Igual filosofía que FCR-008 / PS-002-C:

- sin duplicados (`duplicates=[]`)
- sin pasos ausentes (`missing=[]`)
- sin pasos fuera de orden (`out_of_order=[]`)
- evidencia JSON versionable
- `duration_ms` diagnóstico (no criterio PASS/FAIL salvo que el Spec diga lo contrario)

---

## FLOW-01 (estado)

| Artefacto | Estado |
|-----------|--------|
| SPEC | ✅ **FROZEN** · [FLOW_01_KITCHEN_DELIVERY_SPEC](./FLOW_01_KITCHEN_DELIVERY_SPEC.md) · PR #141 |
| Estados + Packaging lifecycle + T4=`delivered` | ✅ en Spec |
| Invariantes | ✅ en Spec |
| Contrato `FLOW01_T*` | ✅ en Spec |
| Runner `test:flow01-canonical` | ✅ [FLOW01_CANONICAL_RUNNER](../10-validation/flow-01/FLOW01_CANONICAL_RUNNER.md) |
| Implementation | ✅ T1–T4 · FLOW-01 **CERTIFIED** · [PASS acta](../10-validation/flow-01/FLOW01_PASS_ACTA.md) · tag `flow01-pass` |

---

## Nivel producto

Evidence before Implementation aplica a **Flows**.  
Para versiones de producto (beta / release), ver [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) (DoRl) — pregunta distinta, checklist distinto.

---

## END

| Campo | Valor |
|-------|-------|
| Status | ACTIVE |
| Ámbito | Todos los Flows de dominio (Fase 1+) |
| Excepción | Solo Bug Fix que restaure un contrato ya certificado |
