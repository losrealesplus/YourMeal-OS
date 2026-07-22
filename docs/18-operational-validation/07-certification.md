# 07 · Certification y niveles de confianza

## El modelo como artefacto verificable

| Antes de FASE 5 | Después de Validation |
|-----------------|----------------------|
| «Creemos que este modelo representa la operación.» | «Hemos intentado romperlo; conocemos sus límites actuales.» |

FASE 5 convierte el [Operational Model](../17-operational-model/README.md) en un **artefacto verificable** — no una hipótesis elegante sin contrastar.

Eso cambia la conversación con desarrolladores, clientes y futuros miembros del equipo: el modelo tiene **historial de refutación** y **límites documentados**.

---

## Proceso de revisión (gobernanza)

Equivalente a revisión científica — **no existe el cambio directo**:

```text
Observación / Escenario / Edge case
        ↓
Validation Report (VR)
        ↓
Model Change (MC) — si aplica
        ↓
Operational Model (17)
```

Regla: **VR → MC → solo entonces `17-operational-model`.**

---

## Niveles de confianza

Comunican el **grado de madurez** del modelo en cada momento. No es burocracia: es lenguaje compartido.

| Nivel | Significado | Cómo se alcanza |
|-------|-------------|-----------------|
| **Alpha** | Modelado completo (FASE 4); **sin** validación ejecutada | 01–06 endurecidos |
| **Beta** | Validado en auditorías de mesa (VS + protocolo de 6 preguntas) | VS críticos con VR; ver [validation-coverage](./05-validation-reports/validation-coverage.md) |
| **Release Candidate (RC)** | Validado con observación real **y** edge cases críticos | FOV + EC con VR; waiver documentado si campo parcial |
| **Certified v1.0** | Sin contradicciones conocidas; cambios futuros solo vía VR → MC | Criterios de certificación abajo |

```text
Alpha  →  Beta  →  RC  →  Certified v1.0
         ↑
   (estado actual tras tren MC + Dynamics)
```

Tras **Certified v1.0**, cualquier cambio mayor inicia ciclo hacia **v2.0** con el mismo proceso.

---

## Operational Model Certified v1.0

No se cierra FASE 5 diciendo «está terminado».

Se cierra con acto explícito en nivel **Certified v1.0**:

> **Operational Model Certified v1.0**

El modelo deja de ser hipótesis endurecida.  
Pasa a ser **base validada** con límites conocidos.

---

## Criterios de Certified v1.0

Todos deben cumplirse:

| # | Criterio | Evidencia |
|---|----------|-----------|
| 1 | Nivel mínimo **RC** alcanzado | validation-coverage |
| 2 | Escenarios VS-001…007 auditados con VR | [05](./05-validation-reports/README.md) |
| 3 | Edge cases EC-001…006 con VR | Índice 05 |
| 4 | Ningún 🚨 sin MC aplicado o rechazo documentado | [06](./06-model-changes/README.md) |
| 5 | Field observation (**FOV**): campaña FOR + Field Validation Report (o waiver documentado) | [20 FOV](../20-evidence-framework/03-field-operational-validation.md) |
| 6 | Constitución INV-001…055 revisada tras todos los MC | 05-invariants |
| 7 | Trazabilidad Capabilities críticas al día | 06-capability-mapping |
| 8 | Sin features ni código de producto añadidos antes de G-01 | CHANGELOG / PRs |
| 9 | **IOV** ejecutado (Comprehension · Adversarial · Independent Implementation) | [19 IOV](../19-independent-operational-validation/README.md) |
| 10 | Sin Forced concession estructural abierta sin VR→MC | [SF](../19-independent-operational-validation/04-findings/structural-findings.md) |
| 11 | **Economic Confirmation** completada · roadmap por evidencia | [20 EC](../20-evidence-framework/04-economic-confirmation.md) |
| 12 | **Gate G-01** PASS | [05 G-01](../20-evidence-framework/05-gate-g01-operational-readiness.md) |

