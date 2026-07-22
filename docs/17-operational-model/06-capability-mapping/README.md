# 06 — Capability Mapping (trazabilidad)

**FASE 4 · Operational Model**  
**Prerrequisito:** [05 Invariants](../05-invariants/README.md) ✅  
**Observation:** ⏸ congelada  

> Ya no es un documento de diseño.  
> Es un **ejercicio de trazabilidad** sobre la gramática completa.

Las Capabilities dejan de ser el centro del sistema.  
Son **consumidoras** del Operational Model.

---

## Cadena de trazabilidad

```text
Capability
        ↓
Core Objects que utiliza
        ↓
Operational Dependencies que recorre
        ↓
Transiciones que ejecuta
        ↓
Operational Checks que dispara
        ↓
Invariants que debe respetar
```

Cada Capability implementada (o candidata) debe poder responder esta cadena **sin inventar** objetos, verbos ni leyes nuevas.

---

## Jerarquía (recordatorio)

```text
Invariant          ← gobierna
        ↓
Lifecycle
        ↓
Operational Check
        ↓
Capability         ← consume (no define)
```

Una Capability que no puede mapearse a Invariants explícitos **no está lista** para implementarse como producto operativo.

---

## Plantilla y ejemplos

| Recurso | Uso |
|---------|-----|
| [traceability-template.md](./traceability-template.md) | Plantilla para cada Capability |
| [dish-management.md](./dish-management.md) | Primer mapeo completo ✅ |
| [capability-index.md](./capability-index.md) | Índice orientativo (hipótesis) |

Roadmap vivo de producto: [CAPABILITY_ROADMAP.md](../../15-product/CAPABILITY_ROADMAP.md).  
No inventar Capabilities aquí — solo **mapear** las que ya existen o están candidatas.

---

## Gate de implementación

Antes de abrir o ampliar una Capability:

1. ¿Evidencia en Discovery? (⏸ hasta retomar Observation)  
2. ¿Qué pregunta operativa elimina?  
3. ¿Qué Check expresa esa pregunta (en una **transición**)?  
4. ¿Cadena de trazabilidad completa?  
5. ¿Ningún Check viola un [Invariant](../05-invariants/README.md)?

Ver [OPERATIONAL_CHECKS.md](../../15-product/OPERATIONAL_CHECKS.md).

---

## Domain Model

Cuando una Capability se implemente, el Domain Model (`docs/12`) usa los **mismos nombres** que este Operational Model.

Si diverge, gana el lenguaje operativo validado — ADR si hace falta.

---

## Relacionado

- [05 Constitución](../05-invariants/README.md)  
- [04 Lifecycles](../04-lifecycles/README.md)  
- [PRODUCT_PRINCIPLES §13](../../15-product/PRODUCT_PRINCIPLES.md)
