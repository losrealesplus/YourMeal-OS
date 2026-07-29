# CHANGE_AUTHORITY

**Documento:** `CHANGE_AUTHORITY.md`  
**Fecha:** 2026-07-29  
**Tipo:** Regla de gobierno  
**Estado:** Active  
**No modifica FOPEBA.** Complementa [OPERATIONAL_CORE_CONTRACT](./OPERATIONAL_CORE_CONTRACT.md) · [PLATFORM_BASELINE_v1](./PLATFORM_BASELINE_v1.md).

---

## Propósito

Formalizar que **no todas las partes del sistema tienen el mismo nivel de estabilidad** ni el mismo criterio de cambio.

---

## Matriz de autoridad

| Área | Quién puede cambiarla | Condición |
|------|------------------------|-----------|
| Foundation | Solo con evidencia operacional | + ADR superseding |
| Auth | Solo evidencia + ADR | Identity Freeze respetado |
| Identity | Solo evidencia + ADR | Foundation Lock Identity respetado |
| Operational Core (Declared / Contract) | Solo evidencia + ADR | No docs constitucionales nuevos sin reapertura |
| Entry / Journey (certificados) | Equipo producto + evidencia de cert | Layer Independence: no invalidar inferiores |
| Flow | Equipo de producto durante certificación | Objeto = handoffs (Bloque G) |
| Módulos operacionales | Desarrollo normal | Deben **consumir** el Core |
| Notifications · Jobs · Analytics · AI | Desarrollo normal | Tras necesidad demostrable; consumen Core / eventos |

---

## Pregunta de gate (todo PR)

```text
¿Este cambio consume el Operational Core
o intenta redefinirlo?
```

| Respuesta | Acción |
|-----------|--------|
| Redefine Foundation / Auth / Identity / Membership / RBAC / Entry / Journey / Flow | ❌ Rechazado |
| Consume el Core y respeta el Contract | ✅ Continúa revisión técnica |

Checklist en la [plantilla de Pull Request](../../.github/pull_request_template.md).

Desarrollo operacional diario: además de este gate, aplica [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) (PRs no huérfanas · Feature → Flow/Handoff · evidencia del Flow · Readiness por certificaciones).

---

## Evidencia operacional (definición mínima)

Para reabrir Foundation / Auth / Identity / Core hace falta **al menos una** de:

- Hallazgo de certificación RI / FOPEBA que demuestre bloqueo de negocio  
- Incidente productivo reproducible atribuible al contrato del Core  
- ORR / gate fallido cuya causa raíz sea el diseño del Core  

Opinión o “mejora estética” **no** es evidencia.

---

## Relación con Layer Independence

Evolución **interna** de una capa (p. ej. MFA, nuevo handoff) no invalida certificaciones inferiores.  
**Rediseño de contrato** de una capa Core = CHANGE_AUTHORITY fila correspondiente + ADR.
