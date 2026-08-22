# YOURMEAL OS — PRODUCT DESIGN 02-D
## CROSS-SYSTEM RESPONSIBILITY & FORBIDDEN ACTIONS MATRICES

---

## 01 — Cross-System Responsibility Matrix `[DECISIÓN 98]`

| Acción / Capacidad | Comensal (`Customer`) | Tenant (`Tenant Authority / Delegable`) | Operaciones (`Operations`) | Automatización (`System Automation`) | Proveedor Externo (`Integration`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Crear Pedido** | **ALLOWED** | **ALLOWED** *(Staff Intake)* | **FORBIDDEN** | **CONDITIONAL** *(Suscripciones preautorizadas)*| **CONDITIONAL** *(Canales autorizados)* |
| **Solicitar Modificación** | **ALLOWED** *(Petición universal)*| **ALLOWED** | **FORBIDDEN** | **FORBIDDEN** | **FORBIDDEN** |
| **Modificación Directa de Pedido**| **CONDITIONAL** *(Preautorizado antes corte)*| **ALLOWED** *(Auditado)* | **FORBIDDEN** | **CONDITIONAL** *(Flujo preautorizado)* | **FORBIDDEN** |
| **Aprobar / Resolver Modificación**| **FORBIDDEN** | **ALLOWED** *(Delegable por config)*| **FORBIDDEN** | **CONDITIONAL** *(Reglas preautorizadas)*| **FORBIDDEN** |
| **Solicitar Cancelación** | **ALLOWED** *(Petición universal)*| **ALLOWED** | **FORBIDDEN** | **FORBIDDEN** | **FORBIDDEN** |
| **Cancelación Directa de Pedido**| **CONDITIONAL** *(Preautorizado antes corte)*| **ALLOWED** *(Auditado)* | **FORBIDDEN** | **CONDITIONAL** *(Flujo preautorizado)* | **FORBIDDEN** |
| **Aprobar / Resolver Cancelación**| **FORBIDDEN** | **ALLOWED** *(Delegable por config)*| **FORBIDDEN** | **CONDITIONAL** *(Reglas preautorizadas)*| **FORBIDDEN** |
| **Confirmar Pago** | **FORBIDDEN** *(Adjunta comprobante)* | **ALLOWED** *(Verificación staff)*| **FORBIDDEN** | **CONDITIONAL** *(Pasarela online)* | **CONDITIONAL** *(Notificación validada)* |
| **Modificar Estado de Pago** | **FORBIDDEN** | **ALLOWED** *(Delegable por config)*| **FORBIDDEN** | **CONDITIONAL** *(Flujo preautorizado)* | **CONDITIONAL** *(Evento pasarela)* |
| **Ejecución Operativa (Cocina N1 / Packing N2)**| **FORBIDDEN** | **CONDITIONAL** *(Si asignado a rol)* | **ALLOWED** | **CONDITIONAL** *(Auto-etapas)* | **FORBIDDEN** |
| **Decisión Comercial** | **FORBIDDEN** | **ALLOWED** | **FORBIDDEN** *(Salvo delegación expresa)*| **FORBIDDEN** | **FORBIDDEN** |
| **Avanzar Estado Operativo**| **FORBIDDEN** | **ALLOWED** | **ALLOWED** | **CONDITIONAL** *(Auto-etapas)* | **CONDITIONAL** *(Evento de entrega)* |
| **Completar Entrega** | **FORBIDDEN** *(Confirma recepción)* | **ALLOWED** | **ALLOWED** *(Repartidor)* | **FORBIDDEN** | **CONDITIONAL** *(Evento de courier)* |
| **Emitir Notificaciones** | **FORBIDDEN** | **ALLOWED** *(Delegable)* | **CONDITIONAL** *(Avisos internos)*| **ALLOWED** *(Event-driven)* | **FORBIDDEN** |
| **Crear Incidencia** | **CONDITIONAL** *(Reclamación asistida)*| **ALLOWED** | **ALLOWED** *(Suelo operativo)*| **ALLOWED** *(Fallo de integración)*| **CONDITIONAL** *(Fallo de courier)* |
| **Resolver Incidencia** | **FORBIDDEN** | **ALLOWED** *(Delegable por config)*| **CONDITIONAL** *(Si autorizado)* | **FORBIDDEN** | **FORBIDDEN** |
| **Acceso a Reportes** | **FORBIDDEN** | **ALLOWED** *(Contexto Tenant)* | **CONDITIONAL** *(Hojas de cocina)*| **ALLOWED** *(Generación periódica)*| **FORBIDDEN** |
| **Consulta de Auditoría** | **CONDITIONAL** *(Su propio historial)*| **ALLOWED** *(Auditoría completa)*| **CONDITIONAL** *(Su rol / turno)*| **ALLOWED** *(Registro inmutable)* | **FORBIDDEN** |
| **Configuración de Políticas**| **FORBIDDEN** | **ALLOWED** *(Autoridad Tenant)* | **FORBIDDEN** | **FORBIDDEN** | **FORBIDDEN** |

---

## 02 — Forbidden Actions Matrix `[DECISIÓN 97]`

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ACCIONES TAXATIVAMENTE PROHIBIDAS POR DOMINIO                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ❌ COMENSAL (Customer):                                                          │
│ • No puede modificar estados operativos ni aplicar cancelaciones directas sin    │
│   preautorización explícita del Tenant.                                          │
│ • No puede acceder a datos, menús privados ni pedidos de otros comensales.       │
│ • No puede ver raciones, inventarios ni recetas internas de cocina.              │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ❌ OPERARIOS (Operations):                                                       │
│ • No pueden alterar precios, menús, descuentos ni tomar decisiones comerciales   │
│   a menos que hayan sido explícitamente delegadas en la configuración del Tenant.│
│ • No pueden verificar pagos ni cambiar el estado financiero de los pedidos.      │
│ • No pueden cancelar pedidos comercialmente sin autorización del Tenant.         │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ❌ TENANT (Administración / Staff):                                              │
│ • No puede acceder a los datos, clientes o pedidos de otros Tenants.            │
│ • No puede consultar contraseñas en texto plano de comensales ni empleados.      │
│ • No puede eliminar pedidos del historial (solo cancelarlos con auditoría).      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ❌ PLATAFORMA / AUTOMATIZACIÓN (YourMeal OS):                                    │
│ • No puede tomar decisiones comerciales autónomas sin preautorización del Tenant.│
│ • No puede realizar cambios silenciosos en el contexto de un Tenant sin auditar. │
│ • No puede fusionar datos de clientes entre distintos Tenants.                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ❌ PROVEEDORES EXTERNOS (Integrations):                                          │
│ • No pueden tomar decisiones comerciales por el Tenant ni modificar políticas.   │
│ • Solo pueden emitir eventos o datos específicos autorizados por la plataforma.  │
└──────────────────────────────────────────────────────────────────────────────────┘
```
