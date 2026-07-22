# 06 · Economic Confirmation (EC)

Parte del [Evidence Framework](./README.md).  
**Fase obligatoria** de FOPEBA — no anexo.

> **No confundir** con *Edge Cases* de FASE 5 (IDs históricos `EC-xxx`).  
> En FOPEBA, **EC = Economic Confirmation**.

**Nomenclatura:** se exploraron IJ (Implementation Justification) y VC (Value Confirmation).  
Se mantiene **EC**: cuantifica impacto económico y prioriza el roadmap de forma directa. Confirma, en la práctica, que **merece construirse**.

---

## Hipótesis B

> **Ese modelo genera valor suficiente para justificar construir el producto.**

### Pregunta principal

> **¿Vale la pena construir esto?**

No técnicamente. **Económicamente** — y en sentido amplio: justificar implementación.

---

## Prerrequisito

```text
FOV → Knowledge Update → EC
```

EC **no** mide valor sobre un modelo que el campo acaba de dejar inconsistente.  
Ver [05 Knowledge Update](./05-knowledge-update.md).

---

## Objetivo

Demostrar que el conocimiento consolidado genera **suficiente valor operativo** para justificar implementación.

---

## Qué mide (estricto)

No solo ahorro. También **coste evitado**:

- tiempo de planificación ahorrado;
- errores evitados;
- retrabajos evitados;
- cambios manuales reducidos;
- decisiones automatizadas correctamente.

El valor del modelo no depende solo de generar ingresos: también de **reducir fricción operacional**.

### Las cuatro preguntas

| # | Pregunta | Qué exige |
|---|----------|-----------|
| 1 | **¿Qué problema elimina?** | Hoy vs mañana |
| 2 | **¿Cuánto tiempo ahorra?** | **Medido**, no estimado |
| 3 | **¿Qué errores / costes evita?** | Etiquetas · lotes · rutas · stock · retrabajo · … |
| 4 | **¿Cuánto dinero representa?** | Impacto = ahorro + **coste evitado** (no proyección de ingresos) |

---

## Método

1. Capabilities candidatas ancladas al modelo **post–Knowledge Update**.  
2. ECL ≥ 3 (críticas → rumbo a 4).  
3. Medir tiempo y errores.  
4. Traducir a impacto económico.  
5. Matriz de priorización · Stability visible.

---

## Matriz por Capability

| Capability | Tiempo | Errores | Impacto | Prioridad | ECL | S |
|------------|--------|---------|---------|-----------|-----|---|
| Planning | 4 h/semana | Alto | Alto | Muy alta | 5 | S1 |
| Routes | 2 h | Medio | Alto | Alta | 5 | S1 |
| Inventory | 1 h | Muy alto | Muy alta | Alta | 5 | S2 |

---

## Cadena

```text
Reality → FOV → Knowledge Update → Model → Capabilities → EC → Roadmap
```

El roadmap es **consecuencia de la evidencia**.

---

## Artefactos

| Artefacto | Contenido |
|-----------|-----------|
| **ECR-xxx** | Record por Capability / cluster |
| **Economic Confirmation Report** | Matriz · roadmap · ECL-5 donde aplique |

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| EC | ⏳ No ejecutado |

---

## Relacionado

- [04 FOV](./04-field-operational-validation.md)  
- [05 Knowledge Update](./05-knowledge-update.md)  
- [07 Gate G-01](./07-gate-g01-operational-readiness.md)  
- [CAPABILITY_ROADMAP](../15-product/CAPABILITY_ROADMAP.md)
