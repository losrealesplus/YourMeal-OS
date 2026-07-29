# OPERATIONAL CORE · DECLARED

**Documento:** `OPERATIONAL_CORE_DECLARED.md`  
**Fecha:** 2026-07-29  
**Nivel:** Decision (gobernanza de plataforma · corazón operativo)  
**Estado:** **Declared**  
**Knowledge Lifetime:** Iteration *(acta inmutable al cierre de declaración)*  
**No es:** un ADR de implementación · un cambio a FOPEBA · permiso para abrir Event Bus · código nuevo

**Principio asociado:** [Operational Layer Independence](../05-architecture/OPERATIONAL_LAYER_INDEPENDENCE.md)

---

## Declaración oficial

```text
OPERATIONAL CORE
Status:
  Declared

Includes:
  Foundation
  Auth
  Identity
  Entry
  Journey
  Flow          (cuando sea certificado)

Rule:
  Todo nuevo módulo deberá consumir el Operational Core.
  Ningún módulo podrá redefinir:
    Identity
    Membership
    RBAC
    Entry
    Journey
    Flow
```

---

## Qué es el Operational Core

No es un paquete de código.  
Es el **núcleo operativo certificado** (o en certificación) sobre el que se apoyan todas las capas consumidoras.

```text
Operational Core
├── Foundation          ✅ LOCKED
├── Auth                ✅ FROZEN
├── Identity            ✅ FOUNDATION LOCKED v1
├── Entry               ✅ CERTIFIED
├── Journey             ✅ COMPLETE
└── Flow                ⏳ NEXT (entra al Core al certificar)
```

Cadena estable:

```text
Foundation
    ↓
Auth
    ↓
Identity
    ↓
Entry
    ↓
Journey
    ↓
Flow
```

Cada eslabón responde a una pregunta distinta, con evidencia y criterio de cierre propios  
([Operational Layer Independence](../05-architecture/OPERATIONAL_LAYER_INDEPENDENCE.md)).

---

## Capas consumidoras (fuera del Core)

Todo lo que venga después **consume** el Core; no lo redefine:

```text
Notifications
Jobs
Analytics
AI / Automation
Reports
Integrations
…
```

Pregunta de diseño correcta:

> ¿Qué expone el Core para que Notifications (u otro módulo) pueda funcionar?

Pregunta incorrecta:

> ¿Qué Identity / Membership / Entry inventamos dentro de Notifications?

---

## Reglas

| # | Regla |
|---|--------|
| 1 | Todo módulo nuevo **consume** el Operational Core. |
| 2 | Ningún módulo **redefine** Identity, Membership, RBAC, Entry, Journey o Flow. |
| 3 | Evolución interna de una capa Core no invalida capas inferiores (Layer Independence). |
| 4 | Rediseño de una capa Core requiere ADR + evidencia operacional. |
| 5 | Event Bus / Notifications / Jobs se abren con necesidad demostrada (típicamente post-Flow), no “por si acaso”. |
| 6 | FOPEBA no se modifica con esta acta. |

---

## Evidencia de capas (referencias)

| Capa | Acta / evidencia |
|------|------------------|
| Foundation | [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · ACT-002 |
| Auth | [IDENTITY_FREEZE_v1](./IDENTITY_FREEZE_v1.md) |
| Identity | [IDENTITY_FOUNDATION_LOCK_v1](./IDENTITY_FOUNDATION_LOCK_v1.md) · PR #90 · #91 · #92 |
| Entry | [OPERATIONAL_CERTIFICATION_LAYER_CLOSED](./OPERATIONAL_CERTIFICATION_LAYER_CLOSED.md) · EP-OPS-002 |
| Journey | [EP_OPS_003_JOURNEYS_COMPLETE](./EP_OPS_003_JOURNEYS_COMPLETE.md) |
| Flow | [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md) · NOT STARTED |

> Identity Foundation Lock puede vivir en PR #92 hasta merge; la declaración del Core asume ese cierre.

---

## Efecto en el diseño

YourMeal OS deja de pensarse como “MVP que acumula pantallas” y pasa a consolidar un **núcleo operativo**:

- Quién es la persona (Identity)  
- Cómo entra (Entry)  
- Cómo completa su jornada (Journey)  
- Cómo se transfieren handoffs entre jornadas (Flow)  

ya no se rediscuten en cada módulo consumidor.

---

## Firma de declaración

| Campo | Valor |
|-------|-------|
| Decisión | Operational Core **Declared** |
| Fecha | 2026-07-29 |
| Principio | Operational Layer Independence |
| Contrato | [OPERATIONAL_CORE_CONTRACT](./OPERATIONAL_CORE_CONTRACT.md) · **ACTIVE** |
| Cierre documental | [CORE_DOCUMENTATION_CLOSED](./CORE_DOCUMENTATION_CLOSED.md) |
| Siguiente cierre de capa Core | **Flow** (Bloque G) |
| Fuera de alcance inmediato | Event Bus · Notifications · Jobs (consumidores futuros) |
