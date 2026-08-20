# YOURMEAL OS — PRODUCT DESIGN 02-C (LOCKED)
## TENANT ADMIN USER FLOWS SPECIFICATION (38 CANONICAL FLOWS & 20 EDGE CASES)

---

## 00 — FINAL LOCK PASS & METHODOLOGY

Este documento constituye la especificación oficial y congelada (**🔒 LOCKED**) de los flujos de usuario de **Tenant Admin** para YourMeal OS. Todos los flujos se describen exclusivamente en lenguaje funcional de producto, garantizando la delimitación estricta de accesos de soporte y la preservación del histórico operativo.

---

## 01 — Canonical User Flows

### FLOW 01: Create Tenant (Platform Admin) `[PROPOSED]`
1. El Super Admin de YourMeal OS accede a la consola de plataforma $\rightarrow$ `[ + Nuevo Tenant ]`.
2. Introduce Razón Social, nombre comercial, subdominio y email del administrador inicial.
3. El sistema crea el Tenant y emite la invitación de acceso al administrador designado.

---

### FLOW 02: Tenant Onboarding & Initial Setup `[PROPOSED]`
1. El Tenant Admin accede mediante el enlace de invitación y establece su contraseña inicial.
2. Configura los datos básicos de la empresa: Logotipo, nombre comercial y datos de contacto.
3. Accede al Cockpit principal de administración de su Tenant.

---

### FLOW 03: Create Brand `[LOCKED]`
1. En `/admin/settings/brands`, el Admin pulsa `[ + Nueva Marca ]`.
2. Introduce nombre comercial *"EatClean Fit"*, logotipo corporativo y colores de marca.
3. Guarda el registro de la marca vinculada al Tenant.

---

### FLOW 04: Configure Brand Independence Level `[LOCKED]` & `[PROPOSED]`
1. En la configuración de la marca, el Admin selecciona qué elementos son compartidos o independientes:
   - Configuración de clientes (compartida o aislada) `[PROPOSED]`.
   - Configuración de catálogo (catálogo central o platos exclusivos) `[PROPOSED]`.
   - Configuración de menús y calendarios `[PROPOSED]`.
2. El sistema aplica las reglas de visibilidad y acceso configuradas para esa marca.

---

### FLOW 05: Create Location (Sede / Cocina) `[LOCKED]`
1. En `/admin/settings/locations`, pulsa `[ + Nueva Sede ]`.
2. Introduce nombre *"Cocina Central Santa Cruz"*, dirección física y teléfono de contacto.

---

### FLOW 06: Configure Location Overrides `[LOCKED]`
1. En la ficha de la sede *"Santa Cruz"*, selecciona el plato *"Bowl Salmón"*.
2. Configura las sobrescrituras locales permitidas:
   - `Location-specific price override:` Establece un precio diferenciado para esa sede.
   - `Location-specific availability override:` Marca el plato como activo o pausado en esa sede.
3. El plato conserva su definición maestra en el catálogo pero aplica los ajustes locales en la sede configurada.

---

### FLOW 07: Create Staff Member `[LOCKED]`
1. En `/admin/staff`, pulsa `[ + Nuevo Empleado ]`.
2. Introduce nombre, correo electrónico, teléfono y rol inicial asignado.
3. El sistema genera el acceso y emite la notificación al empleado.

---

### FLOW 08: Assign Staff Permissions & Custom Role `[LOCKED]` & `[PROPOSED]`
1. El Admin selecciona un rol predefinido o crea un rol personalizado.
2. Modifica permisos granulares según las necesidades operativas del empleado.

---

### FLOW 09: Assign Staff Department `[LOCKED]`
1. En la ficha del empleado, el Admin asigna los departamentos operativos activos (ej. `Cocina` y `Packing`).
2. Al iniciar sesión, el empleado dispone de acceso directo a los módulos de trabajo correspondientes.

---

### FLOW 10: Assign Staff Location Context `[LOCKED]`
1. El Admin asigna el empleado a una sede física concreta (`Location`).
2. El empleado opera dentro del contexto de los pedidos y lotes de esa sede.

---

### FLOW 11: Create Customer (Manual Staff Intake) `[EXISTING / CERTIFIED]`
1. En `/admin/customers`, el Admin o Staff pulsa `[ + Nuevo Cliente ]`.
2. Introduce nombre, email, teléfono y dirección de entrega.
3. El comensal queda registrado con estado activo en el Tenant.

---

