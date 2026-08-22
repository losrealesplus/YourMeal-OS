# YOURMEAL OS — PRODUCT DESIGN 02-D
## ONE CANONICAL ORDER LIFECYCLE & AUTHORITY ARCHITECTURE

---

## 01 — The "One Canonical Order" Principle `[DECISIONES 8, 11, 18, 22]`

YourMeal OS prohíbe taxativamente la existencia de máquinas de estado paralelas o desacopladas entre departamentos comerciales y operacionales.

```text
                            ONE CANONICAL ORDER
                      (Único Objeto de Verdad Central)
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
CUSTOMER REPRESENTATION     TENANT REPRESENTATION     OPERATIONS REPRESENTATION
(Visión Simplificada &      (Control Comercial,       (Detalle de Elaboración,
 Autoservicio de Estado)     Auditoría & Finanzas)     Etiquetado & Logística)
```

* **Fuente de Verdad Única:** Todos los actores (Comensal, Admin, Cocinero, Empaquetador, Repartidor) leen y actúan sobre el **mismo pedido canónico**.
* **Historial Inmutable de Cambios (Sin Versionado Destructivo):** No se generan copias o versiones paralelas del pedido. Toda modificación actualiza la orden canónica y genera un registro inmutable en el historial (`Change History`), preservando valor anterior, valor nuevo, actor responsable, marca temporal y motivo.
* **Resolución de Concurrencia:** **El último cambio VÁLIDO Y AUTORIZADO determina el estado actual.** Un cambio no autorizado o inválido jamás sobrescribe el estado del pedido, y todos los cambios históricos permanecen intactos para auditoría y trazabilidad.

---

## 02 — Canonical Order Lifecycle & Contextual Representations `[DECISIÓN 8]`

El pedido transita por una secuencia unificada de 9 estados canónicos formalizados en `02-A` y `02-B`:

| Estado Canónico | Representación Comensal (`Customer`) | Representación Administración (`Tenant Admin`) | Representación Suelo Operativo (`Operations`) |
| :--- | :--- | :--- | :--- |
| **`draft`** | En confección en carrito multi-día | Carrito activo no confirmado | No visible en operaciones |
| **`confirmed`** | Pedido formalizado / Programado | Pedido confirmado pendiente de pago o validación | Visible en previsión de demanda (si está configurado) |
| **`in_production`**| En cocina / Preparando tu comida | En elaboración en cocina central | Lote activo en pantalla de Cocina (N1) |
| **`prepared`** | Comida cocinada / Empaquetando | Producido; en mesa de empaquetado | En checklist de mesa de Packing (N2) |
| **`ready_for_delivery`**| Listo para salida | Listo en almacén / Asignado a ruta | En estación de despacho y asignación de repartidor |
| **`out_for_delivery`** | Repartidor en camino | En ruta de entrega | Pedido activo en hoja de ruta de reparto |
| **`delivered`** | ¡Buen provecho! Entregado | Pedido completado con éxito | Entrega cerrada y firmada/confirmada |
| **`cancel_requested`** | Solicitud de cancelación enviada | Solicitud de baja pendiente de revisión | Alerta visual en cocina/packing de posible freno |
| **`cancelled`** | Pedido cancelado | Cancelado (con motivo y auditoría) | Retirado de lotes activos y marcado como anulado |

---

## 03 — Ownership & Authority Governance `[DECISIONES 1 A 10]`

```text
┌─────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ DIMENSIÓN DE AUTORIDAD  │ REGLA DE GOBERNANZA DE PRODUCTO                                        │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Autoridad Comercial** │ **El Tenant conserva la autoridad comercial** y puede delegar acciones │
│                         │ autorizadas a roles configurados. Define precios, políticas de cobro,  │
│                         │ menús y resolución final de peticiones o cancelaciones.                │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Autoridad Operativa** │ **Operaciones ejecuta dentro de su alcance autorizado.** Cocina avanza │
│                         │ lotes (`in_production` $\rightarrow$ `prepared`); no adquiere          │
│                         │ autoridad comercial sin delegación expresa del Tenant.                 │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Transferencia de      │ **Inmediata al formalizar.** Al confirmar el pedido, la                │
│ Responsabilidad**       │ responsabilidad pasa al Tenant y a los departamentos asignados.        │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Subordinación de la   │ **AUTOMATIZACIÓN $\neq$ DECISIÓN COMERCIAL AUTÓNOMA.** YourMeal OS     │
│ Automatización**        │ ejecuta flujos preautorizados por el Tenant; no toma decisiones solas. │
└─────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 04 — Modification Model: Request vs Direct Modification `[DECISIONES 21, 55 A 60]`

```text
                                 SOLICITUD DE MODIFICACIÓN
                                (Customer o Staff Intake)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             PEDIDO EN "CONFIRMED"                       PEDIDO EN "IN_PRODUCTION"
          (Antes de corte de cocina)                   (Cocina ya inició cocinado)
                       │                                           │
                       ▼                                           ▼
             RESOLUCIÓN AUTOMÁTICA                       REQUIERE APROBACIÓN TENANT
          (Si el Tenant lo preautorizó)                 (Tenant o rol delegado resuelve)
                       │                                           │
                       ├─────────────────────┬─────────────────────┤
                       ▼                                           ▼
                  [ APROBADA ]                                [ RECHAZADA ]
                       │                                           │
             • Actualiza orden canónica                  • Pedido mantiene estado actual
             • Registra cambio en historial inmutable    • Comensal recibe motivo
             • Actualiza Cocina (N1) y Packing (N2)      • Comensal puede solicitar otra opción
             • Notificación a comensal                   • Historial inmutable preservado
```

* **Comensal:** Siempre puede **solicitar una modificación**. Modifica directamente **únicamente cuando la configuración del Tenant preautoriza un flujo automático** (ej. antes de la hora de corte).
* **Tenant:** Conserva la autoridad comercial para aprobar o rechazar modificaciones, pudiendo delegar esta capacidad a roles autorizados.
* **Impacto Operativo Inmediato:** Toda modificación aprobada actualiza en tiempo real las cantidades agregadas en cocina y las tarjetas de cliente en packing.

---

## 05 — Cancellation Model: Request vs Actual Cancellation `[DECISIONES 48 A 54]`

```text
                                 SOLICITUD DE CANCELACIÓN
                                (Comensal siempre puede pedir)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          FLUJO DIRECTO PREAUTORIZADO                   REQUIERE EVALUACIÓN TENANT
        (Ej. `confirmed` antes de corte)              (Ej. `in_production` o posterior)
                       │                                           │
                       ▼                                           ▼
               ESTADO: "CANCELLED"                      ESTADO: "CANCEL_REQUESTED"
             (Resolución inmediata)                                │
                       │                                           ▼
                       │                                RESOLUCIÓN DEL TENANT
                       │                                (Aprueba baja o alternativa)
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             ▼
                               ESTADO FINAL: "CANCELLED"
                                             │
                       • Pedido JAMÁS se elimina de la base de datos
                       • Preservado en historial inmutable y auditoría
                       • Retirado de lotes activos en cocina/packing
```

* **Petición Universal vs Cancelación Directa:** El comensal **siempre puede solicitar la cancelación**. La transición directa a `cancelled` ocurre solo si la regla del Tenant lo preautoriza; de lo contrario, el pedido pasa a `cancel_requested` para resolución comercial del Tenant.
* **Invariante de Preservación Absoluta:** Un pedido cancelado **jamás se elimina del sistema**. Permanece en estado `cancelled` con atribución de autor, fecha y motivo para auditoría, contabilidad y métricas.
