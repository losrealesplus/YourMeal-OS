# YOURMEAL OS — PRODUCT DESIGN 02-C (LOCKED)
## TENANT ADMIN PRODUCT DECISION LOG & RATIONALE

---

## 00 — DECISION LOG & TAXONOMY AUDIT

Cada decisión se clasifica formalmente por su origen, racionalidad y estado de aprobación (`[LOCKED]`, `[PROPOSED]`, `[OPEN QUESTION]`, `[FUTURE]`).

---

### DECISION 01: El Axioma EatClean vs YourMeal OS
* **Decisión:** Se declara formalmente: *"EatClean es una configuración de YourMeal OS, no la definición de YourMeal OS"*.
* **Origen:** `[PREVIOUS PRODUCT DECISION]`
* **Racionalidad:** Protege la plataforma contra el acoplamiento a reglas particulares de un único cliente y garantiza su escalabilidad a futuros Tenants.
* **Estado:** `[LOCKED]`

---

### DECISION 02: Independencia Configurable de Marcas (Brand Independence)
* **Decisión:** La relación entre una Brand y sus clientes, catálogo, menús, pedidos y operaciones es configurable por Tenant, no una regla rígida.
* **Origen:** `[PREVIOUS PRODUCT DECISION]`
* **Racionalidad:** Permite que un operador gestione múltiples marcas con distintos grados de independencia operativa y comercial.
* **Estado:** `[LOCKED]`

---

### DECISION 03: Sobrescritura de Precios y Disponibilidad por Sede (Location Overrides)
* **Decisión:** El plato se define a nivel maestro en el Tenant, pero cada sede física (`Location`) puede sobrescribir disponibilidad y precio sin duplicar el plato.
* **Origen:** `[PREVIOUS PRODUCT DECISION]`
* **Racionalidad:** Simplifica el mantenimiento del catálogo para negocios con sedes en múltiples ubicaciones.
* **Estado:** `[LOCKED]`

---

### DECISION 04: Separación de Niveles de Soporte y Auditoría Obligatoria
* **Decisión:** El acceso de soporte global de YourMeal OS Admin a un Tenant exige motivo y genera auditoría inmutable. El acceso asistido a comensales (`Customer Assisted Access`) queda acotado a soporte autorizado puntual.
* **Origen:** `[PREVIOUS PRODUCT DECISION]`
* **Racionalidad:** Garantiza la confianza institucional y la privacidad de datos sin accesos administrativos silenciosos.
* **Estado:** `[LOCKED]`

---

### DECISION 05: Detección de Duplicados sin Fusión Cross-Tenant
* **Decisión:** El sistema alerta de posibles coincidencias de email/teléfono dentro del mismo Tenant, pero nunca cruza datos ni fusiona clientes entre distintos Tenants.
* **Origen:** `[PREVIOUS PRODUCT DECISION]`
* **Racionalidad:** Mantiene el aislamiento comercial absoluto entre organizaciones.
* **Estado:** `[LOCKED]`

---

### DECISION 06: Módulo B2B como Propuesta Modular
* **Decisión:** El módulo B2B se clasifica como módulo opcional (`[PROPOSED]`), sin asumir facturaciones consolidadas ni subsidios específicos hasta su diseño detallado.
* **Origen:** `[NEW PRODUCT DECISION]`
* **Racionalidad:** Evita sobrediseñar reglas corporativas antes de su fase específica.
* **Estado:** `[PROPOSED]`

---

### DECISION 07: Trazabilidad Funcional en Production Master
* **Decisión:** Los reportes descargables de producción que representen unidades individuales conservan la asociación funcional *Unidad $\rightarrow$ Cliente $\rightarrow$ Nombre en reporte*.
* **Origen:** `[PREVIOUS PRODUCT DECISION]`
* **Racionalidad:** Garantiza el control de calidad y la trazabilidad de raciones en suelo operativo.
* **Estado:** `[LOCKED]`
