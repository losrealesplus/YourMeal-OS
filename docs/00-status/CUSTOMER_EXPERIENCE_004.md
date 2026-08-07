# CUSTOMER EXPERIENCE 004

**Status:** ▶ **ACTIVE** — Era 2 Experience Sprint  
**Type:** Experience Sprint (build) — **not** Observation Sprint  
**Mission:** **Zero Friction Organization Management**  
**Declared:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A · TEAM LAW 001  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Customer · Phase 004  
**Surface:** `/admin/customer-workspace` · `useCustomer()` only (LAW 003)  
**Constraint:** Experience **above** Facade — **no** Capability / Facade / Engine / Foundation changes  

```text
Mission
Zero Friction Organization Management

Not: create companies.
Yes: create an organization and start working immediately.
```

```text
Primary KPI
Time-to-Organization (TTO) < 45 seconds

Secondary KPIs
Time-to-Add Worker < 15 seconds
Time-to-Resume Operation < 5 seconds
```

---

## Language (Experience, not Architecture)

The operator thinks:

```text
Organización → Trabajadores → Pedidos
```

Never:

```text
Customer → Company → Membership → Employee → Relation
```

That second stack is ours. Isabella never sees it.

**Organization** opens the future without renaming the Experience:

* Empresa · Colegio · Hotel · Hospital · Gimnasio · Residencia  

Same mission language. Same KPI.

---

## Ideal flow

```text
Nueva Organización
↓
Nombre
↓
Persona de contacto
↓
Teléfono
↓
Dirección
↓
Guardar
↓
Añadir trabajadores
↓
Listo
```

Later (Progressive Completion / CX005):

* CIF · Facturación · Convenios · Notas · Preferencias · Alergias  

---

## Behaviour (shipped)

* Dedicated **Nueva organización** path (not buried in “tipo de cliente”)  
* Minimal fields only · TTO &lt; 45 s  
* After save: **Next Best Action** — Añadir trabajador · Crear pedido · Listo  
* Workers created via existing Facade `staff_create` + Experience-layer org roster (membership substrate not opened)  
* Search / Edit / Create particular remain on the same surface  

---

## Persistence honesty

Company **provision** already exists on the Facade (used).  

Durable **employee ↔ organization membership** is not opened in this PR (no Facade change).  

Experience keeps an **organization roster** (session) so Isabella can add workers and keep working — PRODUCT LAW 001 — until Product lifts membership write.

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current estimated org alta** | ≈ 90–180 s (multi-screen · CIF-first · relations jargon) |
| **New target** | ≤ 45 s (name → contact → phone → address → save) |
| **Estimated saving** | ≈ **45–135 s per organization** |
| **Add worker** | ≤ 15 s after org exists |
| **Validation** | Dogfood · Observation later (LAW 001-A) |

Label: **Estimated**.

---

## Reserved (not this sprint)

### Organization Templates

```text
Organización
↓
20 trabajadores
↓
Menú empresa
↓
Horario fijo
↓
Facturación mensual
```

Registered as future Accelerator idea — see [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md).  
**Do not implement now.**

---

## Explicit non-goals

* Do **not** open OCC / Quick Capture / Import Pipeline  
* Do **not** modify Facade / Capability / Engine  
* Do **not** open CX005 / CX006 / Orders in this PR  

---

## Customer Experience sequence

```text
001 Create     ✅
002 Search     ✅
003 Edit       ✅
004 Organization  ← active
005 Progressive Completion
006 Bulk Operations
↓
ORDER EXPERIENCE 001
```

---

## Acceptance

* No Capability / Facade / Engine changes  
* Experience only  
* Operator never thinks in Membership / Relation jargon  

## Definition of Done

* Organization ready to work in &lt; 45 s  
* Workers can be added without leaving context  
* Software disappears  

---

## Related

* [CUSTOMER_EXPERIENCE_003](./CUSTOMER_EXPERIENCE_003.md) · [002](./CUSTOMER_EXPERIENCE_002.md) · [001](./CUSTOMER_EXPERIENCE_001.md)  
* [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md)  
* [ACCELERATOR_001](./ACCELERATOR_001_OPERATIONAL_COMMAND_CENTER.md) — still Reserved  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)
