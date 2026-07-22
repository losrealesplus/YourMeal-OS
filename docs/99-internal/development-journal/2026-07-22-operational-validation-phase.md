# FASE 5 — Operational Validation (refutación del modelo)

**Fecha:** 2026-07-22  
**Rama:** `cursor/operational-validation-f54a`

---

## Contexto

Tras cerrar FASE 4 (gramática operativa 01–06), el usuario definió el cambio de mentalidad:

- No «¿qué construimos?» sino **«¿dónde nos equivocamos?»**
- La validación **busca refutar**, no confirmar
- Sin features, sin ampliar el modelo sin Validation Report
- Certificación simbólica: **Operational Model Certified v1.0**

---

## Qué se hizo

Estructura `docs/18-operational-validation/`:

| # | Bloque |
|---|--------|
| README | Misión, flujo, gates |
| 01 | Validation principles (10 reglas) |
| 02 | 7 escenarios (VS-001…007) sembrados |
| 03 | 6 edge cases (EC-001…006) |
| 04 | Field observation (lente validación vs Discovery) |
| 05 | Validation reports (plantilla VR) |
| 06 | Model changes (regla VR → MC → 17) |
| 07 | Certification criteria |

Alineación: estado · AGENTS · docs index · 16 Discovery · 17 Model gate.

---

## Decisión

El modelo no se convierte en software permanente hasta sobrevivir a la refutación.  
EatClean, cuando se reactive, entra por **04-field-observation**, no por inventar procesos.

---

## Siguiente

1. Ejecutar VS-001 (mesa redonda / walkthrough)  
2. Edge cases EC-001, EC-002  
3. Primer VR con dictamen real
