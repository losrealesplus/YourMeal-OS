# Brand

## Dos productos · dos identidades

| Producto | Marca visible | Audiencia |
|----------|---------------|-----------|
| **YourMeal OS** (SaaS corporativo) | YourMeal OS | Empresas que contratan la plataforma |
| **Customer Application** | **Tenant** (100%) | Clientes finales de cada empresa |

Decisión permanente: [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md).  
Contrato técnico: [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md).

```text
La Customer Application pertenece al Tenant.
YourMeal OS pertenece al proveedor del servicio.
```

> **The Platform owns the capability. The Tenant owns the experience.**

En front office, YourMeal OS solo puede aparecer como **Powered by YourMeal OS** (configurable).

---

## Producto A — YourMeal OS

**Nombre:** YourMeal OS  

**Tagline:** The Operating System for Meal Prep & Catering  

**Voz:** profesional · clara · operacional (no lifestyle-marketing dentro del OS) · multilingual.

**Dirección visual (chrome corporativo):** [04-design](../04-design/README.md) — “Stainless industrial precision”.

---

## Producto B — Tenant (ejemplo: EatClean Tenerife)

Branding completo vía `BrandConfig` del Tenant (`tenants.brand` + assets).  
Nombre, logo, colores, tipografía, copy, stores y splash son del Tenant — no de YourMeal OS.

Experiencia concreta (copy, login, home, nav): [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md)  
Brief Cursor/Lovable: [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md)  
Assets: [`tenants/eatclean/`](../../tenants/eatclean/README.md)  
Fuente de identidad: [eatcleantenerifecatering.es](https://eatcleantenerifecatering.es/)

---

## Relacionado

- [ADR 0003 Multi-tenant](../adr/0003-multi-tenant.md)  
- Dictionary: Customer Application · BrandConfig · Tenant-Branded · Powered by YourMeal OS
