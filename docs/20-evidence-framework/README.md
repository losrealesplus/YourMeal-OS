# 08 · Evidence Framework — FOPEBA

**Documento madre** del framework de evidencia.

FOPEBA deja de ser solo un método para diseñar modelos operacionales.  
Pasa a ser un **framework de generación y validación progresiva de conocimiento**, donde cada decisión de diseño y cada paso hacia la implementación llevan un **nivel explícito de evidencia**.

---

## Lo que ya está validado (mesa)

```text
FOPEBA
    ↓
Operational Model
    ↓
Beta (Table Validated)
```

Sabemos que el modelo:

- resiste estrés conceptual;
- generaliza;
- mantiene una espina estable;
- no necesita reinventar el dominio.

Eso valida:

> *«Si diseñamos primero el conocimiento operacional, podemos construir un modelo estable.»*

Eso **no** valida la promesa mayor de FOPEBA:

> *«Este proceso produce mejores productos.»*

Para esa promesa hacen falta **dos hipótesis distintas**.

---

## Dos hipótesis pendientes

| Hipótesis | Pregunta | Fase |
|-----------|----------|------|
| **A** | ¿El modelo representa correctamente la **realidad**? | [FOV](./03-field-operational-validation.md) |
| **B** | ¿Ese modelo genera **valor** suficiente para justificar construir el producto? | [EC · Economic Confirmation](./04-economic-confirmation.md) |

FOV y EC **no** son anexos. Son **fases obligatorias** de FOPEBA.

---

## Estructura de este documento

```text
08 · Evidence Framework
│
├── Knowledge States          → 01
├── Evidence Confidence Levels (ECL) → 02
├── Field Operational Validation (FOV) → 03
├── Economic Confirmation (EC) → 04
└── Gate G-01 · Operational Readiness → 05
```

| Doc | Contenido |
|-----|-----------|
| [01 Knowledge States](./01-knowledge-states.md) | Puente con el registro KS existente |
| [02 ECL](./02-evidence-confidence-levels.md) | ECL-1…5 — calidad de la evidencia |
| [03 FOV](./03-field-operational-validation.md) | Campo → FOR · Field Validation Report |
| [04 Economic Confirmation](./04-economic-confirmation.md) | ¿Vale la pena construir esto? |
| [05 Gate G-01](./05-gate-g01-operational-readiness.md) | Apertura formal de Etapa 2 |

---

## Secuencia FOPEBA (evolucionada)

```text
Foundation
    ↓
Blueprint
    ↓
Discovery
    ↓
Operational Checks
    ↓
Operational Model
    ↓
Operational Validation          ← ¿explica la operación? (mesa)
    ↓
Independent Operational Validation (IOV)  ← ¿transferible / atacable / interpretable?
    ↓
FOV                             ← ¿la realidad produce el mismo modelo?
    ↓
EC (Economic Confirmation)      ← ¿hay valor suficiente?
    ↓
Gate G-01 · Operational Readiness
    ↓
Implementation                  ← traducción, no descubrimiento
```

**Implementation ya no depende solo de Operational Validation.**  
Depende de Validation + FOV + EC (+ IOV en el camino de transferibilidad) y del **Gate G-01**.

---

## Glosario crítico (evitar colisiones)

| Sigla | Significado en FOPEBA | No confundir con |
|-------|----------------------|------------------|
| **FOV** | Field Operational Validation (fase) | — |
| **FOR** | Field Observation Report (artefacto) | — |
| **EC** | **Economic Confirmation** (fase) | Edge Cases de mesa (`EC-xxx` en FASE 5) |
| **Edge Case** | Escenario límite de mesa (FASE 5) | Prefijo histórico `EC-xxx` — usar nombre completo «Edge Case» |
| **ECL** | Evidence Confidence Level | — |
| **IOV** | Independent Operational Validation | — |
| **OPE** | Nombre previo del proceso (= núcleo metodológico de FOPEBA) | — |

---

## Cadena Reality → Roadmap

```text
Reality
    ↓
FOV
    ↓
Operational Model (confirmado / ajustado)
    ↓
Capabilities
    ↓
EC
    ↓
Roadmap
```

Por primera vez el roadmap deja de ser solo una decisión de producto.  
Pasa a ser una **consecuencia de la evidencia**.

---

## Relación con YourMeal OS

YourMeal OS = primer experimento que demuestra si FOPEBA cumple su promesa mayor.

Estado actual: **Operational Model Beta** (mesa).  
Pendiente: FOV · EC · G-01 → Etapa 2.

---

## Relacionado

- [OPE / proceso](../18-operational-validation/00-operational-product-engineering.md)  
- [IOV](../19-independent-operational-validation/README.md)  
- [Knowledge Validation Pyramid](../19-independent-operational-validation/00-knowledge-validation-pyramid.md)  
- [Estado](../00-status/README.md)
