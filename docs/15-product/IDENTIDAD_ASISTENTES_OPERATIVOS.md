# Identidad de producto · Asistentes Operativos

**Tipo:** identidad de producto (Product Era) — no es Guidelines de arquitectura  
**Relacionado:** [EATCLEAN_DIA_OPERATIVO.md](./EATCLEAN_DIA_OPERATIVO.md) · [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)

---

## Misión

> **YourMeal OS ayuda a cada persona a tomar la siguiente decisión correcta en el momento adecuado.**

No sustituye a la cocina.

No sustituye al gerente.

No sustituye al repartidor.

Les evita tener que recordar cien cosas al mismo tiempo.

---

## Qué no es

| No es | Porque |
|-------|--------|
| Un ERP más | Los ERP registran lo que ya pasó |
| Un CRM de cocina | No gestiona «clientes» como protagonista |
| Un chatbot / IA conversacional | No es charla; es decisión |
| Un inventario de módulos | Los módulos no son la identidad |

---

## Qué sí es

Un **sistema operativo para la toma de decisiones diarias**.

Reactivo = registrar el pasado.  
**Proactivo** = avisar **antes** de que aparezca el problema.

```text
🟢 Stock suficiente para mañana.
🟡 Ingredientes para 12 ensaladas; hay 18 pedidos.
🔴 Si no descongelas el pollo antes de las 18:00, mañana se retrasa la producción.
```

---

## Nivel de producto: Asistentes Operativos

Por debajo siguen existiendo Capabilities (`Dish Management`, `Production Planning`, …).

Por encima, para el usuario, YourMeal OS se experimenta como **Asistentes Operativos**:

sistemas que observan el estado de la operación y avisan **antes** del fallo.

No son chatbots.

Son **decisiones operativas empaquetadas**.

| Situación | No es… | Es… |
|-----------|--------|-----|
| No queda lechuga para mañana | Problema de inventario | **Anticipación** (avisar hoy) |
| Hay que sacar el pollo del congelador | Un recordatorio cualquiera | **Dependencia temporal** |
| No repetir platos en el menú | Un CRUD de platos | **Ayuda editorial** |
| La ruta es demasiado larga | Un mapa | **Validación operativa** |
| ¿Ha pagado? | Contabilidad en abstracto | **Decisión en el momento de entrega** |

---

## Organizar por momentos de decisión

Más que por departamentos, el producto se organiza por **cuándo** hay que decidir.

### 🌙 Antes de cerrar

- ¿Qué hay que descongelar?
- ¿Qué falta comprar?
- ¿Hay incidencias abiertas?
- ¿Está lista la producción de mañana?

### 🌅 Antes de empezar

- ¿Qué se cocina primero?
- ¿Qué ingredientes faltan?
- ¿Qué pedidos son prioritarios?
- ¿Hay cambios de última hora?

### 📦 Antes de repartir

- ¿Todas las bolsas están completas?
- ¿Las rutas son viables?
- ¿Todos los clientes están asignados?
- ¿Hay pagos pendientes?

### 🌙 Antes de terminar el día

- ¿Qué stock queda?
- ¿Qué hay que pedir?
- ¿Qué hay que descongelar?
- ¿Qué incidencias quedan abiertas?

---

## El sello: «¿Qué necesita tu atención ahora?»

La superficie principal no es un dashboard de gráficos.

Es una cola de **atención**:

```text
🔴 Acción crítica
Descongelar 8 kg de pollo antes de las 18:00.

🟡 Producción
Faltan ingredientes para 6 ensaladas de mañana.

🟢 Reparto
Todas las rutas están dentro del tiempo previsto.

🟡 Administración
3 pedidos pendientes de cobro en la entrega.

🔵 Menú
Hay dos platos muy similares a los de la semana pasada.
```

No mostramos datos.

**Guiamos el trabajo.**

YourMeal OS no será recordado por el mejor módulo de inventario o el mejor planificador de rutas.

Será recordado porque **cada empleado abre la aplicación y sabe inmediatamente cuál es la siguiente acción que realmente importa**.

---

## Jerarquía de producto (cómo hablar de ello)

```text
Asistentes Operativos          ← experiencia / identidad
        ↓
Momentos de decisión           ← cuándo
        ↓
Capabilities                   ← qué capacidad operativa
        ↓
Use Cases → Domain → Infra     ← cómo (ya validado)
```

`Dish Management` sigue siendo una Capability real.

Los Asistentes Operativos son el **nivel superior** con el que el producto se presenta y se prioriza.

---

## Relación con «eliminar preguntas»

| Antes | Ahora |
|-------|--------|
| Eliminar preguntas al llegar | Además: **anticipar** la pregunta antes de que nazca |
| Cola de trabajo | Cola de **atención** (qué importa ahora) |
| Capabilities por área | Capabilities al servicio de **momentos de decisión** |

---

## Qué no hacer todavía

- Implementar el feed de atención sin evidencia de campo.
- Llenar la UI de gráficos «porque un dashboard lo lleva».
- Confundir Asistente Operativo con chatbot.

Validar primero en EatClean: qué alertas habrían evitado el retraso o el error de ayer.

---

## Relacionado

- [Día operativo EatClean](./EATCLEAN_DIA_OPERATIVO.md)
- [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)
- [Product Era](../99-internal/development-journal/2026-07-21-product-era.md)
