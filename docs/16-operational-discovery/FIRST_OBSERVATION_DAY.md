# FIRST_OBSERVATION_DAY — Primera jornada observada

**Tipo:** Operational Discovery (checklist de campo)  
**Objetivo:** aprender, no enseñar la aplicación  
**Rol ese día:** investigadores — no desarrolladores · no vendedores

No es un cuarto pilar. Es la primera ejecución de Discovery.

La documentación estratégica base ya está madura.  
Esta jornada es la **siguiente fase del producto**.

---

## Propósito

Conseguir la **primera jornada observada** en EatClean.

Registrar preguntas, tiempos, workarounds e incidentes — **sin proponer soluciones**.

### Qué no es esta jornada

- Validar pantallas.  
- Vender funcionalidades.  
- Buscar bugs de software.

### Qué sí es

Descubrir los **Operational Checks implícitos** que ya viven en la cabeza de los empleados — y cuáles faltan.

Preguntas guía:

| Pregunta de campo | Para qué sirve después |
|-------------------|------------------------|
| ¿Qué comprueba la gente de memoria? | Checks implícitos existentes |
| ¿Qué se olvida o se descubre tarde? | Checks que faltan |
| ¿Qué, si falla, para la operación? | Checks críticos |
| ¿Qué comprobación, si fuera automática, ahorraría más minutos? | Prioridad de automatización |

Los Checks se **diseñan después**. Este día solo captura evidencia (OF, preguntas, tiempos).

Ver unidad mínima de valor: [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md).

---

## Actitud

- Mirar más que preguntar.  
- No interrumpir el flujo salvo necesidad.  
- Anotar hora + pregunta exacta cuando alguien pregunta.  
- Al final del día importa el **patrón**, no la solución.  
- Si alguien «lleva en la cabeza» una regla («siempre saco el pollo antes de irme»), anotar la regla como evidencia — no como diseño de Check.

---

## Lista de observación

### Producción

- ¿Cuántas veces alguien pregunta qué hacer?
- ¿Cuántas veces cambia el orden previsto?
- ¿Qué tareas esperan a otra persona?
- ¿Qué se comprueba de memoria antes de cocinar (stock, descongelación, mise en place)?

### Packaging

- ¿Qué se comprueba manualmente?
- ¿Qué se vuelve a revisar dos veces?
- ¿Qué errores casi ocurren?

### Reparto

- ¿Qué llamadas se realizan?
- ¿Qué información falta al salir?
- ¿Qué decisiones improvisa el repartidor?
- ¿Cómo saben si hay que cobrar / si la ruta «cabe»?

### Administración / cierre

- ¿Qué información se busca constantemente?
- ¿Qué se copia entre sistemas?
- ¿Qué se confirma por WhatsApp?
- ¿Qué dejan anotado «para mañana» (compras, descongelar, incidencias)?

---

## Contador de preguntas (métrica estrella)

Anotar cada pregunta operativa con hora:

```text
08:12  ¿Qué bolsa es esta?
08:18  ¿Está pagado?
08:31  ¿Qué toca ahora?
08:46  ¿Queda pollo?
09:10  ¿Qué ruta hago primero?
```

Al cierre: total del día → [QUESTIONS_LIBRARY.md](./QUESTIONS_LIBRARY.md) + [TIME_LOSSES.md](./TIME_LOSSES.md) + OF en [OPERATIONAL_FINDINGS.md](./OPERATIONAL_FINDINGS.md).

Cada pregunta repetida es candidata a un futuro Operational Check — **después** de validar el patrón. No inventar Checks el mismo día.

---

## Entregable de la jornada

1. N OF reales (sustituir plantillas).  
2. Conteo de preguntas.  
3. Workarounds / incidentes vistos.  
4. Lista informal (en OF o notas): «comprobaciones que ya hacen de cabeza» vs «olvidos / descubrimientos tardíos».  
5. **Cero** diseños de Capability, Check o pantalla ese día.

---

## Después de la jornada (no el mismo día)

Gate: [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md) — evidencia → pregunta → Check → Capabilities.

Orientación de PRs: valor operativo (jornada · findings · Asistente · Checks), no solo tecnología.

---

## Relacionado

- [README.md](./README.md)
- [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md)
- [PRODUCT_VISION.md](../15-product/PRODUCT_VISION.md) — KPIs y misión
