# RBAC-001 · Surface Certification

**Epic:** EP-OPS-002  
**Estado:** **CERTIFIED** (2026-07-28)  
**Alcance:** Separación de superficies · navegación · no rediseño RBAC/Auth  
**PRE-CHECK:** [EP_OPS_002_PRECHECK](./EP_OPS_002_PRECHECK.md)

---

## Pregunta de certificación

> ¿Tenant Surface y Platform Surface están claramente separadas en rutas, menús, guards y responsabilidades?

**Respuesta: SÍ.**

---

## Superficies

| Surface | Raíz | Responsabilidad exclusiva |
|---------|------|---------------------------|
| **Tenant** | `/admin` | Clientes · Pedidos · Producción · Cocina · Delivery · Facturación · Operación diaria · Configuración del negocio |
| **Platform** | `/saas` | Gestión SaaS · Tenants · Suscripciones · Licencias · Platform Owners · Configuración global · Herramientas de plataforma |
| **Customer** | `/app` | Experiencia del cliente final (fuera del alcance operativo Tenant/Platform) |
| **Driver** | `/driver` | Operación de conductor (sub-superficie logística) |

### Nunca cruzado

| Surface | Prohibido |
|---------|-----------|
| Tenant `/admin` | Tenants globales · licencias SaaS · Platform Owners · gestión de plataforma |
| Platform `/saas` | Operación diaria de una empresa (cocina, repartos, pedidos del día) |

---

## Validación

| Aspecto | Evidencia | Resultado |
|---------|-----------|-----------|
| Navegación post-login | `homePathForRoles` · `resolveHomePath` · `decideOperationsCenterEntry` | PASS |
| Menú Tenant | `admin-shell` / Ops Center — módulos de negocio | PASS |
| Menú Platform | rutas `/saas/*` — tenants, licenses, roles SaaS | PASS |
| Breadcrumbs / headers | shells distintos por superficie | PASS |
| Acciones | capabilities por ruta (`assertCapabilityFromContext`) | PASS (sin cambio de matriz) |
| Guards | `assertStaffRoute` · `assertSaasRoute` | PASS |
| Casos negativos | [SURFACE_NAVIGATION_REPORT](./SURFACE_NAVIGATION_REPORT.md) · `route-guards.spec.ts` | PASS |

---

## Componentes compartidos (justificados)

| Compartido | Superficies | Justificación | Acción |
|------------|-------------|---------------|--------|
| Primitivos UI (`Button`, `DataTable`, `AdminHeader`, …) | Tenant (+ layout) | Design system — no lógica de dominio Platform | **Mantener** |
| `CustomerDirectoryService` | Support + Customers (ambos Tenant) | Mismo directorio de clientes; vistas con capabilities distintas | **Mantener** |
| Hub `/admin/settings` | Company Admin · híbrido con `company_admin` | Configuración **del negocio** (Tenant). Platform branding/tenants viven en `/saas` | **Mantener** (FCR-001 reclasificado: no es fuga Platform→Tenant) |
| Entry discreto SaaS | Tenant → Platform | `saas-ops-entry` solo si `saas.manage` | **Mantener** |

Ninguna vista Platform reutiliza pantallas de operación diaria Tenant sin justificación.

---

## Hallazgos FCR relacionados

| ID | PRE-CHECK | Post EP-OPS-002 |
|----|-----------|-----------------|
| FCR-001 | VALID — hub Tenant compartido cuando hay `company_admin` | **Cerrado como diseño** — Tenant settings ≠ Platform settings |
| RBAC-001 | Separación de rutas OK | **CERTIFIED** |

---

## Evidence Gate · RBAC-001

```text
STATUS: CERTIFIED

Evidence
  ☑ Tenant Surface ≠ Platform Surface (rutas + guards)
  ☑ Responsabilidades documentadas
  ☑ Componentes compartidos auditados y justificados
  ☑ Casos negativos de cross-surface PASS
  ☑ Sin cambios a Identity / Auth / RBAC capabilities / RLS

Gate: PASS
```
