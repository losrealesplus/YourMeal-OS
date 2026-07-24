# EP-002B · Operational Execution

**Estado:** Queued (tras o en paralelo controlado con EP-002A)  
**Tras:** [EP-001](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md) · preferible solapar solo tras Home sin humo  
**Cara:** Centro de Operaciones · OJ  
**Principio:** [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (DICT-071)

---

## Objetivo

Profundizar la **ejecución operativa diaria** (no dashboards decorativos): cocina, producción necesaria, rutas/entregas y cierre — siempre con datos reales o superficie oculta.

```text
Customer Experience (EP-002A)     Operational Execution (EP-002B)
        │                                    │
        └──────── same Order object ─────────┘
```

---

## Alcance

| Ítem | Pregunta | Nota |
|------|----------|------|
| Cocina | ¿La cola del día refleja pedidos reales y cambia estados? | Ya base en `/admin/kitchen` — cerrar huecos |
| Producción | ¿Hace falta planning/batch admin o basta cocina? | Solo activar `admin_module_production` si hay persistencia |
| Rutas | ¿El reparto opera sin mocks? | Preferir `/admin/delivery` real; rutas mock siguen FF OFF |
| Entregas | ¿Estados de entrega coherentes UI ↔ DB? | Misma spine de estados |
| Cierre operativo | ¿El pedido termina en delivered / issue documentado? | Evidencia FOPEBA |

---

## Fuera de alcance

- Inventario/contabilidad/promos admin (siguen FF OFF hasta datos reales).
- Rediseño de FOPEBA / ADR.
- Marketing senders.

---

## Relación con Milestone

Alimenta outcomes **Kitchen / Delivery / Operational Close** del [Milestone Pilot Ready](./MILESTONE_EATCLEAN_PILOT_READY.md).

---

## Definition of Done

- Journey operativo del día usable sin salir de la plataforma.
- Ningún workspace en nav con datos simulados.
- Intervenciones manuales (si las hay) registradas como evidencia (G-02.7).
