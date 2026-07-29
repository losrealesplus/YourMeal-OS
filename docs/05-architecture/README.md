# Architecture

**Source of truth for architecture decisions.** Lovable accelerates UI; it does not own architecture.

## Phase

**FOUNDATION ✅** → **[FOUNDATION LOCK](./FOUNDATION_LOCK.md)** → Module 01 · Evidence Gate

## Key documents

| Doc | Why |
|-----|-----|
| [FOUNDATION_LOCK.md](./FOUNDATION_LOCK.md) | Close the platform before features |
| [OPERATIONAL_LAYER_INDEPENDENCE.md](./OPERATIONAL_LAYER_INDEPENDENCE.md) | Capas certificadas evolucionan sin invalidar inferiores |
| [../00-status/OPERATIONAL_CORE_DECLARED.md](../00-status/OPERATIONAL_CORE_DECLARED.md) | Operational Core Declared — corazón del sistema |
| [../00-status/OPERATIONAL_CORE_CONTRACT.md](../00-status/OPERATIONAL_CORE_CONTRACT.md) | Core Contract ACTIVE — 8 garantías a módulos |
| [../00-status/CHANGE_AUTHORITY.md](../00-status/CHANGE_AUTHORITY.md) | Quién puede cambiar cada área del sistema |
| [../00-status/PLATFORM_PHASE_COMPLETE.md](../00-status/PLATFORM_PHASE_COMPLETE.md) | Fase de Plataforma COMPLETE |
| [../00-status/PLATFORM_BASELINE_v1.md](../00-status/PLATFORM_BASELINE_v1.md) | Baseline v1 — punto de partida de todo desarrollo futuro |
| [../00-status/PLATFORM_V1_CLOSED.md](../00-status/PLATFORM_V1_CLOSED.md) | Cierre formal Plataforma v1 |
| [../00-status/FLOW_CERTIFICATION_OPEN.md](../00-status/FLOW_CERTIFICATION_OPEN.md) | Flow como certificación operacional (no pantallas) |
| [../00-status/PR_TAXONOMY.md](../00-status/PR_TAXONOMY.md) | Categorías obligatorias de PR |
| [../00-status/CORE_DOCUMENTATION_CLOSED.md](../00-status/CORE_DOCUMENTATION_CLOSED.md) | Cierre documental Foundation / Identity / Core |
| [FOUR_LAYERS.md](./FOUR_LAYERS.md) | Knowledge · Platform · Materialization · Operational |
| [TENANT_BRANDING.md](./TENANT_BRANDING.md) | BrandConfig · Tenant-Managed runtime · `brand.manage` |
| [BRAND_CONTRACT.md](./BRAND_CONTRACT.md) | Límites logo/colores/WCAG |
| [BRAND_VALIDATION_CHECKLIST.md](./BRAND_VALIDATION_CHECKLIST.md) | Checklist post-gestión de marca |
| [TENANT_EXPERIENCE_SPEC.md](./TENANT_EXPERIENCE_SPEC.md) | Reglas permanentes de experiencia Tenant |
| [TENANT_IMPLEMENTATION_EATCLEAN.md](./TENANT_IMPLEMENTATION_EATCLEAN.md) | Implementación específica EatClean |
| [../07-experience/CUSTOMER_JOURNEYS.md](../07-experience/CUSTOMER_JOURNEYS.md) | Experience First · CJ-001 Pedido semanal |
| [architecture-review.md](./architecture-review.md) | As-built senior review |
| [MODULE_CONVENTION.md](./MODULE_CONVENTION.md) | `src/modules/...` layout |
| [OPERATIONAL_REPRESENTATION_PATTERN.md](./OPERATIONAL_REPRESENTATION_PATTERN.md) | Service → Report / Workspace (DICT-072) |
| [TENANT_OPERATIONAL_AUTONOMY.md](./TENANT_OPERATIONAL_AUTONOMY.md) | Criterio de madurez multi-tenant · WP-5 (DICT-073) |
| [../10-api/README.md](../10-api/README.md) | Service → Repository → Supabase |
| [../adr/0009-foundation-lock.md](../adr/0009-foundation-lock.md) | Lock ADR |
| [../adr/0014-customer-application-is-tenant-branded.md](../adr/0014-customer-application-is-tenant-branded.md) | Customer App = Tenant-Branded |

## As-built stack

```text
Route → Permission Guard → Service → Repository → Supabase (RLS)
```

Single `ServiceContext` (tenant, user, capabilities, localization, audit, flags, client).

## Layers

| Layer | Location | Must not |
|-------|----------|----------|
| Presentation | routes / module presentation | Business rules, direct Supabase business I/O |
| Application | `modules/*/application`, services | JSX |
| Domain | `modules/*/domain`, `src/domain` | I/O |
| Infrastructure | `modules/*/infrastructure` | Business rules |
| Permissions | `src/permissions` | Scattered role checks in UI |

## Related

- [Database](../06-database/README.md)
- [Business rules](../08-business-rules/README.md)
- [Domain model](../12-domain-model/README.md)
- [Capability matrix](../09-security/CAPABILITY_MATRIX.md)
- [Experience](../07-experience/README.md)