### FLOW 12: Detect Potential Duplicate Customer `[LOCKED]`
1. Al introducir un email existente en el Tenant, el sistema muestra una advertencia informativa de posible duplicado.
2. Si el email pertenece a otro Tenant, el sistema **no emite ninguna alerta** y permite el alta para garantizar el aislamiento absoluto entre empresas.

---

### FLOW 13: Create Customer Initial Credentials `[LOCKED]`
1. El Admin emite una credencial temporal o envía un enlace de invitación seguro al comensal.

---

### FLOW 14: Customer First Login & Password Change `[LOCKED]`
1. El comensal accede con la credencial temporal.
2. El sistema requiere obligatoriamente establecer una nueva contraseña personal antes de continuar.

---

### FLOW 15: Customer Password Recovery `[LOCKED]`
1. El comensal solicita recuperación de acceso y recibe un enlace seguro para restablecer su clave.

---

### FLOW 16: Customer Assisted Access for Authorized Support `[LOCKED]`
1. Un agente de soporte autorizado con permiso expreso inicia una sesión de asistencia técnica puntual sobre la cuenta del cliente.
2. Introduce el motivo justificado de la intervención.
3. La acción queda registrada de forma inmutable en el registro de auditoría del Tenant.

---

### FLOW 17: Create Dish in Catalogue `[EXISTING / CERTIFIED]`
1. En `/admin/dishes`, pulsa `[ + Nuevo Plato ]`.
2. Introduce nombre *"Pollo Asado con Boniato"*, descripción, categoría, precio base y fotografía.

---

### FLOW 18: Create Recipe (Ficha Técnica) `[LOCKED]`
1. En la ficha del plato, el Admin define las instrucciones de elaboración y tiempos de preparación.

---

### FLOW 19: Assign Ingredients & Nutritional Information `[LOCKED]` & `[PROPOSED]`
1. En la receta, añade las materias primas correspondientes.
2. Si el módulo de nutrición está activo en el Tenant, se habilitan los campos y capacidades nutricionales definidas para ese módulo.

---

### FLOW 20: Configure Contextual Dish Pricing `[PROPOSED]`
1. En la ficha del plato, el Admin puede definir tarifas específicas (menú semanal, carta suelta) según la configuración del Tenant.

---

### FLOW 21: Configure Location Dish Availability `[LOCKED]`
1. En `/admin/dishes`, el Admin actualiza la disponibilidad de un plato para una sede específica (`Disponible` / `Agotado`).

---

### FLOW 22: Create Weekly Menu `[EXISTING / CERTIFIED]`
1. En `/admin/menus`, pulsa `[ + Nuevo Menú Semanal ]`.
2. Selecciona la semana de entrega y asigna platos a cada jornada.

---

### FLOW 23: Publish Menu `[EXISTING / CERTIFIED]`
1. El Admin revisa la programación y pulsa `[ Publicar Menú ]`.
2. El menú se vuelve accesible para los comensales en la aplicación.

---

### FLOW 24: Configure Public vs Private Menu `[LOCKED]`
1. El Admin define si el menú publicado es de acceso público general o privado por invitación.

---

### FLOW 25: Direct Order Modification by Admin `[LOCKED]`
1. En `/admin/orders`, el Admin modifica un pedido confirmado e introduce el motivo obligatorio.
2. El sistema genera una nueva versión auditada (`Order V2`) conservando el histórico anterior.

---

### FLOW 26: Cancel Order by Admin `[LOCKED]`
1. En `/admin/orders`, el Admin cancela un pedido indicando el motivo.
2. El pedido pasa a `cancelled` y se registra la auditoría del cambio.

---

### FLOW 27: Configure Tenant Payment Methods `[LOCKED]`
1. En `/admin/settings/payments`, el Admin activa los métodos de cobro que ofrece su negocio (Bizum, Transferencia, Efectivo o Pasarela online aprobada).

---

### FLOW 28: Verify External Payment with Audit `[LOCKED]`
1. El Staff comprueba el justificante de pago recibido y valida el cobro.
2. El estado pasa a `payment_status = verified` con registro del usuario responsable.

---

### FLOW 29: Configure Delivery Zones & Rules `[LOCKED]`
1. En `/admin/settings/delivery`, configura códigos postales atendidos, días de entrega y tarifas de envío.

---

### FLOW 30: Configure Pickup at Central Kitchen `[PROPOSED]`
1. En logística, activa la opción de recogida en sede y define el punto de entrega y horarios.

---

