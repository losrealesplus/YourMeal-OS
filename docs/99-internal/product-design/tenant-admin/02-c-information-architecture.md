# YOURMEAL OS — PRODUCT DESIGN 02-C (LOCKED)
## TENANT ADMIN INFORMATION ARCHITECTURE (IA) & MULTI-TENANT SAAS MODEL

---

## 00 — FINAL LOCK PASS & STRATEGIC CONTEXT

Este documento constituye la especificación oficial y congelada (**🔒 LOCKED**) de la arquitectura de información de **Tenant Admin** para YourMeal OS:

1. **Axioma Estratégico Fundamental `[LOCKED]`:**
   > *"EATCLEAN IS A CONFIGURATION OF YOURMEAL OS, NOT THE DEFINITION OF YOURMEAL OS."*
   > *(EatClean es una configuración de YourMeal OS, no la definición de YourMeal OS).*
   Todo lo que EatClean necesita actualmente forma parte de YourMeal OS, pero **no todo lo que YourMeal OS puede hacer es necesario para EatClean**.
2. **Definición Canónica de Tenant `[LOCKED]`:**
   - **Tenant:** Organización / negocio independiente que opera dentro de YourMeal OS y posee su propio contexto operativo, usuarios, clientes, catálogo, pedidos y configuración.
   - *Aclaración:* El modelo comercial y de facturación SaaS de YourMeal OS no forma parte de este documento de Product Design.
3. **Principio de Autonomía del Tenant `[LOCKED]`:**
   > *"YOURMEAL OS NEVER MAKES BUSINESS DECISIONS FOR A TENANT WITHOUT TENANT AUTHORIZATION."*
   > *(YourMeal OS nunca toma decisiones comerciales por un Tenant sin su autorización explícita).*
   La plataforma sugiere, calcula y alerta, pero jamás altera precios, menús, cancela pedidos ni modifica reglas comerciales de forma autónoma.
4. **Aislamiento Multitenant (`Tenant Isolation`) `[LOCKED]`:**
   - Aislamiento absoluto a nivel de producto: Un Tenant jamás tiene visibilidad ni acceso a datos, clientes, pedidos o configuraciones de otro Tenant.
5. **Independencia de Marcas 100% Configurable (`Brand Independence`) `[LOCKED]`:**
   - Un Tenant puede gestionar múltiples marcas comerciales (`Brands`).
   - La relación entre Brand y Clientes, Catálogo, Menús, Pedidos, Operaciones, Sedes y Dominios es **totalmente configurable** por el Tenant.
6. **Sedes y Sobrescrituras Locales (`Location Overrides`) `[LOCKED]`:**
   - *Tenant con 1 Sede:* El comensal no necesita seleccionar sede durante el pedido.
   - *Tenant con Múltiples Sedes:* El pedido se asocia obligatoriamente a una sede operativa.
   - *Sobrescrituras:* La sede puede sobrescribir el precio base y la disponibilidad de platos cuando el Tenant lo permita (`Location-specific price override` / `Location-specific availability override`).
7. **Separación de Niveles de Acceso y Soporte `[LOCKED]`:**
   - `1. Platform Administration:` Gestión global del ciclo de vida de tenants y capacidades de plataforma (Super Admin).
   - `2. Tenant Support Context:` Entrada auditada al entorno de un Tenant para soporte técnico con justificación obligatoria (`ADMIN ACTION` $\rightarrow$ `TENANT CONTEXT` $\rightarrow$ `AUDIT RECORD`).
   - `3. Customer Assisted Access:` Herramienta de soporte autorizado puntual, enmarcada en el Tenant activo, con permiso requerido, motivo obligatorio y registro inmutable de auditoría (no es una capacidad de navegación cotidiana).
8. **Motor de Pedidos (`Order Engine / Order Lifecycle`) `[LOCKED]`:**
   - Utiliza el ciclo de vida de pedidos previamente formalizado y bloqueado en Customer (`02-A`) y Operations (`02-B`), sin redefinir ni alterar estados en este documento.
9. **Trazabilidad Funcional en Reportes Descargables `[LOCKED]`:**
   - Los reportes descargables que representen unidades individuales de producción deben conservar la asociación entre cada unidad y el cliente correspondiente cuando dicha trazabilidad forme parte del reporte (ej. *Production Master: 8 unidades de producción $\rightarrow$ 8 clientes asociados $\rightarrow$ 8 nombres visibles en el reporte descargable*).
10. **Desacoplamiento de Taxonomía (Core vs Capability vs Module) `[LOCKED]`:**
    - `CORE:` Capacidad inseparable de la plataforma base.
    - `CAPABILITY:` Habilidad transversal que puede habilitarse/configurarse según Tenant.
    - `MODULE:` Conjunto funcional más amplio compuesto por múltiples capacidades relacionadas.

---

## 01 — Multi-Tenant SaaS Hierarchy Model

