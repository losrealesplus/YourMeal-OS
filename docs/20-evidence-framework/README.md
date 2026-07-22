# 08 · Evidence Framework — FOPEBA

**Documento madre** del framework de evidencia.

FOPEBA no es un framework de diseño de documentos ni de modelos.  
Es un **framework de ingeniería de conocimiento operacional basado en evidencia progresiva**.

El foco:

> **Reducir incertidumbre de manera sistemática** hasta que exista evidencia suficiente para justificar una implementación.

---

## De subproducto a activo

| Antes | Ahora |
|-------|-------|
| VS → VR → decisión | Conocimiento → **Evidencia** → **Confianza** → Decisión |

La evidencia deja de ser documentación del proyecto.  
Pasa a ser un **activo del framework**.

---

## Tres ejes del conocimiento

```text
Knowledge State     → ¿en qué estado está esta afirmación?
ECL                 → ¿con qué grado de evidencia la tratamos?
Stability Index     → ¿cuánto se mueve en el tiempo?
```

Confidence ≠ Stability.  
Un Capability puede ser ECL-5 y aun así S1 (changing).

| Concepto | ECL | Stability |
|----------|-----|-----------|
| Order | 5 | S3 |
| Batch | 5 | S3 |
| Route | 4 | S2 |
| Planning | 3 | S1 |
| Dynamic Pricing | 1 | S0 |

---

## Lo que ya está validado (mesa)

```text
FOPEBA → Operational Model → Beta (Table Validated)
```

Valida: *modelo estable*.  
No valida aún: *este proceso produce mejores productos* → FOV + Knowledge Update + EC + G-01.

---

## Dos hipótesis (promesa de producto)

| Hipótesis | Pregunta | Fase |
|-----------|----------|------|
| **A** | ¿El modelo representa la **realidad**? | [FOV](./04-field-operational-validation.md) |
| **B** | ¿Hay **valor** suficiente para construir? | [EC](./06-economic-confirmation.md) |

---

## Estructura

```text
08 · Evidence Framework
│
├── 01 Knowledge States
├── 02 Evidence Confidence Levels (ECL) — transversal
├── 03 Stability Index
├── 04 Field Operational Validation (FOV)
├── 05 Knowledge Update
├── 06 Economic Confirmation (EC)
└── 07 Gate G-01 · Operational Readiness
```

| Doc | Contenido |
|-----|-----------|
| [01 KS](./01-knowledge-states.md) | Estado del conocimiento |
| [02 ECL](./02-evidence-confidence-levels.md) | Calidad de evidencia · métricas estratégicas |
| [03 Stability](./03-stability-index.md) | Deuda conceptual · S0…S3 |
| [04 FOV](./04-field-operational-validation.md) | Campo · FOR · FVR · principio de sorpresa |
| [05 Knowledge Update](./05-knowledge-update.md) | Consolidar antes de medir valor |
| [06 EC](./06-economic-confirmation.md) | ¿Merece construirse? |
| [07 G-01](./07-gate-g01-operational-readiness.md) | Aprueba conocimiento, no código |

---

## Secuencia FOPEBA

```text
Foundation → Blueprint → Discovery → Checks → Model
    → Operational Validation
    → IOV
    → FOV
    → Knowledge Update          ← consolidar evidencia de campo
    → EC (Economic Confirmation)
    → Gate G-01
    → Implementation
```

El conocimiento se consolida **antes** de medir el valor económico.

---

## Regla de diseño del framework

> **Cada nueva fase debe eliminar una incertidumbre que ninguna fase anterior pueda eliminar.**

Si una fase no reduce un tipo de incertidumbre nuevo, pertenece a una fase existente.

Eso mantiene FOPEBA **compacto y elegante** a medida que evoluciona.

---

## Glosario

| Sigla | Significado | No confundir con |
|-------|-------------|------------------|
| **FOV** | Field Operational Validation | — |
| **FOR** | Field Observation Report | — |
| **EC** | Economic Confirmation | Edge Cases (`EC-xxx` mesa) |
| **ECL** | Evidence Confidence Level | — |
| **S0…S3** | Stability Index | — |
| **KU** | Knowledge Update | — |
| **G-01** | Operational Readiness Gate | — |

Nombres alternativos explorados para EC (no adoptados): Implementation Justification (IJ) · Value Confirmation (VC). **EC** se mantiene: cuantifica impacto y prioriza roadmap.

---

## Relacionado

- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)  
- [IOV](../19-independent-operational-validation/README.md)  
- [Estado](../00-status/README.md)
