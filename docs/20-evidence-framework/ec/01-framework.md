# EC Framework — cómo medir

---

## Hipótesis B

> El conocimiento operacional certificado genera **valor suficiente** para justificar construir el producto.

Valor = ahorro + **coste evitado** (no proyección de ingresos de marketing).

---

## Cuatro dimensiones

| Dim | Nombre | Qué mide |
|-----|--------|----------|
| **A** | **Tiempo** | Minutos ahorrados · planificación · rutas · rework temporal |
| **B** | **Calidad** | Errores evitados · incidencias · etiquetas / lotes / entregas fallidas |
| **C** | **Consistencia** | Decisiones homogéneas · menos improvisación · menos dependencia de memoria |
| **D** | **Escalabilidad** | Nuevos clientes · productos · cocinas sin reinventar el modelo |

Toda Capability candidata se evalúa en A–D.  
Faltar una dimensión no invalida EC, pero debe justificarse (N/A documentado).

---

## Las cuatro preguntas (por Capability / cluster)

| # | Pregunta | Exigencia |
|---|----------|-----------|
| 1 | ¿Qué problema elimina? | Hoy vs mañana |
| 2 | ¿Cuánto tiempo ahorra? | **Medido** (OVI), no estimado a ojo |
| 3 | ¿Qué errores / costes evita? | Ligado a OVI de calidad |
| 4 | ¿Cuánto dinero representa? | Impacto = ahorro + coste evitado |

---

## Método

1. Anclar Capabilities al modelo **post-KUR** (o RC si KUR-null).  
2. Definir baseline (antes) con observación FOV / operación actual.  
3. Medir o estimar con método explícito los [OVI](./02-operational-value-indicators.md).  
4. Rellenar matriz A–D por Capability.  
5. Priorizar roadmap = consecuencia de la matriz (no de preferencia de UI).  
6. Emitir [ECR](./03-ecr.md) de campaña.

### Umbral de confianza de medición

| Nivel | Uso |
|-------|-----|
| Medido en campo (cronómetro / conteo) | Preferido para A/B |
| Estimado con método (muestra · entrevista estructurada) | Aceptable si se declara |
| «Nosotros creemos» | **No** entra al ECR |

ECL de la Capability ≥ 3 (críticas rumbo a 4) antes de priorizar alto.

---

## Matriz EC (plantilla)

| Capability | A Tiempo | B Calidad | C Consistencia | D Escalabilidad | Impacto | Prioridad | ECL | S |
|------------|----------|-----------|----------------|-----------------|---------|-----------|-----|---|
| … | OVI-… | OVI-… | … | … | Alto/Med/Bajo | … | | |

---

## Cadena

```text
Reality → FOV → FER → KU → Model → Capabilities → EC (OVI) → Roadmap → G-01
```

---

## Relacionado

- [02 OVI](./02-operational-value-indicators.md)  
- [03 ECR](./03-ecr.md)
