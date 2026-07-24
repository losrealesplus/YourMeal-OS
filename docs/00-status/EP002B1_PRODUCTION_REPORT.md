# EP-002B.1 · Production Reports

**Estado:** Done (implementation)  
**Cara:** Centro de Operaciones · Cocina  
**Principio:** [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (DICT-071)  
**Pregunta:** ¿Qué necesita **hacer** cocina hoy?

---

## Problema operacional

EatClean trabaja diariamente con una **Hoja de Producción** generada a mano. No es un listado de pedidos ni un documento administrativo: es el documento con el que cocina produce toda la jornada.

YourMeal OS la genera automáticamente a partir de pedidos reales en cola de cocina.

---

## Arquitectura

```text
Pedidos (confirmed → prepared)
        │
ProductionReportService
        │
        ├── Report  → Hoja de Producción (digital + print)
        └── Workspace → [Kitchen Execution](./EP002B2_KITCHEN_EXECUTION.md)
```

Patrón: [Operational Representation (DICT-072)](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md).  
La UI no contiene lógica de negocio. El estado de lote (`batchStatus`) vive en `kitchen_production_batches` y se lee en ambas superficies.

---

## Agrupación

Por **plato**, no por cliente. Personalizados (líneas con `comment`) van en sección aparte y no se mezclan con el bloque estándar.

Resumen de ingredientes: `dish_ingredients × raciones`. Si no hay receta, no se inventa cantidad.

---

## Superficies

| Superficie | Contenido |
|------------|-----------|
| Digital (`/admin/production-sheet`) | Acordeones por plato, alérgenos, raciones, prep time, estados, personalizados, resumen |
| Impresión / PDF | Layout tipo papel (navegador → Imprimir / Guardar PDF) |

Entrada desde **Cocina** → «Hoja de Producción».

---

## Definition of Done

Cocina puede consultar, imprimir y guardar en PDF la hoja del día sin introducir datos manuales, reflejando exactamente la cola operativa.
