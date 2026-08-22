# YOURMEAL OS — PRODUCT DESIGN 02-D
## EXTERNAL INTEGRATIONS, TAXONOMY, REPORTING & AUDIT ARCHITECTURE

---

## 01 — External Integrations Conceptual Framework `[DECISIONES 71 A 80]`

YourMeal OS modela las integraciones externas bajo un framework genérico de servicios de terceros homologados por la plataforma.

```text
                           YOURMEAL OS PLATFORM
                       (Integration Framework Core)
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   PAYMENT PROVIDERS       NOTIFICATION PROVIDERS      DELIVERY PROVIDERS
 (Stripe, Redsys, Bizum)    (Push, Email, WhatsApp)     (Courier APIs, GPS)
```

### Ciclo de Vida de una Integración `[DECISIÓN 74]`
* **`INACTIVE`:** Integración no habilitada en el Tenant.
* **`CONFIGURING`:** Parámetros o credenciales en proceso de configuración.
* **`ACTIVE`:** Integración operativa y enrutando eventos bidireccionales.
* **`ERROR`:** Fallo de conexión o credenciales; activa mecanismos de fallback configurados (ej. conmutar a cobro manual).

### Gobernanza de Activación `[DECISIÓN 73]`
* La plataforma YourMeal OS gestiona y homologa la disponibilidad de integraciones.
* Un Tenant puede configurar parámetros específicos de integraciones permitidas siempre que cuente con la autorización previa de la plataforma.

---

## 02 — Platform Taxonomy: Core vs Capability vs Module `[DECISIONES 81 A 87]`

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ 1. YOURMEAL OS CORE (Inseparable de la Plataforma Base)                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ • Identidad & Tenant Isolation Absoluto                                          │
│ • Motor de Ciclo de Vida de Pedido Canónico                                      │
│ • Framework de Permisos Granulares & Roles (`RBAC`)                              │
│ • Motor de Eventos, Automatizaciones & Registro de Auditoría Inmutable           │
│ • Framework de Integraciones & Reportes Estándar del Sistema                     │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ 2. CAPABILITIES (Capacidades Funcionales Transversales y Reutilizables)          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ • Cobros Online / Verificación Externa de Pagos                                  │
│ • Demanda Agregada de Cocina (N1) & Mesa de Packing (N2)                         │
│ • Reparto por Zonas & Captura Asistida (`STAFF_INTAKE`)                          │
│ • Sobrescrituras por Sede (`Location Overrides`) & Marcas (`Brand Independence`)  │
│ • Live Tracking GPS & Customer Assisted Access                                   │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ 3. MODULES (Agrupaciones Funcionales Mayores Configurables por Tenant)           │
├──────────────────────────────────────────────────────────────────────────────────┤
│ • Módulo de Empresas & Convenios B2B `[PROPOSED]`                                │
│ • Módulo de Nutrición, Macros & Dietas `[PROPOSED]`                              │
│ • Módulo de Suscripciones Periódicas Recurrentes `[FUTURE]`                      │
│ • Módulo de Stock, Ingredientes & Almacén `[FUTURE]`                             │
│ • Módulo de Mermas & Escandallos de Recetas `[FUTURE]`                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

* **Visibilidad de Dependencias `[DECISIONES 86, 87]`:** La plataforma no impide arbitrariamente la combinación de capacidades, pero muestra con total transparencia las dependencias requeridas (ej. activar *Demanda Agregada* requiere que el departamento *Cocina* esté habilitado).

---

## 03 — Cross-System Reporting & Production Traceability `[DECISIONES 88 A 90]`

1. **Reportes Base de Plataforma (Core):** Informes predefinidos de órdenes diarias, incidencias de producción y ventas consolidadas.
2. **Reportes Personalizados del Tenant:** El Tenant puede configurar filtros, columnas y periodicidad sobre los datos de su contexto.
3. **Regla Inviolable de Trazabilidad en Producción (`Production Master`):**
   > *"Los reportes descargables que representen unidades individuales de producción deben conservar la asociación entre cada unidad y el cliente correspondiente cuando dicha trazabilidad forme parte del reporte."*
   *(Ejemplo: 8 raciones de pasta $\rightarrow$ 8 nombres de clientes en el PDF/XLSX descargable).*

---

## 04 — Universal Audit & History Framework `[DECISIONES 27, 28, 91 A 95]`

Todo cambio relevante registra de forma inmutable:
* **QUIÉN:** Actor responsable (`Customer`, `Tenant Admin`, `Operario`, `Automatización del Sistema` o `Integración Externa`).
* **QUÉ:** Estado anterior y nuevo estado del objeto.
* **CUÁNDO:** Fecha y hora exacta.
* **POR QUÉ:** Motivo obligatorio registrado (en cancelaciones, modificaciones manuales o accesos de soporte).

### Visibilidad de Historial por Rol:
* **Comensal:** Acceso exclusivo a su propio historial de compras, pagos y cancelaciones.
* **Operaciones:** Historial de lotes cocinados, empaquetados y hojas de ruta.
* **Tenant Admin:** Auditoría integral de todas las acciones comerciales, operativas y de staff dentro de su organización.
* **Plataforma Admin:** Acceso auditado a nivel de soporte técnico bajo motivo obligatorio.
