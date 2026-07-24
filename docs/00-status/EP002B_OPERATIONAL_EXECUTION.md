# EP-002B · Operational Execution

**Estado:** In progress (B.1·B.2 done · B.3 Packaging queued)  
**Tras:** [EP-001](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md) · [EP-002A](./EP002A_CUSTOMER_EXPERIENCE_COMPLETION.md)  
**Cara:** Centro de Operaciones · OJ  
**Principio:** [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (DICT-071)  
**Patrón:** [Operational Representation](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) (DICT-072)  
**Pregunta del sprint:** ¿Qué necesita **hacer** el equipo de EatClean?

---

## 1. Objetivo

Profundizar la **ejecución operativa diaria** (no dashboards decorativos): cocina, producción necesaria, rutas/entregas y cierre — siempre con datos reales o superficie oculta.

```text
EP-002A · ¿Qué necesita saber el cliente?
                │
                │  same Order object
                │
EP-002B · ¿Qué necesita hacer el equipo?
```

Esa separación (Customer Experience vs Operational Execution) es intencional y permanente.

---

## 2. Alcance

| Ítem | Pregunta | Nota |
|------|----------|------|
| Cocina | ¿La cola del día refleja pedidos reales y cambia estados? | Base en `/admin/kitchen` — cerrar huecos |
| **Hoja de Producción** | ¿Cocina puede trabajar el día sin hoja manual? | [EP-002B.1](./EP002B1_PRODUCTION_REPORT.md) — Report via `ProductionReportService` |
| **Kitchen Execution** | ¿Cocina ve y avanza el estado de cada lote ahora? | [EP-002B.2](./EP002B2_KITCHEN_EXECUTION.md) — Workspace; mismos datos que el Report |
| **Packaging** | ¿Qué hay que empaquetar y en qué estado está? | [EP-002B.3](./EP002B3_PACKAGING.md) — siguiente; mismo patrón Service → Report / Workspace |
| Producción (batch) | ¿Hace falta planning/batch admin o basta cocina + hoja? | Solo activar `admin_module_production` si hay persistencia |
| Rutas / Delivery | ¿El reparto opera sin mocks? | EP-002B.4; preferir `/admin/delivery` real |
| Entregas | ¿Estados de entrega coherentes UI ↔ DB? | Misma spine que ve el cliente en EP-002A |
| Cierre operativo | ¿El pedido termina en delivered / issue documentado? | Evidencia FOPEBA |

---

## 3. Fuera de alcance

- Inventario/contabilidad/promos admin (FF OFF hasta datos reales).
- Rediseño de FOPEBA / ADR.
- Marketing senders.
- Rediseño de la Customer App (pertenece a EP-002A).

---

## 4. Relación con Milestone

Alimenta outcomes **Kitchen / Delivery / Operational Close** del [Milestone Pilot Ready](./MILESTONE_EATCLEAN_PILOT_READY.md).

---

## 5. Definition of Done

> **¿Puede el equipo de EatClean producir y entregar los pedidos de la semana sin salir de YourMeal OS y sin inventar estados?**

Apoyo:

- Journey operativo del día usable en plataforma.
- Ningún workspace en nav con datos simulados.
- Intervenciones manuales registradas como evidencia (G-02.7).
- Estados visibles al cliente (EP-002A) = estados que Ops muta aquí.
