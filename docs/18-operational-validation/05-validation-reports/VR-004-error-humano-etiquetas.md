# VR-004 — Error humano · etiquetas cruzadas

**Fecha:** 2026-07-22  
**Origen:** [VS-004](../02-validation-scenarios/VS-004-error-humano-etiquetas.md)  
**Dimensión:** Error humano y recuperación (físico ≠ digital)  
**Autor / sesión:** Auditoría de mesa

---

## Intención

¿Puede el modelo detectar, aislar, corregir y dejar evidencia de un swap de Labels **sin** modificar Batch/Order y **sin** inventar Core «NoConformidad» / «Incidente» de espina?

---

## Hallazgo

| Capacidad | ¿Soportada? |
|-----------|-------------|
| Nombrar objetos implicados | ✔ Packaging · Label · Batch · Order · Actor |
| Distinguir contenido vs etiqueta | ✔ parcial (Batch/Dish vs Label) |
| Estado de discrepancia / Hold | ✗ |
| Checks antes de Route post-error | ⚠ |
| Corregir solo Label (Void + reapply) | ✔ camino narrable |
| No regenerar Route | ✔ |
| Huella sin borrar historia | ✔ principio INV-020 · mecánicas incompletas |
| Incident como Core | **Rechazado** |

---

## Clasificación de madurez

# **Extended**

## Severidad

# 🔁

## Justificación

No Contradicted: ningún Invariant obliga a entregar con etiqueta falsa ni a mutar Batch.  
Extended: Packaging necesita Hold/Release; Check de verificación Label↔contenido/Order antes de Hand to route; evidencia vía Label Void + evento Hold (Supporting/Capability auditoría opcional).

Coincide parcialmente con MC-003 (Quarantine Packaging) — **no fusionar aún** (principio 16).

---

## Acción requerida

[MC-004](../06-model-changes/MC-004-packaging-hold-relabel.md) ⏸ aparcado

## Knowledge State

| Elemento | KS | Proveniencia |
|----------|-----|--------------|
| Packaging Lifecycle | V parcial | VR-004 — falta Hold |
| Label Void | V | VR-004 |
| INV-035 | V parcial | no cubre swap post-Applied |
| Incident Core (rechazo) | V (decisión) | VR-004 |
| Batch/Order inmutables en relabel | V | VR-004 |

---

## Criterio de éxito

✔ Dimensión distinta · hallazgos trazables · grieta de recuperación documentada.