> **FOV + EC** son fases obligatorias FOPEBA (Hipótesis A y B).  
> **IOV** cubre transferibilidad. **G-01** abre Etapa 2.

---

## Waiver de campo

Si el campo no puede activarse antes de implementación limitada:

- Máximo alcanzable sin campo: **Beta** (solo mesa)  
- **RC** y **Certified v1.0** requieren FOV o waiver con fecha de re-validación obligatoria  
- El waiver **no** sustituye RC para pilot de producción real

---

## Declaración pública (objetivo del hito)

Cuando se alcance Certified v1.0, el equipo debe poder afirmar con datos:

> **«El Operational Model v1.0 ha sido validado mediante X escenarios, Y casos límite y Z observaciones de campo, con N Validation Reports, IOV (DF/SF/IF) cerrado, sin contradicciones abiertas.»**

Ese día la Etapa 2 (implementación) parte de **conocimiento operacional reproducible**, no de una colección de requisitos.

| Variable | Fuente |
|----------|--------|
| X | VS cerrados en [02](./02-validation-scenarios/README.md) |
| Y | EC cerrados en [03](./03-edge-cases/README.md) |
| Z | FOV en [04](./04-field-observation/README.md) |
| N | VR en [05](./05-validation-reports/README.md) |
| IOV | [19](../19-independent-operational-validation/README.md) |
| Contradicciones abiertas | VR Contradicted / SF Forced sin MC aplicado |

---

## Acto de certificación (plantilla)

```markdown
# Operational Model Certified v1.0

**Fecha:** YYYY-MM-DD  
**Nivel:** Certified v1.0 (previo: RC)  
**Versión del modelo:** commit / tag …  
**Sesión / responsables:** …

## Validation Coverage (resumen)

[Pegar snapshot de validation-coverage.md]

## Declaración

Tras intentar refutar el Operational Model mediante auditorías,
edge cases, observación de campo [completa / waiver documentado]
e Independent Operational Validation (comprensión · adversario · implementación),
el modelo se declara **Certified v1.0** como base permanente de YourMeal OS
hasta una nueva fase de validación mayor (v2.0).

Cualquier cambio futuro al modelo requiere VR → MC.

## Próximo gate

Implementar un modelo que ha sobrevivido a refutación deliberada
y demostrado transferibilidad (Knowledge Validation Pyramid):
diseño visual · UX · Capabilities · código — trazado a 17 certificado.
```

---

## Estado actual

| Elemento | Estado |
|----------|--------|
| Nivel de confianza | **Beta** |
| Operational Model Certified v1.0 | ⏳ No certificado |
| FASE 5 | ✅ Batería VS + Dynamics + tren MC |
| **IOV** | ⏳ Definido |
| **FOV / EC / G-01** | ⏳ [Evidence Framework](../20-evidence-framework/README.md) |
| Etapa 2 | 🔒 hasta **Gate G-01** |

**Criterios Beta cumplidos:** VS-001…006 · 0 Contradicted · MC-001…006 · cobertura mesa.  
**Pendiente G-01 / Certified:** FOV · Economic Confirmation · IOV · criterios Certified 1–10.

> Abrir Etapa 2 ya **no** basta con Beta. Ver [Gate G-01](../20-evidence-framework/05-gate-g01-operational-readiness.md).


---

## Metodología reutilizable

La secuencia Foundation → Blueprint → Discovery → Checks → Model → **Validation** → **IOV** → **Certification** → **Implementation (traducción)**  
es aplicable más allá de YourMeal OS.

Marco: [00-operational-product-engineering](./00-operational-product-engineering.md) · [Knowledge Validation Pyramid](../19-independent-operational-validation/00-knowledge-validation-pyramid.md).  
YourMeal OS es el caso de referencia; el activo transferible es el **framework de ingeniería de productos operativos**.

---

## Relacionado

- [README](./README.md)  
- [IOV](../19-independent-operational-validation/README.md)  
- [validation-coverage](./05-validation-reports/validation-coverage.md)  
- [audit-protocol](./02-validation-scenarios/audit-protocol.md)
