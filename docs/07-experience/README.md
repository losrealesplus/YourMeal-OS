# 07 · Experience

**Cuarto dominio** de YourMeal OS (junto a Knowledge · Engineering · Operations).  
Ver mapa completo: [PROJECT_DOMAINS](../00-status/PROJECT_DOMAINS.md).

Capa de **experiencia del usuario final** (Customer Application).

| Documento | Responde a |
|-----------|------------|
| [Operational Model](../17-operational-model/README.md) | ¿Cómo funciona la operación? |
| **Experience** (esta carpeta) | ¿Cómo la vive el usuario? |
| [CJ001_USAGE_OBSERVATION](./CJ001_USAGE_OBSERVATION.md) | ¿Una persona real completa el pedido sin ayuda? |

## Principio: Experience First

```text
Antes (orientado a capacidades)     Ahora (orientado a recorrido)
─────────────────────────────       ─────────────────────────────
Capability                          Customer Journey
    ↓                                   ↓
Screen                              Screen
                                        ↓
                                    Capability
```

La capability no cambia. La pantalla se diseña desde el **recorrido del usuario**, no desde la estructura interna del sistema.

**Pregunta de diseño (Customer App):**

> ¿Mi madre podría hacer un pedido sin que nadie le explique la app?

Si un usuario nuevo necesita explicación para completar **CJ-001**, hay que mejorar la experiencia — aunque el flujo técnico funcione.

## Regla de pantallas

> **Ninguna pantalla existe por sí sola. Toda pantalla pertenece exactamente a un Customer Journey o a un Operational Journey.**

```text
Customer Journey → Screen → Capability
Operational Journey → Screen → Capability
```

Nunca al revés. Evita pantallas «porque podrían ser útiles».

**Pregunta de diseño (Centro de Operaciones):**

> ¿El equipo sabe qué hacer hoy sin mirar un dashboard de KPIs?

## Cadena completa

```text
Customer Journey
        ↓
Screen (SCR)
        ↓
Capability
        ↓
Operational Model
        ↓
Evidence
```

## Revisión de PR (Experience)

Antes de aprobar cualquier pantalla / cambio de Experience, responder **las cinco**:

1. ¿A qué **Customer Journey** pertenece?  
2. ¿Qué **Capability** utiliza?  
3. ¿Qué **Operational Object** representa?  
4. ¿Qué **decisión** toma el usuario en esta pantalla?  
5. ¿Qué **evidencia** futura esperamos obtener de ella en FOV?

Si no puede responderlas, la pantalla **aún no está justificada**.

## Trazabilidad de pantalla (SCR)

Campo opcional — extensión natural OM ↔ implementación:

```yaml
Screen:
  id: SCR-006
  name: Weekly Menu
Journey: CJ-001
Capabilities:
  - CAP-003
  - CAP-004
Operational Objects:
  - Weekly Menu
  - Order
Evidence:
  - FOV-001   # cuando exista
```

Cada pantalla debe poder responder: ¿por qué existe? · ¿qué capability? · ¿qué objeto OM? · ¿qué evidencia?

Inventario SCR del MVP: [CUSTOMER_JOURNEYS § Pantallas](./CUSTOMER_JOURNEYS.md#inventario-de-pantallas-mvp--12-15).

## Documentos

| Doc | Rol |
|-----|-----|
| [CUSTOMER_JOURNEYS](./CUSTOMER_JOURNEYS.md) | Recorridos CJ-xxx · pantallas MVP · SCR |
| [OPERATIONAL_JOURNEYS](./OPERATIONAL_JOURNEYS.md) | Recorridos OJ-xxx · Centro de Operaciones · Workspaces |
| [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) | Contrato técnico BrandConfig · recursos |
| [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) | Reglas **permanentes** de experiencia Tenant |
| [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) | Implementación específica EatClean |
| [EXPERIENCE_REFACTOR_EATCLEAN_V1](./EXPERIENCE_REFACTOR_EATCLEAN_V1.md) | Bitácora sprint UI · 5 pantallas |
| [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](./EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md) | Bitácora sprint · Login + Operaciones (#24→#29) · **Iteration** |
| [MILESTONE_EATCLEAN_PILOT_READY](../00-status/MILESTONE_EATCLEAN_PILOT_READY.md) | Milestone abierto · EP-001…EP-005 |
| [ACT-001 Experience Baseline Frozen](../00-status/ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) | Congelación experiencia base (#24→#30) |
| [BRAND_JOURNEY_HYPOTHESIS](./BRAND_JOURNEY_HYPOTHESIS.md) | 🧪 Hipótesis BJ — no oficial FOPEBA |
| [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md) | Contract · Implementation · Iteration |
| [PROJECT_DOMAINS](../00-status/PROJECT_DOMAINS.md) | Mapa de cuatro dominios |

## Relacionado

- [07-user-flows](../07-user-flows/README.md) — flujos técnicos / rutas  
- ADR [0014](../adr/0014-customer-application-is-tenant-branded.md) · Dictionary Experience First / Customer Journey / Screen
