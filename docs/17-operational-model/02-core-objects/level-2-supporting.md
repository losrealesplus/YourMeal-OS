# Nivel 2 — Supporting Objects

Importantes para operar. **No** son el corazón del modelo.

Entran aquí si:

- fallan el filtro de ciclo de vida propio (viven dentro de un Core), **o**
- son permanentes pero de soporte (recurso / detalle), **o**
- orbitan la espina sin ser la espina.

Siguen usando nombres del [Ubiquitous Language](../01-ubiquitous-language/README.md).

---

## Order Item · `OrderItem`

| | |
|--|--|
| **Por qué no es Core** | Nace y muere dentro del Order |
| **Responsabilidad** | Granularidad Dish + día + cantidad + notas |
| **Relaciones** | Order · Dish · Packaging · Label |
| **Checks** | Alergias · cantidad vs Batch |

---

## Stock · `Stock`

| | |
|--|--|
| **Por qué Supporting** | Es estado de un Ingredient, no la espina de demanda→entrega; sí es permanente y con Checks |
| **Responsabilidad** | Representar disponible para operar |
| **Relaciones** | Ingredient · Production Plan · Batch · Supplier |
| **Checks** | Suficiencia · mínimo · comprar antes de hora X |

> Candidato a promover a Core si Observation demuestra que sin Stock como objeto de primer nivel el ciclo no se puede narrar. Hoy: Supporting con Checks fuertes.

---

## Label · `Label`

| | |
|--|--|
| **Por qué Supporting** | Identifica una unidad de Packaging; ciclo acoplado al empaquetado |
| **Responsabilidad** | Identidad verificable (destinatario, plato, alérgenos, fecha) |
| **Relaciones** | Packaging · Order Item · Delivery |
| **Checks** | Fecha · alérgenos · destinatario |

---

## Vehicle · `Vehicle`

| | |
|--|--|
| **Por qué Supporting** | Recurso de la Route, no el plan logístico en sí |
| **Responsabilidad** | Medio asignable a Delivery Route |
| **Relaciones** | Delivery Route · Employee (conductor) |
| **Checks** | Preparado · capacidad (futuro) |

---

## Kitchen · `Kitchen`

| | |
|--|--|
| **Por qué Supporting** | Ámbito de ejecución; a menudo uno por Tenant al inicio |
| **Responsabilidad** | Donde ocurren Production Batches |
| **Relaciones** | Production Batch · Employee · Stock |
| **Checks** | — |

---

## Employee · `Employee`

| | |
|--|--|
| **Por qué Supporting** | Opera el sistema; no es un eslabón de la espina comercial |
| **Responsabilidad** | Ejecutar Batches, Packaging, Routes, Checks |
| **Relaciones** | Organization · todos los Asistentes |
| **Checks** | — |

---

## Invoice · `Invoice`

| | |
|--|--|
| **Por qué Supporting** | Documento de facturación; Payment es el hecho de liquidación en la espina |
| **Responsabilidad** | Agrupar importes a liquidar |
| **Relaciones** | Order · Payment · Consumer / Company Account |
| **Checks** | — |

---

## Location · `Location` *(reservado)*

| | |
|--|--|
| **Estado** | No promovido aún |
| **Por qué reservado** | Útil (almacén, punto de entrega, sede) pero riesgo de sobre-modelado |
| **Regla** | Solo entra tras filtro + evidencia (Observation) |

---

## Price · `Price` / Tax · `Tax` *(reservado)*

Configuración comercial / fiscal — ver [Nivel 3](./level-3-configuration.md) si son reglas; no inventar Core de pricing ahora.

---

## Lista Nivel 2 (activa)

```text
Order Item · Stock · Label · Vehicle · Kitchen · Employee · Invoice
```

Reservados (no activos): Location · Price · Tax.
