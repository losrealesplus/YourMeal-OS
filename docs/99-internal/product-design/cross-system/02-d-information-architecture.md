# YOURMEAL OS — PRODUCT DESIGN 02-D
## DOMAIN BOUNDARIES & DATA EXCHANGE ARCHITECTURE

---

## 01 — Cross-Domain Map

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             YOURMEAL OS PLATFORM                                 │
│                   (Global Governance & Security Foundation)                      │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
          TENANT DOMAIN (EatClean)                    TENANT DOMAIN (SaaS B)
┌───────────────────────────────────────────┐      ┌──────────────────────────────┐
│                                           │      │                              │
│  ┌─────────────────┐ ┌─────────────────┐  │      │                              │
│  │ CUSTOMER DOMAIN │ │OPERATIONS DOMAIN│  │      │   ISOLATED TENANT CONTEXT    │
│  │  (Autoservicio, │ │ (Cocina N1,     │  │      │     (Clientes, Pedidos,      │
│  │   Menús,        │ │  Packing N2,    │  │      │      Catálogo, Ajustes)      │
│  │   Mi Pedido)    │ │  Logística)     │  │      │                              │
│  └────────┬────────┘ └────────┬────────┘  │      │                              │
│           │                   │           │      │                              │
│           └─────────┬─────────┘           │      │                              │
│                     ▼                     │      │                              │
│         TENANT MANAGEMENT DOMAIN          │      │                              │
│   (Catálogo Maestro, Precios, Cobros,     │      │                              │
│    Marcas, Sedes, Staff, Políticas)       │      │                              │
└───────────────────────────────────────────┘      └──────────────────────────────┘
```

---

## 02 — Domain Boundaries & Scopes

### 1. CUSTOMER DOMAIN (Comensal / Cliente Final) `[02-A]`
* **Propósito:** Descubrimiento de menús, planificación de comidas semanales, formalización de pedidos, solicitud de modificaciones, solicitud de cancelación asistida y consulta de estado.
* **Límites:** El comensal solo tiene visibilidad sobre sus propios pedidos, direcciones, perfil y el menú publicado por el Tenant activo. No tiene acceso a datos de otros comensales, inventarios, costes ni pantallas de producción.

### 2. TENANT MANAGEMENT DOMAIN (Administración del Negocio) `[02-C]`
* **Propósito:** Orquestador comercial y operacional del negocio. Define el catálogo maestro, planifica menús semanales, fija precios base y por sede, verifica comprobantes de pago, administra el staff, configura zonas de entrega y gobierna las políticas del sistema.
* **Límites:** El Tenant conserva la autoridad comercial de su organización y puede delegar acciones operativas y comerciales autorizadas a roles configurados. No tiene visibilidad sobre otros Tenants de la plataforma.

### 3. OPERATIONS DOMAIN (Centro de Producción & Suelo Operativo) `[02-B]`
* **Propósito:** Transformación de pedidos confirmados en raciones elaboradas y empaquetadas. Cocina ejecuta la demanda agregada (N1) y Packing ejecuta la trazabilidad individual y etiquetado (N2).
* **Límites:** El personal operativo visualiza únicamente los datos indispensables para cocinar y despachar (platos, fechas, cantidades, alérgenos, notas de entrega y nombres de comensal en mesa de empaquetado). Ejecuta cambios operacionales dentro de su alcance autorizado; no adquiere autoridad comercial salvo delegación expresa configurada por el Tenant.

### 4. PLATFORM SUPER ADMIN DOMAIN (Gobernanza Global de YourMeal OS)
* **Propósito:** Provisión de organizaciones, soporte técnico transversal y auditoría global.
* **Límites:** Solo interviene en el contexto de un Tenant bajo justificación explícita y sesión 100% auditada (`Act as Tenant / Support Context`).

---

## 03 — Multi-Tenant Identity Architecture `[DECISIONES 29, 30, 31]`

```text
                        GLOBAL CUSTOMER IDENTITY (Email)
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
       TENANT A PROFILE                              TENANT B PROFILE
  (EatClean Healthy Meals)                       (Singular Street Food)
        ├── Preferencias / Alérgenos                   ├── Preferencias / Alérgenos
        ├── Direcciones de Entrega                     ├── Direcciones de Entrega
        ├── Carrito Activo                             ├── Carrito Activo
        └── Histórico de Pedidos                       └── Histórico de Pedidos
