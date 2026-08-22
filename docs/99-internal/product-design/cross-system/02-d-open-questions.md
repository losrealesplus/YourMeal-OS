# YOURMEAL OS — PRODUCT DESIGN 02-D
## NON-BLOCKING OPEN QUESTIONS & FUTURE INPUT

---

## 00 — OPEN QUESTIONS STATUS

Las preguntas listadas a continuación constituyen temas de refinamiento funcional para fases posteriores de diseño y roadmap. **No bloquean el cierre oficial del diseño de producto 02-D**.

---

### OQ-INT-01: Políticas de Reintento Avanzadas en Automatizaciones Externas
* **Descripción:** Definir si los reintentos ante caídas de proveedores externos de mensajería (SMS/WhatsApp) aplican backoff exponencial automático o requieren intervención del Tenant.
* **Estado:** `NON-BLOCKING`
* **Impacto:** Resiliencia de canales de comunicación secundarios.
* **Propietario de Decisión:** Technical Design / Integration Architecture.

---

### OQ-INT-02: Programación de Generación de Reportes Periódicos
* **Descripción:** Determinar si los reportes automáticos de cierre de jornada se envían por correo al Tenant Admin a una hora fija o se generan bajo demanda al cerrar cocina.
* **Estado:** `NON-BLOCKING`
* **Impacto:** Flujo de trabajo administrativo de cierre diario.
* **Propietario de Decisión:** Tenant Admin Phase 03 / Operations Phase 03.

---

### OQ-INT-03: Algoritmo de Fallback en Pasarelas de Pago Multi-Proveedor
* **Descripción:** Si un Tenant tiene activas dos pasarelas (ej. Stripe y Redsys), definir si el fallo de una activa automáticamente la otra o solicita al usuario seleccionar método alternativo.
* **Estado:** `NON-BLOCKING`
* **Impacto:** Tasa de conversión de cobros online.
* **Propietario de Decisión:** Payments Module Design.
