# Nivel 2 — Supporting Objects

Importantes para operar. **No** son el corazón del modelo.

Entran aquí si:

- fallan el filtro de ciclo de vida propio (viven dentro de un Core), **o**
- son permanentes pero de soporte (recurso / detalle), **o**
- orbitan la espina sin ser la espina.

Siguen usando nombres del [Ubiquitous Language](../01-ubiquitous-language/README.md).  
Familias Dynamics: [Supporting Taxonomy](../07-operational-dynamics/02-supporting-objects-taxonomy.md).

---

## Order Item · `OrderItem`

| | |
|--|--|
| **Por qué no es Core** | Nace y muere dentro del Order |
| **Responsabilidad** | Granularidad Dish + día + cantidad + notas |
| **Relaciones** | Order · Dish · Packaging · Label |
| **Checks** | Alergias · cantidad vs Batch |
| **Amend** | Líneas bajo **Amend Confirmed Order** (MC-001) · dieta del servicio aquí; perfil base en Beneficiary |

---

## Stock · `Stock`

| | |
|--|--|
| **Familia Dynamics** | Operational Resource (inventario) + vínculo Traceability vía Lot |
| **Por qué Supporting** | Es estado de un Ingredient, no la espina de demanda→entrega; sí es permanente y con Checks |
| **Responsabilidad** | Representar disponible para operar |
| **Relaciones** | Ingredient · Production Plan · Batch · Supplier · **Lot** |
| **Checks** | Suficiencia · mínimo · comprar antes de hora X · Lot en Receive/Consume |

> Candidato a promover a Core si Observation demuestra que sin Stock como objeto de primer nivel el ciclo no se puede narrar. Hoy: Supporting con Checks fuertes.

---

## Lot · `Lot` *(MC-003 · VR-003)*

| | |
|--|--|
| **Familia Dynamics** | Traceability |
| **Por qué Supporting** | Ancla Ingredient→Supplier→Batch; **no** eslabón de demanda→entrega |
| **Responsabilidad** | Identidad de lote en Receive y consume; traza inversa (recall) |
| **Relaciones** | Ingredient · Supplier · Stock · Production Batch · (vía Packaging) Order Item |
| **Checks** | ¿Lot obligatorio en Receive? · ¿Puede consumirse? · ¿Puede listarse recorrido inverso? |
| **No es** | Core Recall · Core de espina |

---

## Label · `Label`

| | |
|--|--|
| **Familia Dynamics** | Traceability |
| **Por qué Supporting** | Identifica una unidad de Packaging; ciclo acoplado al empaquetado |
| **Responsabilidad** | Identidad verificable (destinatario, plato, alérgenos, fecha) |
| **Relaciones** | Packaging · Order Item · Delivery |
| **Checks** | Fecha · alérgenos · destinatario · Apply / Void / Reapply (MC-004) |

---

## Vehicle · `Vehicle`

| | |
|--|--|
| **Familia Dynamics** | Operational Resource |
| **Por qué Supporting** | Recurso de la Route, no el plan logístico en sí |
| **Responsabilidad** | Medio asignable a Delivery Route |
| **Relaciones** | Delivery Route · Employee (conductor) · Organization **owns 1..n** |
| **Checks** | Preparado · capacidad |
| **Cardinalidad** *(MC-005)* | Organization **owns** 1..n Vehicles. «A menudo 1» = default de arranque, **no** Invariant |

---

## Kitchen · `Kitchen`

| | |
|--|--|
| **Familia Dynamics** | Operational Resource |
| **Por qué Supporting** | Ámbito de ejecución; a menudo uno por Tenant al inicio |
| **Responsabilidad** | Donde ocurren Production Batches |
| **Relaciones** | Production Batch · Employee · Stock · Organization **owns 1..n** |
| **Checks** | Capacidad en Start / Resume Batch (horno/equipo = atributo/Equipment bajo Kitchen — **no** Core; VR-002) |
| **Cardinalidad** *(MC-005)* | Organization **owns** 1..n Kitchens. «A menudo 1» ≠ ley del modelo |
| **Paralelismo** | Varios Batches en paralelo bajo el mismo Plan / día; Batch puede registrar Kitchen + ventana horaria **sin** objeto Shift |

---

## Employee · `Employee`

| | |
|--|--|
| **Familia Dynamics** | Operational Resource |
| **Por qué Supporting** | Opera el sistema; no es un eslabón de la espina comercial |
| **Responsabilidad** | Ejecutar Batches, Packaging, Routes, Checks |
| **Relaciones** | Organization · todos los Asistentes |
| **Checks** | — |

---

## Invoice · `Invoice`

| | |
|--|--|
| **Familia Dynamics** | Administrative / financiero de soporte |
| **Por qué Supporting** | Documento de facturación; Payment es el hecho de liquidación en la espina |
| **Responsabilidad** | Agrupar importes a liquidar · crédito/ajuste post-incidente |
| **Relaciones** | Order · Payment · Consumer / Company Account |
| **Checks** | ¿Puede emitirse? |

---

## Location · `Location` *(MC-006 · VR-006)*

| | |
|--|--|
| **Estado** | **Activo** (promovido desde reservado) |
| **Familia Dynamics** | Spatial |
| **Por qué Supporting** | Ubica destino / almacén / sede; **no** es el hecho Delivery ni la Route |
| **Responsabilidad** | Destino canónico fino (planta · habitación · aula · punto · almacén) |
| **Relaciones** | Delivery · Beneficiary · Kitchen · Stock |
| **Checks** | ¿Destino válido para Delivery? · Update destination |
| **No es** | Core Ward / Classroom / EmergencyOrder |

---

## Price · `Price` / Tax · `Tax` *(reservado)*

Configuración comercial / fiscal — ver [Nivel 3](./level-3-configuration.md) si son reglas; no inventar Core de pricing ahora.

---

## Rechazos canónicos de escala *(MC-005 · VR-005)*

| Concepto | Decisión |
|----------|----------|
| Shift · Wave · Session como Core | Rechazado — ventana + Employee + Kitchen |
| Order Bundle · Super-Route como Core | Rechazado sin VR Contradicted/Extended de capacidad nueva |

---

## Lista Nivel 2 (activa)

```text
Order Item · Stock · Lot · Label · Vehicle · Kitchen · Employee · Invoice · Location
```

Reservados (no activos): Price · Tax.
