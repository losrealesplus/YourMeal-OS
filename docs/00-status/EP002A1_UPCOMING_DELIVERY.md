# EP-002A.1 · Próxima Entrega

**Estado:** Implemented (código)  
**Sprint:** [EP-002A](./EP002A_CUSTOMER_EXPERIENCE_COMPLETION.md)  
**Home:** `/app` · centro de información del cliente

---

## Objetivo

Responder en < 3 s: **¿Qué pasa con mi próximo pedido?**

---

## Arquitectura

```text
Home (UI)
   ↓
useUpcomingDelivery
   ↓
UpcomingDeliveryService.getForUser
   ↓
selectUpcomingDelivery (domain)
```

- Sin lógica de negocio en la tarjeta.
- Sin datos simulados.
- Franja horaria: solo si existe dato real (hoy `null` — no inventar).
- Cancelados / entregados excluidos; se elige el siguiente elegible por fecha.

---

## DoD

Usuario abre la app y, sin navegar, conoce: si hay pedido pendiente, cuándo, dónde, estado y siguiente acción.
