# Bitácora · Experience Refactor EatClean v1.1

**Knowledge Lifetime:** Iteration *(cerrada — no reeditar reglas aquí)*  
**Tipo:** changelog de sprint (no fuente de verdad permanente)  
**PRs:** ~#24 → #29  
**Reglas permanentes:** [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md)  
**Implementación EatClean:** [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md)  
**Contrato:** [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) · [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)  
**Siguiente hito:** [EatClean Pilot Ready](../00-status/MILESTONE_EATCLEAN_PILOT_READY.md) · [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md)

> Si una regla debe sobrevivir al siguiente sprint, **no** la añadas solo aquí: súbela a TENANT_EXPERIENCE_SPEC o a TENANT_IMPLEMENTATION_EATCLEAN.

---

## Objetivo del sprint

Hacer que EatClean deje de parecer un SaaS personalizado y se sienta como **dos productos** sobre YourMeal OS:

| Cara | Pregunta |
|------|----------|
| Customer App | ¿Qué quiero comer esta semana? |
| Centro de Operaciones | ¿Qué necesita hacer hoy mi equipo? |

**Alcance:** experiencia / navegación / copy / assets.  
**No tocó:** HP-001 · servicios · Supabase · lógica · RBAC.

---

## Cambios realizados

### Identidad

- Logo oficial EatClean en Login / Splash / Operaciones  
- Paleta web (verde · cream · golden = atención)  
- Tipografía Montserrat / Open Sans  
- Powered by reducido a firma en dos líneas  

### Login

- Jerarquía: logo → «¡Bienvenido!» → subtítulo de pedido semanal  
- Entrada staff etiquetada **Centro de Operaciones** (sin «Adm»)  
- `/auth/admin` → email/password · sin signup/OAuth cliente  

### Customer App (continuum v1 → v1.1)

- Home orientada a comida (hero · CTA · menú · favoritos · entrega)  
- Menú editorial (posts/tarjetas · macros · Añadir)  
- Resumen con confirmación calmada  
- Observación de uso: [CJ001_USAGE_OBSERVATION](./CJ001_USAGE_OBSERVATION.md)  

### Centro de Operaciones

- Reemplazo del dashboard KPI por agenda + workspaces  
- Nav: Operaciones · Pedidos · Clientes · Inventario · Más  
- Regla 1 workspace → directo · admin → todas las áreas  
- Doc OJ: [OPERATIONAL_JOURNEYS](./OPERATIONAL_JOURNEYS.md)  

### Tenant assets

- Carpetas `brand/` `copy/` `media/` `weekly-menu/` `promotions/` `onboarding/`  
- README unificado post-merge (`tenants/eatclean/`)  

---

## Resultado del sprint

La app empieza a leerse como producto digital de EatClean (ADR 0014), no como panel white-label.

**Siguiente hito de producto:** [EatClean Pilot Ready](../00-status/MILESTONE_EATCLEAN_PILOT_READY.md) (EP-01…EP-04) — contenido vivo + ciclo E2E. Ver también [§ Contenido vivo](#fotografía-y-contenido-vivo-prioridad-siguiente).

---

## Predecesor

Sprint UI inicial (5 pantallas): [EXPERIENCE_REFACTOR_EATCLEAN_V1](./EXPERIENCE_REFACTOR_EATCLEAN_V1.md).