### FLOW 31: Configure Visible Reports & Traceability `[LOCKED]`
1. En ajustes de reportes, el Admin selecciona qué informes están disponibles para el equipo.
2. **Regla de Trazabilidad:** Para el reporte de producción (*Production Master*), el sistema conserva la asociación funcional: *Unidad de producción $\rightarrow$ Cliente asociado $\rightarrow$ Visible en reporte descargable* (ej. 8 pastas $\rightarrow$ 8 clientes con sus nombres en la exportación PDF/XLSX).

---

### FLOW 32: Create Custom Staff Role `[LOCKED]`
1. En roles y permisos, crea un perfil personalizado con asignación de capacidades específicas.

---

### FLOW 33: Configure Module Permissions `[LOCKED]`
1. Ajusta los permisos de visualización o edición para cada módulo del sistema.

---

### FLOW 34: Enable Optional Platform Module `[LOCKED]`
1. En `/admin/settings/modules`, activa un módulo de plataforma disponible.
2. Las vistas y capacidades asociadas se incorporan inmediatamente al entorno del Tenant.

---

### FLOW 35: Disable Optional Platform Module `[LOCKED]`
1. El Admin desactiva un módulo opcional.
2. Las opciones correspondientes se ocultan limpiamente de la interfaz sin afectar al resto de la operativa.

---

### FLOW 36: Configure Authorized Integration `[LOCKED]`
1. En integraciones, configura los parámetros de un servicio externo homologado por YourMeal OS.

---

### FLOW 37: Platform Admin Enters Tenant Support Context `[LOCKED]`
1. El Super Admin de YourMeal OS inicia una sesión de soporte técnico sobre un Tenant indicando el motivo justificado.
2. La interfaz muestra un aviso visible de que la sesión se encuentra en modo soporte auditado.

---

### FLOW 38: Audit Platform Admin Action `[LOCKED]`
1. Toda acción efectuada durante la sesión de soporte técnico queda registrada en el historial inmutable de auditoría del Tenant.

---

## 02 — Edge Cases & Governance Handling

1. **Tenant Monosede:** La selección de sede se oculta automáticamente en todas las pantallas `[LOCKED]`.
2. **Tenant Multisede:** Los pedidos exigen asociación obligatoria a una sede para su despacho `[LOCKED]`.
3. **Comensal en Múltiples Marcas del Mismo Tenant:** El cliente puede alternar de marca conservando su acceso `[LOCKED]`.
4. **Comensal en Múltiples Tenants:** Los carritos, pedidos y datos están estrictamente aislados `[LOCKED]`.
5. **Empleado Asignado a Varias Sedes:** Selector de sede para alternar su contexto de trabajo `[LOCKED]`.
6. **Plato Inactivo en una Sede:** El plato aparece como no disponible únicamente para los clientes de esa sede `[LOCKED]`.
7. **Precio Diferenciado por Sede:** El pedido aplica el precio local configurado para la sede correspondiente `[LOCKED]`.
8. **Módulo Desactivado por Tenant:** Las rutas y elementos visuales asociados desaparecen limpiamente `[LOCKED]`.
9. **Integración Externa No Homologada:** La plataforma restringe conexiones con servicios no aprobados `[LOCKED]`.
10. **Suspensión Administrativa de Tenant:** El acceso se bloquea con aviso informativo `[LOCKED]`.
11. **Suspensión de Empleado:** Inhabilitación inmediata del acceso del usuario `[LOCKED]`.
12. **Detección de Email Duplicado en Tenant:** Aviso informativo sin bloqueo de perfil `[LOCKED]`.
13. **Fallo de Pasarela de Pago Online:** Mensaje informativo al comensal con posibilidad de métodos alternativos si están habilitados `[PROPOSED]`.
14. **Modificación Administrativa de Pedido en Cocina:** Notificación visual al equipo de producción para actualizar el lote `[LOCKED]`.
15. **Cancelación Administrativa:** Notificación a los departamentos operativos y al cliente con el motivo registrado `[LOCKED]`.
16. **Intento de Acceso No Autorizado entre Tenants:** El acceso a datos de otra organización es imposible `[LOCKED]`.
17. **Soporte Global Sin Motivo:** El sistema exige registrar justificación para iniciar soporte técnico `[LOCKED]`.
18. **Eliminación de Plato con Historial:** Protección de pedidos pasados mediante archivo de plato `[LOCKED]`.
19. **Cambio de Parámetros de Tenant:** Los cambios aplican a futuros pedidos sin alterar registros pasados `[LOCKED]`.
20. **Reactivación de Módulo Apagado:** Restauración de las configuraciones y datos previos del módulo `[LOCKED]`.
