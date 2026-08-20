# YOURMEAL OS — PRODUCT DESIGN 02-C (LOCKED)
## PRODUCT BOUNDARY MATRIX — FINAL REVIEW DRAFT

---

## 00 — TAXONOMY DEFINITIONS & STATUS TAGS

Para delimitar con precisión las fronteras de producto, cada funcionalidad se clasifica bajo definiciones formales y su estado de aprobación:

- **YOURMEAL OS CORE:** Capacidad base inseparable de la plataforma común.
- **CAPABILITY:** Habilidad transversal que puede habilitarse, configurarse o utilizarse según Tenant.
- **MODULE:** Conjunto funcional más amplio compuesto por múltiples capacidades relacionadas.
- **TENANT CONFIG:** Parámetro o regla de negocio configurable por cada empresa.
- **BRAND CONFIG:** Ajuste específico a nivel de marca comercial.
- **LOCATION CONFIG:** Sobrescritura específica a nivel de sede física / cocina.
- **EATCLEAN CONFIG:** Configuración concreta activa para el Tenant Piloto #1.
- **FUTURE / NOT NOW:** Capacidad identificada para el roadmap posterior.

**Estados de Aprobación:**
- `[LOCKED]`: Decisión formalmente aprobada y congelada.
- `[PROPOSED]`: Propuesta conceptual bajo revisión de producto.
- `[OPEN QUESTION]`: Pregunta o modelo pendiente de decisión.
- `[FUTURE]`: Capacidad prevista para fases posteriores.

---

## 01 — Capability & Boundary Classification Matrix (Final Review Draft)

