# RBAC-001 · Surface Separation (Correction Evidence)

**Epic:** EP-OPS-002 · Correction  
**Estado:** **READY FOR RE-CERTIFICATION**  
**Fecha corrección:** 2026-07-28  
**Alcance:** Separación de superficies · navegación · sin rediseño RBAC/Auth/Identity  

---

## Comportamiento final

| Surface | Raíz | Responsabilidad exclusiva |
|---------|------|---------------------------|
| **Tenant** | `/admin` | Clientes · Pedidos · Producción · Cocina · Delivery · Facturación · Operación diaria · Configuración del negocio |
| **Platform** | `/saas` | Gestión SaaS · Tenants · Suscripciones · Licencias · Platform Owners · Configuración global · Herramientas de plataforma |
| **Customer** | `/app` | Experiencia del cliente final |
| **Driver** | `/driver` | Operación de conductor |

### Prohibiciones

| Surface | Nunca |
|---------|-------|
| Tenant `/admin` | Tenants globales · licencias SaaS · Platform Owners · gestión de plataforma |
| Platform `/saas` | Operación diaria de una empresa |

---

## Correcciones aplicadas

| Ítem | Cambio |
|------|--------|
| Cross-surface deny | `assertSaasRoute`: staff Tenant sin `saas.manage` → redirect `/admin` (no `/app`) |
| Platform entry | Solo con `saas.manage`; entry discreto Tenant→Platform cuando aplica |
| Settings hub Tenant | Se mantiene como configuración **del negocio**; Platform branding/tenants en `/saas` |

---

## Componentes compartidos (justificados — se mantienen)

| Compartido | Justificación |
|------------|---------------|
| Primitivos UI (design system) | Sin lógica de dominio Platform |
| `CustomerDirectoryService` | Mismo dominio Tenant (Support + Customers) |
| Hub `/admin/settings` | Configuración Tenant; no es superficie Platform |

Sin vistas Platform reutilizando operación diaria Tenant sin justificación.

---

## Re-Certification Gate (siguiente pasada RI-001)

```text
STATUS: READY FOR RE-CERTIFICATION

Correction evidence
  ☑ Tenant ≠ Platform en rutas y guards
  ☑ Shared components documentados
  ☑ Negativos cross-surface corregidos en código

Gate: — (no PASS · certificación en pasada RI-001)
```