```text
                              YOURMEAL OS
                        (Global Platform Admin)
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
       TENANT A (EatClean)                     TENANT B (Futuro SaaS)
               │                                       │
        ┌──────┴──────┐                         ┌──────┴──────┐
        ▼             ▼                         ▼             ▼
     BRANDS       LOCATIONS                  BRANDS       LOCATIONS
        │             │                         │             │
        └──────┬──────┘                         └──────┬──────┘
               ▼                                       ▼
         USERS / STAFF                           USERS / STAFF
               │                                       │
           CUSTOMERS                               CUSTOMERS
               │                                       │
           CATALOGUE                               CATALOGUE
         (Dishes/Recipes)                        (Dishes/Recipes)
               │                                       │
             MENUS                                   MENUS
               │                                       │
            ORDERS                                  ORDERS
               │                                       │
          OPERATIONS                              OPERATIONS
```

---

## 02 — Structural Entity Contracts

### 1. TENANT (Organización / Negocio Independiente) `[LOCKED]`
* Posee su propio contexto operativo, catálogo maestro, base de clientes, pedidos y configuración.
* Aislamiento absoluto: Un Tenant jamás tiene visibilidad ni acceso a la información de otro Tenant.

### 2. BRAND (Marca Comercial) `[LOCKED]`
* **Independencia Configurable por Tenant:** Un Tenant puede gestionar una o múltiples marcas comerciales.
* **Modelo Relacional Configurable `[PROPOSED]`:** El Tenant decide para cada marca si comparte o aísla:
  - *Base de Clientes* (cliente unificado vs cuentas separadas).
  - *Catálogo de Platos* (catálogo central vs platos exclusivos).
  - *Menús Semanales* (menús compartidos vs calendarios independientes).
  - *Operaciones y Cocina* (misma cocina central vs estaciones dedicadas).
  - *Identidad y Dominios* (subdominios y logos específicos por marca).
* **Cliente Multi-Marca `[LOCKED]`:** Un comensal puede estar vinculado a varias marcas dentro del **mismo Tenant** sin que ello rompa el aislamiento estricto con otros Tenants (`Customer A @ Tenant 1 ≠ Customer A @ Tenant 2`).

### 3. LOCATION (Sede / Cocina / Centro de Distribución) `[LOCKED]`
* **Comportamiento según Número de Sedes:**
  - *1 Sede (Ej. EatClean Tenerife):* El comensal no necesita seleccionar sede durante la compra.
  - *Múltiples Sedes:* El pedido debe quedar asociado a una sede operativa.
* **Sobrescrituras por Sede (`Location Overrides`) `[LOCKED]`:**
  - `Location-specific availability override:` Activar o pausar platos según disponibilidad local.
  - `Location-specific price override:` Ajustar precios por sede según políticas comerciales del Tenant.

---

## 03 — Platform Admin vs Tenant Admin Boundaries

