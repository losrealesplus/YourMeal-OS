# Strategic Order — Post Identity Lock

**Fecha:** 2026-07-29  
**Contexto:** Tras [Identity Foundation Lock v1](./IDENTITY_FOUNDATION_LOCK_v1.md)  
**Naturaleza:** Orientación estratégica (no backlog ejecutable ni permiso para abrir Event Bus ya)

---

## Estado de capas

```text
Foundation                 ✅
Identity Foundation        ✅  LOCKED
Entry                      ✅
Journey                    ✅
Flow                       ⏳  ← foco inmediato de certificación
Business Modules           🚧
```

---

## Orden recomendado

```text
⏳ Flow
↓
Operational Event Bus      (mismo idioma que identity_events → business events)
↓
Notification Center
↓
Background Jobs
↓
Production Readiness
```

### Por qué Flow antes que Event Bus

Flow certifica **handoffs** operacionales. Esos handoffs son la fuente natural de:

```text
Order Created → Meal Planned → Confirmed → Kitchen → Produced
→ Delivery → Delivered → Support → Invoice → Payment
```

Construir Event Bus / Notifications / Jobs **antes** de Flow sería infraestructura especulativa.  
Con Flow cerrado (o en curso con evidencia), el bus consume eventos reales.

### Operational Core (visión, no sprint actual)

| Capacidad | Rol | Momento |
|-----------|-----|---------|
| Notification Service | Avisos de negocio | Tras Event Bus mínimo |
| File Storage | Artefactos | Según módulos |
| Audit (`audit_log`) | Técnico — ya existe | Mantener |
| Activity Timeline / Identity Events | Ya existe (Identity) | Extender patrón |
| Search / Settings / Localization / Flags | Parcialmente presentes | Incremental |
| Event Bus | Business events transversales | Post-Flow |
| Background Jobs | Async / reintentos | Con el bus |

### Idioma futuro de la plataforma

```text
Identity Events
    ↓
Operational / Business Events
    ↓
Audit · Notifications · Analytics · Automation · Future AI
```

Sin acoplar módulos entre sí: pub/sub de hechos de negocio.

---

## Regla

> No reabrir Foundation ni Identity.  
> No abrir Event Bus sin necesidad operacional demostrada por Flow (o hallazgo de cert equivalente).
