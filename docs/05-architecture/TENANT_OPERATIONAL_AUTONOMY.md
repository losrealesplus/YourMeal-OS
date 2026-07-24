# Tenant Operational Autonomy

**DICT:** [DICT-073 · Tenant Operational Autonomy](../99-reference/PROJECT_DICTIONARY.md#tenant-operational-autonomy)  
**EP de materialización (RI-001):** [EP-OPS-001 · WP-5](../00-status/EP_OPS_001_OPERATIONAL_CENTER_READINESS.md#wp-5--tenant-provisioning-capacidad-de-plataforma)  
**Complementa:** Dual Ops Center · Operational Visibility (DICT-071)

---

## Principio

> **Un tenant no está operacionalmente activo hasta que puede autogestionar su organización sin intervención del proveedor SaaS.**

Ese es el criterio de madurez — no “existen pantallas de admin”, sino que el cliente puede ponerse en marcha solo.

---

## WP-5 no es una pantalla

WP-5 es una **capacidad de plataforma**: **aprovisionar un tenant**.

Su misión no es “crear administradores”. Es dejar al tenant en estado operable:

```text
saas_admin aprovisiona tenant + Company Admin
        │
        ▼
Company Admin gestiona usuarios y roles del tenant
        │
        ▼
Staff inicia sesión y opera solo su área
        │
        ▼
Tenant operacionalmente activo
```

---

## Alcance mínimo (plataforma)

| Capacidad | Superficie | Contenido |
|-----------|------------|-----------|
| Tenant Management | `/saas` | Listar · crear · activar/desactivar · estado · branding asociado |
| Company Administration | `/saas` → tenant | Crear/editar/desactivar Company Admin · restablecer contraseña o invitar · ver estado |
| Roles | `/saas` y `/admin` (según actor) | Asignar **roles del sistema**, no permisos individuales |
| Membership (RI-001) | Modelo | **Un usuario pertenece a un único tenant** (multi-tenant membership = fuera de RI-001) |
| Auditoría | `audit_log` | Toda acción con actor · timestamp · tenant · resultado |

### Roles soportados (piloto)

```text
Company Admin
Kitchen
Delivery
Customer Support
Finance
Operations
Custom (futuro)
```

Los permisos los define el sistema; desde WP-5 solo se asignan roles.

---

## Membership · decisión RI-001

Para RI-001 queda **explícito**:

> Un usuario pertenece a un único tenant.

Si en el futuro se admite multi-membership, será un cambio de modelo documentado (KU / ADR), no una interpretación tácita de WP-5.

---

## Relación con Architecture Freeze

Tras **EP-OPS-001 PASS**, la arquitectura se congela temporalmente hasta cerrar RI-001:

- ❌ No nuevos módulos  
- ❌ No nuevos patrones arquitectónicos  
- ❌ No nuevas capacidades  

Solo: corrección de defectos · evidencia · certificación.

Ver hoja de ruta en [EP-OPS-001](../00-status/EP_OPS_001_OPERATIONAL_CENTER_READINESS.md#hoja-de-ruta).
