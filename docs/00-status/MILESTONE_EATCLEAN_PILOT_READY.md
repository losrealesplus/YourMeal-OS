# Milestone · EatClean Pilot Ready

**Estado:** 🟡 **Abierto** (definido · no consumado)  
**Knowledge Lifetime:** Iteration *(definición del hito; al cerrarse queda inmutable)*  
**Tenant:** EatClean  
**Criterio único de aceptación:** ver § Criterio de piloto  
**No es:** un PR de UI · un ADR · un reemplazo de ORR/FOV

> La fase de **identidad y experiencia base** (#24→#29) se considera **cerrada**.  
> A partir de aquí el foco no es «cómo se ve la app», sino **demostrar el ciclo operativo completo con datos reales**.

---

## 1. Objetivo

Demostrar que **Customer App** y **Centro de Operaciones** funcionan como dos caras de una misma operación real sobre YourMeal OS.

```text
Customer Journey
        ↓
Operational Objects
        ↓
Operational Journey
        ↓
Outcome
```

FOPEBA deja de validar solo objetos aislados y demuestra **experiencias operacionales de extremo a extremo**.

---

## 2. Criterio de piloto (Definition of Done del milestone)

Una persona que **nunca** ha usado la aplicación debe poder:

1. descubrir el menú de la semana;
2. elegir sus platos;
3. confirmar el pedido;
4. recibir la confirmación;

…mientras el equipo de EatClean, desde el **Centro de Operaciones**, puede **producir y entregar** ese mismo pedido **sin salir de la misma plataforma**.

Si eso ocurre, el primer tenant ya no es un prototipo: está **listo para un piloto real**.

---

## 3. Entregables (EP)

| ID | Nombre | Pregunta | Cara |
|----|--------|----------|------|
| [EP-01](#ep-01--weekly-experience) | Weekly Experience | ¿El cliente completa un pedido real? | Customer App · CJ-001 |
| [EP-02](#ep-02--kitchen-operations) | Kitchen Operations | ¿La cocina recibe exactamente ese pedido? | OJ · Workspace Cocina |
| [EP-03](#ep-03--delivery-operations) | Delivery Operations | ¿El reparto recibe la ruta correspondiente? | OJ · Workspace Reparto |
| [EP-04](#ep-04--operational-close) | Operational Close | ¿El pedido queda entregado y cerrado? | OJ · cierre de jornada |

Los cuatro son necesarios. Ninguno sustituye a ORR/FOV: se **alinean** con la línea operativa (Smoke → ORR → FOV) y la línea de experiencia (contenido vivo + observación).

---

### EP-01 · Weekly Experience

**Outcome:** pedido confirmado con menú real del Tenant.

- Menú semanal con nombres · fotografías · macros reales (`tenants/eatclean/weekly-menu/` + catálogo)  
- Home viva (próxima entrega con ventana, promoción semanal si aplica, favoritos cuando existan)  
- Flujo CJ-001 completo sin ayuda  

Refs: [CUSTOMER_JOURNEYS · CJ-001](../07-experience/CUSTOMER_JOURNEYS.md#cj-001--pedido-semanal) · [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md)

---

### EP-02 · Kitchen Operations

**Outcome:** el pedido confirmado es visible y accionable en producción.

- Entrada por Centro de Operaciones → Workspace Cocina  
- Lista / plan del día refleja el pedido del cliente  
- OJ-001 (iniciar producción) viable con ese dato  

Refs: [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md) · `/admin/production`

---

### EP-03 · Delivery Operations

**Outcome:** existe ruta / paradas coherentes con el pedido.

- Workspace Reparto  
- Asignación o visibilidad de ruta para la entrega programada  
- OJ-002 viable  

Refs: [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md) · `/admin/routes`

---

### EP-04 · Operational Close

**Outcome:** el pedido pasa a entregado / cerrado en la plataforma.

- Estado de entrega actualizado  
- Cliente y operación comparten el mismo outcome  
- Cierre de jornada (OJ-004) al menos en su forma mínima de piloto  

---

## 4. Qué ya está cerrado (no reabrir como “UI PR”)

Bloque #24→#29 — identidad y experiencia base:

* SaaS ↔ Tenant (ADR 0014)  
* Identidad visual EatClean  
* Experience First · CJ / OJ  
* Centro de Operaciones como entrada del equipo  
* Documentación con [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md)  

Bitácora: [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md).

---

## 5. Relación con la línea operativa FOPEBA

| Línea | Pregunta | Artefactos |
|-------|----------|------------|
| Operativa | ¿Hay evidencia para ORR / FOV? | Smoke · ORR · FOV-001 |
| Piloto (este milestone) | ¿El ciclo cliente→entrega funciona de punta a punta? | EP-01…EP-04 |

No compiten. El piloto **necesita** datos reales y operación; ORR/FOV **autorizan** y **aprenden** del campo.  
Un EP puede generar observaciones útiles para FOV; no salta el Evidence Gate.

---

## 6. Gobernanza de PRs

A partir de la apertura de este milestone:

* Preferir PRs etiquetados `EP-0x` (o equivalentes) frente a PRs genéricos «UI».  
* Iteration docs nuevos = bitácoras por EP, no reescritura del Contract.  
* Al completar los cuatro EP + criterio §2 → fila en [MILESTONES](./MILESTONES.md) y este acta pasa a **Cerrado**.

---

## 7. Referencias

- [CURRENT_PHASE](./CURRENT_PHASE.md)  
- [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md)  
- [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md)  
- [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md)  
- [PROJECT_DOMAINS](./PROJECT_DOMAINS.md)
