# OPERATIVE_ASSISTANTS — Lo que compra el cliente

**Tipo:** Product Blueprint (Product Era)  
**Nivel de producto:** 1 — Asistentes Operativos  
**No diseña:** entidades, Use Cases ni tablas  
**Identidad:** [IDENTIDAD_ASISTENTES_OPERATIVOS.md](./IDENTIDAD_ASISTENTES_OPERATIVOS.md)

Aquí nace el producto.

No los módulos.

Los **asistentes**.

Cada uno elimina **una pregunta**.

Cada uno puede apoyarse en **varias Capabilities**.

---

## Production Assistant

| | |
|--|--|
| **Misión** | Que cocina sepa qué producir y en qué orden sin preguntar |
| **Pregunta que elimina** | ¿Qué debo cocinar ahora? / ¿Cuántas raciones de cada plato? |
| **Acciones que recomienda** | Orden de cocción · cantidades · alertas de faltantes de mise en place · cambios de última hora |
| **Capabilities (apoyo, sin diseñar)** | Dish · Recipe · Orders · Inventory |
| **Momentos** | Antes de empezar · Durante producción |

---

## Packaging Assistant

| | |
|--|--|
| **Misión** | Guiar envasado y etiquetado por cliente sin errores |
| **Pregunta que elimina** | ¿Qué lleva esta bolsa? |
| **Acciones que recomienda** | Checklist por cliente · cerrar bolsa · siguiente · alertar incompletos |
| **Capabilities (apoyo)** | Orders · Labels · Customers (Consumidores / Beneficiarios según actores) |
| **Momentos** | Durante packaging · Antes del reparto |

---

## Route Assistant *(Delivery Builder)*

| | |
|--|--|
| **Misión** | Preparar rutas y cargas viables antes de salir |
| **Pregunta que elimina** | ¿Quién reparte qué? / ¿Qué ruta toca? |
| **Acciones que recomienda** | Asignar pedidos a ruta · validar tiempo · dividir ruta si supera umbral · preparar cajas |
| **Capabilities (apoyo)** | Routes · Drivers · Deliveries · Orders |
| **Momentos** | Antes del reparto |

---

## Delivery Assistant

| | |
|--|--|
| **Misión** | Guiar la entrega punto a punto |
| **Pregunta que elimina** | ¿Quién es el siguiente y qué hago en esta parada? |
| **Acciones que recomienda** | Navegación · entregado · cobro si aplica · incidencia · firma · siguiente |
| **Capabilities (apoyo)** | Deliveries · Drivers · Payments (estado de cobro) |
| **Momentos** | Durante reparto |

---

## Purchasing Assistant

| | |
|--|--|
| **Misión** | Anticipar compras a partir de pedidos, recetas y stock |
| **Pregunta que elimina** | ¿Qué debo comprar hoy? |
| **Acciones que recomienda** | Lista de compra · cantidades · urgencia · proveedor sugerido (futuro) |
| **Capabilities (apoyo)** | Inventory · Suppliers · Orders · Recipe |
| **Momentos** | Antes de cerrar · Fin de jornada |

---

## Closing Assistant

| | |
|--|--|
| **Misión** | Dejar mañana desbloqueada antes de irse |
| **Pregunta que elimina** | ¿Qué tengo que dejar preparado para mañana? |
| **Acciones que recomienda** | Descongelar X antes de hora H · compras pendientes · incidencias abiertas · producción de mañana lista/no lista |
| **Capabilities (apoyo)** | Inventory · Orders · Production Planning · Incidents |
| **Momentos** | Antes de cerrar · Fin de jornada |

---

## Menu Assistant *(Weekly Menu)*

| | |
|--|--|
| **Misión** | Ayudar a componer un menú semanal con variedad y equilibrio |
| **Pregunta que elimina** | ¿Qué platos pongo esta semana sin repetir mal? |
| **Acciones que recomienda** | Alertas de repetición · equilibrio nutricional básico · sugerencias desde catálogo Dish |
| **Capabilities (apoyo)** | Menu · Dish · Nutrition |
| **Momentos** | Planificación (fuera del turno 04:00, pero crítico) |

---

## Operations Assistant *(gerente)*

| | |
|--|--|
| **Misión** | Sintetizar el estado del día en acciones, no en métricas sueltas |
| **Pregunta que elimina** | ¿Cómo vamos? / ¿A quién pregunto ahora? |
| **Acciones que recomienda** | Priorizar críticas · delegar · desbloquear cuellos de botella |
| **Capabilities (apoyo)** | Orquesta todas las anteriores vía Operations Dashboard |
| **Momentos** | Todos |

Detalle de superficie: [OPERATIONS_DASHBOARD.md](./OPERATIONS_DASHBOARD.md)

---

## Regla

Si un Asistente no puede enunciarse como:

> Elimina la pregunta: «…»

aún no está definido.

---

## Relacionado

- [CAPABILITY_ROADMAP.md](./CAPABILITY_ROADMAP.md)
- [MOMENTOS_DE_DECISION.md](./MOMENTOS_DE_DECISION.md)
- [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)
