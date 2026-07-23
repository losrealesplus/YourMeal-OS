# Operational Readiness Review (ORR)

**Cuándo:** después de completar **HP-001** (CAP-006 Connected / Happy Path sin mocks).  
**Qué no es:** validación de negocio (eso es FOV).  
**Qué es:** comprobar que el software está listo para exponerse a un usuario real **sin introducir reglas operacionales nuevas**.

---

## Preguntas obligatorias

1. ¿Queda algún **mock** en el recorrido HP-001?  
2. ¿La trazabilidad OM → Repository → Query → Hook → UI sigue intacta?  
3. ¿Las mutaciones generan `audit_log` donde corresponde?  
4. ¿Tenant / RLS / RBAC se respetan de extremo a extremo?  
5. ¿El Product Skeleton (Lovable) permanece sin alteraciones de UX/navegación?  
6. ¿Algún paso inventó una regla que debería volver a Carril A?

---

## Resultado

| Veredicto | Significado |
|-----------|-------------|
| READY | HP-001 puede usarse con EatClean como escenario FOV |
| READY WITH GAPS | Gaps documentados; no bloquear FOV si son no-críticos |
| NOT READY | Corregir antes de campo |

Acta: crear `docs/00-status/ORR_HP-001.md` al ejecutar (no antes).

## Relacionado

- [HAPPY_PATHS](./HAPPY_PATHS.md)  
- [FOV Mission Brief](../00-status/FOV_MISSION_BRIEF.md)
