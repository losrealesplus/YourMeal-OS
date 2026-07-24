# EP-002B.3 · Packaging

**Estado:** Queued (**después** de [RI-001 Readiness](./RI001_READINESS_SPRINT.md))  
**Cara:** Centro de Operaciones · Empaquetado  
**Patrón:** [Operational Representation Pattern (DICT-072)](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md)  
**Principio:** [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (DICT-071)  
**Pregunta:** ¿Qué hay que **empaquetar** ahora, y en qué estado está cada unidad / lote listo?

---

## Prioridad

No implementar Packaging mientras el sprint de Readiness esté abierto.

Orden:

```text
Cerrar PRs #45–#49 → Completeness · Cero humo · RBAC · E2E → Release Review
        → iniciar RI-001
        → (luego) EP-002B.3 Packaging · EP-002B.4 Delivery
```

El patrón Service → Report / Workspace ya está listo para reutilizar cuando toque.

---

## Por qué ahora

Kitchen Execution cierra *cocinar*. El siguiente eslabón natural es *empaquetar* antes de *repartir*:

```text
Pedidos
  → Kitchen Queue
  → Kitchen Execution
  → Packaging Workspace   ← EP-002B.3
  → Delivery Workspace
  → Entrega
```

Cada fase consume la salida de la anterior. Sin modelo paralelo.

---

## Arquitectura objetivo

```text
Lotes finalizados / cola empaquetable
        │
PackagingService
        │
        ├── Report  → Hoja / manifiesto de empaquetado
        └── Workspace → Packaging (acciones vivas)
```

Reutilizar el patrón de cocina:

- Un Service.
- Un Report documental.
- Un Workspace interactivo.
- Estados en un agregado de **ejecución de empaquetado**, no 26 estados por ración si el trabajo real es por unidad/cliente/parada (decidir el agregado con evidencia de cómo trabaja EatClean; no inventar).

---

## Principios de diseño

1. **No Artificiality / DICT-071** — sin CTAs, tiempos ni responsables simulados.
2. **No segundo modelo de pedidos** — Packaging lee la misma realidad operativa (pedidos + lotes de cocina cuando aplique).
3. **Auditoría** — cada transición de estado → `audit_log`.
4. **Dependencia de Kitchen Execution** — preferir empaquetar lo que cocina ha marcado `finished` (o regla explícita documentada si se permite solape).

---

## Alcance tentativo (a confirmar en implementación)

| Incluye | Excluye (por ahora) |
|---------|---------------------|
| Workspace de empaquetado del día | Inventario / stock automático |
| Report imprimible de lo a empaquetar | Labels fancy sin persistencia |
| Estados de lote/unidad de empaque | Delivery completo (EP-002B.4) |
| Enlace desde Cocina / Ops | KPIs decorativos |

---

## Definition of Done (borrador)

El equipo de empaquetado puede ver qué está listo para empacar, avanzar estados reales desde un Workspace, e imprimir un Report coherente con el mismo Service — sin duplicar la verdad de cocina ni inventar datos.

---

## Dependencias

- [EP-002B.2 Kitchen Execution](./EP002B2_KITCHEN_EXECUTION.md) ✅
- Migración `kitchen_production_batches` aplicada en el entorno (ver checklist en EP-002B.2)
- Clarificar con Ops el agregado real de empaquetado (por pedido, por cliente, por plato, por parada)
