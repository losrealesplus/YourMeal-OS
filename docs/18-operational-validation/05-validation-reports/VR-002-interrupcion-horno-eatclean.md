# VR-002 — Interrupción operacional (horno) EatClean

**Fecha:** 2026-07-22  
**Origen:** [VS-002](../02-validation-scenarios/VS-002-interrupcion-horno.md)  
**Autor / sesión:** Auditoría de mesa (Operational Validation)  
**Familia:** Disrupción operacional mid-execution (≠ VS-001 comercial)

---

## Intención

¿Qué tendría que pasar para que el modelo dejara de explicar una avería de capacidad **después** de iniciada la producción, con Batches mixtos, Packaging parcial y Routes en carga?

> Hacer fallar el escenario. No reparar el horno en el papel.

---

## Hallazgo

El modelo **mantiene** la espina y los Invariants de Packaging, Delivery y Payment bajo retraso.

**No** puede nombrar:

1. **Pausa / bloqueo** de Production Batch `In progress`.  
2. **Replanificación** del Production Plan ya `In execution` (MC-001 solo cubría `Ready`).  
3. **Disponibilidad de capacidad de cocción** (Kitchen Supporting sin Checks ni equipos).

**No** exige Core `Oven` ni Core `Notification`.

---

## ¿Se explicó con el modelo existente?

| Intento | Resultado |
|---------|-----------|
| Objects / Dependencies / Invariants espina | Posible (Packaging · Route · Payment · INV-011) |
| Batch In progress sin transición de pausa | **Imposible** sin Extended Lifecycle |
| ¿Oven como Core Object? | **No** — falla filtro; Kitchen Supporting basta como ancla |
| ¿Notification en el modelo? | **No** — Capability / Nivel 3 |

---

## Cadena de comprobación

| Capa | Resultado |
|------|-----------|
| Core Objects | ✔ sin nuevos |
| Dependencies | ✔ |
| Lifecycles | ✗ Pause Batch · Replan In execution |
| Checks | ✗ capacidad mid-Batch · partida Route |
| Invariants | ✔ ninguno refutado |

---

## Clasificación de madurez

# **Extended**

## Severidad

# 🔁

## Justificación

Misma familia que VR-001 (Lifecycle incompleto), **contexto distinto** (mid-execution + recursos).  
No Contradicted: el modelo no afirma falsedades sobre hornos o notificaciones; simplemente **no nombra** pausa ni capacidad.

Clarified parcial: Kitchen ya existe — falta precisión de capacidad (Checks), no un concepto de espina.

---

## Acción requerida

| | |
|--|--|
| Extended | **MC-002** — Pause/Blocked Batch · Replan In execution · Checks Kitchen/capacidad |
| Relación MC-001 | Ampliar Revise Plan/Route a estados post-Ready según reglas |

## Model Change

[MC-002](../06-model-changes/MC-002-pause-batch-replan-execution.md)

## Knowledge State

| Elemento | KS anterior | KS nuevo | Proveniencia |
|----------|-------------|----------|--------------|
| Production Batch (In progress) | V (VS-001) | **V** parcial | VR-002 — falta Pause |
| Production Plan In execution | V parcial | **V** parcial | VR-002 — falta Replan |
| Kitchen | H | **V** parcial | VR-002 — ancla OK · capacidad no |
| Packaging Pending/Complete | V | **V** | VR-002 |
| Notification (rechazo Core) | — | **V** (decisión) | VR-002 · filtro 02 |
| Payment bajo retraso Delivery | V | **V** | VR-002 |
| INV-020 · 011 · 040 · 044 · 051 | V | **V** | VR-002 |

---

## Criterio de éxito

✔ Hallazgos H1–H7 con decisión trazable.  
✔ Grieta encontrada (Pause · Replan · capacidad) — Validation cumplió propósito.
