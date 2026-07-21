# OPERATIONAL_CHECKS — De datos a atención operativa

**Tipo:** concepto transversal del Product Blueprint  
**No es:** un cuarto pilar · una Capability · una capa de arquitectura  
**Sí es:** el comportamiento que deberían compartir casi todas las Capabilities

> **Operational Checks** son el mecanismo mediante el cual YourMeal OS transforma datos en decisiones operativas.

---

## Definición

> **Un Operational Check es una validación lógica ejecutada automáticamente por YourMeal OS para comprobar que la operación puede continuar sin riesgo y señalar cualquier condición que requiera atención antes de que se convierta en un problema.**

Un check **no** implica que exista un error.

Implica que algo **necesita atención** — o que está en orden.

---

## Por qué existen

> **El primer reto no es automatizar. Es conseguir que la gente confíe en el sistema.**

La confianza no la genera una IA.

La genera que, durante semanas, el sistema **acierte siempre en cosas sencillas**.

Los Checks son esas cosas sencillas: comprobaciones pequeñas, consistentes y explicables.

---

## Cuatro etapas de adopción

No saltar a la IA. Ganar confianza por capas.

### Etapa 1 — Digitalizar

El sistema sustituye el papel. Nada más.

Pedidos · producción · stock · rutas · pagos.

El usuario sigue tomando **todas** las decisiones.

### Etapa 2 — Validar

El sistema **comprueba**. No decide. Solo detecta.

```text
⚠️ Hay lechuga para 10 ensaladas.
Producción prevista: 20.
Pendiente de resolver.
```

No dice qué comprar. No modifica nada. Evita que el problema pase desapercibido.

### Etapa 3 — Recomendar

Cuando ya existe confianza.

```text
⚠️ Producción prevista: 20 ensaladas. Stock: 10.
Recomendación: comprar 3 cajas de lechuga antes de las 18:00.
```

Sigue siendo recomendación. La decisión es humana.

### Etapa 4 — Optimizar

Solo con evidencia acumulada (idealmente varias Organizaciones / cientos de jornadas).

Aprender patrones: sobrantes habituales, rutas que se alargan, etc.

Aquí sí puede entrar IA — **no** para gestionar el día a día en lugar de los Checks; para mejorarlos con evidencia.

---

## Patrón universal (toda Capability)

Cada Capability debería poder responder siempre a tres preguntas:

| # | Pregunta | Qué es |
|---|----------|--------|
| 1 | **¿Qué sabemos?** | Datos |
| 2 | **¿Qué debemos comprobar?** | Checks |
| 3 | **¿Qué necesita atención?** | Acciones |

### Ejemplo · Stock

| | |
|--|--|
| Sabemos | 10 lechugas |
| Check | ¿Cubren la producción prevista? |
| Resultado | ❌ No |
| Acción | Comprar antes de las 18:00 |

### Ejemplo · Producción

| | |
|--|--|
| Sabemos | 100 raciones de pollo previstas |
| Check | ¿Está descongelado considerando la merma? |
| Resultado | ❌ No |
| Acción | Sacar 28 kg del congelador antes de finalizar el turno |

### Ejemplo · Reparto

| | |
|--|--|
| Sabemos | 56 entregas |
| Check | ¿La ruta Norte cabe en la ventana horaria? |
| Resultado | ⚠️ No |
| Acción | Adelantar salida 30 min o redistribuir 8 pedidos |

---

## Ejemplos de superficie (estado de la operación)

### Producción

```text
✓ Pollo suficiente
⚠️ Falta lechuga
✓ Carne descongelándose
✓ Etiquetas listas
```

### Cierre

```text
⚠️ Pendiente descongelar pollo
✓ Compras realizadas
✓ Stock actualizado
⚠️ Incidencia abierta
```

### Reparto

```text
✓ Ruta Sur correcta
⚠️ Ruta Norte supera el tiempo previsto
✓ Vehículos preparados
```

No se muestran módulos. Se muestra el **estado de la operación**.

---

## Cinco principios

1. **Todo Check tiene un propósito operativo.**  
2. **Todo Check debe poder explicarse.** («¿Por qué me avisas de esto?»)  
3. **Todo Check conduce a una acción** (o a una confirmación útil de que no hace falta actuar).  
4. **Un Check nunca decide por la persona.**  
5. **La IA no sustituye a los Checks; los mejora cuando exista suficiente evidencia.**

---

## Filtro de diseño (toda funcionalidad nueva)

Además de *¿qué pregunta elimina?*:

> **¿Qué comprueba, por qué lo comprueba y qué acción permite tomar?**

Si no hay respuesta clara, aún no es un Check — y probablemente no está listo.

---

## Relación con el Centro de Control

La superficie principal no es un dashboard de gráficos.

Es un **Centro de Control**: enseña el estado de la operación (como una torre de control).

Detalle: [OPERATIONS_DASHBOARD.md](./OPERATIONS_DASHBOARD.md) *(Centro de Control)*.

---

## Relacionado

- [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)
- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [OPERATIVE_ASSISTANTS.md](./OPERATIVE_ASSISTANTS.md)
- [Operational Discovery](../16-operational-discovery/README.md) — evidencia antes de Checks sofisticados
