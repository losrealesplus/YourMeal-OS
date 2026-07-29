# OPERATIONAL CORE CONTRACT

**Documento:** `OPERATIONAL_CORE_CONTRACT.md`  
**Fecha:** 2026-07-29  
**Nivel:** Contract (constitucional · plataforma)  
**Estado:** **ACTIVE**  
**Knowledge Lifetime:** Contract  
**No es:** feature · ADR de implementación · cambio a FOPEBA · Event Bus · código

**Acta de declaración:** [OPERATIONAL_CORE_DECLARED](./OPERATIONAL_CORE_DECLARED.md)  
**Principio:** [Operational Layer Independence](../05-architecture/OPERATIONAL_LAYER_INDEPENDENCE.md)

---

## Purpose

Definir las **garantías mínimas** que el Operational Core ofrece a cualquier módulo de YourMeal OS.

El Core ya está declarado. Este contrato fija **qué promete** el Core a las capas consumidoras (Notifications, Jobs, Analytics, AI, Reports, integraciones, …).

```text
YOURMEAL OS OPERATIONAL CORE
────────────────────────────
Foundation   ✅ LOCKED
Auth         ✅ FROZEN
Identity     ✅ FOUNDATION LOCKED
Entry        ✅ CERTIFIED
Journey      ✅ COMPLETE
Flow         ⏳ NEXT  (entra al Core al certificar)

Todo lo demás consume este Core.
Nada lo redefine.
```

---

## Status

```text
OPERATIONAL CORE CONTRACT

Status:
  ACTIVE

Purpose:
  Garantías mínimas del Operational Core
  hacia cualquier módulo de YourMeal OS.
```

---

## GARANTÍA 1 — Identidad única

Existe una **única identidad** por persona (`auth.users`).

- Un email → una Identity.  
- No se crean identidades duplicadas para el mismo email.  
- El Profile es de la persona, no del tenant.

---

## GARANTÍA 2 — Membership

Toda pertenencia a una empresa (tenant) pasa por **Membership** (`tenant_members` · `membership_id`).

- Identity ≠ Membership.  
- Create ≠ access.  
- Soft-archive; nunca hard-delete de memberships/profiles en flujos de aplicación.

---

## GARANTÍA 3 — Acceso

Todo acceso efectivo requiere la cadena:

```text
Identity
    ↓
Membership Approved
    ↓
Role
    ↓
RBAC (capabilities)
```

Sin Membership Approved o sin Role → sin acceso ambiguo a workspaces.

---

## GARANTÍA 4 — Journey Outcomes

Todo Journey certificado produce un **Outcome verificable**.

- La certificación de jornada no es “pantalla lista”.  
- Es un resultado operacional comprobable (FOPEBA / evidencia de Journey).

---

## GARANTÍA 5 — Flow consume Outcomes

Todo Flow consume **Outcomes certificados** de Journeys.

- Flow no inventa estados paralelos que invaliden Journeys.  
- Los handoffs son el objeto de certificación de Flow (Bloque G).

---

## GARANTÍA 6 — No redefinición

Los módulos **nunca** redefinen:

- Identity  
- Membership  
- RBAC  
- Entry  
- Journey  
- Flow  

Consumen el Core; no crean pipelines paralelos de acceso o pertenencia.

---

## GARANTÍA 7 — Estabilidad de capas inferiores

Las capas inferiores permanecen estables.

Su evolución interna **no invalida** certificaciones anteriores  
([Operational Layer Independence](../05-architecture/OPERATIONAL_LAYER_INDEPENDENCE.md)).

Ejemplo: MFA en Identity no reabre Foundation; un handoff nuevo en Flow no reabre Journey.

---

## GARANTÍA 8 — Ampliación solo por consumo

Toda ampliación futura **consume** el Core.

Nunca crea una implementación paralela de Identity, Membership, RBAC, Entry, Journey o Flow.

Pregunta de diseño obligatoria:

> ¿Qué expone el Core para que este módulo funcione?

---

## END

```text
END · OPERATIONAL CORE CONTRACT · ACTIVE
```

---

## Consecuencias

| Permitido | Prohibido |
|-----------|-----------|
| Módulos que leen Membership / Role / Outcomes del Core | Auth/Membership “local” por módulo |
| Event Bus / Notifications / Jobs cuando Flow (u otra evidencia) lo exija | Infraestructura especulativa “por si acaso” |
| Capacidades nuevas compatibles con el contrato | Rediseñar el Core sin evidencia operacional + ADR |
| Documentación de Flow · Modules · Bus · Jobs · Analytics · AI | Nuevos documentos de Foundation / Identity / Core salvo evidencia |

---

## Cierre documental del Core

A partir de este contrato:

```text
Foundation          🔒
Auth                🔒
Identity            🔒
Operational Core    🔒  (Declared + Contract ACTIVE)
```

**No abrir más documentación constitucional de Foundation, Auth, Identity o Core** salvo evidencia operacional que justifique un ADR superseding.

Cada documento nuevo debe pertenecer a:

- Flow  
- Operational Modules  
- Event Bus *(cuando corresponda)*  
- Notifications · Jobs · Analytics · AI  

---

## Roadmap post-contrato

```text
CORE (cerrado · Declared + Contract)
    ↓
Flow Certification
    ↓
Operational Readiness
    ↓
Event Bus (si Flow lo requiere)
    ↓
Notifications
    ↓
Background Jobs
    ↓
Automation
    ↓
Analytics
    ↓
AI
```

Misma disciplina: no desarrollar infraestructura porque “algún día hará falta”; solo cuando una capa certificada genere **necesidad demostrable**.

---

## Firma

| Campo | Valor |
|-------|-------|
| Contrato | Operational Core **ACTIVE** |
| Fecha | 2026-07-29 |
| Complementa | OPERATIONAL_CORE_DECLARED · Layer Independence · [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md) |
| Plataforma | [PLATFORM_PHASE_COMPLETE](./PLATFORM_PHASE_COMPLETE.md) |
| Siguiente capa Core | Flow (Bloque G) |
