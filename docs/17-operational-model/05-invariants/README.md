# 05 — Constitución del sistema (Invariants)

**FASE 4 · Operational Model**  
**Prerrequisito:** [04 Lifecycles](../04-lifecycles/README.md) ✅  
**Observation:** ⏸ congelada  

> La pregunta ya no es «¿qué ocurre?»  
> Es: **¿qué nunca puede romperse?**

No es una lista de validaciones.  
Es la **Constitución** del Operational Model — la capa más estable.

---

## Jerarquía definitiva

```text
Invariant          ← gobierna (verdad permanente)
        ↓
Lifecycle          ← transiciones permitidas
        ↓
Operational Check  ← ¿puede ocurrir esta transición?
        ↓
Capability         ← consume el modelo (no lo define)
```

| Capa | Nunca |
|------|--------|
| **Invariant** | — (más estable) |
| **Lifecycle** | Romper un Invariant |
| **Operational Check** | Cambiar leyes · violar Invariant |
| **Capability** | Crear reglas · inventar objetos sin filtro |

---

## Tres conceptos (no confundir)

| Concepto | Pregunta | Ejemplo |
|----------|----------|---------|
| **Operational Check** | ¿Puede ocurrir esta **transición**? | ¿Hay suficiente pollo? |
| **Business Rule** | ¿Cómo **calcular** algo? | Merma = 8 % |
| **Invariant** | ¿Qué **nunca** puede romperse? | Un Production Batch pertenece a un único Production Plan |

- Los Checks **ayudan**.  
- Los Invariants **gobiernan**.  
- Las Business Rules viven en dominio/cálculo — **no** sustituyen Invariants.

### Regla permanente

> **Ningún Operational Check puede violar un Invariant. Nunca.**

Un Check puede fallar y bloquear una transición.  
No puede autorizar algo que la Constitución prohíbe.

---

## Las seis categorías

| # | Categoría | Pregunta |
|---|-----------|----------|
| 1 | [Identidad](./identity.md) | ¿Quién es único e irreemplazable? |
| 2 | [Propiedad](./property.md) | ¿A quién pertenece siempre? |
| 3 | [Temporalidad](./temporal.md) | ¿Qué nunca puede retroceder sin evento? |
| 4 | [Consistencia](./consistency.md) | ¿Qué no puede existir huérfano? |
| 5 | [Integridad](./integrity.md) | ¿Qué vínculo económico/logístico es sagrado? |
| 6 | [Operación](./operation.md) | ¿Qué orden operativo es inviolable? |

Índice maestro: [constitution-index.md](./constitution-index.md).

---

## Gramática completa

```text
01 Vocabulario   → ¿Cómo hablamos?
02 Sustantivos   → ¿Qué existe?
03 Verbos        → ¿Cómo se relaciona?
04 Tiempo        → ¿Cómo evoluciona?
05 Constitución  → ¿Qué nunca puede romperse?   ← este bloque
06 Trazabilidad  → ¿Qué Capability consume qué? (siguiente)
```

Con 05 cerrado, el modelo tiene **identidad propia**.  
06 deja de ser diseño: es **trazabilidad** sobre lo ya definido.

---

## Gate 05 → 06

> ¿Cada transición crítica respeta al menos un Invariant explícito?

Si sí → [06 Capability Mapping](../06-capability-mapping/README.md) mapea consumo del modelo.  
Si no → añadir Invariant o corregir Lifecycle/Check antes de mapear Capabilities.

---

## Relacionado

- [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md)  
- [04 checks-on-transitions](../04-lifecycles/checks-on-transitions.md)  
- [PRODUCT_PRINCIPLES §13](../../15-product/PRODUCT_PRINCIPLES.md)
