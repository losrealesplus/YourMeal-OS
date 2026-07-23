# Operational Readiness Review (ORR)

**Cuándo:** después de completar **HP-001** (CAP-006 / Happy Path sin mocks).  
**Qué no es:** validación de negocio (FOV).  
**Qué es:** comprobar que el software está listo para un cliente real **sin reglas operacionales nuevas**.

---

## Preguntas fijas (todas deben ser «sí»)

### Arquitectura

* ¿Todas las capacidades del Happy Path (CAP-001…006) están al menos en estado **Connected**, y el recorrido ensamblado es operable de extremo a extremo?

### Ingeniería

* ¿Quedan **mocks** en el recorrido HP-001?

### Conocimiento

* ¿Ha aparecido alguna **regla no prevista** por el Operational Model durante la implementación?

### Operación

* ¿El recorrido está listo para ejecutarse con un **cliente real** sin intervención manual de ingeniería?

Si **alguna** respuesta es «no» → ORR **no superada** (`NOT READY`).

---

## Checklist de apoyo

1. Trazabilidad OM → Repository → Query/Command → Hook → UI intacta.  
2. Mutaciones generan `audit_log` donde corresponde.  
3. Tenant / RLS / RBAC de extremo a extremo.  
4. Product Skeleton sin alteraciones de UX/navegación.  

---

## Resultado

| Veredicto | Significado |
|-----------|-------------|
| READY | HP-001 listo como escenario FOV |
| READY WITH GAPS | Gaps no críticos documentados |
| NOT READY | Corregir antes de campo |

Acta al ejecutar: `docs/00-status/ORR_HP-001.md` (no crear vacía antes).  
Plantilla de evidencia: [HP-001_EVIDENCE_LOG](./HP-001_EVIDENCE_LOG.md).

## Relacionado

- [HAPPY_PATHS](./HAPPY_PATHS.md)  
- [FOV Mission Brief](../00-status/FOV_MISSION_BRIEF.md)
