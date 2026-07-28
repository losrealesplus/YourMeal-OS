# RBAC-001 · Surface Certification

**Epic:** EP-OPS-002  
**Estado:** ✅ **CERTIFIED** (2026-07-28)  
**Ciclo:** Discovery → Evaluation → Correction → Re-Certification → CERTIFIED  
**Alcance:** Separación de superficies · navegación · no rediseño RBAC/Auth/Identity  

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
| **Customer** | `/app` | Experiencia del cliente final |
| **Driver** | `/driver` | Operación de conductor |

### Nunca cruzado

| Surface | Prohibido |
|---------|-----------|
| Tenant `/admin` | Tenants globales · licencias SaaS · Platform Owners · gestión de plataforma |
| Platform `/saas` | Operación diaria de una empresa |

---

## Validación

| Aspecto | Evidencia | Resultado |
|---------|-----------|-----------|
| Navegación post-login | `homePathForRoles` · `resolveHomePath` · `decideOperationsCenterEntry` | PASS |
| Menú Tenant / Platform | shells y rutas separados | PASS |
| Guards | `assertStaffRoute` · `assertSaasRoute` | PASS |
| Negativo Company Admin → `/saas` | redirect `/admin` | PASS |
| Casos negativos | [SURFACE_NAVIGATION_REPORT](./SURFACE_NAVIGATION_REPORT.md) · `route-guards.spec.ts` | PASS |

---

## Componentes compartidos (justificados)

| Compartido | Justificación |
|------------|---------------|
| Primitivos UI | Design system |
| `CustomerDirectoryService` | Mismo dominio Tenant (Support + Customers) |
| Hub `/admin/settings` | Configuración del negocio (Tenant); Platform en `/saas` |

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
