# Operational Model · 05 Constitución + 06 Trazabilidad

**Fecha:** 2026-07-22  
**Fase:** FASE 4 — Operational Model  
**PR:** [#10](https://github.com/losrealesplus/yourmeal-os/pull/10)

---

## Qué pasó

El usuario definió el cambio de naturaleza del bloque 05:

- No lista de reglas — **Constitución del sistema**
- Tres conceptos separados: Operational Check · Business Rule · Invariant
- Seis categorías: Identidad · Propiedad · Temporalidad · Consistencia · Integridad · Operación
- Regla permanente: **ningún Check viola un Invariant**
- Jerarquía: `Invariant → Lifecycle → Operational Check → Capability`

Con 05, la gramática operativa queda completa.  
06 deja de ser diseño y pasa a ser **trazabilidad**.

---

## Qué se hizo

### 05 · Invariants (`05-invariants/`)

- README con marco constitucional y jerarquía
- Seis archivos por categoría (INV-001…055)
- `constitution-index.md` — índice maestro
- Eliminado `05-INVARIANTS.md` (v0.1 plana)

### 06 · Capability Mapping (`06-capability-mapping/`)

- README — cadena Capability → Objects → Dependencies → Transitions → Checks → Invariants
- `traceability-template.md`
- `dish-management.md` — primer mapeo completo
- `capability-index.md`
- Eliminado `06-CAPABILITY_MAPPING.md` (tabla simple)

### Alineación

- `OPERATIONAL_CHECKS.md` — principio 7: Invariants gobiernan
- `PRODUCT_PRINCIPLES.md` §13 — jerarquía explícita
- README modelo · estado · AGENTS · CHANGELOG

---

## Decisión

Las Capabilities son consumidoras del modelo, no su definición.  
La inversión de dependencias es señal de base conceptual sólida.

---

## Siguiente

- Observation EatClean ⏸ — retomar solo con decisión explícita
- Completar trazabilidad de Capabilities candidatas cuando haya evidencia
- Sin código / pantallas / APIs en esta fase
