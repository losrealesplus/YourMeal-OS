# YOURMEAL OS — MVP SCOPE LOCK 001

**Status:** 🔒 **SCOPE LOCKED** — contrato de construcción  
**Declared:** 2026-08-09  
**Layer:** Product Scope · Construction Contract  
**Authority:** Product decision over historical Experience / Accelerator sequencing  
**Baseline forensic:** `origin/main` @ `6f8505335512810aa12812f4519db13a91546439`  
**Workspace authority:** Mac local `~/Developer/YourMeal-OS` · Git = código · Device builds = derivados  
**Companions:** [ACCELERATOR_002](./ACCELERATOR_002_OPERATIONAL_BULK.md) · [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md) · [AGENTS.md](../../AGENTS.md) (Zero Lost Changes) · [PR_CHANGE_LEVELS](../22-implementation/PR_CHANGE_LEVELS.md)

```text
Este documento fija QUÉ entra en el MVP operativo.
No implementa. No certifica. No declara GREEN.

Baseline → Scope Lock → Implementation missions → Organism MVP GREEN
```

---

## Purpose

Convertir la decisión de producto post-auditoría **MVP BASELINE / SCOPE LOCK** en un **contrato de alcance explícito**.

El repositorio contiene substrate amplio y Experiences Journey-Certified. Eso **no** implica Organism MVP GREEN.

Este Scope Lock:

1. Define el organismo mínimo durable.
2. Declara IN / OUT de forma no ambigua.
3. Registra blockers y dependencias.
4. Fija orden de implementación.
5. Impide que agentes interpreten “Accelerator Registered” o “Journey Certified” como OUT o GREEN del MVP.

**No** sustituye ADRs, Domain Model ni Journey Certification.  
**Sí** manda sobre el **orden y alcance de construcción del MVP** mientras este documento esté ACTIVE.

---

## Organism MVP

El MVP debe demostrar **ambos** caminos:

```text
TENANT
  ↓
CUSTOMER
  ↓
MENU
  ↓
ORDER
  ↓
WORK PLAN
  ↓
PRODUCTION
```

```text
CUSTOMER
  ↓
SIGN UP
  ↓
TENANT ASSOCIATION
  ↓
MENU
  ↓
ORDER
  ↓
MY ORDERS
```

Validación de dispositivo:

```text
SAME GIT COMMIT
      ↓
  Mac Local
   /       \
Android    iOS
   ↓         ↓
 OPPO     iPhone
```

---

## MVP Principles

### Qué NO cuenta como progreso

- Cantidad de pantallas / rutas / componentes  
- Existencia de un Facade o command  
- Journey Certified / Experience Frozen  
- Tests mock sin persistence real  
- Documentación “Future” histórica sin re-decisión  

### Qué SÍ cuenta — Organism MVP GREEN

Evidencia de:

1. Acción del usuario  
2. Application command / use case  
3. Persistence durable  
4. Lectura posterior (read-back)  
5. Estado consistente tras refresh / restart  
6. Relación correcta tenant ↔ customer  
7. Siguiente etapa del organismo consumiendo el resultado  
8. Tests apropiados  
9. Device validation cuando aplique  
10. Build trazable a commit Git identificable  

### Definition of MVP GREEN (formal)

Una capability del MVP es **GREEN** solo cuando cumple **todos** los puntos anteriores aplicables.

```text
UI exists          ≠ GREEN
Facade exists      ≠ GREEN
Journey Certified  ≠ GREEN
Mock tests pass    ≠ GREEN
```

---

## Baseline snapshot (no reinterpretar)

Fuente: auditoría READ-ONLY contra `origin/main` @ `6f85053`.

| Área | Estado baseline |
|------|-----------------|
| Customer Core | PARTIAL |
| Customer Bulk | UNIMPLEMENTED |
| Menu Core | PARTIAL (publish semanal usable) |
| Menu Bulk | UNIMPLEMENTED |
| Tenant Order Core | BROKEN / PARTIAL (staff intake UNIMPLEMENTED) |
| Customer Order / App | PARTIAL (cold tenant association) |
| Work Plan (Hoja de Producción) | PASS como base desde Orders |
| Production Integration | PARTIAL |
| Android | PARTIAL · field histórico |
| iOS | NOT READY |

