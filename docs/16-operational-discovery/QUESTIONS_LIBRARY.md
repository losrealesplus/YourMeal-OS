# QUESTIONS_LIBRARY — Preguntas recurrentes

**Tipo:** Operational Discovery  
**Fuente:** Operational Findings + observación en EatClean  
**Uso:** cada pregunta es candidata a ser eliminada por un Asistente

> El producto no se mide por pantallas.  
> Se mide por **preguntas que dejan de hacerse**.

---

## Cómo usar esta biblioteca

| Campo | Significado |
|-------|-------------|
| Pregunta | Exactamente como la formula la gente en cocina |
| Frecuencia | Estimada o contada (p. ej. 17× / semana) |
| Momento | Ver [MOMENTOS_DE_DECISION.md](../15-product/MOMENTOS_DE_DECISION.md) |
| Findings | OF-xxx que la sustentan |
| Asistente | Quién debería eliminarla |
| Estado | Hipótesis · Observada · Recurrente · Cubierta |

---

## Catálogo (semilla — validar en campo)

| Pregunta | Momento | Asistente | Findings | Estado |
|----------|---------|-----------|----------|--------|
| ¿Qué toca ahora? | Producción | Production Assistant | — | Hipótesis |
| ¿Qué lleva esta bolsa? | Packaging | Packaging Assistant | OF-001 | Ejemplo |
| ¿Cuál es mi siguiente entrega? | Reparto | Delivery Assistant | — | Hipótesis |
| ¿Qué debo dejar preparado antes de irme? | Cierre | Closing Assistant | — | Hipótesis |
| ¿Qué debo comprar hoy? | Cierre / compras | Purchasing Assistant | — | Hipótesis |
| ¿Este pedido está pagado? | Reparto / admin | Delivery / Admin | — | Hipótesis |
| ¿Qué platos ya usamos? | Menú | Menu Assistant | — | Hipótesis |
| ¿Cómo vamos? | Todo el día | Operations Dashboard | — | Hipótesis |

Tras una semana de observación, las filas deben llevar **frecuencia** y OF enlazados. Sin eso, siguen siendo hipótesis.

---

## Regla

Si una pregunta aparece muchas veces y no tiene Asistente claro → actualizar Product Blueprint primero, no inventar Capability.
