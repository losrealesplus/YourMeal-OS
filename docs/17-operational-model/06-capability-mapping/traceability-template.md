# Plantilla · Trazabilidad de Capability

Copiar una sección por Capability. Completar antes de implementación o ampliación significativa.

---

## [Nombre de la Capability]

**Estado:** ⏳ candidata · 🚧 en curso · ✅ implementada  
**Asistente(s):** …  
**Evidencia Discovery:** OF-… / ⏸ pendiente  

### 1. Core Objects

| Objeto | Rol en esta Capability |
|--------|------------------------|
| … | … |

### 2. Operational Dependencies

| Verbo | Desde → Hacia | Notas |
|-------|---------------|-------|
| … | … | … |

Referencia: [03 verbs](../03-relationships/verbs.md) · [spine-flow](../03-relationships/spine-flow.md).

### 3. Transiciones

| Objeto | Transición | Evento |
|--------|------------|--------|
| … | `Estado A` → `Estado B` | … |

Referencia: [04 lifecycles](../04-lifecycles/README.md).

### 4. Operational Checks (en transición)

| Transición | Pregunta del Check | Acción si falla |
|------------|-------------------|-----------------|
| … | ¿Puede …? | … |

### 5. Invariants que respeta

| ID | Invariante (resumen) |
|----|----------------------|
| INV-… | … |

**Confirmación:** ningún Check de esta Capability viola la Constitución.

### 6. Lo que NO hace

- No define nuevos Core Objects sin [filtro 02](../02-core-objects/README.md).  
- No crea leyes — solo las consume.  
- No sustituye al Asistente Operativo en la experiencia de compra.

---

## Checklist rápido

- [ ] Objetos = Nivel 1 canónico  
- [ ] Checks en transiciones, no en estados  
- [ ] Invariants citados por ID  
- [ ] Alineado con CAPABILITY_ROADMAP (no duplicar nombres)
