# ACTA — Fin de la Construcción Metodológica

**Fecha:** 2026-07-23  
**Nivel del cambio:** Decision (gobernanza)  
**Estado:** **Cerrada**

---

## Decisión

La metodología deja de evolucionar por diseño.

A partir de este punto:

1. Las decisiones metodológicas solo podrán modificarse mediante el ciclo **FOV → Knowledge Update → Gate**.  
2. La implementación continúa aplicando las reglas existentes **sin ampliarlas**.  
3. El software se convierte en el **medio para obtener evidencia**, no en el lugar donde se define el conocimiento.

```text
Pregunta antigua: ¿Cuál es la siguiente regla?
Pregunta actual:  ¿Cuál es la siguiente Capability?
```

---

## Condición de los sistemas

| Sistema | Estado | Condición |
|---------|--------|-----------|
| **FOPEBA v1.0** | Frozen | Evolución metodológica suspendida hasta evidencia FOV |
| **YourMeal OS** | Materialización | Subordinado al OM y capacidades certificadas |
| **Ingeniería** | Estándar operativo definido | Solo: corrección de errores · inconsistencias demostrables · FOV→KU |

Si surge la tentación de un ADR, patrón o nivel nuevo:

> ¿Hay evidencia de campo que lo justifique?  
> Si la respuesta es «no» → **no** cambiar la metodología.

---

## Patrones de implementación (ya suficientes)

Tras CAP-002…005 quedan consolidados:

| Patrón | Flujo |
|--------|-------|
| **Read** | OM → Repository → Query → Hook → UI |
| **Mutation** | UI → Command → Service → Repository → Supabase → audit_log → invalidate → UI |

CAP-006 completa el Mutation Pattern (`Draft → Confirm`). No se requieren nuevos modelos de implementación para el resto de YourMeal OS.

---

## Secuencia hasta evidencia de campo

```text
CAP-006 Confirm (solo Draft→Confirm→Persist→Audit→Invalidate)
        ↓
ORR  →  PASSED | BLOCKED   (puerta binaria; sin «casi listo»)
        ↓
HP-001 con cliente real
        ↓
Phase 3 — Field Operational Validation (FOV)
```

Tras ORR **PASSED**, el siguiente ciclo es **aprendizaje** (FOV), no ampliación metodológica. Nuevos documentos, incidencias y observaciones nacen en contexto FOV.

---

## Hito de listo (no MVP / beta / feature-complete)

```text
HP-001 · Operational · ORR PASSED · Ready for FOV
```

---

## Relacionado

- [04-methodology-frozen](./04-methodology-frozen.md)  
- [MILESTONES](./MILESTONES.md) — historia inmutable  
- [ORR](../22-implementation/ORR.md)  
- [HAPPY_PATHS](../22-implementation/HAPPY_PATHS.md) · [FOV Mission Brief](./FOV_MISSION_BRIEF.md)
