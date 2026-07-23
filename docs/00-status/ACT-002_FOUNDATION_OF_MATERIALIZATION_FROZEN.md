# ACT-002 · Foundation of Materialization Frozen

**Fecha:** 2026-07-23  
**Nivel:** Decision (gobernanza de plataforma + materialización Tenant)  
**Estado:** **Cerrada** / Frozen v1  
**Knowledge Lifetime:** Iteration *(acta inmutable al cierre)*  
**Bloque metodológico:** PR #24 → #31  
**Prerrequisito:** [ACT-001 · Experience Baseline Frozen](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) ✅  
**No es:** un ADR · un Spec de pantallas · permiso para rediseñar branding · evolución del framework FOPEBA

---

## Decisión

Queda **congelada** la **Foundation of Materialization** de YourMeal OS.

Eso significa que estos bloques pasan a **Frozen v1**:

| Bloque | Significado | Evidencia de cierre |
|--------|-------------|---------------------|
| **Foundation** | Core · RBAC · Services · Foundation Lock | Foundation Lock · IR-001 |
| **Methodology** | FOPEBA · Evidence · Dictionary · Knowledge Lifetime | Acta metodología · DICT · KL |
| **Tenant Branding** | Contract + runtime Tenant-Managed | ADR-0014 · Brand Contract · `brand.manage` · PR #31 |
| **Experience Baseline** | Superficies EatClean reconocibles y continuas | ACT-001 · #24→#30 |
| **Materialization** | Capas Knowledge → Platform → Materialization → Operational | [FOUR_LAYERS](../05-architecture/FOUR_LAYERS.md) |

A partir de este momento:

```text
❌ El siguiente trabajo ya no consiste en diseñar la infraestructura de materialización.
✅ Consiste en demostrar que un negocio real puede operar con ella.
```

---

## Evolución cerrada (contexto)

```text
FASE 0 — Foundation Lock
Arquitectura · ADRs · Core · RBAC · Servicios

        │
        ▼

FASE 1 — Tenant Materialization  (#24→#31)
#24 Tenant Experience
#25 ADR-0014
#26 Experience Refactor
#27 Weekly Menu
#28 Login
#29 Operations Center
#30 Brand Continuity · Pilot Ready · Knowledge Lifetime
#31 Tenant Branding Runtime (Tenant-Managed)

        │
        ▼

FASE 2 — Pilot Ready  (abierta)
EP-001…EP-005 · [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md)
```

---

## Mapa de cuatro capas (congelado como lectura del sistema)

```text
Knowledge Layer
────────────────
FOPEBA · ADRs · Evidence · Dictionary

↓

Platform Layer
──────────────
RBAC · Core Objects · Capabilities · Services · Repositories

↓

Materialization Layer
─────────────────────
BrandConfig · Branding · Experience · Tenant Assets · Localization

↓

Operational Layer
─────────────────
Weekly Experience · Kitchen · Delivery · Operations
```

Detalle: [FOUR_LAYERS](../05-architecture/FOUR_LAYERS.md).

---

## Qué cambia el tipo de decisión

| Antes (Fase 1) | Ahora (Fase 2) |
|----------------|----------------|
| ¿Cómo se materializa la identidad? | ¿Puede EatClean operar una semana solo con YourMeal OS? |
| Spec · ADR · Refactor | Guía de ejecución de piloto · evidencia |
| FOPEBA ayuda a construir | FOPEBA **observa** → Knowledge Update → Gate |
| Éxito = pantallas / continuidad de marca | Éxito = ciclo pedido → cocina → reparto → evidencia |

Pregunta de éxito (no negociable):

> **¿Puede un negocio real operar durante una semana completa utilizando exclusivamente YourMeal OS y generar evidencia suficiente para que FOPEBA confirme, corrija o amplíe el conocimiento obtenido?**

---

## Qué sí se puede hacer sin “descongelar” Materialization

- Ejecutar [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md)  
- Entregables **EP-001…EP-005**  
- Smoke · ORR · FOV · EC  
- Contenido vivo del Tenant (menú · fotos · macros) dentro de Brand Contract / Tenant Assets  
- Correcciones de bug / bloqueo demostrable del piloto  

## Qué no se acepta

- Rediseño de branding por preferencia  
- Nuevos ADRs de identidad “porque queda mejor”  
- Inventar fases o tipos de evidencia FOPEBA  
- Tratar Brand Journey (BJ) como concepto Accepted del Dictionary  

---

## Artefactos canónicos

| Nivel | Doc |
|-------|-----|
| Contract | [FOUR_LAYERS](../05-architecture/FOUR_LAYERS.md) · [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) · [Brand Contract](../05-architecture/BRAND_CONTRACT.md) · [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md) · [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) |
| Implementation | [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) · Brand Continuity Locked |
| Validation | [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md) · [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md) |
| Iteration | Esta acta (ACT-002) · ACT-001 |

---

## Relación con ACT-001

ACT-001 congela la **experiencia base EatClean** (superficies).  
ACT-002 congela la **infraestructura de materialización multi-tenant** (capas + branding runtime + metodología aplicada).

Ambas actas apuntan al mismo siguiente paso: **demostrar**, no rediseñar.
