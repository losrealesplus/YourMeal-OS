# Architecture

**Source of truth for architecture decisions.** Lovable accelerates UI; it does not own architecture.

## Phase

**FOUNDATION ✅** → **[FOUNDATION LOCK](./FOUNDATION_LOCK.md)** → Module 01 · Evidence Gate

## Key documents

| Doc | Why |
|-----|-----|
| [FOUNDATION_LOCK.md](./FOUNDATION_LOCK.md) | Close the platform before features |
| [OPERATIONAL_LAYER_INDEPENDENCE.md](./OPERATIONAL_LAYER_INDEPENDENCE.md) | Capas certificadas evolucionan sin invalidar inferiores |
| [IDENTITY_LIFECYCLE.md](./IDENTITY_LIFECYCLE.md) | Identity → Profile → Membership → Role → Workspace |
| [MEMBERSHIP_LIFECYCLE.md](./MEMBERSHIP_LIFECYCLE.md) | Membership states + audit stamps |
| [IDENTITY_AUDIT.md](./IDENTITY_AUDIT.md) | identity_events · Activity Timeline |
| [USER_PROVISIONING.md](./USER_PROVISIONING.md) | Invitation · Provisioning · create ≠ access |
| [../00-status/OPERATIONAL_CORE_DECLARED.md](../00-status/OPERATIONAL_CORE_DECLARED.md) | Operational Core Declared — corazón del sistema |
| [../00-status/OPERATIONAL_CORE_CONTRACT.md](../00-status/OPERATIONAL_CORE_CONTRACT.md) | Core Contract ACTIVE — 8 garantías a módulos |
| [../00-status/CHANGE_AUTHORITY.md](../00-status/CHANGE_AUTHORITY.md) | Quién puede cambiar cada área del sistema |
| [../00-status/PLATFORM_PHASE_COMPLETE.md](../00-status/PLATFORM_PHASE_COMPLETE.md) | Fase de Plataforma COMPLETE |
| [../00-status/PLATFORM_BASELINE_v1.md](../00-status/PLATFORM_BASELINE_v1.md) | Baseline v1 — punto de partida de todo desarrollo futuro |
| [../00-status/PLATFORM_V1_CLOSED.md](../00-status/PLATFORM_V1_CLOSED.md) | Cierre formal Plataforma v1 |
| [../00-status/PLATFORM_FLOW_TRANSITION_DECLARED.md](../00-status/PLATFORM_FLOW_TRANSITION_DECLARED.md) | Acta: construcción → evidencia operacional |
| [../00-status/OPERATING_MODEL_v1.md](../00-status/OPERATING_MODEL_v1.md) | Constitución operativa — Flow dirige sobre arquitectura estable |
| [../00-status/FLOW_CERTIFICATION_OPEN.md](../00-status/FLOW_CERTIFICATION_OPEN.md) | Flow como certificación operacional (no pantallas) |
| [../00-status/FLOW_GOVERNANCE.md](../00-status/FLOW_GOVERNANCE.md) | Política permanente: desarrollo nace desde Flow |
| [../00-status/FLOW_FIRST.md](../00-status/FLOW_FIRST.md) | Regla diaria: feature → Flow |
| [../00-status/FLOW_DEFINITION_OF_DONE.md](../00-status/FLOW_DEFINITION_OF_DONE.md) | Done = Handoff → Evidence → Certification |
| [../00-status/FLOW_WORK_HIERARCHY.md](../00-status/FLOW_WORK_HIERARCHY.md) | Spec → Execution → Evidence → Certification → Readiness |
| [../00-status/FLOW_CATALOG.md](../00-status/FLOW_CATALOG.md) | FLOW-01…03 (Kitchen → Delivery → Support → Accounting) |
| [../00-status/PR_TAXONOMY.md](../00-status/PR_TAXONOMY.md) | Categorías obligatorias de PR |
| [../00-status/CORE_DOCUMENTATION_CLOSED.md](../00-status/CORE_DOCUMENTATION_CLOSED.md) | Cierre documental Foundation / Identity / Core |
| [FOUR_LAYERS.md](./FOUR_LAYERS.md) | Knowledge · Platform · Materialization · Operational |
| [TENANT_BRANDING.md](./TENANT_BRANDING.md) | BrandConfig · Tenant-Managed runtime · `brand.manage` |
| [BRAND_CONTRACT.md](./BRAND_CONTRACT.md) | Límites logo/colores/WCAG |
| [BRAND_VALIDATION_CHECKLIST.md](./BRAND_VALIDATION_CHECKLIST.md) | Checklist post-gestión de marca |
| [TENANT_EXPERIENCE_SPEC.md](./TENANT_EXPERIENCE_SPEC.md) | Reglas permanentes de experiencia Tenant |
| [TENANT_IMPLEMENTATION_EATCLEAN.md](./TENANT_IMPLEMENTATION_EATCLEAN.md) | Implementación específica EatClean |
| [RUNTIME_SECRET_GATEWAY.md](./RUNTIME_SECRET_GATEWAY.md) | Command Palette oculta · YMOS Horus → Runtime Suite |
| [RUNTIME_SUITE.md](./RUNTIME_SUITE.md) | Runtime Suite · Lifecycle RUNTIME-SUITE-001 |
| [DEVELOPER_PORTAL.md](./DEVELOPER_PORTAL.md) | Developer Portal · triple-tap · passphrase · HORUS |
| [RUNTIME_CORE.md](./RUNTIME_CORE.md) | Runtime Core · Developer Platform v1.0 kernel |
| [DEVELOPER_PLATFORM_HOST.md](./DEVELOPER_PLATFORM_HOST.md) | Runtime Host · shell dinámico · DEVELOPER-PLATFORM-003 |
| [DEVELOPER_PLATFORM.md](./DEVELOPER_PLATFORM.md) | Vocabulario · Portal / Platform / Runtime Engine |
| [DEVELOPER_PLATFORM_ROADMAP.md](./DEVELOPER_PLATFORM_ROADMAP.md) | Roadmap congelado · riesgo Product Core |
| [DOCTOR_ENGINE.md](./DOCTOR_ENGINE.md) | Doctor Engine · checks · Health Score · v1.1 |
| [INCIDENT_ENGINE.md](./INCIDENT_ENGINE.md) | Incident Engine · FOPEBA Incident Objects · v1.2 |
| [DOCTOR_UI.md](./DOCTOR_UI.md) | Doctor UI · glance diagnostics · v1.3 |
| [KNOWLEDGE_ENGINE.md](./KNOWLEDGE_ENGINE.md) | Knowledge Engine · Diagnostic Knowledge Model · v1.4 |
| [RECOMMENDATION_ENGINE.md](./RECOMMENDATION_ENGINE.md) | Recommendation Engine · decisiones · v1.5 |
| [CAPABILITY_ENGINE.md](./CAPABILITY_ENGINE.md) | Capability Engine · RuntimeCapability · v1.6 |
| [RECOVERY_ENGINE.md](./RECOVERY_ENGINE.md) | Recovery Engine · orchestrate recover/verify · v1.7 |
| [DEVELOPER_PLATFORM_v1.md](./DEVELOPER_PLATFORM_v1.md) | Constitución Developer Platform v1.0 · FROZEN |
| [BOOTSTRAP_PIPELINE.md](./BOOTSTRAP_PIPELINE.md) | App Bootstrap Pipeline · PRODUCT-CORE-001/002 · executable contract |
| [BOOTSTRAP_STATE_MACHINE.md](./BOOTSTRAP_STATE_MACHINE.md) | Operational Bootstrap OP-001 (Day-0 ladder · distinto del App Bootstrap) |
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