| Funcionalidad / Feature | Clasificación Primaria | Nivel de Configuración | EatClean (Tenant #1) | Futuro SaaS | Estado de Producto | Racionalidad |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **WebApp Comensal & Contenedor iOS** | **CORE** | Tenant / Brand | **ON** | **ON** | `[LOCKED]` | Superficie universal de comensal. |
| **Planificador de Pedidos Multi-Día**| **CORE** | Tenant | **ON** | **ON** | `[LOCKED]` | Lógica de pedido único fechado. |
| **Order Engine / Order Lifecycle** | **CORE** | — | **ON** | **ON** | `[LOCKED]` | Ciclo transaccional locked en 02-A/B. |
| **Tenant Isolation** | **CORE** | — | **ON** | **ON** | `[LOCKED]` | Aislamiento y contexto absoluto. |
| **Framework de Operaciones Base** | **CORE** | Tenant | **ON** | **ON** | `[LOCKED]` | Centro de mando unificado de suelo. |
| **Demanda Agregada Cocina (N1)** | **CAPABILITY** | Department (Kitchen)| **ON** | **OPTIONAL** | `[LOCKED]` | Activable según departamentos del Tenant. |
| **Trazabilidad Individual Packing (N2)**| **CAPABILITY**| Department (Packing)| **ON** | **OPTIONAL** | `[LOCKED]` | Activable según departamentos del Tenant. |
| **Gestión de Staff & Permisos Granulares**| **CORE** | Tenant | **ON** | **ON** | `[LOCKED]` | Gobierno de accesos y roles internos. |
| **Catálogo Maestro de Platos & Recetas** | **CORE** | Tenant | **ON** | **ON** | `[LOCKED]` | Biblioteca base de productos. |
| **Menús Semanales Programados** | **CORE** | Tenant / Brand | **ON** | **ON** | `[LOCKED]` | Calendario de comidas por día. |
| **Captura Asistida por Staff (`STAFF_INTAKE`)**| **CAPABILITY** | Tenant Config | **ON** | **OPTIONAL** | `[LOCKED]` | Alta manual de pedidos por teléfono/soporte. |
| **Peticiones Fuera de Menú (`CUSTOM_REQUEST`)**| **CAPABILITY** | Tenant Config | **ON** | **OPTIONAL** | `[LOCKED]` | Solicitudes no listadas en catálogo. |
| **Verificación Externa de Pagos (Bizum)**| **CAPABILITY** | Tenant Config | **ON** | **OPTIONAL** | `[LOCKED]` | Revisión manual de justificantes. |
| **Pasarelas de Pago Online Integradas**| **CAPABILITY** | Tenant Config | **OFF** | **OPTIONAL** | `[PROPOSED]` | Cobro directo in-app con tarjeta. |
| **Reparto Manual & Enrutamiento por Zona**| **CAPABILITY** | Tenant Config | **ON (Zona)**| **OPTIONAL** | `[LOCKED]` | Logística de paradas y despacho. |
| **Recogida en Cocina Central (Pickup)** | **CAPABILITY** | Location Config | **OPTIONAL** | **OPTIONAL** | `[PROPOSED]` | Retirada directa sin envío a domicilio. |
| **Gestión Multi-Sede (Location Overrides)**| **CAPABILITY** | Location Config | **1 Sede** | **OPTIONAL** | `[LOCKED]` | Sobrescritura de precio y disponibilidad. |
| **Gestión Multi-Marca (Brand Independence)**| **CAPABILITY** | Brand Config | **1 Marca**| **OPTIONAL** | `[LOCKED]` | Grados de independencia configurables. |
| **Auditoría de Soporte Platform Admin** | **CORE** | Platform | **ACTIVO** | **ACTIVO** | `[LOCKED]` | Registro inmutable de soporte técnico. |
| **Customer Assisted Access (Soporte)** | **CAPABILITY** | Tenant (Auditado) | **ON** | **ON** | `[LOCKED]` | Asistencia puntual auditada a comensal. |
| **Reportes por Defecto (Órdenes/Incidencias/Ventas)**| **CORE**| Tenant | **ON** | **ON** | `[LOCKED]` | Reportes iniciales sin configuración. |
| **Reporte Production Master con Trazabilidad**| **CAPABILITY**| Tenant Config | **ON** | **OPTIONAL** | `[LOCKED]` | *Unidad $\rightarrow$ Cliente $\rightarrow$ Visible en reporte*. |
| **Módulo de Nutrición & Macros (Kcal)**| **MODULE** | Tenant Module | **OPCIONAL** | **OPTIONAL** | `[PROPOSED]` | Capacidades dietéticas (si está activo). |
| **Módulo de Empresas B2B** | **MODULE** | Tenant Module | **OPTIONAL**| **OPTIONAL** | `[PROPOSED]` | Gestión corporativa B2B. |
| **Módulo de Live Tracking (GPS en Vivo)**| **MODULE / CAP**| Tenant Module | **OFF** | **OPTIONAL** | `[LOCKED]` | Seguimiento de repartidor en tiempo real. |
| **Módulo de Suscripciones Recurrentes**| **MODULE** | Tenant Module | **OFF** | **OPTIONAL** | `[FUTURE]` | Cobros semanales automáticos. |
| **Módulo de Mermas & Escandallos** | **MODULE** | Tenant Module | **OFF** | **OPTIONAL** | `[FUTURE]` | Control de costes y eficiencia. |
| **Módulo de Stock e Ingredientes** | **MODULE** | Tenant Module | **OFF** | **OPTIONAL** | `[FUTURE]` | Gestión de inventario de almacén. |
| **Enrutamiento Automatizado con IA** | **MODULE** | Tenant Module | **OFF** | **OPTIONAL** | `[FUTURE]` | Optimización avanzada de rutas. |

---

## 02 — Separation of Concerns: Platform vs Tenant Context vs EatClean

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. YOURMEAL OS PLATFORM CORE (Común e Inseparable)                     │
├────────────────────────────────────────────────────────────────────────┤
│ • Motor de ciclo de vida de pedidos y lógica de contenedor multi-día.  │
│ • Tenant Isolation absoluto en toda la plataforma.                     │
│ • Framework de operaciones de suelo y gestión de staff.                │
│ • Consola de plataforma y auditoría inmutable de soporte técnico.      │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 2. TENANT BUSINESS DATA & CONFIGURATION (Contexto Operativo del Tenant)│
├────────────────────────────────────────────────────────────────────────┤
│ • Catálogo de platos, recetas, precios y alérgenos.                    │
│ • Base de comensales, sedes físicas, marcas y zonas de entrega.        │
│ • Selección de métodos de pago y departamentos operativos activos.     │
│ • Activación selectiva de módulos habilitados.                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 3. EATCLEAN CONFIGURATION (Tenant Piloto #1)                           │
├────────────────────────────────────────────────────────────────────────┤
│ • Modelo de negocio: Comida saludable en Tenerife.                     │
│ • Estructura física: 1 Marca comercial, 1 Sede física central.         │
│ • Métodos de pago: Cobro externo (Bizum/Transferencias); Pasarela OFF. │
│ • Logística: Reparto por zonas ON; Live Tracking OFF.                  │
│ • Departamentos activos: Cocina ON, Packing ON, Reparto ON.            │
└────────────────────────────────────────────────────────────────────────┘
```
