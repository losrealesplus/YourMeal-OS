# MC-004 — Packaging Hold · verificación Label · evidencia (aparcado)

**Validation Report:** [VR-004](../05-validation-reports/VR-004-error-humano-etiquetas.md)  
**Fecha:** 2026-07-22  
**Estado:** ✅ **aplicado** — tren Dynamics post [09 joint gap analysis](../09-joint-gap-analysis.md) — 2026-07-22

---

## Problema demostrado

Swap físico de etiquetas con vínculos digitales Packaging↔Order correctos: no hay Hold, ni Check post-Applied de coincidencia Label↔contenido, ni ciclo Release tras Void/reapply.

---

## Cambio propuesto (borrador)

### 1. Packaging — estados

```text
In progress | Complete  →  Held (Under review)
Held  →  In progress | Complete   (Release tras corrección)
Held  →  (no Handed to route)
```

| Check | Pregunta |
|-------|----------|
| → Held | ¿**Puede retenerse**? |
| → Release | ¿**Puede liberarse**? (Label↔Order/Batch verificado) |
| Hand to route | ¿**Identidad verificada**? |

### 2. Label

Reafirmar: corrección = `Void` + nuevo ciclo Printed→Applied · **sin** cambiar Batch ni Order.

### 3. Evidencia

- Eventos Hold/Release/Void con responsable y timestamp.  
- Capability auditoría consume eventos.  
- Supporting **OperationalIncident** opcional (órbita) — **nunca** Core.  
- Solape con Quarantine de MC-003: unificar en análisis conjunto.

### 4. Rechazos

| Concepto | Decisión |
|----------|----------|
| NoConformidad / Incident como Core | Rechazado |
| Mutar Batch/Order por relabel | Rechazado |

---

**Estado:** ✅ **aplicado** — tren Dynamics post [09 joint gap analysis](../09-joint-gap-analysis.md) — 2026-07-22
