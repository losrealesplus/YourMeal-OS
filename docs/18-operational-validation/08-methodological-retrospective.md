# Retrospectiva metodológica (post VS-001)

**Cuándo:** inmediatamente después de cerrar VS-001 y VR-001 — **antes** de abrir VS-002.

**Objetivo:** validar la **herramienta** con la que validáis el modelo.  
No retrospectiva del dominio — retrospectiva del **proceso OPE**.

---

## Criterio de éxito de VS-001 (recordatorio)

No es:

> «No encontramos errores.»

Es:

> **«Cada hallazgo produjo una decisión trazable.»**

Una contradicción bien documentada **aumenta** el conocimiento.

---

## Preguntas de la retrospectiva

Responder por escrito (acta breve o diario).

### Protocolo de auditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿El protocolo indujo algún sesgo? | |
| ¿Responder **antes** de abrir `docs/17` fue viable? | |
| ¿La sexta pregunta («¿concepto nuevo?») fue clara? | |
| ¿La sesión intentó **hacer fallar** el escenario de verdad? | |

### Evidencia y VR

| Pregunta | Respuesta |
|----------|-----------|
| ¿Las seis preguntas por paso fueron suficientes? | |
| ¿Algún tipo de evidencia quedó fuera? | |
| ¿La clasificación VR (Confirmed / Clarified / Extended / Contradicted) fue clara? | |
| ¿Cada hallazgo tiene VR con decisión trazable? | |

### Knowledge State y proveniencia

| Pregunta | Respuesta |
|----------|-----------|
| ¿El Knowledge State cambió de forma consistente? | |
| ¿La proveniencia (observación + VR + versión modelo) fue fácil de registrar? | |
| ¿El registry necesita columnas o estados adicionales? | |

### Equilibrio epistemológico

| Pregunta | Respuesta |
|----------|-----------|
| ¿Apareció sesgo de «proteger el modelo» (principio 14)? | |
| ¿Apareció sesgo de «añadir objeto por comodidad» (principio 13)? | |
| ¿Algún VR Contradicted se trató como derrota en lugar de éxito? | |

---

## Decisiones de mejora del proceso

| # | Ajuste propuesto | ¿Aplica a VS-002+? | MC de proceso* |
|---|------------------|-------------------|----------------|
| 1 | | | |
| 2 | | | |

\* Cambios al protocolo OPE (18), no al Operational Model (17), salvo que un VR lo exija.

---

## Gate VS-001 → VS-002

- [ ] VR-001 cerrado con clasificación de madurez  
- [ ] [knowledge-state-registry](../knowledge-state-registry.md) actualizado  
- [ ] Esta retrospectiva completada  
- [ ] Ajustes al protocolo aplicados (si los hay)

Solo entonces abrir VS-002.

---

## Relacionado

- [VS-001](./VS-001-semana-normal.md)  
- [audit-protocol](./audit-protocol.md)  
- [00 operational-product-engineering](../00-operational-product-engineering.md)
