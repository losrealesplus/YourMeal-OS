# YOURMEAL OS — PRODUCT DESIGN 02-D
## AUTHORITATIVE PRODUCT DECISION LOG (100 DECISIONS TRACEABILITY)

---

## 01 — Decision Register by Category (Decisiones 1 a 100)

### BLOQUE A: OWNERSHIP & AUTHORITY (Decisiones 1 a 10)
* **D01 `[LOCKED]`:** La titularidad del pedido varía según su estado; el Tenant siempre conserva la autoridad comercial y puede delegar acciones autorizadas a roles configurados.
* **D02 `[LOCKED]`:** La responsabilidad del pedido se transfiere inmediatamente al crearse.
* **D03 `[LOCKED]`:** Los permisos de modificación de operaciones son configurables por Tenant.
* **D04 `[LOCKED]`:** La autoridad del Tenant sobre modificaciones es configurable.
* **D05 `[LOCKED]`:** Las capacidades de modificación del Tenant son configurables.
* **D06 `[LOCKED]`:** La autoridad del estado comercial del pedido es configurable.
* **D07 `[LOCKED]`:** La autoridad del estado operativo reside en Operaciones + automatización + configuración del Tenant.
* **D08 `[LOCKED]`:** Se prohíben máquinas de estado paralelas. Se establece **Un Solo Ciclo de Vida Canónico de Pedido** con representaciones contextuales para Comensal, Tenant y Operaciones.
* **D09 `[LOCKED]`:** El comensal ve las actualizaciones de estado de inmediato por defecto, sujeto a configuración del Tenant.
* **D10 `[LOCKED]`:** El flujo de modificación y cancelación del comensal es configurable a nivel de plataforma y Tenant.

---

### BLOQUE B: ORDER SOURCE OF TRUTH (Decisiones 11 a 18)
* **D11 `[LOCKED]`:** Un Solo Pedido Canónico + Historial Completo de Cambios (sin creación de versiones paralelas de orden).
* **D12 `[LOCKED]`:** En caso de rechazo de cambio, el comensal recibe el motivo y puede solicitar alternativas (EatClean) / configurable (YourMeal OS).
* **D13 `[LOCKED]`:** La autoridad para confirmar pagos puede recaer en el Tenant, la Pasarela o la Automatización.
* **D14 `[LOCKED]`:** Modelo de pago externo EatClean: Comensal formaliza $\rightarrow$ Pago externo $\rightarrow$ Comprobante opcional $\rightarrow$ Staff verifica y confirma.
* **D15 `[LOCKED]`:** Los pagos integrados pueden disparar acciones downstream si el Tenant lo configuró/autorizó.
* **D16 `[LOCKED]`:** Operaciones recibe los pedidos confirmados automáticamente por defecto (con soporte para importación asistida).
* **D17 `[LOCKED]`:** Las modificaciones de pedido aprobadas actualizan las pantallas de Operaciones automáticamente.
* **D18 `[LOCKED]`:** Comensal, Tenant y Operaciones comparten la misma fuente de verdad canónica.

---

### BLOQUE C: TENANT AUTHORITY & GOVERNANCE (Decisiones 19 a 26)
* **D19 `[LOCKED]`:** Notificaciones regidas por valores por defecto de plataforma + configuración del Tenant.
* **D20 `[LOCKED]`:** Mínimo de notificaciones Core + capacidades/módulos adicionales activables.
* **D21 `[LOCKED]`:** Si el comensal solicita modificación mientras el pedido está en producción, se requiere aprobación del Tenant.
* **D22 `[LOCKED]`:** En caso de modificación concurrente entre Tenant y Comensal, el último cambio VÁLIDO Y AUTORIZADO determina el estado actual, pero todos los cambios previos se conservan en el historial inmutable.
* **D23 `[LOCKED]`:** Si Operaciones no puede cumplir una orden, levanta una incidencia; el Tenant toma la decisión comercial final.
* **D24 `[LOCKED]`:** El Tenant es el orquestador del negocio; la automatización no sustituye su autoridad.
* **D25 `[LOCKED]`:** YourMeal OS jamás toma decisiones comerciales autónomas sin autorización previa.
* **D26 `[LOCKED]`:** Principio rector: *"YourMeal OS nunca toma decisiones comerciales por un Tenant sin autorización"* (**Automatización $\neq$ Decisión Autónoma**).

---

