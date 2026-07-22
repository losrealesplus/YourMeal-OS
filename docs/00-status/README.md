# Estado del proyecto

**Última actualización:** 2026-07-22 · sesión UL 🟢  
**Versión:** `v0.1.0` — FOUNDATION LOCKED  

## Roadmap (oficial)

| Área | Estado |
|------|--------|
| FOUNDATION | ✅ Cerrado |
| PRODUCT BLUEPRINT | ✅ Cerrado (fase diseño) |
| OPERATIONAL DISCOVERY | ✅ Estructura cerrada |
| OPERATIONAL CHECKS | ✅ Cerrado (transversal) |
| FIRST OBSERVATION DAY | ⏸ Congelado (hasta retomar a propósito) |
| Operational Model | 🟢 01 UL endurecido · 🚧 02–06 |

---

## Fase actual: YOURMEAL OPERATIONAL MODEL (Core Operativo)

No es el Core técnico (DDD).  
Es el **lenguaje permanente** de la operación de comida preparada.

```text
Foundation ✅ → Blueprint ✅ → Checks ✅
        ↓
Operational Model 🚧
   01 Ubiquitous Language 🟢
   02–06 siguientes
        ↓
Observation EatClean ⏸
```

| Pregunta anterior | Pregunta ahora |
|-------------------|----------------|
| ¿Qué funcionalidades tendrá? | ¿Qué objetos existen en cualquier negocio de comida preparada? |

Índice: [docs/17-operational-model/](../17-operational-model/README.md) · [01 UL](../17-operational-model/01-ubiquitous-language/README.md)

**No es un cuarto pilar.** Equivalente producto del Domain Model.

---

## Tres pilares (+ lenguaje + Checks)

| Bloque | Pregunta | Estado |
|--------|----------|--------|
| **FOUNDATION** | ¿Cómo construimos? | ✅ |
| **PRODUCT BLUEPRINT** | ¿Qué / por qué? | ✅ |
| **OPERATIONAL DISCOVERY** | ¿Por qué evolucionar? | ✅ carpeta · ⏸ campo |
| **Operational Checks** | ¿Cómo guía la operación? | ✅ transversal |
| **Operational Model** | ¿Con qué lenguaje? | 🚧 01🟢 · 02–06 |

```text
Producto:  Discovery → Check → Assistant → Capability
Lenguaje:  Operational Model (Ubiquitous Language primero)
Técnica:   Capability → Use Cases → Domain → Infrastructure
```

Gate: evidencia → pregunta → Check → Capability.

Contrato semántico: *misma palabra ≠ cosas distintas; misma realidad ≠ dos palabras.*

---

## PRs

| PR | Tema | Estado |
|----|------|--------|
| [#9](https://github.com/losrealesplus/yourmeal-os/pull/9) | Operational Checks | ✅ Merged |
| [#10](https://github.com/losrealesplus/yourmeal-os/pull/10) | Operational Model FASE 4 | 🚧 Open |

---

## Próxima sesión / siguiente paso

1. Endurecer **02 · Core Objects** (solo permanentes; sin sobre-modelado)  
2. Luego 03 → 06  
3. Observation sigue ⏸ · sin código / pantallas

| Índice | Ruta |
|--------|------|
| Ubiquitous Language | [01-ubiquitous-language/](../17-operational-model/01-ubiquitous-language/README.md) |
| Operational Model | [docs/17-operational-model/](../17-operational-model/README.md) |
| Checks | [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md) |
