# IOV-003 · Independent Implementation

**Paso 2 · Campaña de certificación** — [01](../00-status/01-certification-campaign.md)

El paso más elegante de la metodología: la teoría desaparece.

---

## Pregunta

> **¿Dos personas distintas implementan el mismo modelo?**

---

## Procedimiento

1. Dos desarrolladores (o dos diseños) **independientes**.  
2. **Sin comunicación** entre ellos.  
3. Mismo [KCM](./kcm/README.md).  
4. **No programan.** Diseñan arquitectura.

Autores no corrigen a mitad.

---

## Qué entregan (no código)

- Agregados  
- Límites de módulo / bounded context  
- Repositorios (contratos)  
- Casos de uso  
- Servicios / orquestación  

---

## Comparación

No igualdad absoluta.  
**Equivalencia conceptual.**

Si ambos llegan prácticamente al mismo diseño → **alta expresividad** del modelo.

---

## Evidencia: Interpretation Findings (IF)

No hablan del dominio.  
Hablan de **cómo fue entendido**.

Registro: [interpretation-findings](./04-findings/interpretation-findings.md) · IVR-003.

---

## Criterio de salida

El modelo produce implementaciones **coherentes** (equivalencia conceptual aceptable).  
IF clasificados · sin ambigüedad estructural abierta que bloquee RC.

---

## Estado

⏳ Tras IOV-002.

---

## Relacionado

- [IOV-002](./02-adversarial-validation.md)  
- [RC](../00-status/02-operational-model-rc.md)