### BLOQUE D: AUDIT & ACTORS (Decisiones 27 y 28)
* **D27 `[LOCKED]`:** Todo cambio relevante registra el actor que lo ejecutó (`Customer`, `Tenant Admin`, `Operario`, `Automatización`, `Integración`).
* **D28 `[LOCKED]`:** Los motivos de cambio son configurables por tipo de operación.

---

### BLOQUE E: MULTI-TENANT ISOLATION (Decisiones 29 a 31)
* **D29 `[LOCKED]`:** El aislamiento multitenant entre organizaciones es absoluto.
* **D30 `[LOCKED]`:** Un mismo comensal puede pertenecer a varios Tenants manteniendo perfiles, carritos y pedidos 100% aislados.
* **D31 `[LOCKED]`:** La desactivación de un comensal en el Tenant A solo revoca su acceso en dicho Tenant.

---

### BLOQUE F: EVENT MODEL & AUTOMATION (Decisiones 32 a 36)
* **D32 `[LOCKED]`:** Modelo conceptual de eventos de producto (`ORDER_CREATED`, `PAYMENT_CONFIRMED`, `PRODUCTION_STARTED`, etc.).
* **D33 `[LOCKED]`:** Un evento puede disparar múltiples acciones requeridas u opcionales.
* **D34 `[LOCKED]`:** *"El Tenant puede configurar libremente las cadenas de automatización disponibles dentro del catálogo de capacidades y acciones soportadas por YourMeal OS."*
* **D35 `[LOCKED]`:** Una misma acción puede ser disparada por distintos eventos.
* **D36 `[LOCKED]`:** Fallo en automatización: las acciones exitosas previas se conservan; solo se reintenta la fallida y se genera incidencia.

---

### BLOQUE G: ORDER CREATION & INCIDENTS (Decisiones 37 a 47)
* **D37 `[LOCKED]`:** La creación de pedido emite `ORDER_CREATED` por defecto.
* **D38 `[LOCKED]`:** Los pedidos pueden existir sin pago previo (requisito configurable; EatClean soporta cobro externo posterior).
* **D39 `[LOCKED]`:** Notificación al Tenant tras creación es configurable.
* **D40 `[LOCKED]`:** Operaciones no requiere un objeto de tarea separado por pedido; opera sobre la orden canónica.
* **D41 `[LOCKED]`:** Operaciones puede iniciar producción antes de la aprobación del Tenant si está preconfigurado.
* **D42 `[LOCKED]`:** Si el Tenant permite preparación antes del pago, Operaciones puede comenzar.
* **D43 `[LOCKED]`:** Alerta/escalado interno si una acción del Tenant permanece pendiente demasiado tiempo.
* **D44 `[LOCKED]`:** Las incidencias son objetos independientes cuando corresponde.
* **D45 `[LOCKED]`:** Modelo mínimo de incidencias: `OPEN` y `CLOSED`.
* **D46 `[LOCKED]`:** Las incidencias no son bloqueantes por defecto salvo configuración explícita.
* **D47 `[LOCKED]`:** La resolución de una incidencia puede reanudar automáticamente el flujo operativo.

---

### BLOQUE H: CANCELLATION RULES (Decisiones 48 a 54)
* **D48 `[LOCKED]`:** Cancelación: El comensal siempre puede solicitar cancelación; pasa a `cancelled` si está preautorizado automáticamente, o a `cancel_requested` si requiere revisión del Tenant.
* **D49 `[LOCKED]`:** Si el pedido ya está en producción, el Tenant decide la resolución comercial.
* **D50 `[LOCKED]`:** Notificación al comensal sobre cancelación es configurable.
* **D51 `[LOCKED]`:** Si Operaciones no puede cumplir un pedido, el Tenant toma la decisión comercial final.
* **D52 `[LOCKED]`:** Los pedidos cancelados **jamás se eliminan**; se conservan en estado `cancelled` para historial.
* **D53 `[LOCKED]`:** El registro de motivo de cancelación es configurable/obligatorio.
* **D54 `[LOCKED]`:** Se distingue formalmente entre `cancel_requested` y `cancelled`.

---

