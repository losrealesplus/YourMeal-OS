# 04 · Economic Confirmation (EC)

Parte del [Evidence Framework](./README.md).  
**Fase obligatoria** de FOPEBA — no anexo.

> **No confundir** con *Edge Cases* de FASE 5 (IDs históricos `EC-xxx`).  
> En FOPEBA, **EC = Economic Confirmation**.

---

## Hipótesis B

> **Ese modelo genera valor suficiente para justificar construir el producto.**

Aquí cambia completamente la pregunta.

Ya no hablamos del dominio.  
Hablamos del **negocio**.

### Pregunta principal

> **¿Vale la pena construir esto?**

No técnicamente.  
**Económicamente.**

---

## Objetivo

Demostrar que el conocimiento obtenido genera **suficiente valor operativo** como para justificar su implementación.

FOV confirma el modelo en la realidad.  
EC confirma que ese conocimiento **merece** convertirse en producto.

---

## Las cuatro preguntas

| # | Pregunta | Qué exige |
|---|----------|-----------|
| 1 | **¿Qué problema elimina?** | Hoy vs mañana (p.ej. Excel · WhatsApp · llamadas → workflow) |
| 2 | **¿Cuánto tiempo ahorra?** | **Medido**, no estimado |
| 3 | **¿Qué errores evita?** | Etiquetas · lotes · rutas · stock · … |
| 4 | **¿Cuánto dinero representa?** | **Impacto económico**, no proyección de ingresos |

---

## Método

1. Partir de Capabilities candidatas (Blueprint / Mapping 06).  
2. Anclar cada Capability a evidencia FOV/mesa (ECL ≥ 3 preferible; crítico → rumbo a 4).  
3. Medir en operación real (o proxy auditable) tiempo y errores.  
4. Traducir a impacto económico (coste de error · horas · merma · penalizaciones · retrabajo).  
5. Rellenar la matriz de priorización.

---

## Resultado: matriz por Capability

| Capability | Tiempo | Errores | Impacto | Prioridad |
|------------|--------|---------|---------|-----------|
| Planning | 4 h/semana | Alto | Alto | Muy alta |
| Routes | 2 h | Medio | Alto | Alta |
| Inventory | 1 h | Muy alto | Muy alta | Alta |

Ahora sí existe una **priorización objetiva**.

Plantilla de fila:

```markdown
### Capability · [Nombre]

| Campo | Valor |
|-------|-------|
| Problema que elimina | … |
| Tiempo ahorrado (medido) | … / período |
| Errores que evita | … |
| Impacto económico | … |
| ECL | ECL-5 si medido en EC |
| Prioridad | Muy alta · Alta · Media · Baja |
| Evidencia | FOR-… · medición-… · fecha |
```

---

## Integración FOV → EC → Roadmap

```text
Reality
    ↓
FOV
    ↓
Operational Model
    ↓
Capabilities
    ↓
EC
    ↓
Roadmap
```

El roadmap deja de ser solo una decisión de producto.  
Pasa a ser una **consecuencia de la evidencia**.

---

## Artefactos

| Artefacto | Contenido |
|-----------|-----------|
| **ECR-xxx** | Economic Confirmation Record (una Capability o cluster) |
| **Economic Confirmation Report** | Resumen de campaña · matriz · roadmap repriorizado |

Índice: [reports/](./reports/README.md).

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| EC | ⏳ No ejecutado |
| Matriz Capabilities | — |
| Roadmap por evidencia | — |

---

## Relacionado

- [03 FOV](./03-field-operational-validation.md)  
- [05 Gate G-01](./05-gate-g01-operational-readiness.md)  
- [Capability Mapping](../17-operational-model/06-capability-mapping/README.md)  
- [CAPABILITY_ROADMAP](../15-product/CAPABILITY_ROADMAP.md)
