# YOURMEAL OS — PRODUCT DESIGN 02-D
## CROSS-SYSTEM BUSINESS FLOWS SPECIFICATION

---

## 01 — End-to-End Cross-System Flows

### FLOW E2E-01: Standard Order & Execution Pipeline `[LOCKED]`
1. **Comensal (Customer Domain):** Selecciona sus platos por día en el menú semanal $\rightarrow$ Introduce dirección y franja $\rightarrow$ Confirma pedido (`status: confirmed`).
2. **Sistema (Event Engine):** Emite el evento `ORDER_CREATED` $\rightarrow$ Enruta el pedido al contexto del Tenant.
3. **Administración (Tenant Domain):** El pedido aparece en el libro maestro de órdenes. Si está configurado pago externo (Bizum/Transferencia), pasa a revisión. Si es pago online o validación automática preautorizada, pasa a `status: confirmed` liberado.
4. **Cocina (Operations Domain — N1):** En la fecha de preparación, las raciones del pedido se consolidan automáticamente en la demanda agregada de cocina $\rightarrow$ El cocinero inicia el lote (`status: in_production`) $\rightarrow$ Al finalizar la cocción pulsa `[ Lote Producido ]` (`status: prepared`).
5. **Mesa de Packing (Operations Domain — N2):** El operario de packing visualiza la tarjeta del cliente con sus platos individuales y alérgenos $\rightarrow$ Empaqueta las raciones $\rightarrow$ Verifica $\rightarrow$ Marca como listo (`status: ready_for_delivery`).
6. **Reparto (Operations Domain):** El repartidor asignado inicia la ruta (`status: out_for_delivery`) $\rightarrow$ Entrega al comensal $\rightarrow$ Registra entrega completada (`status: delivered`).
7. **Comensal:** Visualiza la actualización instantánea en su móvil *"¡Comida entregada!"*.

---

### FLOW E2E-02: External Payment Verification Flow (EatClean Model) `[LOCKED]`
1. **Comensal:** Tras formalizar el pedido, visualiza las instrucciones de pago (Bizum / Cuenta bancaria) $\rightarrow$ Adjunta captura del comprobante en la WebApp.
2. **Sistema:** Registra `payment_status = pending_verification` y emite notificación al panel de cobros del Tenant.
3. **Staff / Rol Autorizado:** Revisa el comprobante contra la cuenta bancaria $\rightarrow$ Pulsa `[ Validar Pago ]`.
4. **Sistema:** Registra `payment_status = verified`, emite el evento `PAYMENT_CONFIRMED` y actualiza la vista del comensal.
5. **Operaciones:** Si el Tenant configuró la regla *"requerir pago verificado antes de cocinar"*, el pedido se desbloquea para la jornada de producción correspondiente.

---

### FLOW E2E-03: Assisted Order Intake by Staff (`STAFF_INTAKE`) `[LOCKED]`
1. **Staff / Atención al Cliente:** Recibe solicitud de pedido vía telefónica o WhatsApp $\rightarrow$ Accede a `/admin/orders/new`.
2. **Staff:** Selecciona el comensal existente o realiza el alta asistida $\rightarrow$ Configura los platos por día y la dirección de entrega $\rightarrow$ Pulsa `[ Crear Pedido Asistido ]`.
3. **Sistema:** Crea la orden canónica con atributo de origen `intake_channel = staff_intake`, emitiendo `ORDER_CREATED` y credenciales temporales si es un cliente nuevo.
4. **Comensal:** Recibe notificación informativa y enlace para visualizar su pedido programado.

---

### FLOW E2E-04: Customer Modification with Kitchen Handoff `[LOCKED]`
1. **Comensal:** En su área personal, pulsa `[ Modificar Pedido ]` sobre un pedido futuro $\rightarrow$ Cambia un plato o fecha de entrega $\rightarrow$ Pulsa `[ Solicitar Cambio ]`.
2. **Sistema:**
   - *Caso A (Pedido en `confirmed` antes del corte):* Si el Tenant preautorizó cambios automáticos, actualiza la orden canónica, registra la entrada en el historial inmutable de cambios y notifica a ambas partes.
   - *Caso B (Pedido en `in_production` o tras la hora de corte):* Deja el pedido en su estado actual, registra `modification_requested` y alerta al Tenant.
3. **Tenant / Rol Autorizado:** Consulta la viabilidad operativa con cocina $\rightarrow$ Pulsa `[ Aprobar Cambio ]` o `[ Rechazar con Motivo ]`.
4. **Sistema (si es Aprobado):** Aplica el cambio a la orden canónica, registra el evento en el historial inmutable de cambios, recalcula la demanda agregada en Cocina (N1) y la tarjeta de cliente en Packing (N2), notificando al comensal.

---

### FLOW E2E-05: Customer Cancellation with Operational Stop `[LOCKED]`
1. **Comensal:** Pulsa `[ Cancelar Pedido ]` e introduce el motivo del desestimiento.
2. **Sistema:**
   - *Si el pedido está en un estado con resolución automática preautorizada:* Transiciona inmediatamente a `cancelled` y registra el motivo en el historial inmutable.
   - *Si el pedido está en `in_production` o posterior:* Transiciona a `cancel_requested` y emite una alerta prioritaria en la consola del Tenant y en la pantalla de operaciones.
3. **Tenant / Rol Autorizado:** Resuelve la petición comercial (ej. autoriza anulación o gestiona compensación).
4. **Operaciones:** El lote en cocina o la bolsa en packing se marca visualmente con aviso de cancelación, retirando las raciones de la cadena de despacho. El pedido permanece preservado en la base de datos como `cancelled`.

---

### FLOW E2E-06: Operational Incident & Tenant Escalation `[DECISIONES 23, 44 A 47]`
1. **Cocinero / Repartidor:** Detecta una rotura de stock de un ingrediente o un problema en la dirección de entrega $\rightarrow$ Pulsa `[ Reportar Incidencia ]` $\rightarrow$ Describe el problema (*"Falta salmón fresco"*).
2. **Sistema:** Crea el objeto de incidencia (`status: open`) vinculado al pedido/lote y emite alerta visual al Tenant. Por defecto, **no bloquea el resto de pedidos** salvo que el Tenant lo haya configurado como crítico.
3. **Tenant / Rol Autorizado:** Toma la decisión comercial (ej. acuerda sustituir el salmón por atún) $\rightarrow$ Aplica la modificación asistida en el pedido $\rightarrow$ Marca la incidencia como `[ Resuelta / Closed ]`.
4. **Operaciones:** La pantalla de cocina se actualiza con la nueva instrucción acordada y se reanuda la elaboración del plato.

---

### FLOW E2E-07: Platform Super Admin Authorized Support (`Act as Tenant`) `[LOCKED]`
1. **Super Admin de YourMeal OS:** Recibe una petición de soporte técnico de un Tenant $\rightarrow$ Accede a la consola global $\rightarrow$ Selecciona `[ Iniciar Soporte Tenant ]`.
2. **Sistema:** Exige obligatoriamente registrar el motivo justificado de la intervención antes de permitir el acceso.
3. **Super Admin:** Entra en el contexto del Tenant en modo soporte (con banner visual permanente de advertencia) y realiza el diagnóstico técnico necesario.
4. **Sistema:** Registra de forma inmutable cada acción realizada en el log de auditoría del Tenant (`actor: super_admin`, `reason: soporte autorizado`, `timestamp`).
