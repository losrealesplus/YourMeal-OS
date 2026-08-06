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

## FOUNDATION LAW 001 (permanente · Operational Capabilities)

```text
Capability
    ↓
Contract
    ↓
Facade
    ↓
Services
    ↓
Store / Repositories
    ↓
UI (consumes Facade only)
```

Every Operational Capability follows this stack.  
Architecture freezes the Contract; Facade implements the public API; UI never skips layers.

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
Order Workspace is the first official **consumer** of an Operational Process Capability (LAW 003 · LAW 004).

Prohibido:

```text
Operational Experience → invent business rules
Operational Experience → bypass Facade
Capability → depend on a specific screen
```

---

## Operational Model (permanente · YourMeal OS)

```text
Context
        │
        ▼
Business Entity
        │
        ▼
Operational Planning
        │
        ▼
Operational Execution
        │
        ▼
Operational Outcome
```

| Layer | Owns | Examples |
|-------|------|----------|
| **Context** | Who operates · tenant · permissions | Identity |
| **Business Entity** | Demand actors / master entities | Customers |
| **Operational Planning** | Commitments and executable work plans | Orders · Production |
| **Operational Execution** | Coordinating work in progress | Kitchen Execution · Delivery |
| **Operational Outcome** | Settling completed work | Billing |

This model is permanent. New capabilities declare their layer before Architecture starts.

---

## FOUNDATION LAW 005 (permanente · Operational Model)

```text
Each Capability belongs to exactly one layer
of the Operational Model.

A Capability must not mix responsibilities
from two different layers.

If it needs information from another layer,
it consumes that layer exclusively through
its Facade.
```

```text
Kitchen Execution  (Operational Execution)
        │
        │  consumes only
        ▼
ProductionFacade   (Operational Planning)
```

**Never:**

```text
Kitchen → invent Production batches from Orders
Kitchen → plan work
Production → cook / start / pause batches
Orders → invoice
Billing → replan Production
```

**Why this law exists**

Growth pressure will tempt Execution capabilities to plan, and Planning capabilities to settle money.  
LAW 005 keeps the chain clean for every tenant — starting with EatClean.

| Violation | Correction |
|-----------|------------|
| Kitchen starts generating plans | Belongs in Production |
| Production starts/pauses batches as craft ownership | Belongs in Kitchen Execution |
| Delivery invents kitchen queues | Belongs in Kitchen Execution |
| Billing mutates Orders to “fix” invoices | Belongs in Orders + Billing Facades separately |

Source panel: [FOUNDATION_STATUS](../00-status/FOUNDATION_STATUS.md) · Board: [OPERATIONAL_ENGINE_BOARD](../00-status/OPERATIONAL_ENGINE_BOARD.md)

---

## Operational Grammar (permanente · YourMeal OS)

```text
Context
────────────────────
Identity
¿Quién opera?

↓

Business Entity
────────────────────
Customer
¿Quién genera la demanda?

↓

Operational Planning
────────────────────
Order
¿Qué prometimos?

↓

Production
¿Qué trabajo debemos generar?

↓

Operational Execution
────────────────────
Kitchen Execution
¿Qué trabajo debe ejecutarse ahora?

↓

Delivery
¿Qué trabajo debe entregarse ahora?

↓

Operational Outcome
────────────────────
Billing
¿Qué trabajo puede cerrarse y facturarse?
```

This is the **language** of YourMeal OS — not only its architecture.  
EatClean is the first tenant of this grammar, not the product.

---

## FOUNDATION LAW 006 (permanente · Domain)

```text
Every Capability
must answer exactly one canonical business question.

If a Capability answers more than one question,
the domain boundary is incorrect.
```

| Capability | Canonical question (only) |
|------------|---------------------------|
| Identity | ¿Quién opera? |
| Customer | ¿Quién genera la demanda? |
| Order | ¿Qué prometimos? |
| Production | ¿Qué trabajo debemos generar? |
| Kitchen Execution | ¿Qué trabajo debe ejecutarse ahora? |
| Delivery | ¿Qué trabajo debe entregarse ahora? |
| Billing | ¿Qué trabajo puede cerrarse y facturarse? |

**Never** a Capability that both plans and executes, or both executes and bills.  
LAW 005 (layer) + LAW 006 (question) prevent giant modules as the product grows.

---

## FOUNDATION LAW 006-A (permanente · Domain boundary)

```text
Capabilities
never answer the question
of another Capability.
```

| Capability | Must never answer |
|------------|-------------------|
| Kitchen Execution | ¿Qué debemos producir? (Production) |
| Delivery | ¿Qué está ejecutándose en cocina? (Kitchen) |
| Billing | ¿Qué debemos entregar? (Delivery) |
| Production | ¿Qué trabajo debe ejecutarse ahora? (Kitchen) |
| Orders | ¿Quién genera la demanda? (Customer) |

Each question has exactly one owner. Crossing questions = broken domain boundary.

---

## FOUNDATION LAW 007 (permanente · Operational Flows)

```text
Operational Flows
never bypass Capabilities.

Every transition between business stages
must occur through certified Capability Facades.
```

```text
Orders
  ↓
ProductionFacade
  ↓
KitchenExecutionFacade
  ↓
DeliveryFacade (future)
  ↓
BillingFacade (future)
```

**Never:**

```text
Orders → Kitchen
Kitchen → Billing
Production → Delivery
```

| Flow | Transition | Via |
|------|------------|-----|
| OPERATIONAL-FLOW-001 | Orders → Production → Kitchen | OrderFacade · ProductionFacade · KitchenExecutionFacade |
| OPERATIONAL-FLOW-002 | Production → Kitchen → Delivery | ProductionFacade · KitchenExecutionFacade · DeliveryFacade |
| OPERATIONAL-FLOW-003 | Delivery → Billing | DeliveryFacade · BillingFacade |

LAW 007 is the bridge from **Capability Certification** (Phase A) to **Operational Flow Validation** (Phase B).
