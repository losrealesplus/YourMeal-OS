# Independent Operational Validation (IOV)

**Pregunta de la fase:**

> **¿El conocimiento puede transferirse y sobrevivir a personas que no participaron en su construcción?**

Eso es **otra dimensión** de validación — distinta de FASE 5.

| Fase | Pregunta |
|------|----------|
| [Operational Validation](../18-operational-validation/README.md) | ¿El modelo **explica** la operación? |
| **Independent Operational Validation** | ¿El conocimiento es **transferible, atacable e interpretable**? |

Ningún IOV modifica directamente el [Operational Model](../17-operational-model/README.md).  
Todos producen **evidencia**. Los cambios al modelo siguen VR → MC (si la evidencia lo exige).

---

## Por qué existe

Tras VS-001…006, Dynamics v0.2 y el tren MC, el modelo alcanza **Beta** (mesa): explica la operación bajo refutación propia.

Eso **no** demuestra que:

- un ingeniero nuevo pueda **usarlo** sin los autores;
- resista ataques de quien **no** lo construyó;
- dos equipos lo **traduzcan** a la misma arquitectura técnica.

IOV es, en FOPEBA, la prueba de **transferibilidad** del conocimiento.  
Junto con [FOV](../20-evidence-framework/04-field-operational-validation.md) y [EC](../20-evidence-framework/06-economic-confirmation.md), alimenta el [Gate G-01](../20-evidence-framework/07-gate-g01-operational-readiness.md) antes de Etapa 2.

---

## Los tres niveles

| Nivel | Nombre | Pregunta | Evidencia |
|-------|--------|----------|-----------|
| [IOV-001](./01-comprehension-validation.md) | Comprehension Validation | ¿Se entiende? | **Documentation Findings** (DF) |
| [IOV-002](./02-adversarial-validation.md) | Adversarial Validation | ¿Resiste ataques? | **Structural Findings** (SF) |
| [IOV-003](./03-independent-implementation.md) | Independent Implementation | ¿Se implementa igual? | **Interpretation Findings** (IF) |

No se llaman «Red Team 1/2/3». En OPE cada ejercicio responde una **pregunta concreta**.

---

## Regla de oro

```text
IOV → Findings (DF / SF / IF)
        ↓
(si hay contradicción estructural independiente)
        ↓
VR → MC → Operational Model
```

Los Findings **no** son Model Changes.  
Son evidencia de transferibilidad, resistencia o consistencia de interpretación.

---

## Secuencia FOPEBA (IOV en contexto)

```text
Blueprint
    ↓
Discovery
    ↓
Checks
    ↓
Operational Model
    ↓
Validation Scenarios
    ↓
Joint Gap Analysis
    ↓
Independent Operational Validation   ← esta fase
    ↓
FOV
    ↓
Knowledge Update
    ↓
EC (Economic Confirmation)
    ↓
Gate G-01
    ↓
Implementation
```

Detalle: [FOPEBA](../18-operational-validation/00-operational-product-engineering.md) · [Evidence Framework](../20-evidence-framework/README.md) · [Pirámide](./00-knowledge-validation-pyramid.md).

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| Prerrequisito | ✅ Operational Validation VS-001…006 · Dynamics · tren MC · **Beta** |
| IOV-001 | ⏳ No ejecutado |
| IOV-002 | ⏳ No ejecutado |
| IOV-003 | ⏳ No ejecutado |
| Findings abiertos | — |

---

## Índice

| Doc | Contenido |
|-----|-----------|
| [00 Knowledge Validation Pyramid](./00-knowledge-validation-pyramid.md) | Seña de identidad OPE |
| [01 Comprehension](./01-comprehension-validation.md) | IOV-001 · DF |
| [02 Adversarial](./02-adversarial-validation.md) | IOV-002 · SF |
| [03 Independent Implementation](./03-independent-implementation.md) | IOV-003 · IF |
| [04 Findings](./04-findings/README.md) | Taxonomía DF · SF · IF · plantillas |

---

## Relacionado

- [18 Operational Validation](../18-operational-validation/README.md)  
- [07 Certification](../18-operational-validation/07-certification.md)  
- [Estado](../00-status/README.md)
