# PLATFORM BASELINE · v1

**Documento:** `PLATFORM_BASELINE_v1.md`  
**Fecha:** 2026-07-29  
**Status:** **BASELINE**  
**Version:** **v1**  
**Knowledge Lifetime:** Contract  
**No es:** feature · cambio a FOPEBA · reapertura del Core · permiso para Event Bus

---

## Declaración oficial

```text
PLATFORM_BASELINE_v1

Status:
  BASELINE

Includes:
  Foundation
  Auth
  Identity
  Operational Core
  Governance

Rule:
  Todo desarrollo futuro parte de esta baseline.
  La baseline únicamente cambia mediante evidencia operacional
  y siguiendo CHANGE_AUTHORITY.
```

---

## Fotografía de plataforma

```text
FASE DE PLATAFORMA

Foundation
        🔒 LOCKED
↓
Auth
        🔒 FROZEN
↓
Identity
        🔒 FOUNDATION LOCKED
↓
Operational Core
        🔒 DECLARED
↓
Operational Core Contract
        🔒 ACTIVE
↓
Platform Governance
        🔒 COMPLETE
↓
PLATFORM BASELINE v1
        🔒 BASELINE
```

---

## Zonas estables (fuera del desarrollo diario)

| Zona | Estado | Acta / ancla |
|------|--------|--------------|
| Foundation | LOCKED | [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) |
| Auth | FROZEN | [IDENTITY_FREEZE_v1](./IDENTITY_FREEZE_v1.md) |
| Identity | FOUNDATION LOCKED | [IDENTITY_FOUNDATION_LOCK_v1](./IDENTITY_FOUNDATION_LOCK_v1.md) |
| Operational Core | DECLARED + CONTRACT ACTIVE | [DECLARED](./OPERATIONAL_CORE_DECLARED.md) · [CONTRACT](./OPERATIONAL_CORE_CONTRACT.md) |
| Governance | COMPLETE | [PLATFORM_PHASE_COMPLETE](./PLATFORM_PHASE_COMPLETE.md) · [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md) · PR template |

Estas zonas **no evolucionan** en el día a día.  
Solo cambian con evidencia operacional + [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md).

---

## Jerarquía del producto (post-baseline)

```text
Platform                    ✅ COMPLETE (esta baseline)
    ↓
Operational Core            🔒
    ↓
Operational Modules         ▶ Flow Certification · luego módulos de negocio
    ↓
Operational Services        ⏳ Event Bus · Notifications · Jobs (cuando haga falta)
    ↓
Experience                  continuo (Consume Core; no lo redefine)
```

---

## Cambio de pregunta

| Hasta Baseline v1 | A partir de Baseline v1 |
|-------------------|-------------------------|
| ¿Cómo debe construirse YourMeal OS? | ¿Cómo **opera** YourMeal OS? |

Progreso se mide por **certificaciones superadas**, no por funcionalidades acumuladas.

---

## Roadmap desde la baseline

```text
══════════════════════════════════════════════
PLATFORM
                ✅ COMPLETE  ← Baseline v1
══════════════════════════════════════════════
FLOW CERTIFICATION
                ▶ CURRENT
══════════════════════════════════════════════
OPERATIONAL READINESS
                ⏳ NEXT
══════════════════════════════════════════════
EVENT BUS (si Flow lo requiere)
↓
NOTIFICATIONS
↓
BACKGROUND JOBS
↓
ANALYTICS
↓
AI
══════════════════════════════════════════════
```

---

## Checklist mental de PR (fase actual)

```text
¿Respeta la Baseline?
    ↓
¿Respeta el Core / Contract?
    ↓
¿Produce evidencia operacional?
    ↓
¿Acerca Flow a certificación?
```

Si todas son sí → el PR está alineado con la fase.  
Si redefine Foundation / Auth / Identity / Core → ❌ ([CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md)).

---

## Versiones futuras

| Baseline | Cuándo |
|----------|--------|
| **v1** (esta) | Cierre Fase de Plataforma · Governance COMPLETE |
| v2+ | Solo si evidencia operacional + ADR + actualización explícita de esta acta (no reescritura silenciosa) |

Comparar v2 contra v1 debe ser posible leyendo este documento y el ADR superseding.

---

## Firma

| Campo | Valor |
|-------|-------|
| Baseline | **PLATFORM_BASELINE_v1** |
| Status | BASELINE |
| Fecha | 2026-07-29 |
| Cierre de fase | [PLATFORM_V1_CLOSED](./PLATFORM_V1_CLOSED.md) |
| Evidencia PR | #91 · #92 · #93 · #94 · #95 · #96 · #97 |
| Objetivo actual | **Flow Certification** · [FLOW_CERTIFICATION_OPEN](./FLOW_CERTIFICATION_OPEN.md) |
| Último doc constitucional del Core | Baseline v1 (este) |
