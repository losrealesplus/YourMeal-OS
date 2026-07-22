# Estado del proyecto

**Última actualización:** 2026-07-22 · VS-001 auditado · VR-001 Extended · MC-001 propuesto  
**Versión técnica:** `v0.1.0` — FOUNDATION LOCKED  
**Versión modelo:** Alpha (pre-certificación)

---

## Perspectiva estratégica

**YourMeal OS ya no es el centro del trabajo.**

Es el **primer sistema que demostrará si el proceso OPE funciona**.

| Centro | Rol |
|--------|-----|
| **OPE** (Operational Product Engineering) | Marco · proceso de adquisición de conocimiento |
| **YourMeal OS** | Experimento controlado · caso de referencia |

Las decisiones de aquí en adelante: ¿fortalecen el conocimiento trazable o solo aceleran código?

---

## Dos etapas del proyecto

### Etapa 1 · Construcción del conocimiento — **casi consolidada**

Objetivo: **reducir incertidumbre**. No desarrollar software de producto.

```text
Foundation              ✅
Blueprint               ✅
Discovery               ✅ (estructura · campo ⏸)
Operational Checks      ✅
Operational Model       ✅ FASE 4
Operational Validation  🚧 FASE 5 abierta
```

### Etapa 2 · Construcción del producto — **aún no empezada**

Objetivo: **traducir conocimiento certificado** a software · UX · Capabilities.

```text
Gate: Operational Model Certified v1.0
        ↓
Implementation (traducción, no redescubrimiento)
```

Que la Etapa 2 no haya empezado es **buena noticia**: cuando empiece, el conocimiento será más estable.

---

## Fase actual: cerrar validación — empezar por VS-001

```text
Operational Model Alpha
        ↓
VS-001  ← primera evidencia externa al diseño
        ↓
VR-001 + Knowledge State + retrospectiva metodológica
        ↓
VS-002… · EC… · FOV…
        ↓
Operational Model Certified v1.0
```

Índice: [18-operational-validation/](../18-operational-validation/README.md)

| Misión inmediata | Prohibido |
|------------------|-----------|
| Auditoría VS-001 · decisiones trazables | VS-002 sin retrospectiva post-VS-001 |
| Actualizar Knowledge State registry | Features · UI · código producto |

**Criterio de éxito VS-001:** cada hallazgo → decisión trazable (no «cero errores»).

---

## FASE 4 — Operational Model 🟢

```text
01–06 endurecidos · Knowledge State inicial Hypothesized
```

[17-operational-model/](../17-operational-model/README.md)

---

## Mapa de bloques

| Bloque | Etapa | Estado |
|--------|-------|--------|
| Foundation | 1 | ✅ |
| Blueprint | 1 | ✅ |
| Discovery | 1 | ✅ · campo ⏸ |
| Operational Checks | 1 | ✅ |
| Operational Model | 1 | 🟢 |
| Operational Validation | 1 | 🚧 · **Alpha** |
| Implementation | 2 | ⏳ post-certificación |

Marco: [OPE](../18-operational-validation/00-operational-product-engineering.md) · [Knowledge State](../18-operational-validation/knowledge-state.md)

---

## El día que importa (objetivo de certificación)

Poder decir con evidencia:

> *«El Operational Model v1.0 ha sido validado mediante X escenarios, Y casos límite y Z observaciones de campo, con N Validation Reports, sin contradicciones abiertas.»*

Ese día el software no partirá de requisitos sueltos — partirá de **conocimiento** puesto a prueba.

Plantilla: [07-certification](../18-operational-validation/07-certification.md).

---

## PRs

| PR | Tema | Estado |
|----|------|--------|
| [#9](https://github.com/losrealesplus/yourmeal-os/pull/9) | Operational Checks | ✅ Merged |
| [#10](https://github.com/losrealesplus/yourmeal-os/pull/10) | Operational Model FASE 4 | 🚧 Open |
| [#11](https://github.com/losrealesplus/YourMeal-OS/pull/11) | Operational Validation · OPE | 🚧 Open |

---

## Próxima sesión

1. Coordinar / aplicar **MC-001 + MC-002** (Amend · Revise · Pause · Replan)  
2. Firmar retrospectiva metodológica  
3. **VS-003** familia seguridad alimentaria (reescribir) — preferible tras MCs  
4. Sin Etapa 2 hasta Certified v1.0

| Índice | Ruta |
|--------|------|
| VR-002 | [VR-002](../18-operational-validation/05-validation-reports/VR-002-interrupcion-horno-eatclean.md) |
| MC-002 | [MC-002](../18-operational-validation/06-model-changes/MC-002-pause-batch-replan-execution.md) |
| VS-002 | [VS-002](../18-operational-validation/02-validation-scenarios/VS-002-interrupcion-horno.md) |
| Familias | [02 README](../18-operational-validation/02-validation-scenarios/README.md) |
