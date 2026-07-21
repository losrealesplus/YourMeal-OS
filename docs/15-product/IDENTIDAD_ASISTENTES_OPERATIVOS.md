# Identidad de producto · Asistentes Operativos

**Tipo:** filosofía / identidad de producto (Product Era) — no es Guidelines de arquitectura técnica  
**Relacionado:** [EATCLEAN_DIA_OPERATIVO.md](./EATCLEAN_DIA_OPERATIVO.md) · [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)

---

## Misión

> **YourMeal OS ayuda a cada persona a tomar la siguiente decisión correcta en el momento adecuado.**

No sustituye a la cocina, al gerente ni al repartidor.

Les evita tener que recordar cien cosas al mismo tiempo.

### Cómo se vende (propuesta de valor)

> **YourMeal OS es un sistema operativo que coordina toda la operación diaria de una cocina profesional y ayuda a cada persona a tomar la siguiente decisión correcta en el momento adecuado.**

No vendemos inventario, rutas o recetas.

Vendemos **decisiones correctas a tiempo**.

Si mañana el Core sirve a una panadería, un obrador u otro catering, pueden cambiar Capabilities — **la identidad del producto permanece**.

---

## Dos arquitecturas (conviven; no compiten)

### Arquitectura técnica (ya validada)

```text
Platform
    ↓
Capabilities
    ↓
Use Cases
    ↓
Domain
    ↓
Infrastructure
```

### Arquitectura de la experiencia operativa

```text
Momento operativo
        ↓
Pregunta del usuario
        ↓
Asistente Operativo
        ↓
Capability (una o varias)
        ↓
Use Cases
```

El gerente no piensa «voy a usar Dish Management».

Piensa: **«¿Qué problemas tengo esta mañana?»**

```text
¿Qué necesita tu atención ahora?

🔴 Faltan 8 kg de pollo para mañana.
🟡 Dos rutas superan el tiempo previsto.
🟡 Hay 3 pedidos sin asignar.
🟢 El packaging está completo.
```

Al pulsar «Faltan 8 kg de pollo»:

```text
Asistente Operativo
        ↓
Inventory Capability
        ↓
Stock Use Cases
        ↓
Repositories
        ↓
Infrastructure
```

El usuario nunca ve esa complejidad.

---

## Dos niveles de producto

| Nivel | Nombre | Qué es |
|-------|--------|--------|
| **1** | **Asistentes Operativos** | Lo que compra el cliente. La experiencia. |
| **2** | **Capabilities** | Cómo lo implementamos. El Core. |

Un Asistente puede **orquestar varias Capabilities** para resolver **una única decisión**.

Eso rompe el ERP típico donde cada módulo vive aislado.

| Asistente Operativo | Capabilities implicadas (ejemplos) |
|---------------------|--------------------------------------|
| Producción | Dish, Recipes, Inventory, Orders |
| Packaging | Orders, Labels, Customers |
| Reparto | Routes, Drivers, Deliveries |
| Compras | Inventory, Suppliers |
| Menú semanal | Menu, Dishes, Nutrition |
| Operaciones (gerente) | Todas las anteriores (síntesis) |

---

## El verdadero «frontend» del negocio

React es la tecnología de interfaz.

El **frontend del negocio** es:

```text
¿Qué necesita tu atención ahora?
```

Todo lo demás son pantallas secundarias.

---

## Principio de propósito (obligatorio)

> **Cada Asistente Operativo debe ser capaz de responder una pregunta concreta o recomendar una acción concreta. Nunca mostrar información sin propósito.**

### ❌ Obliga al usuario a pensar

```text
Stock
Lechuga: 12 kg
Tomate: 8 kg
Pollo: 4 kg
```

### ✅ El sistema ya hizo el trabajo difícil

```text
Acción recomendada
Comprar 6 kg de lechuga hoy.

Motivo:
La producción prevista para mañana supera el stock disponible.
```

---

## Filtro de diseño (el más importante)

Antes de preguntar *«¿qué tablas necesita?»*, preguntar:

> **¿Qué pregunta elimina?**

| Si la respuesta… | Entonces… |
|------------------|-----------|
| No es clara | La funcionalidad **aún no está madura** |
| Es inmediata (*¿qué cocino primero?*, *¿qué compro hoy?*, *¿qué pedido requiere atención?*) | **Encaja** con la filosofía |

Proteger esta identidad con cuidado en cada idea nueva.

---

## Qué no es / qué sí es

| No es | Porque |
|-------|--------|
| Un ERP más | Los ERP son reactivos: registran el pasado |
| Un chatbot | No es charla; es decisión |
| Un inventario de módulos | Los módulos no son lo que se compra |

| Situación | No es… | Es… |
|-----------|--------|-----|
| No queda lechuga para mañana | Inventario | **Anticipación** |
| Sacar el pollo del congelador | Recordatorio genérico | **Dependencia temporal** |
| No repetir platos | CRUD | **Ayuda editorial** |
| Ruta demasiado larga | Mapa | **Validación operativa** |
| ¿Ha pagado? | Contabilidad abstracta | **Decisión en la entrega** |

Reactivo = registrar el pasado.  
**Proactivo** = avisar **antes** del problema.

---

## Momentos de decisión

Más que por departamentos, por **cuándo** hay que decidir.

### 🌙 Antes de cerrar

¿Qué descongelar? ¿Qué comprar? ¿Incidencias? ¿Producción de mañana lista?

### 🌅 Antes de empezar

¿Qué se cocina primero? ¿Qué falta? ¿Prioridades? ¿Cambios de última hora?

### 📦 Antes de repartir

¿Bolsas completas? ¿Rutas viables? ¿Clientes asignados? ¿Pagos pendientes?

### 🌙 Antes de terminar el día

¿Stock? ¿Pedidos a proveedor? ¿Descongelar? ¿Incidencias abiertas?

---

## Sello de experiencia

```text
🔴 Acción crítica — Descongelar 8 kg de pollo antes de las 18:00.
🟡 Producción — Faltan ingredientes para 6 ensaladas de mañana.
🟢 Reparto — Rutas dentro del tiempo previsto.
🟡 Administración — 3 cobros pendientes en entrega.
🔵 Menú — Dos platos muy similares a la semana pasada.
```

No mostramos datos. **Guiamos el trabajo.**

---

## Qué no hacer todavía

- Implementar el feed de atención sin evidencia de campo.
- Dashboards de vanity metrics.
- Confundir Asistente con chatbot.
- Diseñar Capabilities aisladas sin preguntar *¿qué pregunta elimina?*

---

## Relacionado

- [Día operativo EatClean](./EATCLEAN_DIA_OPERATIVO.md)
- [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)
- [Product Era](../99-internal/development-journal/2026-07-21-product-era.md)
