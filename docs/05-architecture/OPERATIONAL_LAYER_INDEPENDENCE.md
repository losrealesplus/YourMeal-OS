# Operational Layer Independence

**Documento:** `OPERATIONAL_LAYER_INDEPENDENCE.md`  
**Tipo:** Regla arquitectónica permanente  
**Estado:** Accepted  
**Fecha:** 2026-07-29  
**Knowledge Lifetime:** Contract  

> **No modifica FOPEBA.** No es un Evidence Gate ni un bloque del framework de certificación.  
> Formaliza una propiedad ya demostrada en la práctica (Foundation · Auth · Identity · Entry · Journey).

**Relacionado:** [OPERATIONAL_CORE_DECLARED](../00-status/OPERATIONAL_CORE_DECLARED.md) · [FOUNDATION_LOCK](./FOUNDATION_LOCK.md) · [IDENTITY_FOUNDATION_LOCK_v1](../00-status/IDENTITY_FOUNDATION_LOCK_v1.md) · [FOUR_LAYERS](./FOUR_LAYERS.md)

---

## Principio

```text
Cada capa certificada
debe poder evolucionar internamente
sin invalidar
la certificación de las capas inferiores.
```

Las certificaciones son **independientes**.  
Una capa superior puede crecer; una inferior permanece cerrada salvo evidencia operacional + ADR.

---

## Ejemplos

| Evolución | No reabre |
|-----------|-----------|
| Identity → añadir MFA | Foundation |
| Flow → nuevo handoff | Journey |
| Notifications → canal Push | Flow |
| Jobs → nuevo worker | Event Bus / Flow |
| Reports → nuevo informe | Identity / RBAC |

```text
Identity
    ↓  añadir MFA
    ✗ NO reabre Foundation

Flow
    ↓  añadir un nuevo handoff
    ✗ NO reabre Journey

Notifications
    ↓  nuevo canal Push
    ✗ NO reabre Flow
```

---

## Qué pregunta responde cada capa

| Capa | Pregunta | Evidencia típica |
|------|----------|------------------|
| Foundation | ¿Hay plataforma estable (RBAC, services, soft-delete)? | Foundation Lock · ADRs |
| Auth | ¿La sesión/identidad de acceso es confiable? | Identity Freeze |
| Identity | ¿Persona ↔ Tenant ↔ Role es consistente? | Identity Foundation Lock |
| Entry | ¿Cada rol entra en la superficie correcta? | EP-OPS-002 · Surface cert |
| Journey | ¿El departamento puede completar su jornada? | EP-OPS-003 · Journey COMPLETE |
| Flow | ¿Los handoffs entre jornadas cierran la empresa E2E? | Bloque G (pendiente) |

Cada capa tiene **su propio criterio de cierre**.  
Fallar o evolucionar una capa superior **no** invalida automáticamente las inferiores.

---

## Reglas operativas

1. **Evolución interna permitida** dentro del contrato de la capa (capabilities, eventos, handoffs nuevos).  
2. **Rediseño de contrato** de una capa inferior requiere ADR + evidencia operacional (incidente, gate, ORR).  
3. **No acoplar** módulos consumidores al interior de una capa: consumen el **Operational Core** expuesto.  
4. **FOPEBA** sigue midiendo operación y evidencia; este principio no añade gates al framework.

---

## Anti-patrones

| Anti-patrón | Por qué falla |
|-------------|---------------|
| “Al tocar Flow reabrimos Journey” | Invalida certificaciones sin evidencia |
| “Notifications redefine Membership” | Dependencia circular / Core roto |
| “Nuevo módulo inventa su propio Auth” | Bypass del Core |
| Ampliar FOPEBA para cada capa técnica | Mezcla metodología con arquitectura de plataforma |

---

## Relación con Operational Core

Este principio protege el Core declarado en [OPERATIONAL_CORE_DECLARED](../00-status/OPERATIONAL_CORE_DECLARED.md) y las garantías de [OPERATIONAL_CORE_CONTRACT](../00-status/OPERATIONAL_CORE_CONTRACT.md):

```text
Consumer layers (Notifications · Jobs · Analytics · AI · …)
        ↓ consume
Operational Core (Foundation → … → Flow)
```

Los consumidores **no redefinen** Identity, Membership, RBAC, Entry, Journey ni Flow.