```text
┌──────────────────────────────────────────┬──────────────────────┬──────────────────────┐
│ CAPACIDAD / RESPONSABILIDAD              │ YOURMEAL OS ADMIN    │ TENANT ADMIN         │
├──────────────────────────────────────────┼──────────────────────┼──────────────────────┤
│ Provisión y suspensión de Tenants        │ **SÍ (Global)**      │ NO                   │
│ Asignación de capacidades de plataforma  │ **SÍ (Global)**      │ Solicita             │
│ Soporte técnico de plataforma            │ **SÍ (Auditado)**    │ NO                   │
│ Tenant Support Context (Acceso soporte)  │ **SÍ (Auditado)**    │ NO                   │
│ Customer Assisted Access (Soporte)       │ **SÍ (Auditado)**    │ **SÍ (Auditado)**    │
│ Gestión de Staff y permisos internos     │ NO                   │ **SÍ (Tenant Context)**│
│ Catálogo, Platos, Recetas y Precios      │ NO                   │ **SÍ (Tenant Context)**│
│ Menús Semanales y Publicación            │ NO                   │ **SÍ (Tenant Context)**│
│ Verificación de Pagos de Clientes        │ NO                   │ **SÍ (Tenant Context)**│
│ Configuración de Políticas y Reglas      │ NO                   │ **SÍ (Tenant Context)**│
└──────────────────────────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 04 — Global Information Architecture (Tenant Admin Surface)

```text
TENANT ADMIN (/admin/*)
├── [ OVERVIEW / COCKPIT ]  → Resumen de actividad, pedidos del día, estado de módulos y alertas.
├── [ STAFF & PERMISOS ]    → Gestión de personal, asignación de roles, departamentos y sedes.
├── [ CLIENTES ]            → Directorio de comensales, altas asistidas, histórico y soporte.
├── [ CATÁLOGO & PLATOS ]   → Catálogo maestro de platos, recetas, ingredientes y modificadores.
├── [ MENÚS SEMANALES ]     → Planificador de menús por día, ranuras, precios y visibilidad.
├── [ LIBRO DE PEDIDOS ]    → Supervisión de órdenes, modificaciones directas y cancelaciones.
├── [ COBROS & PAGOS ]      → Métodos de cobro configurados, verificación de pagos y justificantes.
├── [ LOGÍSTICA & ENTREGAS ]→ Zonas de reparto, días de servicio, costes de envío y recogida.
├── [ REPORTES ]            → Centro de configuración y exportación de reportes PDF/XLSX.
├── [ MÓDULOS & CAPABILITIES] Toggles de activación de módulos y capacidades de plataforma.
├── [ MARCAS & SEDES ]      → Gestión de marcas comerciales, sedes y sobrescrituras locales.
└── [ AJUSTES & BRANDING ]  → Identidad corporativa, logo, reglas de pedido mínimo y soporte.
```

---

## 05 — Detailed Component Specifications

### 1. GESTIÓN DE STAFF & PERMISOS `[LOCKED]`
* **Modelo Canónico:** `Usuario` $\rightarrow$ `Rol / Permisos` $\rightarrow$ `Departamentos Activos` $\rightarrow$ `Sede Asignada`.
* **Capacidades del Tenant Admin:**
  - Crear, editar, suspender, reactivar y archivar personal.
  - Asignar roles predefinidos o configurar roles personalizados.
  - Asignar departamentos operativos (`Cocina`, `Packing`, `Reparto`, `Soporte`).
  - Restringir la operativa de un empleado a una sede física concreta (`Location`).
  - Emitir restablecimiento de credenciales de acceso.

---

### 2. DIRECTORIO & GESTIÓN DE CLIENTES `[LOCKED]`
* **Contexto del Tenant:** Los datos de comensales pertenecen al contexto operativo exclusivo del Tenant.
* **Detección de Duplicados:** Alerta de posibles coincidencias de email o teléfono dentro del mismo Tenant. **Nunca cruza ni fusiona clientes entre distintos Tenants**.
* **Credenciales de Acceso:**
  - Alta asistida con emisión de credencial temporal o enlace de invitación.
  - **Obligatoriedad de cambio de contraseña en el primer acceso**.
  - El Tenant Admin no tiene acceso de lectura a las contraseñas de los comensales.
* **Customer Assisted Access (Soporte Autorizado):** Herramienta de asistencia técnica puntual, restringida a personal con permiso expreso, enmarcada en el Tenant activo y **100% auditada**.

---

### 3. CATÁLOGO, PLATOS & RECETAS `[LOCKED]` & `[PROPOSED]`
* **Modelo Conceptual:** `DISH` (Plato Maestro) $\rightarrow$ `RECIPE` (Ficha Técnica) $\rightarrow$ `INGREDIENTS` (Materias Primas).
* **Taxonomía de Categorías:** Parametrizable por Tenant (Comidas, Bebidas, Postres, Extras, etc.).
* **Precios Contextuales `[PROPOSED]`:** El Tenant puede definir tarifas diferenciadas (precio en menú semanal, precio a la carta o precio por sede).
* **Módulo de Nutrición `[PROPOSED]`:** Si el módulo de nutrición está activo, el sistema habilita las capacidades nutricionales definidas para ese módulo según su diseño posterior.

---

### 4. MENÚS SEMANALES & REGLAS DE PUBLICACIÓN `[EXISTING / CERTIFIED]` & `[LOCKED]`
* **Planificador Semanal:** Programación de platos por día de consumo/entrega.
* **Visibilidad de Menú:** Configurable como `Público`, `Privado` o `Por Invitación`.
* **Ciclo de Menú:** `Borrador` $\rightarrow$ `Publicado` $\rightarrow$ `Archivado`.

---

### 5. LIBRO DE PEDIDOS & MODIFICACIÓN ADMINISTRATIVA `[LOCKED]`
* **Modificación Directa por Admin:** Requiere registro de motivo y genera una nueva versión auditada (`Order V1` $\rightarrow$ `Order V2`), preservando el histórico operacional.
* **Cancelación por Admin:** Registra responsable, fecha y motivo de cancelación.

---

### 6. PAGOS, COBROS & VERIFICACIÓN `[LOCKED]`
* **Múltiples Métodos Coexistentes:** El Tenant configura qué métodos habilita (Efectivo, Bizum, Transferencia bancaria, Pasarela online aprobada).
* **Separación de Estados:** Se mantiene la distinción formal entre `Order Status` y `Payment Status`.
* **Aprobación de Pagos Externos:** El Staff autorizado revisa justificantes y valida cobros manuales.

---

### 7. LOGÍSTICA, ZONAS & RECOGIDA EN LOCAL `[LOCKED]` & `[PROPOSED]`
* **Zonas de Entrega:** Configuración de códigos postales, días de reparto y costes de envío.
* **Recogida en Sede (Pickup) `[PROPOSED]`:** Opción configurable para permitir que el comensal recoja su pedido en cocina central o punto de entrega.

---

### 8. BRANDING & IDENTIDAD VISUAL `[LOCKED]`
* Cada Tenant configura su logotipo, nombre comercial y paleta de colores.
* **Firma de Plataforma:** La aplicación muestra discretamente *"Powered by YourMeal OS"*, preservando la identidad tecnológica de la plataforma.
