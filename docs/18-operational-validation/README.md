# Operational Validation — FASE 5

**Marco completo:** [FOPEBA](./00-operational-product-engineering.md) — generación y validación progresiva de conocimiento  
**Evidence:** [20 Evidence Framework](../20-evidence-framework/README.md) (FOV · EC · ECL · G-01)

**No es:** Discovery · diseño de producto · implementación · pantallas · APIs · ampliación del modelo por intuición  
**Sí es:** el intento sistemático de **romper** el [Operational Model](../17-operational-model/README.md) antes de convertirlo en software permanente

```text
FASE 4 — Operational Model     → ¿Con qué lenguaje hablamos? (hipótesis endurecida)
FASE 5 — Operational Validation  → ¿Dónde nos equivocamos? (refutación)
FASE 6 — Implementation        → Traducción del modelo certificado (no redescubrimiento)
```

---

## Criterio de verdad del proyecto

| Antes | Desde FASE 5 |
|-------|--------------|
| *«¿Está bien diseñado?»* | *«¿Ha sobrevivido a suficientes intentos de demostrar que está mal?»* |

---

## Cambio de mentalidad

| Fase anterior | Pregunta |
|---------------|----------|
| Blueprint · Model | ¿Qué construimos? |
| **Operational Validation** | **¿Dónde nos equivocamos?** |

> La validación **no busca confirmar**. Busca **refutar**.

Cada escenario debe formularse así:

> **¿Qué tendría que pasar para que este modelo dejara de ser válido?**

Si tras intentar romperlo el modelo sigue siendo coherente, gana el derecho a convertirse en base permanente.

---

## Artefacto verificable

FASE 5 convierte el Operational Model en un **artefacto verificable**:

| Antes | Después |
|-------|---------|
| «Creemos que este modelo representa la operación.» | «Hemos intentado romperlo; conocemos sus límites.» |

Paralelo metodológico (no metáfora vacía):

| Disciplina | Enfoque |
|------------|---------|
| Ciencia | Falsar la teoría |
| Ingeniería | Llevar hasta el fallo |
| Criptografía | Invitar a romper |
| **YourMeal FASE 5** | Refutar el modelo operativo |

---

## Gobernanza: revisión antes del cambio

```text
Observación / Escenario / Edge case
        ↓
Validation Report (VR)
        ↓
Model Change (MC)
        ↓
Operational Model (17)
```

**No existe el cambio directo al modelo.** Ver [07 certification](./07-certification.md).

---

## Misión (muy concreta)

| Hacer | No hacer |
|-------|----------|
| Intentar romper el modelo | Crear features |
| Clasificar cada anomalía | Ampliar el modelo por impulso |
| Demostrar antes de modificar | «Mejorar» el diseño sin evidencia |
| Trazar hallazgos a dictámenes | Saltar directo a código o UI |

**No crear nada. No ampliar nada. No mejorar nada — salvo lo que un Validation Report obligue a corregir.**

---

## Estructura de la fase

| # | Carpeta | Propósito |
|---|---------|-----------|
| 00 | [operational-product-engineering](./00-operational-product-engineering.md) | Marco metodológico · criterio de verdad |
| 01 | [validation-principles](./01-validation-principles.md) | Reglas del juego |
| 02 | [validation-scenarios](./02-validation-scenarios/README.md) | Casos operativos completos |
| 03 | [edge-cases](./03-edge-cases/README.md) | Rotura deliberada del modelo |
| 04 | [field-observation](./04-field-observation/README.md) | EatClean — el modelo explica la realidad |
| 05 | [validation-reports](./05-validation-reports/README.md) | Dictámenes trazables · [coverage](./05-validation-reports/validation-coverage.md) |
| 06 | [model-changes](./06-model-changes/README.md) | Cambios al modelo (solo vía report) |
| 07 | [certification](./07-certification.md) | Niveles Alpha → Beta → RC → **Certified v1.0** |
| 08 | [methodological-retrospective](./08-methodological-retrospective.md) | Validar el proceso |
| 09 | [joint-gap-analysis](./09-joint-gap-analysis.md) | **Siguiente** — priorizar MC-001…006 |
| — | [knowledge-state](./knowledge-state.md) | Estado del conocimiento · proveniencia |

---

## Pregunta de cada ejercicio

Nunca:

> «¿La pantalla funciona?»

Siempre:

> **«¿El modelo sigue siendo coherente?»**

Cadena de comprobación (misma que trazabilidad 06):

```text
¿Existe en el modelo?
        ↓
Core Objects · Dependencies · Lifecycles · Checks · Invariants
```

---

## Relación con otros bloques

| Bloque | Rol en validación |
|--------|-------------------|
| [16 Operational Discovery](../16-operational-discovery/README.md) | Evidencia de campo histórica; **no** sustituye validación |
| [17 Operational Model](../17-operational-model/README.md) | Objeto bajo prueba — **no se edita sin report** |
| [15 Product Blueprint](../15-product/README.md) | Congelado para nuevas features hasta certificación |
| Código / UI | **Fuera de alcance** hasta `07-certification` |

Discovery pregunta: *¿qué hemos aprendido para evolucionar?*  
Validation pregunta: *¿el modelo actual explica la operación sin contradicciones?*

---

## Flujo

```text
Escenario / Edge case / Observación de campo
        ↓
Ejecutar cadena de comprobación (modelo)
        ↓
Validation Report (dictamen)
        ↓
Si ajuste necesario → 06 Model Changes (respaldado por VR)
        ↓
Repetir hasta umbral de certificación
        ↓
07 · Nivel Certified v1.0 (vía Alpha → Beta → RC)
```

Métrica viva: [validation-coverage](./05-validation-reports/validation-coverage.md).

---

## Gate hacia implementación

```text
Operational Model Certified v1.0
        ↓
Diseño visual · UX · nuevas Capabilities · código de producto
```

Sin certificación, el modelo sigue siendo **hipótesis endurecida**, no base permanente.

---

## Estado

| Bloque | Estado |
|--------|--------|
| Estructura FASE 5 | 🟢 Definida |
| Escenarios VS-001…006 | ✅ Cerrados (Extended×4 · Clarified×2) |
| Field observation (EatClean) | ⏸ hasta activación bajo validación |
| Reports / MC | ✅ VR-001…006 · MC-001…006 aplicados vía Dynamics |
| Certificación | **Beta** (mesa) — IOV + RC pendientes para Certified |

---

## Siguiente fase (Etapa 1)

1. [Evidence Framework](../20-evidence-framework/README.md) — FOV · Economic Confirmation · Gate G-01  
2. [IOV](../19-independent-operational-validation/README.md) — transferibilidad  

No abrir Etapa 2 sin G-01.

---

## Relacionado

- [Estado del proyecto](../00-status/README.md)  
- [Operational Model](../17-operational-model/README.md)  
- [IOV](../19-independent-operational-validation/README.md)  
- [PRODUCT_PRINCIPLES §13](../15-product/PRODUCT_PRINCIPLES.md)
