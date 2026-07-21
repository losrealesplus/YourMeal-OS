# EatClean · Día operativo

**Tipo:** mapa de producto (Product Era) — no es Guidelines ni Foundation  
**Organización:** EatClean Tenerife  
**Estado:** borrador operativo (evidencia descrita + web pública; validar en cocina)  
**Fuente web:** [eatcleantenerifecatering.es](https://eatcleantenerifecatering.es/)

> **Orden de pensamiento (Product Era)**  
> Antes: YourMeal OS → ¿cómo puede servir a una cocina?  
> Ahora: **EatClean → ¿qué necesita? → ¿cómo debe evolucionar YourMeal OS?**

---

## Qué es este documento

No es un inventario de pantallas.

Es el seguimiento de un día de operación: desde la planificación hasta el cierre.

Su propósito es convertirse en el **mapa de Capabilities** de YourMeal OS para EatClean:

- no «qué funcionalidades tiene el software»;
- sino **dónde se pierden minutos, preguntas e interrupciones**;
- y qué Capability elimina cada pregunta.

---

## Qué es EatClean (contexto)

Servicio de menús saludables con producción propia, catering y reparto. Oferta amplia y personalizada; cocina grill/horno; menús corporativos y eventos.

YourMeal OS no debe ser «un software de cocina».

Debe ser un **Sistema Operativo para la operación diaria**:

> Que cualquier empleado, a las 04:00, sepa exactamente qué hacer **sin preguntar**.

---

## Flujo operativo (visión actual)

### Planificación

```text
Publicar menú semanal
        ↓
Clientes / empresas realizan pedidos
        ↓
Se cierra la producción
```

### Producción (≈ 04:00)

```text
Preparación
        ↓
Cocinado
        ↓
Control de raciones
```

### Packaging

```text
Envasar
        ↓
Etiquetar
        ↓
Agrupar por cliente
```

### Logística

```text
Preparar bolsas
        ↓
Preparar cajas
        ↓
Asignar rutas
        ↓
Repartidores
        ↓
Entrega
```

### Operación (continuo)

```text
Stock
        ↓
Compras
        ↓
Reposición
```

---

## El día completo — seguir a las personas

> Las respuestas marcadas con **¿?** deben validarse en cocina real.  
> Lo demás resume el proceso ya descrito por el equipo.

### Antes del día de producción

| Momento | Quién (hipótesis) | Qué ocurre | Información que necesita | Hoy (hipótesis) |
|---------|-------------------|------------|--------------------------|-----------------|
| Menú semanal | Admin / cocina | Publica oferta | Platos disponibles, fechas | ¿WhatsApp / Excel / web? **¿?** |
| Pedidos | Consumidores / empresas | Encargan | Menú, plazos | Canal de pedido **¿?** |
| Cierre de producción | Admin | Congela cantidades | Pedidos consolidados | Manual **¿?** |

### 04:00 — apertura

| Pregunta de campo | Notas |
|-------------------|--------|
| ¿Quién llega primero? | **¿?** |
| ¿Qué hace en los primeros 10 minutos? | Probable: mirar qué cocinar hoy **¿?** |
| ¿Qué herramientas usa? | Papel, WhatsApp, llamadas, memoria **¿?** |
| ¿De quién depende para empezar? | ¿Espera pedidos cerrados / stock? **¿?** |

### Producción

| Actividad | Pregunta que hace hoy | Error / retraso típico (hipótesis) |
|-----------|----------------------|-------------------------------------|
| Prep mise en place | ¿Qué preparo primero? | Orden improvisado |
| Cocinado | ¿Cuántas raciones de X? | Contar mal / repetir pregunta |
| Control de raciones | ¿Cuánto falta? | Descuadre prep vs pedidos |

### Packaging

| Actividad | Pregunta que hace hoy | Error / retraso típico (hipótesis) |
|-----------|----------------------|-------------------------------------|
| Envasar | ¿Cuántos de cada plato? | Mezclar raciones |
| Etiquetar | ¿Qué lleva esta bolsa? | Etiqueta incorrecta |
| Agrupar por cliente | ¿Esta bolsa es de María? | Bolsa incompleta |

### Logística y entrega

| Actividad | Pregunta que hace hoy | Error / retraso típico (hipótesis) |
|-----------|----------------------|-------------------------------------|
| Cajas / rutas | ¿Qué ruta toca? ¿Qué va en esta caja? | Pedido en ruta equivocada |
| Reparto | ¿Siguiente cliente? ¿Cómo llego? | Llamadas al gerente |
| Incidencias | ¿Qué hago si no hay nadie? | Sin registro |

### Durante el día — gerente

| Pregunta recurrente | Coste |
|---------------------|--------|
| ¿Qué falta por cocinar? | Interrupciones |
| ¿Qué falta por etiquetar? | Interrupciones |
| ¿Qué falta por salir? | Interrupciones |
| ¿Qué repartidor sigue en ruta? | Llamadas |
| ¿Qué falta comprar? | Urgencias |

---

## Capabilities que aparecen solas

Cada Capability se resume en **una frase** que elimina una pregunta.

| Capability | Frase | Elimina la pregunta |
|------------|-------|---------------------|
| **Production Planning** | Nunca preguntes qué cocinar. | ¿Qué cocino hoy y cuántas raciones? |
| **Kitchen Queue** | Nunca preguntes qué sigue. | ¿Qué toca ahora? |
| **Packaging Assistant** | Nunca preguntes qué lleva esta bolsa. | ¿Esto es de María? ¿Falta algo? |
| **Delivery Builder** | Nunca preguntes qué ruta toca. | ¿Qué caja / ruta / repartidor? |
| **Delivery Assistant** | Nunca preguntes qué cliente sigue. | ¿Dónde voy? ¿Entregado? ¿Incidencia? |
| **Stock Intelligence** | Nunca preguntes qué comprar. | ¿Qué falta mañana? |
| **Operations Dashboard** | Nunca preguntes cómo vamos. | Las cinco preguntas del gerente |

### Operations Dashboard (la más importante)

Una sola pantalla viva:

```text
¿Qué falta por cocinar?
¿Qué falta por etiquetar?
¿Qué falta por salir?
¿Qué repartidor sigue en ruta?
¿Qué falta comprar?
```

Si eso existe, el gerente deja de ir preguntando a cada persona.

### Relación con Dish Management (ya construido)

`Dish Management` no es el día a las 04:00.

Es el **catálogo** que alimenta planificación, producción y pedidos.

En el mapa operativo:

```text
Dish Management (Core listo)
        ↓
Production Planning / Kitchen Queue / …
```

Sin platos bien definidos, el resto improvisa.

---

## Filosofía de Capabilities

No construimos pantallas.

**Eliminamos preguntas.**

Cada pregunta eliminada significa:

- menos interrupciones;
- menos errores;
- menos tiempo perdido.

Los minutos ahorrados en cada fase, sumados, son el producto que EatClean compra.

---

## Qué NO hacer todavía

- Diseñar UI detallada de cada Capability.
- Implementar Production Planning / Kitchen Queue «porque suenan bien».
- Abrir Capability 2 sin evidencia del piloto o de este mapa validado en cocina.

Siguiente evidencia de campo:

1. Validar con EatClean las filas marcadas **¿?**.
2. Medir dónde se pierden más minutos / más preguntas.
3. Priorizar la Capability que elimine la pregunta más cara.

---

## Definition of Done de este documento

- [x] Flujo operativo descrito (planificación → entrega → stock)
- [x] Día completo planteado como seguimiento de personas
- [x] Capabilities emergentes + frases «nunca preguntes…»
- [x] Operations Dashboard identificado
- [ ] Validación en cocina real (nombres, horarios, herramientas actuales)
- [ ] Priorización por minutos / preguntas eliminadas

---

## Relacionado

- [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)
- [Product Era](../99-internal/development-journal/2026-07-21-product-era.md)
- [Estado](../00-status/README.md)
- Dish Management (Core) — ya validado hasta Infrastructure
