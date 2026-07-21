# FIRST_OBSERVATION_DAY — Primera jornada observada

**Tipo:** Operational Discovery (checklist de campo)  
**Fase:** diseño estratégico **cerrado** → observación  
**Rol ese día:** **etnógrafo de operaciones** — no arquitecto · no vendedor · no demos

El siguiente arquitecto es **EatClean**.

No validamos YourMeal OS. No vendemos. No demostramos nada.

---

## Misión (una sola pregunta)

> **¿Qué Operational Checks ya existen hoy… pero viven únicamente en la cabeza de las personas?**

Eso es el verdadero objetivo.

| Lo que oyes | Lo que es |
|-------------|-----------|
| «Con esto no llegamos a mañana.» | Un Check (stock / producción) |
| «Antes de irme tengo que sacar el pollo.» | Un Check (descongelación) |
| «Esta ruta hoy va justa.» | Un Check (viabilidad de ruta) |

No buscas funcionalidades.

Buscas **lógica de negocio** que hoy depende de la memoria humana.

---

## Regla de la jornada

Durante la observación:

| Hacer | No hacer |
|-------|----------|
| Mirar | Responder |
| Escuchar | Proponer |
| Anotar | Corregir |
| Preguntar solo para entender | Enseñar |

Preguntas permitidas (y casi solo estas):

- ¿Por qué haces eso?
- ¿Cómo sabes que falta?
- ¿Qué pasaría si se te olvidara?
- ¿Cómo lo recuerdas?
- ¿Quién te lo dice normalmente?

Cada respuesta probablemente esconde uno o varios Operational Checks.

---

## Qué esperar (y qué no)

No descubriréis 50 Capabilities el primer día.

Descubriréis **decenas de pequeñas comprobaciones**:

- «Siempre miro si queda suficiente film.»
- «Siempre reviso si todas las etiquetas tienen fecha.»
- «Siempre cuento las bolsas antes de que salga la furgoneta.»
- «Siempre compruebo que el cliente nuevo esté en la ruta.»

Eso son Checks — más valiosos que una lista de funcionalidades.

---

## Criterio de éxito del día

**No** terminar diciendo: «Necesitamos desarrollar esto.»

**Sí** terminar diciendo: «Hoy hemos identificado N Checks implícitos.»

Ese es un éxito enorme.

Ese mismo día: **cero** decisiones de producto, **cero** diseños de Check/Capability/pantalla.

Camino después (otro día):

```text
Observación → Discovery → Operational Check → Assistant → Capability
```

---

## Contador de preguntas

Anotar cada pregunta operativa con hora:

```text
08:12  ¿Qué bolsa es esta?
08:18  ¿Está pagado?
08:31  ¿Qué toca ahora?
08:46  ¿Queda pollo?
09:10  ¿Qué ruta hago primero?
```

Al cierre → [QUESTIONS_LIBRARY.md](./QUESTIONS_LIBRARY.md) · [TIME_LOSSES.md](./TIME_LOSSES.md) · OF en [OPERATIONAL_FINDINGS.md](./OPERATIONAL_FINDINGS.md).

Además: lista informal de **Checks implícitos oídos** (cita + quién + momento). Sin diseñar el Check.

---

## Zonas a observar

### Producción

¿Qué se comprueba de memoria? ¿Quién pregunta qué hacer? ¿Qué espera a otra persona?

### Packaging

¿Qué se revisa dos veces? ¿Qué errores casi ocurren?

### Reparto

¿Qué improvisa el repartidor? ¿Cómo saben si hay que cobrar / si la ruta «cabe»?

### Cierre / administración

¿Qué dejan «para mañana»? ¿Qué se confirma por WhatsApp?

---

## Entregable

1. N OF reales (sustituir plantillas).  
2. Conteo de preguntas.  
3. Workarounds / incidentes.  
4. **Lista de Checks implícitos** (citas; no specs).  
5. Cero diseños.

---

## Relacionado

- [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md) — unidad mínima de valor (diseñar **después**)
- [README.md](./README.md) — regla de oro: solo evidencia
- [Estado](../00-status/README.md) — fase de diseño estratégico cerrada