```

* **Aislamiento Estricto `[LOCKED]`:** Un mismo comensal puede ser cliente de múltiples Tenants usando el mismo correo, pero sus datos de perfil, direcciones, pedidos y preferencias están totalmente encapsulados por organización.
* **Desactivación Aislada `[LOCKED]`:** Si el Tenant A suspende a un comensal, este pierde acceso exclusivamente a los servicios del Tenant A; su cuenta y operativa en el Tenant B permanecen intactas.

---

## 04 — Data Exchange Contract (Contrato Funcional de Intercambio) `[DECISIÓN 96]`

| Flujo de Datos | Emisor $\rightarrow$ Receptor | Información Transmitida | Finalidad de Negocio | Momento / Disparador | Datos Prohibidos / Restringidos |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **DEX-01: Formalización de Pedido** | Customer $\rightarrow$ Tenant | Selección de platos por día, dirección de entrega, franja horaria, notas y método de pago propuesto. | Registrar la intención de compra y reservar franja de entrega. | Al confirmar pedido en WebApp comensal. | Datos técnicos internos, flags de auditoría, estados de cocina. |
| **DEX-02: Liberación Operativa** | Tenant $\rightarrow$ Operations | Líneas de pedido confirmadas, fecha de servicio, sede asignada, alérgenos, variantes y nombre del cliente para packing. | Planificar producción de cocina (N1) y checklist de empaquetado (N2). | Pedido confirmado o liberación anticipada configurada. | Precios pagados, costes de adquisición, datos de facturación privada del cliente. |
| **DEX-03: Progresión de Estado** | Operations $\rightarrow$ Customer | Estado operativo público (`En preparación`, `Listo para entrega`, `En reparto`, `Entregado`). | Mantener al comensal informado en tiempo real de su comida. | Al avanzar etapas en pantalla de cocina, packing o reparto. | Incidencias internas no resueltas, mermas de cocinado, notas privadas de personal. |
| **DEX-04: Solicitud de Modificación** | Customer $\rightarrow$ Tenant | Platos modificados, cambio de día o ajuste de dirección solicitada con motivo. | Someter a aprobación del negocio cambios en pedidos confirmados. | Comensal solicita modificar pedido en curso. | Modificación directa sin aprobación si el pedido ya está en producción o fuera de corte. |
| **DEX-05: Ajuste Operativo por Cambio** | Tenant $\rightarrow$ Operations | Actualización de orden canónica, historial de cambios, ajuste de raciones e instrucciones. | Actualizar la hoja de producción de cocina y checklist de packing. | Tenant o rol autorizado aprueba cambio solicitado. | Aplicación silenciosa de cambios sin notificar al suelo de cocina. |
| **DEX-06: Notificación de Incidencia** | Operations $\rightarrow$ Tenant | Reporte de rotura de stock, retraso de cocinado o imposibilidad de entrega. | Solicitar decisión comercial al Tenant y contactar al cliente. | Operario registra incidencia en cocina o reparto. | Cancelación comercial autónoma directa por parte del operario sin aval del Tenant. |
| **DEX-07: Comprobante de Pago** | Customer $\rightarrow$ Tenant | Captura de justificante Bizum / Transferencia y referencia de pago. | Permitir la verificación manual de cobro por el Staff autorizado. | Comensal sube justificante en pantalla de pago. | Visibilidad del comprobante para personal de cocina o reparto. |
