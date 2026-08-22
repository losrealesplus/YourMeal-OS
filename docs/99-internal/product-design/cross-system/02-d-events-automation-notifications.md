# YOURMEAL OS — PRODUCT DESIGN 02-D
## EVENT MODEL, AUTOMATION CHAINS & NOTIFICATIONS ARCHITECTURE

---

## 01 — Conceptual Product Event Model `[DECISIONES 32 A 36]`

Los cambios relevantes en el estado de negocio y operativo de YourMeal OS se representan conceptualmente como **Eventos de Producto**.

```text
                  BUSINESS / OPERATIONAL ACTION
                               │
                               ▼
                    CONCEPTUAL PRODUCT EVENT
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   REQUIRED SYSTEM ACTIONS             OPTIONAL AUTOMATION CHAINS
(Audit log, state progression)       (Tenant-configured actions)
```

### Catálogo de Eventos Canónicos de Producto `[LOCKED]`
1. **`ORDER_CREATED`:** El comensal o staff formaliza una nueva orden.
2. **`ORDER_MODIFICATION_REQUESTED`:** Se solicita un cambio en un pedido confirmado.
3. **`ORDER_MODIFICATION_APPROVED`:** El Tenant aprueba formalmente la modificación.
4. **`ORDER_MODIFICATION_REJECTED`:** El Tenant deniega la modificación con motivo.
5. **`PAYMENT_CONFIRMED`:** El pago es validado (manualmente por staff o vía pasarela).
6. **`ORDER_RELEASED_TO_OPERATIONS`:** El pedido se envía a la cola activa de cocina.
7. **`PRODUCTION_STARTED`:** Cocina inicia la elaboración del lote (`in_production`).
8. **`ORDER_READY`:** Packing finaliza el empaquetado de raciones (`ready_for_delivery`).
9. **`OUT_FOR_DELIVERY`:** El repartidor inicia la entrega en ruta.
10. **`ORDER_DELIVERED`:** El pedido se entrega satisfactoriamente al cliente.
11. **`CANCEL_REQUESTED`:** Se solicita la cancelación de un pedido en curso.
12. **`CANCELLED`:** El pedido es formalmente cancelado con motivo registrado.
13. **`INCIDENT_CREATED`:** Operaciones o staff abre una incidencia de producción/reparto.
14. **`INCIDENT_RESOLVED`:** La incidencia es cerrada tras resolución del Tenant.

---

## 02 — Automation Chains & Governance Principle `[DECISIONES 24, 25, 26, 34, 66]`

### Principio Rector de Automatización `[LOCKED]`
> *"YourMeal OS jamás toma decisiones comerciales por un Tenant sin su autorización previa."*
> **AUTOMATIZACIÓN $\neq$ DECISIÓN COMERCIAL AUTÓNOMA.**

La plataforma ejecuta acciones automatizadas **únicamente cuando el Tenant las ha preautorizado mediante configuración**.

### Contrato de Automatización Configurable `[LOCKED]`
> *"El Tenant puede configurar libremente las cadenas de automatización disponibles dentro del catálogo de capacidades y acciones soportadas por YourMeal OS."*

* **Relación N a N (Eventos y Acciones):** Un evento puede disparar múltiples acciones simultáneas (ej. `PAYMENT_CONFIRMED` $\rightarrow$ libera a cocina + emite notificación al comensal + genera apunte contable); y una misma acción puede ser disparada por distintos eventos.
* **Tolerancia a Fallos Parciales `[DECISIÓN 36]`:** Si una acción secundaria falla (ej. error en el envío de un SMS), las acciones previas ejecutadas con éxito se preservan. Solo se reintenta la acción fallida y se genera una alerta/incidencia interna sin abortar la transacción principal.

---

## 03 — Notification Architecture & Channels `[DECISIONES 19, 20, 61 A 70]`

```text
┌────────────────────────────────────────────────────────────────────────┐
│ CANALES DE NOTIFICACIÓN                                                │
├────────────────────────────────────────────────────────────────────────┤
│ • **Canal por Defecto (Core):** **IN-APP** (Notificaciones en interfaz)│
│ • **Canales Opcionales / Módulos:** Push móvil, Email, SMS, WhatsApp   │
└────────────────────────────────────────────────────────────────────────┘
```

### Reglas de Visibilidad y Filtrado por Rol `[DECISIÓN 70]`
Cada actor recibe **únicamente las notificaciones y eventos pertinentes a su rol, sede y contexto**:
1. **Comensal:** Avisos sobre el estado de su pedido (`Confirmado`, `En camino`, `Entregado`, `Cambio Aprobado/Rechazado`).
2. **Cocinero / Packing:** Avisos sobre lotes a preparar, raciones especiales y alertas de pedidos cancelados o modificados en tiempo real.
3. **Tenant Admin:** Alertas de cobros pendientes de validar, solicitudes de modificación de clientes e incidencias de suelo de cocina.
4. **Seguridad de Datos:** La carga completa de un evento interno nunca se expone íntegra a un actor sin los permisos correspondientes.
