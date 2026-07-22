# VR-001 — Modificación tardía EatClean (espina completa)

**Fecha:** 2026-07-22  
**Origen:** [VS-001 Escenario Hostil 001](../02-validation-scenarios/VS-001-semana-normal.md)  
**Autor / sesión:** Auditoría de mesa (Operational Validation)  
**Participantes:** Facilitation documental · contraste con `docs/17` **después** de mapear

---

## Intención de la sesión

¿Qué tendría que pasar para que el modelo dejara de ser válido ante una modificación de Order Confirmed 18 minutos antes de producción, con Stock insuficiente, Supplier, Route, alérgenos y Payment B2B?

> Objetivo: **hacer fallar** el escenario, no pasarlo.

---

## Hallazgo

El modelo **narra** la espina y los tensores (Stock, Supplier, Label, Payment) **sin inventar Core Objects**.

Falla al **nombrar transiciones** para:

1. Modificar un Order **Confirmed** (sin Cancel).  
2. Revisar un Production Plan **Ready**.  
3. Revisar Delivery Routes **Ready**.

Cancel + nuevo Order **contradice** el hecho operativo declarado («modifica uno existente»). Por tanto no es explicación válida bajo principio 13 — la grieta es de Lifecycle, no de comodidad de diseño.

---

## ¿Se explicó con el modelo existente?

| Intento | Resultado |
|---------|-----------|
| Explicación con Objects / Dependencies / Invariants actuales | **Posible** (espina + Stock + Supplier + Label + Payment) |
| Explicación completa del **evento** modificación | **Imposible** sin transición Amend / Revise |
| ¿Concepto nuevo (Core Object)? | **No** |
| ¿Purchase Order como Core? | **No** — Supporting futuro ya previsto |

---

## Cadena de comprobación (resumen)

| Capa | Resultado |
|------|-----------|
| Core Objects | ✔ 17 + actores; Beneficiary · Supplier · Stock · Label bastan |
| Dependencies | ✔ `aggregate into` · `consumes` · `supplies` · `transports` · `settles` |
| Lifecycles | ✗ Amend Order · Revise Plan · Revise Route ausentes |
| Checks | Parcial — Stock Start ✔ · faltan Checks de Amend/Revise |
| Invariants | ✔ Ninguno refutado (INV-034 · 043 · 032 · 040 sostienen el relato) |

---

## Clasificación de madurez

# **Extended**

## Severidad

# 🔁

## Justificación

- **No Confirmed:** el evento central no tiene transición canónica.  
- **No solo Clarified:** no basta precisar texto — hay que **añadir** transiciones y Checks al Lifecycle Order / Plan / Route.  
- **No Contradicted:** ningún Invariant queda falso; no hace falta Core Object nuevo (principio 13 respetado: se agotó el modelo existente antes de pedir vocabulario).

---

## Acción requerida

| Clasificación | Acción |
|---------------|--------|
| Extended | **MC-001** obligatorio — transiciones Amend / Revise + Checks |

## Model Change

[MC-001 — Amend Order y Revise Plan/Route](../06-model-changes/MC-001-amend-and-revise-transitions.md)

## Knowledge State

| Elemento | KS anterior | KS nuevo | Proveniencia |
|----------|-------------|----------|--------------|
| Order (Lifecycle Confirm/Cancel) | H | **V** (parcial) | VR-001 — Confirm/Cancel explican parte; Amend pendiente MC |
| Production Plan (Ready) | H | **V** (parcial) | VR-001 |
| Production Batch · Stock · INV-034 | H | **V** | VR-001 Paso 4 |
| Supplier `supplies` | H | **V** | VR-001 Paso 5 |
| Packaging · Label | H | **V** | VR-001 Paso 6 |
| Delivery Route (Ready) | H | **V** (parcial) | VR-001 — falta Revise |
| Payment B2B Not due | H | **V** | VR-001 Paso 8 |
| INV-011 · 021 · 032 · 040 · 043 | H | **V** | VR-001 |
| Transición Amend Order | — | **H** (propuesta MC-001) | VR-001 |

---

## Criterio de éxito VS-001

✔ Cada hallazgo H1–H8 tiene decisión trazable en este VR + MC-001.
