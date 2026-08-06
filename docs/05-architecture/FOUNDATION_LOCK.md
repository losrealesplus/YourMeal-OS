# Foundation Lock

**Estado:** ✅ **CERRADO** — 2026-07-20  
**Tag:** `v0.1.0` — `FOUNDATION LOCKED`  
**Regla:** *Ningún cambio arquitectónico sin ADR.*

La plataforma queda cerrada. La infraestructura y la arquitectura base se consideran estables. El foco pasa al dominio de negocio (Module 01).

Ver [CHANGELOG](../../CHANGELOG.md) y [estado del proyecto](../00-status/README.md).

---

## Por qué existió

> Foundation is real. The risk is false readiness.

Foundation Lock eliminó la falsa madurez: RBAC en runtime, soft delete, ServiceContext, repositorios y errores de dominio.

## Checklist (completado)

### Lock 1 — Runtime RBAC ✅

```text
Route → Permission Guard → Service → Repository → Database (RLS)
```

### Lock 2 — Soft delete ✅

`archive` / `restore` / `purge` — nunca `delete()` en Services de negocio.

### Lock 3 — ServiceContext ✅

Contexto único: tenant, user, capabilities, localization, audit, flags, cliente Supabase, IP.

### Lock 4 — Repository layer ✅

```text
UI → Service → Repository → Supabase
```

### Lock 5 — Domain errors ✅

Errores tipados (`PermissionDenied`, `DishNotFound`, …).

## Pulido pendiente (no bloquea Module 01)

- Filtrado de navegación admin por capabilities
- ADR de tablas junction (cascade vs soft-delete)

## Después del lock

1. Tag `v0.1.0` aplicado / documentado.
2. Module 01: **entidades de dominio primero**; UI al final.
3. Orden congelado: Dish → Ingredient → Recipe → … → UI → CRUD.

---

## Capability Pattern (permanente · OPERATIONAL-001)

Toda Operational Module sigue esta dirección — **nunca al revés**:

```text
Capability
    ↓
Contract (ADR)
    ↓
Facade
    ↓
Services
    ↓
Store
    ↓
UI
```

**Prohibido** como camino de diseño:

```text
UI → Service → Database
```

(La UI puede *llamar* Services vía Facade; no *posee* el ciclo de vida ni el contrato.)

Ejemplo Identity:

```text
Identity Capability (ADR 0055)
    ↓
IdentityFacade / useIdentity (ADR 0056)
    ↓
Bootstrap Stages + Auth services (unchanged)
    ↓
BootstrapIdentityStore / AuthState
    ↓
Shells / modules (observe · consume)
```

Regla: Operational Modules **nunca** importan Supabase Auth ni coordinan carga de identidad; consumen `IdentityFacade`.

---

## FOUNDATION LAW 002 (permanente · OPERATIONAL-002)

```text
Every Operational Capability
owns exactly one Facade.
Capabilities never expose storage.
Capabilities expose business concepts.
```

```text
UI
 ↓
CustomerFacade   (only public API)
 ↓
Services
 ↓
Repositories
 ↓
Supabase
```

**Nunca:**

```text
UI → Supabase
UI → Repository
UI → raw tables
```

Ejemplo Customer (ADR 0058 · 0059):

```text
Customer Capability
    ↓
CustomerFacade / useCustomer
    ↓
CustomerDirectoryService · CompanyAccountService
    ↓
Repositories
    ↓
Ops screens (consume Facade only)
```

No exponemos tablas. Exponemos lenguaje de negocio (`CreateCustomerCommand`, `SearchCustomersQuery`, …).

---

## FOUNDATION LAW 003 (permanente · OPERATIONAL-002 Validate)

```text
A screen never owns business logic.
Screens orchestrate user interaction.
Capabilities own business behaviour.
```

```text
Screen (UI)
    ↓  orchestrates interaction only
Capability Facade
    ↓  owns behaviour (commands · queries)
Application Services
    ↓
Repositories
    ↓
Infrastructure
```

Una pantalla de Clientes puede desaparecer mañana y sustituirse por otra.  
**Customer Capability** sigue siendo exactamente la misma.

Prohibido:

```text
Screen → Repository
Screen → Supabase
Screen → “business rules” inline
```

---

## FOUNDATION LAW 004 (permanente · OPERATIONAL-003 / Operational Experience)

```text
Operational Experience
consumes Capabilities.

Capabilities own business behaviour.

The UI owns interaction only.
```

```text
Platform
    ↓
Foundation
    ↓
Capabilities (Identity · Customers · Orders · …)
    ↓
Operational Experience (Capability Demos · Product UI)
    ↓
Tenant Success
```

Customer Workspace was the first official **consumer** of a certified Capability.  
Order Capability will be the first **process** Capability — Operational Experience will consume it the same way (LAW 003 · LAW 004).

Prohibido:

```text
Operational Experience → invent business rules
Operational Experience → bypass Facade
Capability → depend on a specific screen
```