Estos estados **no** se reclasifican a GREEN en este documento.

---

## MVP-01 Customer Core

**Scope:** ✅ **IN**

El Tenant debe poder crear Customer **individualmente**.

### Mínimo funcional

- Particular (y Empresa/organización cuando el flujo existente lo soporte sin inventar substrate)  
- Identificación · teléfono · email · dirección · código postal  
- Alergias · preferencias  
- Guardar · buscar · ver · editar posteriormente  
- Persistencia durable · recuperación tras cerrar/reabrir  

### Flujo mínimo

```text
TENANT
  ↓
CREATE CUSTOMER
  ↓
VALIDATE
  ↓
PERSIST
  ↓
SUCCESS
  ↓
CUSTOMER VISIBLE
  ↓
REFRESH / RESTART
  ↓
CUSTOMER STILL EXISTS
```

### Gate de GREEN

Customer Core **no** es GREEN hasta:

- path durable  
- read-back fiable  
- refresh/restart fiable  
- validación real en dispositivo (Android/OPPO como mínimo del path crítico)

**Nota de campo:** fallo observado en creación de Customer en Android → BLOCKER-001 / BLOCKER-002.

**Esta fase:** documentar · **no** implementar en misiones de Scope Lock.

---

## MVP-02 Customer Bulk

**Scope:** ✅ **IN** (después de Customer Core GREEN)

```text
UPLOAD → PREVIEW → VALIDATION → ERROR REPORT
  → CONFIRM → BULK CREATE → RESULT → DURABLE CUSTOMERS
```

### Formatos

**No** fijar todavía CSV / XLSX / PDF como contrato técnico definitivo.

> Supported formats must be explicitly defined before implementation.

### Dependencia

```text
Customer Core GREEN → Customer Bulk
```

