# EP-002B.2 · Kitchen Execution

**Estado:** Done (implementation)  
**Cara:** Centro de Operaciones · Cocina  
**Principio:** [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (DICT-071)  
**Pregunta:** ¿Qué está ocurriendo en la cocina **ahora mismo**?

---

## Problema operacional

La [Hoja de Producción](./EP002B1_PRODUCTION_REPORT.md) responde *qué hay que cocinar hoy*.  
Kitchen Execution responde *en qué estado está cada lote de producción*.

No son el mismo documento: una es un **Report** (imprimible); la otra es un **Workspace** (acciones).

---

## Arquitectura

```text
Kitchen Queue (pedidos confirmed → prepared)
        │
ProductionReportService
        │
        ├── Report  → Hoja de Producción (/admin/production-sheet)
        └── Workspace → Ejecución de Cocina (/admin/kitchen-execution)
```

Un único origen. Dos representaciones.

Convención YourMeal OS:

| Capa | Rol |
|------|-----|
| **Service** | Lógica de negocio compartida |
| **Report** | Documento operativo (lectura / impresión) |
| **Workspace** | Lugar donde el equipo cambia estado |

`KitchenExecutionService.getDayBoard` reutiliza `ProductionReportService.buildForDay`.  
Las mutaciones van a `kitchen_production_batches` (lote = plato × día), no a un modelo paralelo de pedidos.

---

## Estados (por lote)

```text
Pendiente → Preparando → Emplatando → Finalizado
```

Opcional: Preparando → Finalizado (sin paso de emplatado).

Los estados pertenecen al **grupo de producción**, no a cada pedido individual.  
Si hay 26 raciones de pechuga, se marca una vez el lote.

---

## Persistencia

Tabla `kitchen_production_batches`:

- Unique `(tenant_id, delivery_date, dish_id)`
- Enum `kitchen_batch_status`: `pending | preparing | plating | finished`
- `started_at` / `finished_at` / `updated_by`
- Cada transición → `audit_log` (`entityType: kitchen_production_batch`, `action: status_change`)

Sin fila = estado efectivo `pending` (no se inventa progreso).

---

## Superficies

| Superficie | Contenido |
|------------|-----------|
| Workspace (`/admin/kitchen-execution`) | Lotes con raciones, alérgenos, prep time (si existe), clientes expandibles, personalizados, acciones de transición |
| Report (`/admin/production-sheet`) | Muestra el mismo `batchStatus` (lectura) |

Entrada: **Cocina** → «Ejecución» · enlace cruzado con Hoja de Producción.

---

## Fuera de alcance (no simular)

- Temporizadores artificiales / responsables no persistidos.
- Packaging, métricas de cocina, alertas de retraso (consumirán este mismo lote más adelante).
- Mutar estado de pedido individual desde este workspace (sigue siendo cola de pedidos).

---

## Definition of Done

Cocina puede gestionar el ciclo completo de producción por plato desde un workspace vivo, mientras la Hoja de Producción sigue siendo la representación imprimible de la misma información.