### BLOQUE I: MODIFICATION RULES (Decisiones 55 a 60)
* **D55 `[LOCKED]`:** Reglas diferenciadas según el tipo de modificación (platos, fechas, franjas, direcciones).
* **D56 `[LOCKED]`:** Las reglas de modificación son configurables por el Tenant; el comensal puede solicitar cambios libremente pero la modificación directa depende de preautorización.
* **D57 `[LOCKED]`:** Si un cambio no es viable, Tenant y Operaciones proponen alternativas al cliente.
* **D58 `[LOCKED]`:** Las modificaciones aprobadas se propagan inmediatamente a las pantallas de Operaciones.
* **D59 `[LOCKED]`:** Si Operaciones ya comenzó a cocinar, el comportamiento depende del estado y la regla del Tenant.
* **D60 `[LOCKED]`:** Toda modificación permanece en el historial inmutable sin sobrescrituras destructivas ni versionado paralelo.

---

### BLOQUE J: NOTIFICATIONS & CHANNELS (Decisiones 61 a 70)
* **D61-D66 `[LOCKED]`:** Eventos disparan múltiples acciones y cadenas de automatización dentro del catálogo soportado.
* **D67 `[LOCKED]`:** Fallo de notificación: reintento selectivo e incidencia opcional sin abortar la orden.
* **D68 `[LOCKED]`:** Prioridad de notificaciones configurable.
* **D69 `[LOCKED]`:** Canal por defecto `IN-APP`. Canales adicionales opcionales (Push, Email, SMS, WhatsApp).
* **D70 `[LOCKED]`:** Filtrado estricto de visibilidad de eventos por rol, permisos y contexto de sede.

---

### BLOQUE K: EXTERNAL INTEGRATIONS (Decisiones 71 a 80)
* **D71 `[LOCKED]`:** Integraciones modeladas como Capabilities o Modules según su alcance.
* **D72 `[LOCKED]`:** Framework genérico de integraciones (Pagos, Notificaciones, Logística, Contabilidad, CRM).
* **D73 `[LOCKED]`:** Activación gestionada por YourMeal OS con parametrización autorizada del Tenant.
* **D74 `[LOCKED]`:** Ciclo de vida conceptual: `INACTIVE`, `CONFIGURING`, `ACTIVE`, `ERROR`.
* **D75-D77 `[LOCKED]`:** Fallbacks automáticos configurados ante indisponibilidad de proveedores externos.
* **D78 `[LOCKED]`:** Monitorización de salud y estado de integraciones por plataforma.
* **D79-D80 `[LOCKED]`:** Flujo bidireccional de eventos entre YourMeal OS y servicios de terceros.

---

### BLOQUE L: CORE / CAPABILITY / MODULE & REPORTING (Decisiones 81 a 90)
* **D81 `[LOCKED]`:** Definición de YourMeal OS Core (Identidad, Aislamiento, Permisos, Auditoría, Pedido Canónico, Eventos, Automatización, Notificaciones, Framework de Integración).
* **D82-D85 `[LOCKED]`:** Definición y desacoplamiento de Capabilities y Modules.
* **D86-D87 `[LOCKED]`:** Transparencia y visibilidad de dependencias entre capacidades.
* **D88-D90 `[LOCKED]`:** Reportes base de plataforma, reportes configurables por Tenant y regla de trazabilidad en *Production Master* (*Unidad $\rightarrow$ Cliente $\rightarrow$ Nombre en reporte*).

---

### BLOQUE M: AUDIT & HISTORY ACCESS (Decisiones 91 a 95)
* **D91-D95 `[LOCKED]`:** Modelo universal de auditoría con visibilidad segmentada (Comensal ve sus compras, Operario ve su turno, Tenant Admin ve la organización completa).

---

### BLOQUE N: DATA EXCHANGE CONTRACT (Decisión 96)
* **D96 `[LOCKED]`:** Formalización del Contrato de Intercambio de Datos (`DEX-01` a `DEX-07`).

---

### BLOQUE O: FORBIDDEN ACTIONS (Decisión 97)
* **D97 `[LOCKED]`:** Definición taxativa de acciones prohibidas por actor y dominio.

---

### BLOQUE P: CROSS-SYSTEM RESPONSIBILITY MATRIX (Decisión 98)
* **D98 `[LOCKED]`:** Matriz canónica de responsabilidades (`ALLOWED`, `CONDITIONAL`, `FORBIDDEN`).

---

### BLOQUE Q: INTEGRATION CONTRACT v1.0 (Decisión 99)
* **D99 `[LOCKED]`:** Formalización de las 18 cláusulas del Contrato de Integración Funcional v1.0.

---

### BLOQUE R: DELIVERABLES (Decisión 100)
* **D100 `[LOCKED]`:** Entrega de la suite completa de documentos de Product Design 02-D bajo la estructura oficial.
