# BR-03 · Scope Decision (Beta v1)

**Fecha:** 2026-07-31  
**Decisión:** **B — Beta acotada**  
**Autoridad:** Product CTO  
**Precedente:** [BR-03.2 Admin Smoke Test](./BR-03_ADMIN_SMOKE_TEST.md)  
**Objetivo de fase:** Que EatClean pueda operar una jornada real utilizando YourMeal OS.

---

## Decisión formal

```text
BR-03 Scope Decision

Las operaciones Edit Dish y Disable Dish
quedan fuera del alcance de Beta v1.

Justificación:

No bloquean el flujo operativo principal:

Create Dish
  ↓
Weekly Menu Draft
  ↓
Assign Slots
  ↓
Publish
  ↓
Client Consumption

Se reevalúan para Beta vNext según feedback del piloto.
```

---

## Evaluación (¿bloquea la beta?)

| Flujo | Estado smoke | ¿Bloquea Beta v1? |
|-------|--------------|-------------------|
| Crear plato | PASS | No |
| Crear semana | PASS | No |
| Añadir platos | PASS | No |
| Publicar menú | PASS | No |
| Menú disponible para cliente | BLOCKED (runtime) | **Sí** — exige G3 |
| Editar plato | FAIL | **No** (alta controlada) |
| Desactivar plato | FAIL | **No** (beta acotada) |

Los únicos bloqueos que impiden demostrar el producto son los **runtime**, no la ausencia de editar/desactivar.

---

## Flujo operativo certificado (criterio BR-03.4)

Tras PASS de [BR-03.3 Runtime Validation](./BR-03_RUNTIME_VALIDATION.md):

```text
Administrador
  ↓
Crear plato
  ↓
Crear semana
  ↓
Añadir platos
  ↓
Publicar
  ↓
Cliente puede consumir el menú
  ↓
CERTIFIED
```

---

## Backlog · G1 / G2 no se eliminan

```text
BETA v1
  ✔ Crear plato
  ✔ Publicar menú
  ✔ Cliente consume menú (tras G3 runtime)

──────────────

BETA vNext
  □ Editar plato     (ex-G1)
  □ Desactivar plato (ex-G2)
```

| ID | Capacidad | Destino | Nota |
|----|-----------|---------|------|
| G1 | Editar plato en UI | **Beta vNext** | Dominio/servicio ya existen; falta UI |
| G2 | Desactivar plato en UI | **Beta vNext** | Activar ya existe; falta desactivar |
| G3 | Smoke runtime admin→cliente | **BR-03.3** (bloqueante) | Único gap que cierra BR-03 |

**No priorizar en Beta v1:** inventario, promociones, informes, quitar slot, unpublish, categorías.

---

## Regla FOPEBA aplicada (beta)

> **Un FAIL solo bloquea la certificación si impide completar el flujo operativo definido.**

Registro canónico: [DEFINITION_OF_DONE.md](../00-status/DEFINITION_OF_DONE.md) · sección *Beta certification gate*.

| Hallazgo | ¿Bloquea certificación BR-03? |
|----------|-------------------------------|
| Editar plato | No |
| Desactivar plato | No |
| Publicar menú ausente/roto | Sí |
| Cliente no ve menú published | Sí |

---

## Roadmap FASE 3 · BETA READINESS

```text
✅ BR-03.1 Audit
✅ BR-03.2 Smoke
➡ BR-03.3 Runtime Validation (G3)
➡ BR-03.4 Admin Certified
➡ BR-04 Client Flow
➡ BR-05 Pilot Day
```

| ID | Objetivo | Estado |
|----|----------|--------|
| BR-03.1 | Admin Audit | ✅ Documento |
| BR-03.2 | Admin Smoke Test | ✅ Documento · decisión B |
| **BR-03.3** | **Runtime Validation (G3)** | **Siguiente** |
| BR-03.4 | Admin Certified | Tras PASS runtime bajo flujo acotado |
| BR-04 | Client Flow | Tras BR-03.4 |
| BR-05 | Pilot Day | Tras BR-04 |
