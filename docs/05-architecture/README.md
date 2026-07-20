# Architecture

**Source of truth for architecture decisions.** Lovable accelerates UI; it does not own architecture.

## Phase

**FOUNDATION ✅** → **[FOUNDATION LOCK](./FOUNDATION_LOCK.md) 🚧** → Module 01

## Key documents

| Doc | Why |
|-----|-----|
| [FOUNDATION_LOCK.md](./FOUNDATION_LOCK.md) | Close the platform before features |
| [architecture-review.md](./architecture-review.md) | As-built senior review |
| [MODULE_CONVENTION.md](./MODULE_CONVENTION.md) | `src/modules/...` layout |
| [../10-api/README.md](../10-api/README.md) | Service → Repository → Supabase |
| [../adr/0009-foundation-lock.md](../adr/0009-foundation-lock.md) | Lock ADR |

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