**Supersede histórico:** ver [Bulk Policy](#bulk-policy) y nota en [ACCELERATOR_002](./ACCELERATOR_002_OPERATIONAL_BULK.md).

---

## MVP-03 Menu Core

**Scope:** ✅ **IN**

```text
DISH → MENU → PUBLISH → CUSTOMER VIEW
```

El Tenant:

1. Crea/gestiona Dish  
2. Crea Menu semanal  
3. Asocia Dish al Menu  
4. Publica Menu  

El Customer visualiza el Menu publicado.

### Arquitectura

Respetar entidades existentes. **No** inventar entidad **Meal** sin ADR / decisión arquitectónica.  
Ingredient / Recipe full CRUD: **OUT** del MVP (ver Out of Scope).

Baseline: substrate Dish + Weekly Menu + slots + publish + customer visibility ya existe.

---

## MVP-04 Menu Bulk

**Scope:** ✅ **IN** (después de Menu Core GREEN)

```text
UPLOAD → PREVIEW → VALIDATE → ERRORS
  → CONFIRM → CREATE/UPDATE MENU DATA → RESULT
```

Relación Dish / Ingredient / Recipe / Menu: respetar arquitectura existente.  
Formatos: definir antes de implementar.

```text
Menu Core GREEN → Menu Bulk
```

---

## MVP-05 Tenant Order Core

**Scope:** ✅ **IN**

El Tenant debe poder crear un Order para un Customer existente.

```text
CUSTOMER → MENU → CREATE ORDER → SELECT DISHES
  → VALIDATE → PERSIST → CONFIRM → VISIBLE TO PRODUCTION
```

### Blocker conocido (baseline)

`OrderIntakeService`: `staff && targetCustomerId` → `UNIMPLEMENTED` (CAP-008).  
Esto es **BLOCKER-004**. El MVP **debe** cerrar este camino. No se resuelve en esta misión documental.

---

## MVP-06 Customer Order Core

**Scope:** ✅ **IN**

```text
SIGN UP → TENANT ASSOCIATION → CUSTOMER
  → MENU → ORDER → MY ORDERS
```

### Blocker conocido

Signup frío → `tenant_members` / tenant association: **PARTIAL / BROKEN** → **BLOCKER-003**.

---

## MVP-07 Order Bulk

**Scope:** ✅ **IN** (después de Order Core individual GREEN — Tenant y/o Customer paths según fase)

```text
UPLOAD → PREVIEW → VALIDATE
  → RESOLVE CUSTOMER → RESOLVE MENU/DISH
  → VALIDATE ORDER → CONFIRM → CREATE ORDERS → RESULT
```

Debe existir mecanismo explícito para:

- customer resolution  
- duplicate detection  
- validation errors  
- rejected / successful rows  
- durable persistence  

```text
Order Core GREEN → Order Bulk
```

---

## MVP-08 Work Plan

**Scope:** ✅ **IN**

### Decisión canónica

> **Work Plan MVP = Hoja de Producción** derivada de Orders **confirmados**.

**No** es Production Planning (PE session / Menu→work Experience).

```text
CONFIRMED ORDERS
  ↓
WORK PLAN / HOJA DE PRODUCCIÓN
  ↓
FECHA · TOTAL COMIDAS · CUSTOMERS · DISHES · QUANTITIES
  ↓
PRODUCTION / KITCHEN CONSULT
  ↓
EXPORT / PRINT
```

Baseline: Hoja ya clasificada PASS como base desde Orders.  
Alineación canónica = **BLOCKER-006** hasta que el producto trate Hoja como camino MVP (sin rediseñar PE en esta fase).

---

## MVP-09 Production

**Scope:** ✅ **IN**

```text
ORDER → CONFIRMED → WORK PLAN → PRODUCTION → KITCHEN
```

Debe demostrarse con **Orders reales**, no solo Journey Experience session.

### No requerido por este MVP

- Advanced kitchen lifecycle (Start/Pause/Resume completo)  
- Route optimization · maps · POD  
- Delivery assignment avanzado  
- Billing automation  

salvo evidencia futura de que bloquean el organismo mínimo (hoy: no).

---

## MVP-10 Android

**Scope:** ✅ **IN**

Validación en **OPPO** con regla obligatoria:

```text
SOURCE → GIT COMMIT → MAC LOCAL → BUILD → APK → OPPO
```

Prohibido como device-ready:

```text
CLOUD WORKTREE / artifact remoto → APK → OPPO
```

sin commit identificable + SHA256 del artifact.

---

## MVP-11 iOS

**Scope:** ✅ **IN** (después de estabilizar Android en el mismo organismo)

```text
SAME COMMIT → Android/OPPO + iOS/iPhone
```

iOS GREEN requiere: build · install · launch · auth · customer · menu · order · work plan/production según scope · smoke.

Baseline: field **NOT READY**.

---

## Bulk Policy

Bulk (**Customer · Menu · Order**) es **IN SCOPE**.

No se implementa primero.

```text
INDIVIDUAL → DURABLE → E2E → DEVICE → BULK
```

```text
Customer Core GREEN  → Customer Bulk
Menu Core GREEN      → Menu Bulk
Order Core GREEN     → Order Bulk
```

**Razón:** no multiplicar un flujo roto.

**Relación con ACCELERATOR-002:** el registro histórico como “Registered / Future” queda **superseded for MVP scope** por este documento. El Accelerator permanece como registro institucional; el **alcance MVP** manda aquí.

Formatos de archivo: **explícitos antes de implementación** — no inventar CSV/XLSX/PDF por defecto.

---

## Out of Scope

OUT OF SCOPE ≠ borrar código ni docs.

| Ítem | Nota |
|------|------|
| AI | AGENTS / roadmap |
| Offline mode | AGENTS |
| Advanced analytics / SaaS analytics profundas | — |
| Route optimization / maps | Delivery Future |
| POD | Delivery Future |
| Billing automation | — |
| Advanced delivery assignment | Facade UNIMPLEMENTED |
| Advanced kitchen lifecycle completo | Start/Pause/Resume etc. |
| Google Places | — |
| Full Ingredient / Recipe product CRUD | Menu Core no lo exige |
| Company public self-registration | Removida / no MVP |
| Worker durable staff roster | CX004 honesty · no bloquea Customer Core individual |
| Production Planning (PE) como Work Plan MVP | Sustituido por Hoja |

Pueden volver al roadmap sin este Scope Lock.

---

## Blockers

| ID | Descripción |
|----|-------------|
| **BLOCKER-001** | Customer creation field/device validation (Android/OPPO) |
| **BLOCKER-002** | Customer read-back / refresh reliability |
| **BLOCKER-003** | Customer cold signup → tenant association |
| **BLOCKER-004** | Tenant/staff durable Order Intake (CAP-008 UNIMPLEMENTED) |
| **BLOCKER-005** | Admin Order visibility after creation/confirmation (p.ej. drafts ocultos) |
| **BLOCKER-006** | Canonical Work Plan = Hoja de Producción alignment |
| **BLOCKER-007** | Production consumption of confirmed Orders (E2E real, no solo PE) |
| **BLOCKER-008** | Bulk import architecture/contracts (formatos + pipeline) |
| **BLOCKER-009** | Android same-commit device validation |
| **BLOCKER-010** | iOS build + device validation |

---

## Dependency Graph

```text
TENANT
  ↓
CUSTOMER
  ↓
MENU
  ↓
ORDER
  ↓
WORK PLAN (Hoja)
  ↓
PRODUCTION
```

```text
CUSTOMER
  ↓
SIGN UP
  ↓
TENANT ASSOCIATION
  ↓
CUSTOMER
  ↓
MENU
  ↓
ORDER
  ↓
MY ORDERS
```

```text
CUSTOMER CORE → CUSTOMER BULK
MENU CORE     → MENU BULK
ORDER CORE    → ORDER BULK
```

```text
Android / OPPO (same commit)
  ↓
iOS / iPhone (same commit)
```

---

## Implementation Order

Orden oficial provisional (cada fase = misiones pequeñas verificables, no un PR monolítico):

| Phase | Focus |
|-------|--------|
| **1** | Customer Core |
| **2** | Customer self-registration / tenant association |
| **3** | Menu Core |
| **4** | Tenant Order Core |
| **5** | Customer Order Core |
| **6** | Work Plan / Hoja de Producción |
| **7** | Production Integration |
| **8** | Customer Bulk |
| **9** | Menu Bulk |
| **10** | Order Bulk |
| **11** | Android / OPPO |
| **12** | iOS / iPhone |

**Primera misión de implementación (posterior a aprobación humana de este lock):**  
`CURSOR — LOCAL (MAC) → MVP-01 CUSTOMER CORE`

---

## Zero Lost Changes

Ningún código destinado a device validation puede vivir solo en:

- Cursor Cloud · worktree aislado · `/tmp` · artifact storage · conversación  

Flujo obligatorio:

```text
BRANCH → COMMIT → PUSH → PR → REVIEW → MERGE → MAIN
  → MAC SYNC → BUILD → DEVICE
```

Artifacts son derivados. **Git es la autoridad.**  
Detalle operativo: [AGENTS.md — SOURCE OF TRUTH & CHANGE PERSISTENCE](../../AGENTS.md).

---

## Definition of MVP GREEN

**Organism MVP GREEN** cuando el camino completo Tenant y el camino Customer App cumplen la Definition of MVP GREEN por etapa, con:

- Orders reales confirmados  
- Hoja de Producción consumible  
- Production/Kitchen viendo el trabajo  
- Customer consultando My Orders  
- Builds Android e iOS desde el **mismo commit** identificable  

Hasta entonces: estados honestos PARTIAL / BROKEN / UNIMPLEMENTED según evidencia — nunca GREEN por UI o Journey Certified solos.

---

## Change control

| Acción | Regla |
|--------|-------|
| Ampliar IN SCOPE | Decisión humana explícita + actualización de este doc |
| Mover Bulk antes de individual | **Prohibido** mientras este lock esté ACTIVE |
| Tratar PE Planning como Work Plan MVP | **Prohibido** |
| Implementar sin misión LOCAL Mac etiquetada | **Prohibido** para device-bound work |

**Status del documento:** SCOPE LOCKED — READY FOR IMPLEMENTATION (documental).  
La implementación comienza solo con misión explícita posterior.
