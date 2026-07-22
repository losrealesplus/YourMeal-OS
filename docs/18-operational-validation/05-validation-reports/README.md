# 05 · Validation Reports

Cada hallazgo termina en un **dictamen trazable**.

Sin VR-xxx, el hallazgo no puede generar cambio en el modelo.

---

## Clasificación de madurez (cada VR)

Además del símbolo de severidad, todo VR lleva una **clasificación de madurez**:

| Clasificación | Significado | Acción típica |
|---------------|-------------|---------------|
| **Confirmed** | El modelo explica completamente el escenario | Ninguna |
| **Clarified** | El modelo era correcto; la documentación necesitaba mayor precisión | Ajuste en 17 (texto) · MC opcional si formaliza |
| **Extended** | Se incorpora un elemento al modelo con evidencia suficiente | MC obligatorio |
| **Contradicted** | Una parte del modelo era incorrecta y debe modificarse | MC obligatorio + revisión Constitución si aplica |

### Lectura de tendencias

| Patrón en VR | Señal |
|--------------|-------|
| Mayoría Confirmed / Clarified | Modelo **convergiendo** |
| Predominio Extended / Contradicted | Modelo aún **evolucionando** — no acelerar implementación |

Registrar contadores en [validation-coverage](./validation-coverage.md).

### Correspondencia con severidad

| Clasificación | Símbolo habitual |
|---------------|------------------|
| Confirmed | ✔ |
| Clarified | ⚠ (doc) |
| Extended | 🔁 |
| Contradicted | 🚨 |

---

## Plantilla · VR-xxx

```markdown
# VR-xxx — [Título]

**Fecha:** YYYY-MM-DD  
**Origen:** VS-xxx · EC-xxx · FOV-xxx  
**Autor / sesión:** …  
**Participantes:** … (repetir escenario con distintos perfiles aumenta valor)

## Intención de la sesión

¿Qué tendría que pasar para que el modelo dejara de ser válido?

> Objetivo: **hacer fallar** el escenario, no «pasarlo».

## Hallazgo

[Qué se intentó refutar y qué ocurrió]

## ¿Se explicó con el modelo existente?

(Principio 13 — antes de proponer cambio)

| Intento | Resultado |
|---------|-----------|
| Explicación con vocabulario actual | Posible / Imposible |
| ¿Concepto nuevo necesario? | Sí / No |

## Cadena de comprobación (resumen)

| Capa | Resultado |
|------|-----------|
| Core Objects | … |
| Dependencies | … |
| Lifecycles | … |
| Checks | … |
| Invariants | … |

## Clasificación de madurez

**[Confirmed | Clarified | Extended | Contradicted]**

## Severidad

**[✔ | ⚠ | 🔁 | 🚨]**

## Justificación

[Por qué esta clasificación]

## Acción requerida

| Clasificación | Acción |
|---------------|--------|
| Confirmed | Ninguna |
| Clarified | Precisar docs 17 · MC opcional |
| Extended | MC-xxx obligatorio |
| Contradicted | MC-xxx + revisión Invariants si aplica |

## Model Change

MC-xxx (si aplica) · enlace
```

---

## Índice

Ver también [validation-coverage](./validation-coverage.md) — estabilidad del modelo.

| ID | Título | Origen | Clasificación | MC |
|----|--------|--------|---------------|-----|
| — | *(vacío — correcto al inicio)* | — | — | — |

---

## Relacionado

- [06 model-changes](../06-model-changes/README.md)  
- [01 validation-principles](../01-validation-principles.md)  
- [audit-protocol](../02-validation-scenarios/audit-protocol.md)
