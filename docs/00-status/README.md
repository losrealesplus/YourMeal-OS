# Estado del proyecto

**Última actualización:** 2026-07-21 · **Cierre de jornada** 🟢  
**Versión:** `v0.1.0` — FOUNDATION LOCKED  

## Roadmap (oficial)

| Área | Estado |
|------|--------|
| FOUNDATION | ✅ Cerrado |
| PRODUCT BLUEPRINT | ✅ Cerrado (fase diseño) |
| OPERATIONAL DISCOVERY | ✅ Estructura cerrada |
| OPERATIONAL CHECKS | ✅ Cerrado (transversal) |
| FIRST OBSERVATION DAY | ⏸ Congelado (hasta retomar a propósito) |
| OPERATIONAL MODEL | 🚧 Iniciado (FASE 4 · v0.1) |

---

## Fase actual: YOURMEAL OPERATIONAL MODEL (Core Operativo)

No es el Core técnico (DDD).  
Es el **lenguaje permanente** de la operación de comida preparada.

```text
Foundation ✅ → Blueprint ✅ → Checks ✅
        ↓
Operational Model 🚧  ← prioridad ahora
        ↓
Observation EatClean ⏸  (congelado hasta decisión explícita)
```

| Pregunta anterior | Pregunta ahora |
|-------------------|----------------|
| ¿Qué funcionalidades tendrá? | ¿Qué objetos existen en cualquier negocio de comida preparada? |

Índice: [docs/17-operational-model/](../17-operational-model/README.md)

**No es un cuarto pilar.** Equivalente producto del Domain Model.

---

## Tres pilares (+ lenguaje + Checks)

| Bloque | Pregunta | Estado |
|--------|----------|--------|
| **FOUNDATION** | ¿Cómo construimos? | ✅ |
| **PRODUCT BLUEPRINT** | ¿Qué / por qué? | ✅ |
| **OPERATIONAL DISCOVERY** | ¿Por qué evolucionar? | ✅ carpeta · ⏸ campo |
| **Operational Checks** | ¿Cómo guía la operación? | ✅ transversal |
| **Operational Model** | ¿Con qué lenguaje? | 🚧 v0.1 |

```text
Producto:  Discovery → Check → Assistant → Capability
Lenguaje:  Operational Model
Técnica:   Capability → Use Cases → Domain → Infrastructure
```

Gate: evidencia → pregunta → Check → Capability.

---

## PRs

| PR | Tema | Estado |
|----|------|--------|
| [#9](https://github.com/losrealesplus/yourmeal-os/pull/9) | Operational Checks | ✅ Merged |
| [#10](https://github.com/losrealesplus/yourmeal-os/pull/10) | Operational Model FASE 4 | 🚧 Open |

---

## Próxima sesión

1. Endurecer **01 · Ubiquitous Language**  
2. Luego 02 → 06 en ese orden  
3. Sin código · sin pantallas · Observation sigue ⏸

| Índice | Ruta |
|--------|------|
| Operational Model | [docs/17-operational-model/](../17-operational-model/README.md) |
| Checks | [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md) |
| Discovery (congelado) | [FIRST_OBSERVATION_DAY.md](../16-operational-discovery/FIRST_OBSERVATION_DAY.md) |
