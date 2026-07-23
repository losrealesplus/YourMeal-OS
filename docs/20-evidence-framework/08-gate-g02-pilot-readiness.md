# 08 · Gate G-02 · Pilot Readiness

Parte del [Evidence Framework](./README.md).

**Instancia de Gate** ([DICT-005](../99-reference/PROJECT_DICTIONARY.md#gate)) previa a la exposición del modelo a operación real.

Artefacto de gobernanza de la RI: [PILOT_ACCEPTANCE_CHECKLIST](../00-status/PILOT_ACCEPTANCE_CHECKLIST.md).

---

## Qué es (y qué no es)

```text
G-02 · Pilot Readiness

Objetivo

Autorizar el inicio de la Validación Operacional en entorno real.

No evalúa cantidad de funcionalidades.

Evalúa integridad del Operational Journey.
```

| G-02 **es** | G-02 **no es** |
|-------------|----------------|
| Gate de gobernanza | Checklist de QA |
| Autorización a experimentar | Certificación del producto |
| Evaluación de integridad del Journey | Cobertura funcional al 100 % |
| Pregunta de evidencia | Conteo de features |

**Pregunta única:**

> ¿Existe evidencia suficiente para exponer el modelo operacional a la realidad **sin introducir nueva incertidumbre evitable**?

G-02 **no certifica el producto**.  
Certifica que **la hipótesis operacional está lista para enfrentarse a la realidad**.

---

## Relación con G-01

| Gate | Pregunta | Momento | Aprueba |
|------|----------|---------|---------|
| **G-02** | ¿El Journey mínimo es íntegro para un piloto controlado? | Antes del piloto / FOV de campo | Exposición a realidad (experimento) |
| **G-01** | ¿Hay conocimiento Field-Validated suficiente para justificar más ingeniería? | Tras FOV → KU → EC | Readiness de conocimiento (no código) |

```text
… Operational Journey Closed
        ↓
ORR Signed
        ↓
G-02 Pilot Readiness          ← este documento
        ↓
Pilot · Evidence Collection
        ↓
Knowledge Update
        ↓
… (más adelante) G-01 Operational Readiness
```

No sustituyen. **G-02 habilita el experimento; G-01 certifica el conocimiento obtenido.**

---

## Debe cumplirse (evidencia)

Formulado desde la evidencia, no desde el backlog:

| # | Condición |
|---|-----------|
| 1 | El **Operational Journey** completo puede ejecutarse extremo a extremo. |
| 2 | Los **estados del ciclo operacional** son consistentes (UI ↔ persistencia ↔ timeline). |
| 3 | No existen **bloqueadores conocidos** en el flujo principal. |
| 4 | Los **huecos pendientes** están documentados y **no comprometen** la validación. |
| 5 | Las **limitaciones conocidas** son explícitas (**Explicit Uncertainty**). |
| 6 | Los **ORR** definidos para el piloto están firmados (PASSED o fuera de alcance firmado). |
| 7 | Existe **trazabilidad** entre evidencia, modelo e implementación. |

Control operativo: [PILOT_ACCEPTANCE_CHECKLIST](../00-status/PILOT_ACCEPTANCE_CHECKLIST.md) · [ORR Party](../00-status/ORR_B2B_B2C_PARTY.md).

---

## No exige

- Funcionalidad completa.
- Cobertura funcional del 100 %.
- Optimización de UX.
- Escalabilidad.
- Automatización total.
- Release v1.0.

La siguiente etapa tras G-02 **no** es una versión de software: es la **obtención de evidencia operacional**.

---

## Principio · Pilot Integrity

> **Un piloto no comienza cuando el producto tiene más funcionalidades, sino cuando el Journey mínimo puede recorrerse de forma íntegra, auditable y con incertidumbres explícitamente conocidas.**

Conecta con:

| Principio | Cómo aplica en G-02 |
|-----------|---------------------|
| Knowledge First | Primero el modelo y el Journey; el código es materialización |
| Explicit Uncertainty | Huecos visibles documentados o escondidos — nunca silenciosos |
| Operational Integrity | Estados y trazas coherentes en el ciclo |
| Evidence over Opinion | ORR firmados + checklist; no “casi listo” |

Patrón recomendado del framework:

> **Sin módulos nuevos antes de G-02:** cerrar o esconder huecos → firmar ORR → G-02.  
> Reducir incertidumbre **antes** de ampliar alcance.

---

## Resultado

| Resultado | Significado |
|-----------|-------------|
| **PASSED** | Autorizado el inicio de Validación Operacional (piloto controlado). YourMeal OS / EatClean opera como **RI** bajo observación FOPEBA. |
| **BLOCKED** | No ampliar alcance. Cerrar/esconder huecos o reducir alcance por escrito. |

Tras **PASSED**:

```text
Construcción de funcionalidades  →  Demostración / experimento controlado
Software project                 →  Reference Implementation (RI-001)
```

Ese paso, con el tiempo, debe registrarse como **Knowledge Contribution** de RI-001 al framework (qué del modelo resiste el contacto con la operación).

---

## Secuencia RI-001 (YourMeal OS · EatClean)

```text
RI-001
│
├── Foundation Lock ✅
│
├── Experience Baseline ✅
│
├── Methodology Frozen ✅
│
├── Operational Journey Closed ✅
│
├── ORR Signed                    ← en curso
│
├── G-02 Pilot Readiness          ← este Gate
│
├── Pilot
│
├── Evidence Collection
│
├── Knowledge Update
│
└── RI-001 Certified              (conocimiento; no “Release v1.0”)
```

---

## Relacionado

- [Gate G-01](./07-gate-g01-operational-readiness.md)  
- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)  
- [PILOT_ACCEPTANCE_CHECKLIST](../00-status/PILOT_ACCEPTANCE_CHECKLIST.md)  
- [DICT-005 Gate](../99-reference/PROJECT_DICTIONARY.md#gate) · [DICT-069 Pilot Integrity](../99-reference/PROJECT_DICTIONARY.md#pilot-integrity) · [DICT-070 Reference Implementation](../99-reference/PROJECT_DICTIONARY.md#reference-implementation-ri)
