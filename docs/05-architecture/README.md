# Architecture

**Source of truth for architecture decisions.** Lovable accelerates UI; it does not own architecture.

## Phase

**FOUNDATION ✅** → **[FOUNDATION LOCK](./FOUNDATION_LOCK.md)** → Module 01 · Evidence Gate

## Key documents

| Doc | Why |
|-----|-----|
| [FOUNDATION_LOCK.md](./FOUNDATION_LOCK.md) | Close the platform before features |
| [TENANT_BRANDING.md](./TENANT_BRANDING.md) | Contrato BrandConfig · Customer App white-label (ADR 0014) |
| [TENANT_EXPERIENCE_SPEC.md](./TENANT_EXPERIENCE_SPEC.md) | Identidad EatClean · checklist |
| [TENANT_IMPLEMENTATION_EATCLEAN.md](./TENANT_IMPLEMENTATION_EATCLEAN.md) | Brief Cursor/Lovable · EatClean v1 |
| [../07-experience/CUSTOMER_JOURNEYS.md](../07-experience/CUSTOMER_JOURNEYS.md) | Experience First · CJ-001 Pedido semanal |
| [architecture-review.md](./architecture-review.md) | As-built senior review |
| [MODULE_CONVENTION.md](./MODULE_CONVENTION.md) | `src/modules/...` layout |
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
