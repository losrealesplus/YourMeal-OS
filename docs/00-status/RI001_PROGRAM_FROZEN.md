# RI-001 · Program Frozen

**Estado:** **FROZEN** · 2026-07-28  
**Programa:** [RI-001 Operational Readiness Backlog](./RI001_OPERATIONAL_READINESS_BACKLOG.md)  
**Principios:** P11 · P12 · [P13](../20-evidence-framework/12-certification-completeness-p13.md)  
**P14:** diferido (segundo producto)

---

## Qué significa Frozen

RI-001 es un **programa de certificación operacional** con alcance **cerrado**.

No es un backlog que crece indefinidamente.

```text
FOUNDATION → INFRA → Identity → RI-001 (certificación operacional)
```

Tras este acta, RI-001 queda como **hito histórico**: alcance fijado · Definition of Done fijada · evidencia a completar dentro de A–I.

---

## Qué se acepta dentro de RI-001

| Permitido | No permitido |
|-----------|--------------|
| Ejecutar bloques A–I y Evidence Gates | Nuevas features / módulos “porque faltan” |
| Correcciones de errores encontrados **durante** la certificación | Ampliar alcance del programa |
| Reabrir un gate concreto con **aprobación explícita** + revalidación | Tareas de negocio nuevas bajo etiqueta RI-001 |
| Actualizar Session Log / Progress / Report | Convertir RI-001 en cola eterna de mejoras |

Todo lo demás → **siguiente programa o épica** (p. ej. certificación de producción, pedidos, Intake CAP-008 Connected, etc.).

---

## Definition of Done (no cambia)

```text
RI-001 DONE cuando:
✓ Gates A–I PASS
✓ Progress 100% (certificación)
✓ Sin P0/P1 abiertos
✓ Report READY | READY WITH OBSERVATIONS
✓ Evidencia reproducible por decisión
```

Frozen **no** implica DONE.  
Frozen implica: **el programa ya no admite nuevos tipos de trabajo**; solo certificación y correcciones de certificación.

---

## Relación

- [CURRENT_PHASE](./CURRENT_PHASE.md)  
- [RI001_OPERATIONAL_READINESS_BACKLOG](./RI001_OPERATIONAL_READINESS_BACKLOG.md)  
- [CG-RI-001 Report](../10-validation/reports/RI001_CERTIFICATION_REPORT.md)  
