# YOURMEAL OS — PRODUCT DESIGN 02-D
## INTEGRATION CONTRACT v1.0 (FUNCTIONAL PRODUCT CONTRACT)

---

## 00 — PREÁMBULO DEL CONTRATO

El presente **Integration Contract v1.0** constituye el contrato formal de gobernanza funcional de YourMeal OS. Define las reglas de interacción, autoridad y flujo de datos entre los dominios de **Customer (02-A)**, **Operations (02-B)** y **Tenant Admin (02-C)**.

*Este contrato es estrictamente de diseño funcional y de producto. No define APIs técnicas, endpoints HTTP ni esquemas de persistencia.*

---

## 01 — CLÁUSULAS DEL CONTRATO DE INTEGRACIÓN

### CLÁUSULA 1: DOMINIOS Y FRONTERAS
* **1.1.** La plataforma se compone de cuatro dominios estancos: `Customer Domain`, `Tenant Management Domain`, `Operations Domain` y `Platform Super Admin Domain`.
* **1.2.** Cada dominio opera bajo el principio de mínimo privilegio y contexto encapsulado.

### CLÁUSULA 2: PROPIEDAD Y AISLAMIENTO DE TENANT
* **2.1.** El aislamiento entre Tenants es absoluto. Ningún usuario, comensal o staff puede cruzar la frontera de datos de otra organización.
* **2.2.** Un comensal puede poseer perfiles independientes en distintos Tenants asociados a su identidad global sin que exista cruce de información.

### CLÁUSULA 3: AUTORIDAD Y AUTONOMÍA EMPRESARIAL
* **3.1.** El Tenant conserva la máxima autoridad comercial sobre su negocio y puede delegar acciones operativas y comerciales a roles configurados.
* **3.2.** YourMeal OS jamás tomará decisiones comerciales autónomas (alterar precios, cancelar pedidos o cambiar menús) sin autorización previa del Tenant.

### CLÁUSULA 4: UN SOLO CICLO DE VIDA DE PEDIDO CANÓNICO
* **4.1.** Todos los actores interactúan con una única orden canónica central que transita por los 9 estados oficiales: `draft`, `confirmed`, `in_production`, `prepared`, `ready_for_delivery`, `out_for_delivery`, `delivered`, `cancel_requested`, `cancelled`.
* **4.2.** No existen estados desacoplados entre departamentos comerciales y operacionales.
* **4.3.** El último cambio VÁLIDO Y AUTORIZADO determina el estado actual del pedido; todos los cambios históricos anteriores se conservan de forma inmutable.

### CLÁUSULA 5: MODELO DE EVENTOS DE PRODUCTO
* **5.1.** Las transiciones de estado emiten eventos canónicos de producto (`ORDER_CREATED`, `PAYMENT_CONFIRMED`, `PRODUCTION_STARTED`, etc.).
* **5.2.** Los eventos disparan acciones requeridas del sistema y cadenas de automatización opcionales configuradas por el Tenant.

### CLÁUSULA 6: CADENAS DE AUTOMATIZACIÓN
* **6.1.** El Tenant puede configurar libremente las cadenas de automatización disponibles dentro del catálogo de capacidades y acciones soportadas por YourMeal OS.
* **6.2.** Los fallos en acciones secundarias no abortan las acciones principales ejecutadas con éxito.

### CLÁUSULA 7: CANALES Y VISIBILIDAD DE NOTIFICACIONES
* **7.1.** El canal de notificación por defecto es `IN-APP`. Canales adicionales (Push, Email, SMS, WhatsApp) son capacidades activables.
* **7.2.** Los eventos y alertas se filtran contextualmente según el rol y permisos de cada actor.

### CLÁUSULA 8: GESTIÓN DE INCIDENCIAS
* **8.1.** El modelo inicial de incidencias opera con los estados mínimos `OPEN` y `CLOSED`.
* **8.2.** Por defecto, las incidencias operativas no bloquean el flujo global salvo configuración explícita del Tenant.

### CLÁUSULA 9: CANCELACIÓN ASISTIDA Y UNIVERSAL
* **9.1.** El comensal siempre puede solicitar la cancelación.
* **9.2.** Pedidos con resolución automática preautorizada pasan a `cancelled`; pedidos que requieran revisión pasan a `cancel_requested` para resolución del Tenant. Los pedidos cancelados jamás se eliminan del sistema.

### CLÁUSULA 10: MODIFICACIÓN CON HISTORIAL INMUTABLE
* **10.1.** Toda modificación aprobada actualiza la orden canónica y registra una entrada en el historial inmutable de cambios (`Change History`), sin crear versiones paralelas de pedido.
* **10.2.** Las modificaciones aprobadas se propagan instantáneamente a las pantallas de Cocina (N1) y Packing (N2).

### CLÁUSULA 11: NEUTRALIDAD DE PAGOS Y COBROS
* **11.1.** La plataforma soporta la coexistencia de cobros manuales externos (Bizum/Transferencia) y pasarelas online integradas.
* **11.2.** Se mantiene la separación formal entre `Order Status` y `Payment Status`.

### CLÁUSULA 12: INTEGRACIONES EXTERNAS HOMOLOGADAS
* **12.1.** Las integraciones se gestionan a nivel de plataforma con ciclo de vida `INACTIVE`, `CONFIGURING`, `ACTIVE`, `ERROR`.
* **12.2.** Se aplican mecanismos de fallback ante la indisponibilidad de proveedores externos.

### CLÁUSULA 13: INTERCAMBIO CONTROLADO DE DATOS
* **13.1.** La transferencia de datos entre dominios se rige por el Contrato de Intercambio de Datos (`DEX-01` a `DEX-07`), restringiendo el paso de información sensible o irrelevante.

### CLÁUSULA 14: AUDITORÍA TRANSVERSAL OBLIGATORIA
* **14.1.** Toda acción relevante registra actor, cambio de estado, marca temporal y motivo justificado.
* **14.2.** Las sesiones de soporte técnico global (`Act as Tenant`) exigen motivo y quedan auditadas de forma inmutable.

### CLÁUSULA 15: TAXONOMÍA SAAS Y DEPENDENCIAS
* **15.1.** Las funcionalidades se clasifican estrictamente en `CORE`, `CAPABILITY` y `MODULE`.
* **15.2.** Las dependencias operativas entre módulos son transparentes y visibles para el Tenant.

### CLÁUSULA 16: ACCIONES TAXATIVAMENTE PROHIBIDAS
* **16.1.** Se aplican de forma obligatoria las restricciones de la Matriz de Acciones Prohibidas para Comensales, Operarios, Tenant Admins y la Plataforma.

### CLÁUSULA 17: TRAZABILIDAD EN REPORTES DE PRODUCCIÓN
* **17.1.** Los reportes descargables que representen unidades individuales de producción conservan la asociación *Unidad $\rightarrow$ Cliente $\rightarrow$ Nombre en reporte*.

### CLÁUSULA 18: RESPETO AL AXIOMA EATCLEAN
* **18.1.** EatClean opera como el Tenant Piloto #1 de YourMeal OS. Sus flujos particulares no constituyen una restricción arquitectónica para la plataforma general.
