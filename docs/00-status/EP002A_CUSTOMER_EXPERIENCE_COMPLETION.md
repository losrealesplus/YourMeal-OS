# EP-002A · Customer Experience Completion

**Estado:** Ready to start  
**Tras:** [EP-001 Functional Completeness](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md) ✅  
**Cara:** Customer App · CJ-001  
**Principio:** [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (DICT-071)

---

## Objetivo

Completar las superficies **visibles al cliente final** que aún están parciales, para que el producto se sienta terminado sin abrir módulos nuevos.

> Primera tarea del bloque: **Home** — Favoritos · Próxima entrega.

---

## Alcance

| Ítem | Pregunta | Acción esperada |
|------|----------|-----------------|
| Favoritos | ¿Puedo guardar y recuperar platos que me gustan? | Persistencia real o ocultar CTA |
| Próxima entrega | ¿Cuándo llega mi pedido? | Ventana real desde pedido confirmado |
| Historial completo | ¿Qué pedí antes? | Lista + detalle con estados reales |
| Confirmaciones | ¿Sé que el pedido quedó hecho? | Confirmación clara post-CJ-001 |
| Estados del pedido | ¿En qué punto está mi pedido? | Mismos estados que Ops (sin humo) |

---

## Fuera de alcance

- WhatsApp / Email / Push senders (modelo ya en Customer Directory · Communications).
- Rediseño estético (ACT-001).
- Nuevos módulos admin.

---

## Relación con Milestone

Alimenta el outcome de **Weekly Experience** del [Milestone Pilot Ready](./MILESTONE_EATCLEAN_PILOT_READY.md) (Home viva + CJ-001 sin huecos visibles).

---

## Definition of Done

- Ningún CTA de Home promete una capacidad inexistente.
- Historial y estados leen pedidos reales del tenant.
- Cero humo en Customer App del alcance EP-002A.
