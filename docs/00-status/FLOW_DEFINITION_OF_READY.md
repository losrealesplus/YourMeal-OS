# Flow · Definition of Ready

**Documento:** `FLOW_DEFINITION_OF_READY.md`  
**Fecha:** 2026-08-02  
**Status:** **ACTIVE** · Estándar Fase 1+ tras FLOW-01 CERTIFIED  
**Complementa:** [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) Regla 7–8 · [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md)  
**Referencia viva:** FLOW-01 · [PASS acta](../10-validation/flow-01/FLOW01_PASS_ACTA.md)

---

## Propósito

Ningún `FLOW-XX` nuevo empieza por implementación.

Antes del primer PR de dominio, el Flow debe estar **Ready**: especificado, congelado, instrumentable y con runner.

---

## Definition of Ready (checklist obligatorio)

Para cada `FLOW-XX`:

```text
FLOW-XX
□ SPEC congelada
□ Contrato de evidencias definido (FLOWNN_T*_STARTED|COMPLETED)
□ Runner creado (test:flownn-canonical)
□ Estados permitidos / ciclo de vida
□ Invariantes
□ PASS esperado (tokens · terminal · duplicates/missing/out_of_order)
□ BLOCKED esperado (transiciones aún no implementadas / parciales)
□ Acta de certificación (plantilla + ubicación docs/10-validation/)
```

Sin todos los ítems → ❌ no abrir Implementation PRs del happy path.

---

## Ciclo institucionalizado (probado)

```text
SPEC
    ↓
Freeze
    ↓
Runner
    ↓
Implementación mínima (una transición / PR)
    ↓
PASS parcial (BLOCKED en la siguiente)
    ↓
Siguiente transición
    ↓
PASS completo
    ↓
Acta
```

Demostrado en:

| Ámbito | Referencia |
|--------|------------|
| Plataforma | FCR-008 · PS-002-C · tag `ps002c-pass` |
| Dominio | FLOW-01 · T1–T4 · tag `flow01-pass` |

Taxonomía de hitos Git: [GIT_MILESTONE_TAGS](./GIT_MILESTONE_TAGS.md).

---

## Semántica del runner (inmutable)

| Estado | Significa |
|--------|-----------|
| **PASS** | El contrato implementado (o el prefijo de la entrega) se cumple |
| **FAIL** | El contrato implementado está roto |
| **BLOCKED** | El siguiente tramo del contrato aún no existe |

`BLOCKED` **no** es defecto.

---

## Disciplina de PRs de implementación

> Cada PR responde a **una sola pregunta**:  
> *¿Qué transición del dominio ha quedado certificada?*

Si la respuesta es “Tₙ y parte de Tₙ₊₁” → el PR tiene demasiado alcance.

---

## Relación Ready → Done

| Gate | Documento |
|------|-----------|
| **Ready** (antes de código) | este documento |
| **Done** (tras evidencia) | [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md) |

```text
Definition of Ready
        ↓
Implementation (transición a transición)
        ↓
Definition of Done (Handoff → Evidence → Certification)
```

---

## END

| Campo | Valor |
|-------|-------|
| Status | ACTIVE |
| Excepción | Solo Bug Fix que restaure un contrato ya certificado |
