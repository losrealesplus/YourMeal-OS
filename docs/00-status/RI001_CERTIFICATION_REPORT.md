# RI-001 Certification Report

**Tipo:** Artefacto de **decisión** del [CG-RI-001](./RI001_CERTIFICATION_GATE.md) — no cronología de desarrollo  
**Estado:** Plantilla — **no emitir** hasta completar carriles del Gate  
**Producto:** YourMeal OS  
**Reference Implementation:** EatClean Tenerife (RI-001)  
**Puente:** YourMeal OS → FOPEBA (primer caso de referencia certificado)

---

## Declaración de alcance (no es un DICT nuevo)

> **La certificación no valida el software; valida la capacidad operacional del sistema bajo un escenario real y con evidencia suficiente para sustentar una decisión.**

Ese matiz evita confundir **calidad del código** con **preparación operacional**.

Pregunta única que debe responder este informe:

> **¿Por qué esta decisión de certificación está justificada por la evidencia disponible?**

---

## Cabecera

| Campo | Valor |
|-------|-------|
| Documento | RI-001 Certification Report |
| Versión | _pendiente_ |
| Fecha de decisión | _pendiente_ |
| Gate | CG-RI-001 |
| Baseline `main` | _SHA / tag_ |
| Emisor | _nombre / rol_ |
| Revisores | _FOPEBA / ops / producto_ |
| Firma / registro | _pendiente_ |

---

## 1 · Executive Summary

_Qué se demostró · qué quedó acotado · nivel de confianza operacional · decisión propuesta en una frase._

---

## 2 · Scope of Certification

| Incluye | Excluye |
|---------|---------|
| Capacidad operacional bajo [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) | Calidad de código como fin en sí mismo |
| Evidencia (DICT-006) de escenarios ejecutados | Opinión · intención · diffs sin ejecución |
| EatClean como caso de referencia | Packaging / Delivery avanzados (cola, si acotados) |
| Decisión READY / RWO / NOT READY | Nuevos principios metodológicos |

Declaración de alcance (arriba) aplica a todo el informe.

---

## 3 · Certification Basis

| Base | Artefacto | Rol |
|------|-----------|-----|
| OCM-001 | [EATCLEAN_OPERATIONAL_STRUCTURE](./EATCLEAN_OPERATIONAL_STRUCTURE.md) | Contrato canónico |
| ORS-001 | [ORS_001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) | Prueba operacional de referencia |
| CG-RI-001 | [RI001_CERTIFICATION_GATE](./RI001_CERTIFICATION_GATE.md) | Gate y salidas |
| Release Board | [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md) | Bloqueadores eliminados |

---

## 4 · Evidence Summary

> Solo [Evidence (DICT-006)](../99-reference/PROJECT_DICTIONARY.md#evidence): resultado verificable de un escenario operacional definido.

| ID | Escenario / carril | Fecha | Resultado | Enlace / acta |
|----|--------------------|-------|-----------|---------------|
| EV-… | ORS-001 | | | |
| EV-… | Observability | | | |
| EV-… | RBAC ± | | | |
| EV-… | FCR bloque Ops | | | |
| EV-… | RRR | | | |

### Release Board (estado al cierre)

| Bloqueador | Estado | Evidencia |
|------------|:------:|-----------|
| `/admin` Operativo | | |
| `/saas` Gobierno | | |
| Jornada completa (ORS-001) | | |
| Observability | | |
| RRR | | |

---

## 5 · Findings

| ID | Severidad | Superficie | Descripción | Decisión | Seguimiento |
|----|-----------|------------|-------------|---------|-------------|
| | Critical | | | | |
| | High | | | | |
| | Medium | | | | |
| | Low | | | | |

Agrupar o filtrar por: **Critical · High · Medium · Low**.

---

## 6 · Certification Decision

Marcar **una** (definiciones: [CG-RI-001 · Salidas](./RI001_CERTIFICATION_GATE.md#-ready)):

| Decisión | ☐ |
|----------|:-:|
| 🟢 **READY** | ☐ |
| 🟡 **READY WITH OBSERVATIONS** | ☐ |
| 🔴 **NOT READY** | ☐ |

```text
READY                     → Autorizado para RI-001
READY WITH OBSERVATIONS   → RI-001 autorizado + Plan de seguimiento
NOT READY                 → RI-001 bloqueado
```

---

## 7 · Rationale

Justificación explícita: **por qué la evidencia disponible sustenta la decisión marcada en §6**.

_Referenciar IDs de evidencia (EV-…) y hallazgos. No argumentar por intención ni por volumen de código._

---

## 8 · Knowledge Harvest

Lecciones y patrones que pasan a **FOPEBA** (YourMeal OS = primer caso de referencia certificado del framework):

| Activo | Patrón FOPEBA | Cosechado ☐ |
|--------|---------------|:-----------:|
| OCM-001 | Modelo canónico operacional | ☐ |
| ORS-001 | Validación operacional | ☐ |
| CG-RI-001 | Certification Gate | ☐ |
| Release Board | Eliminación de bloqueadores | ☐ |
| Operational Observability | Evidencia en operación | ☐ |
| Evidence (DICT-006) | Criterio epistémico de certificación | ☐ |
| Este Report | Plantilla de decisión de RI | ☐ |

Productos destino: CompiME · LosReales+ · futuros — reutilizan proceso certificado, no solo código.

_Lecciones aprendidas (texto libre):_

_

---

## 9 · Next Actions

| Acción | Owner | Condición |
|--------|-------|-----------|
| Plan de seguimiento (si RWO) | | |
| Incorporación a FOPEBA (patrones §8) | | |
| Desbloqueo / bloqueo operativo RI-001 | | |
| Correcciones pendientes (si NOT READY) | | |

---

## Cierre formal de RI-001

RI-001 **termina** solo cuando se cumplen las tres condiciones:

1. Se emite este **RI-001 Certification Report**.  
2. La decisión (READY / RWO / NOT READY) queda **firmada** y **justificada con evidencia** (§6–§7).  
3. El conocimiento obtenido se incorpora a **FOPEBA** como patrones reutilizables (§8).  

```text
Principios → Conocimiento → Implementación → Certificación
        → Conocimiento validado → FOPEBA → Siguiente producto
```

---

## Anexos

- [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) · [Release Board](./EP_OPS_001_RELEASE_BOARD.md)  
- [Matriz FCR](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) · [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md)  
- Log de hallazgos · capturas · audit samples  
