# PRODUCT_VISION — Qué es YourMeal OS

**Tipo:** Product Blueprint (Product Era)  
**Audiencia:** cliente, producto, equipo  
**No contiene:** React, Supabase, arquitectura técnica, tablas

> `FOUNDATION` respondió **cómo construir**.  
> Este bloque responde **qué construir y por qué**.

---

## ¿Qué es realmente YourMeal OS?

YourMeal OS **no** es un ERP.

**No** es un programa de cocina.

**No** es un gestor de pedidos.

**Es un Sistema Operativo para la operación diaria de empresas de alimentación.**

Su misión es ayudar a cada persona a tomar la **siguiente decisión correcta** en el momento adecuado.

El producto no vende módulos.

Vende **minutos recuperados**, **errores evitados** y **coordinación entre equipos**.

---

## Misión

### Del software

> Ayudar a cada persona de la operación a tomar la siguiente decisión correcta en el momento adecuado.

### De la plataforma / empresa

> **Reducir la carga cognitiva de la operación diaria.**

No solo ahorrar tiempo.

No solo automatizar tareas.

Reducir la cantidad de cosas que las personas tienen que **recordar**, **preguntar** o **coordinar manualmente**.

No sustituye al cocinero, al gerente ni al repartidor.

Les evita tener que recordar cien cosas a la vez.

---

## Criterio de éxito (años)

No se mide por el número de Capabilities implementadas.

Se mide por:

> **¿Cuántas decisiones dejamos de depender de la memoria humana para que el equipo pudiera centrarse en cocinar, servir y atender mejor a sus clientes?**

### KPIs de operación (no de pantallas)

| KPI | Qué mide |
|-----|----------|
| Tiempo recuperado | Minutos ahorrados |
| Errores evitados | Incidencias reducidas |
| **Preguntas eliminadas** | Dependencia de memoria y coordinación |
| Decisiones asistidas | Acciones sugeridas por el sistema |
| Interrupciones evitadas | Cambios de contexto del equipo |

**Métrica estrella:** preguntas eliminadas (p. ej. de ~180/día a ~35/día).

Detalle de medición: [Operational Discovery](../16-operational-discovery/README.md).

---

## Visión

Que cualquier empleado, al llegar (incluida la apertura a las ~04:00), sepa exactamente qué hacer **sin preguntar**.

Que el gerente no recorra la cocina preguntando cómo vamos.

Que la información llegue **antes** del problema, no después.

Que YourMeal OS sea reconocible en cualquier Organización de alimentación por la misma identidad: **atención → acción → resultado** — aunque cambien las Capabilities concretas.

---

## Propuesta de valor

| El cliente no compra… | El cliente compra… |
|-----------------------|--------------------|
| Inventario | Anticipación de faltas |
| Rutas | Validación operativa antes de salir |
| Recetas | Decisiones de producción a tiempo |
| Dashboards | «¿Qué necesita tu atención ahora?» |
| Módulos aislados | Coordinación del día completo |

En una frase comercial:

> **YourMeal OS coordina la operación diaria de una cocina profesional y ayuda a cada persona a tomar la siguiente decisión correcta en el momento adecuado.**

---

## Qué compra realmente un cliente

1. **Asistentes Operativos** — el nivel de experiencia (lo que se usa cada día).  
2. **Menos preguntas** en el equipo.  
3. **Menos interrupciones** al gerente.  
4. **Minutos** recuperados en producción, packaging, reparto y compras.  
5. Un Core que aprende de su operación (primera Organización: **EatClean**).

Las **Capabilities** son cómo lo implementamos.  
No son el argumento de venta principal.

---

## Identidad técnica del producto

YourMeal OS no hace magia.

Hace **miles de comprobaciones pequeñas y consistentes**.

> **YourMeal OS no intenta ser más inteligente que el usuario. Intenta recordar todo aquello que el usuario no debería tener que recordar.**

> **No mostramos datos. Confirmamos que la operación puede continuar.**

Eso genera confianza. La confianza permite recomendar. La evidencia acumulada permite optimizar.

| Concepto | Rol |
|----------|-----|
| **Operational Checks** | Unidad mínima de inteligencia (sin IA): datos → comprobación → acción |
| **Centro de Control** | Superficie: estado de la operación (no vanity dashboard) |
| **Etapas de adopción** | Digitalizar → Validar → Recomendar → Optimizar |

No es un cuarto pilar. Es el comportamiento transversal del Product Blueprint.

Detalle: [OPERATIONAL_CHECKS.md](./OPERATIONAL_CHECKS.md).

---

## Primer profesor

**EatClean** no es solo el primer cliente.

Es el primer profesor del Core.

El orden de pensamiento es:

```text
EatClean → ¿qué necesita?
        ↓
¿cómo debe evolucionar YourMeal OS?
```

---

## Prueba de entrada (toda Capability futura)

Antes de existir en YourMeal OS, toda idea debe responder:

> **¿Qué pregunta elimina en la operación diaria de EatClean?**

Si no elimina una pregunta o no ahorra tiempo real / errores / interrupciones, **aún no merece entrar**.

---

## Relacionado

- [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)
- [OPERATIONAL_CHECKS.md](./OPERATIONAL_CHECKS.md)
- [OPERATIONS_DASHBOARD.md](./OPERATIONS_DASHBOARD.md) — Centro de Control
- [IDENTIDAD_ASISTENTES_OPERATIVOS.md](./IDENTIDAD_ASISTENTES_OPERATIVOS.md)
- [EATCLEAN_DIA_OPERATIVO.md](./EATCLEAN_DIA_OPERATIVO.md)
- [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)
