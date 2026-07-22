# Operational Validation — FASE 5

**No es:** Discovery · diseño de producto · implementación · pantallas · APIs · ampliación del modelo por intuición  
**Sí es:** el intento sistemático de **romper** el [Operational Model](../17-operational-model/README.md) antes de convertirlo en software permanente

```text
FASE 4 — Operational Model     → ¿Con qué lenguaje hablamos? (hipótesis endurecida)
FASE 5 — Operational Validation  → ¿Dónde nos equivocamos? (refutación)
```

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
| 01 | [validation-principles](./01-validation-principles.md) | Reglas del juego |
| 02 | [validation-scenarios](./02-validation-scenarios/README.md) | Casos operativos completos |
| 03 | [edge-cases](./03-edge-cases/README.md) | Rotura deliberada del modelo |
| 04 | [field-observation](./04-field-observation/README.md) | EatClean — el modelo explica la realidad |
| 05 | [validation-reports](./05-validation-reports/README.md) | Dictámenes trazables |
| 06 | [model-changes](./06-model-changes/README.md) | Cambios al modelo (solo vía report) |
| 07 | [certification](./07-certification.md) | Operational Model Certified v1.0 |

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
07 · Operational Model Certified v1.0
```

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
| Escenarios / edge cases | 🚧 Semillas — ejecutar |
| Field observation (EatClean) | ⏸ hasta activación bajo validación |
| Reports / changes | Vacío (correcto) |
| Certificación | Pendiente |

---

## Relacionado

- [Estado del proyecto](../00-status/README.md)  
- [Operational Model](../17-operational-model/README.md)  
- [PRODUCT_PRINCIPLES §13](../15-product/PRODUCT_PRINCIPLES.md)
