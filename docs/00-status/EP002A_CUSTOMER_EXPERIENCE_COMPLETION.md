# EP-002A · Customer Experience Completion

**Estado:** Locked · Ready to start  
**Tras:** [EP-001 Functional Completeness](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md) ✅  
**Cara:** Customer App · CJ-001  
**Principio:** [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (DICT-071)  
**Pregunta del sprint:** ¿Qué necesita **saber** el cliente?

> No empezamos por pantallas.  
> Empezamos por el **Customer Weekly Cycle**.

---

## 1. Objetivo

Que el cliente sienta que la aplicación le **acompaña toda la semana**, no solo en el momento de pedir.

```text
Customer Weekly Cycle

Domingo / Lunes
        ↓
Nuevo menú disponible
        ↓
Explorar platos
        ↓
Elegir pedido
        ↓
Confirmar
        ↓
Pedido en preparación
        ↓
Pedido en reparto
        ↓
Pedido entregado
        ↓
Historial y favoritos
        ↓
Esperar nuevo menú
```

Toda la **Home** debe reflejar ese ciclo (Home dinámica según fase).

---

## 2. Prioridades (orden de ejecución)

### P1 · Próxima entrega *(cerrado — EP-002A.1)*

Cuando el cliente abre la app, la primera pregunta es:

> **¿Qué pasa con mi próximo pedido?**

La tarjeta debe responder con datos reales. Ver [EP002A1_UPCOMING_DELIVERY](./EP002A1_UPCOMING_DELIVERY.md).

### P2 · Historial + Repetir pedido *(cerrado — EP-002A.2)*

Reutilizar el pasado sin copiar a ciegas. Ver [EP002A2_REPEAT_ORDER](./EP002A2_REPEAT_ORDER.md).

### P3 · Favoritos

No solo una lista. Deben **ahorrar tiempo**:

- Repetir pedido (cuando aplique).
- Añadir al menú / pedido actual.
- Ver cuándo fue la última vez que lo pidió.
- Persistencia real o CTA oculto (DICT-071).

### P4 · Home dinámica

La Home **no es siempre igual**:

| Situación del cliente | Home destaca |
|----------------------|--------------|
| Aún no ha pedido esta semana | Menú semanal (CTA principal) |
| Ya confirmó | Próxima entrega |
| Inactivo semanas | Sugerir volver *(solo cuando exista motor de campañas; hasta entonces no inventar promo)* |

Confirmación post-pedido y estados visibles en detalle forman parte del mismo ciclo (sin pantallas decorativas).

---

## 3. Reglas

- Cero humo: lo visible funciona o se oculta ([DICT-071](../20-evidence-framework/09-operational-visibility-principle.md)).
- Mismos estados de pedido que Ops (una sola spine).
- No rediseño estético (ACT-001).
- No WhatsApp / Email senders (motor Communication ya modelado; envío = más adelante).
- Etiqueta UI puede seguir siendo familiar; dominio evolutivo = **Customer Success** en Admin (PR #42).

---

## 4. Fuera de alcance

- EP-002B (cocina · rutas · cierre operativo).
- Nuevos módulos admin.
- Campañas reales (solo hueco preparado; sin fake promo en Home).

---

## 5. Relación con Milestone / EP-002B

| Sprint | Pregunta |
|--------|----------|
| **EP-002A** (este) | ¿Qué necesita **saber** el cliente? |
| **[EP-002B](./EP002B_OPERATIONAL_EXECUTION.md)** | ¿Qué necesita **hacer** el equipo de EatClean? |

Alimenta el outcome **Weekly Experience** del [Milestone Pilot Ready](./MILESTONE_EATCLEAN_PILOT_READY.md).

---

## 6. Definition of Done

No se mide por pantallas completadas.

Se mide por esta pregunta:

> **¿Puede un cliente utilizar la aplicación durante una semana completa sin echar en falta información sobre su pedido?**

Si la respuesta es **sí** (y la Home refleja el Customer Weekly Cycle sin humo), EP-002A está terminado.

Checklist de apoyo (no sustituye la pregunta):

- [ ] Próxima entrega con datos reales o ausente de forma honesta  
- [ ] Favoritos útiles (repetir / añadir / última vez) o no visibles  
- [ ] Historial con detalle + repetir (real)  
- [ ] Home dinámica según fase del ciclo  
- [ ] Estados alineados con Ops  
