# VR-005 — Escalabilidad operacional EatClean

**Fecha:** 2026-07-22  
**Origen:** [VS-005](../02-validation-scenarios/VS-005-escalabilidad.md)  
**Dimensión:** Escalabilidad / sesgo de escala  
**Autor / sesión:** Auditoría de mesa

---

## Intención

Al pasar de ~180 a ~1.030 Orders (y magnitudes asociadas), ¿el Operational Model sigue describiendo la realidad con los **mismos** Core Objects, Dependencies, Lifecycles e Invariants — o el volumen obliga a **redefinir el dominio**?

---

## Hallazgo

| Tentación de escala | Decisión |
|---------------------|----------|
| Order Bundle / mega-agregación | Rechazada — Plan ya agrega |
| Production Session / Shift Core | Rechazada — instancias Batch + Kitchen |
| Super-Route / región Core | Rechazada — n Routes |
| DietaryProfile Core por volumen | Rechazada sin evidencia de capacidad nueva |
| Wave / Execution Window Core | Rechazada — Plan · Route window · INV-021 |

| Precisión faltante | Tipo |
|--------------------|------|
| Organization **n** Kitchen · **n** Vehicle | Clarified (docs) |
| Paralelismo de Batches/Routes como first-class | Clarified (docs) |
| «Una Kitchen» = default, no Invariant | Clarified |

**Criterio específico de éxito:** ✔ el dominio **no** se redefine; crece la **instancia**.

---

## Separación OPE

| Escalar implementación | Escalar modelo |
|------------------------|----------------|
| Más trabajadores · vehículos · rendimiento | Nuevos conceptos porque el dominio cambió |
| **Necesario aquí** | **No forzado por VS-005** |

---

## Clasificación de madurez

# **Clarified**

## Severidad

# ⚠

## Justificación

No Extended de Lifecycle crítico: los objetos **ya** soportan n.  
No Confirmed puro: la documentación sugiere operación pequeña («a menudo una Kitchen») y puede inducir sesgo.  
No Contradicted: ningún Invariant limita N.

---

## Acción requerida

[MC-005](../06-model-changes/MC-005-cardinality-parallelism-docs.md) ⏸ — solo precisión documental en 17 (cardinalidades · paralelismo).  
Sin Core nuevos.

## Knowledge State

| Elemento | KS | Proveniencia |
|----------|-----|--------------|
| Order / Plan / Batch / Route (escala) | **V** | VR-005 |
| Kitchen / Vehicle cardinalidad n | V parcial → Clarified | VR-005 |
| Shift/Wave/Session Core (rechazo) | **V** (decisión) | VR-005 |
| INV-011 · 021 · 042 | **V** | VR-005 |

---

## Criterio de éxito

✔ Hallazgos trazables · dimensión distinta · dominio no redefinido por volumen.
