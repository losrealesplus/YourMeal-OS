# Flow · Definition of Done

**Documento:** `FLOW_DEFINITION_OF_DONE.md`  
**Fecha:** 2026-07-29  
**Estado:** Active  
**Fase:** Flow Certification

---

## Done (antes · Plataforma)

```text
Feature implementada
    ↓
Tests
    ↓
Merge
```

## Done (ahora · Flow Certification)

```text
Handoff definido
    ↓
Evidence obtenida
    ↓
Flow certificado
    ↓
Merge
```

---

## Criterio mínimo para merge de trabajo Flow

| Paso | Obligatorio |
|------|-------------|
| Handoff explícito (Outcome A → Outcome B) | ✅ |
| Evidencia reproducible (FOPEBA / RI / acta) | ✅ |
| Cadena Outcome → Handoff → Evidence → Certification | ✅ |
| Sin certificar pantallas/APIs/componentes como PASS de Flow | ✅ |
| Respeta Baseline + Core Contract | ✅ |

Código sin handoff/evidencia puede existir en ramas de exploración, pero **no** cuenta como Done de la fase.

---

## Regla auxiliar · Beta certification (FOPEBA)

Cuando el objeto a certificar es un **flujo operativo de beta** (BR-*), aplica además:

> **Un FAIL solo bloquea la certificación si impide completar el flujo operativo definido.**

Así una capacidad útil pero no crítica no retrasa una beta funcional.  
Detalle y ejemplo BR-03: [BR-03_SCOPE_DECISION](../12-beta/BR-03_SCOPE_DECISION.md) · [DEFINITION_OF_DONE](./DEFINITION_OF_DONE.md).

---

## Relación

- Gobernanza: [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md)  
- Disciplina: [FLOW_CERTIFICATION_OPEN](./FLOW_CERTIFICATION_OPEN.md)  
- Jerarquía: [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md)  
- Catálogo: [FLOW_CATALOG](./FLOW_CATALOG.md)
