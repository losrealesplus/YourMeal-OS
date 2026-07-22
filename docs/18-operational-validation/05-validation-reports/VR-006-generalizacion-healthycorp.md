# VR-006 — Generalización HealthyCorp Catering

**Fecha:** 2026-07-22  
**Origen:** [VS-006](../02-validation-scenarios/VS-006-generalizacion-healthycorp.md)  
**Dimensión:** Generalización del dominio  
**Autor / sesión:** Auditoría de mesa

---

## Intención

¿OPE explica hospitales / residencias / colegios (HealthyCorp) con el **mismo** Operational Model que EatClean, sin redefinir Core Objects?

---

## Hallazgo

| Resultado | Evidencia |
|-----------|-----------|
| Core Objects nuevos | **0** |
| Contradicciones estructurales (X) | **0** |
| Invariants EatClean-only | **0** |
| Diferencias C / R / E | Catálogo en VS-006 |
| Location | Supporting **reservado** → activar (**E**) |
| Amend / Revise / Hold | Ya aparcados MC-001…004 (**E**) |

**Pregunta marco:** el modelo describe el **dominio de comida preparada**, no solo EatClean — con evidencia trazable de VS-005 (escala) + VS-006 (reglas).

---

## Clasificación de madurez

# **Clarified**

## Severidad

# ⚠

## Justificación

Universalidad **no rota**.  
Clarified: qué es config vs regla vs extensión.  
Extended controlado solo donde ya había hueco Lifecycle/Supporting — no por «ser hospital».

No Contradicted: ningún Invariant falso bajo HealthyCorp.

---

## Acción requerida

[MC-006](../06-model-changes/MC-006-location-supporting-expedite.md) ⏸  
+ análisis conjunto con MC-001…005

## Knowledge State

| Elemento | KS | Proveniencia |
|----------|-----|--------------|
| Organization multi-tenant | **V** | VR-006 |
| Order (prescripción = attrs) | **V** | VR-006 |
| Beneficiary (dieta operativa en Order Item) | **V** | VR-006 |
| Location Supporting | H → propuesto E | VR-006 |
| Constitución INV-* | **V** (leyes de dominio) | VR-006 |
| Core nuevos rechazados | **V** (decisión) | VR-006 |

---

## Criterio de éxito

✔ Cada diferencia en C|R|E|X · ✔ 0 X · ✔ batería VS-001…006 cerrada.
