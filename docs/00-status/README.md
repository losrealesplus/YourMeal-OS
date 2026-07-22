# Estado del proyecto

**Última actualización:** 2026-07-22 · FASE 5 Operational Validation 🚧  
**Versión:** `v0.1.0` — FOUNDATION LOCKED  

## Roadmap (oficial)

| Área | Estado |
|------|--------|
| FOUNDATION | ✅ Cerrado |
| PRODUCT BLUEPRINT | ✅ Cerrado (fase diseño) |
| OPERATIONAL DISCOVERY | ✅ Estructura cerrada |
| OPERATIONAL CHECKS | ✅ Cerrado (transversal) |
| Operational Model (FASE 4) | 🟢 01–06 (gramática completa) |
| **Operational Validation (FASE 5)** | 🚧 Estructura + semillas |
| Certificación modelo | ⏳ Operational Model Certified v1.0 |

---

## Fase actual: OPERATIONAL VALIDATION

> **¿Dónde nos equivocamos?** — no «¿qué construimos?»

La validación **no busca confirmar. Busca refutar.**

```text
Operational Model 🟢 (hipótesis endurecida)
        ↓
Operational Validation 🚧  ← intentar romper el modelo
        ↓
Operational Model Certified v1.0  ⏳
        ↓
UX · Capabilities · código de producto
```

Índice: [docs/18-operational-validation/](../18-operational-validation/README.md)

| Misión FASE 5 | Prohibido |
|---------------|-----------|
| Romper el modelo con escenarios y edge cases | Añadir features |
| Dictámenes trazables (VR) | Cambiar el modelo sin VR |
| Field observation bajo lente de coherencia | Saltar a UI / código |

---

## FASE 4 cerrada — Operational Model

```text
   01 Ubiquitous Language 🟢
   02 Core Objects 🟢
   03 Operational Dependencies 🟢
   04 Lifecycles (transiciones) 🟢
   05 Invariants (Constitución) 🟢
   06 Capability Mapping (trazabilidad) 🟢
```

Índice: [docs/17-operational-model/](../17-operational-model/README.md)

---

## Tres pilares (+ lenguaje + Checks)

| Bloque | Pregunta | Estado |
|--------|----------|--------|
| **FOUNDATION** | ¿Cómo construimos? | ✅ |
| **PRODUCT BLUEPRINT** | ¿Qué / por qué? | ✅ |
| **OPERATIONAL DISCOVERY** | ¿Por qué evolucionar? | ✅ carpeta · ⏸ campo Discovery |
| **Operational Checks** | ¿Cómo guía la operación? | ✅ transversal |
| **Operational Model** | ¿Con qué lenguaje? | 🟢 FASE 4 |
| **Operational Validation** | ¿Dónde falla el modelo? | 🚧 FASE 5 |

```text
Producto:  Discovery → Check → Assistant → Capability  (post-certificación)
Lenguaje:  Operational Model → Validation → Certified v1.0
Técnica:   Capability → Use Cases → Domain → Infrastructure  (post-certificación)
```

Gate actual: **refutar modelo** → certificar → entonces implementar.

---

## PRs

| PR | Tema | Estado |
|----|------|--------|
| [#9](https://github.com/losrealesplus/yourmeal-os/pull/9) | Operational Checks | ✅ Merged |
| [#10](https://github.com/losrealesplus/yourmeal-os/pull/10) | Operational Model FASE 4 | 🚧 Open |
| *(nuevo)* | Operational Validation FASE 5 | 🚧 |

---

## Próxima sesión / siguiente paso

1. Ejecutar **VS-001** (semana normal) — walkthrough de coherencia del modelo  
2. Ejecutar edge cases prioritarios (EC-001 stock · EC-002 payment)  
3. Activar field observation EatClean **solo en modo validación** cuando el equipo decida  
4. Sin código / pantallas / features nuevas hasta certificación

| Índice | Ruta |
|--------|------|
| Validation | [18-operational-validation/](../18-operational-validation/README.md) |
| Principios | [01-validation-principles](../18-operational-validation/01-validation-principles.md) |
| Certificación | [07-certification](../18-operational-validation/07-certification.md) |
| Operational Model | [17-operational-model/](../17-operational-model/README.md) |
