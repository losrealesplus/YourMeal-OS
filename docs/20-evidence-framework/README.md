# 08 · Evidence Framework — FOPEBA

**Documento madre** del framework de evidencia.

FOPEBA no es un framework de diseño de documentos ni de modelos.  
Es un **framework de ingeniería de conocimiento operacional basado en evidencia progresiva**.

El foco:

> **Reducir incertidumbre de manera sistemática** hasta que exista evidencia suficiente para justificar una implementación.

El rasgo distintivo de FOPEBA no es solo el Operational Model.  
Es la **cadena de evidencia**: cada decisión conectada a observación, validación, nivel de confianza y estado del conocimiento.

---

## Familias de evidencia

| Familia | Fase | Qué demuestra |
|---------|------|---------------|
| Documental / Discovery | Discovery · Checks | Qué ocurre y qué se decide |
| Conceptual (mesa) | Operational Validation | El modelo explica bajo refutación propia |
| Transferencia | IOV-001 | El conocimiento es transferible |
| Resistencia estructural | IOV-002 | El conocimiento resiste ataques |
| Interpretabilidad / determinismo | IOV-003 | Dos lecturas independientes equivalen |
| **Empírica** | **FOV** | La operación real produce / tensiona el modelo |
| Consolidación | FER → KU | Qué cambia el conocimiento (con filtro) |
| Valor | EC | ¿Merece construirse? |
| Readiness | G-01 | ¿Conocimiento suficiente para justificar código? |

Hasta el RC, toda la evidencia es de **laboratorio**.  
Eso no es un defecto: es lo que pretendía la Etapa 1.

FOV abre la familia **empírica**.

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

## Lo que ya está certificado (laboratorio)

```text
Observations → Discovery → Checks → Model
  → Operational Validation → IOV-001 → IOV-002 → IOV-003
  → Operational Model RC (Knowledge Certified)
```

RC = **certificado para ser puesto a prueba**, no verdad definitiva.  
Acta: [02-operational-model-rc](../00-status/02-operational-model-rc.md).

No valida aún: *este proceso produce mejores productos* → FOV (empírica) + FER + KU + EC + G-01.

---

## Dos hipótesis (promesa de producto)

| Hipótesis | Pregunta | Fase |
|-----------|----------|------|
| **A** | ¿La operación real produce / tensiona el conocimiento certificado? | [FOV](./04-field-operational-validation.md) · [fov/](./fov/README.md) |
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
│     └── fov/  protocolo · hipótesis · plan · FO · FER
├── 05 Knowledge Update
├── 06 Economic Confirmation (EC)
└── 07 Gate G-01 · Operational Readiness
```

| Doc | Contenido |
|-----|-----------|
| [01 KS](./01-knowledge-states.md) | Estado del conocimiento |
| [02 ECL](./02-evidence-confidence-levels.md) | Calidad de evidencia · métricas estratégicas |
| [03 Stability](./03-stability-index.md) | Deuda conceptual · S0…S3 |
| [04 FOV](./04-field-operational-validation.md) | Campaña observacional · evidencia empírica |
| [fov/](./fov/README.md) | Protocolo · FO-V/E/C/U · FER |
| [05 KU](./05-knowledge-update.md) | Consolidar **tras FER** |
| [06 EC](./06-economic-confirmation.md) | ¿Merece construirse? |
| [07 G-01](./07-gate-g01-operational-readiness.md) | Aprueba conocimiento, no código |

---

## Secuencia FOPEBA

```text
Foundation → Blueprint → Discovery → Checks → Model
    → Operational Validation
    → IOV
    → Operational Model RC
    → FOV (FO) → FER
    → Knowledge Update          ← solo si FER autoriza
    → EC (Economic Confirmation)
    → Gate G-01
    → Implementation
```

---

## Regla de diseño del framework

> **Cada nueva fase debe eliminar una incertidumbre que ninguna fase anterior pueda eliminar.**

Si una fase no reduce un tipo de incertidumbre nuevo, pertenece a una fase existente.

---

## Glosario

| Sigla | Significado | No confundir con |
|-------|-------------|------------------|
| **FOV** | Field Operational Validation | — |
| **FO** | Field Observation (FO-V/E/C/U) | Finding de mesa |
| **FER** | Field Evidence Review | FVR legado |
| **FOR** | Field Observation Report (legado; preferir FO) | — |
| **EC** | Economic Confirmation | Edge Cases (`EC-xxx` mesa) |
| **ECL** | Evidence Confidence Level | — |
| **S0…S3** | Stability Index | — |
| **KU** | Knowledge Update | — |
| **G-01** | Operational Readiness Gate | — |

---

## Relacionado

- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)  
- [IOV](../19-independent-operational-validation/README.md)  
- [Estado](../00-status/README.md)
