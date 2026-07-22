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
(estado actual del modelo tras FASE 4)
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
| 5 | Field observation: mínimo acordado (o waiver para Beta-only con fecha de RC obligatoria) | [04](./04-field-observation/README.md) |
| 6 | Constitución INV-001…055 revisada tras todos los MC | 05-invariants |
| 7 | Trazabilidad Capabilities críticas al día | 06-capability-mapping |
| 8 | Sin features ni código de producto añadidos en FASE 5 | CHANGELOG / PRs |

---

## Waiver de campo

Si el campo no puede activarse antes de implementación limitada:

- Máximo alcanzable sin campo: **Beta** (solo mesa)  
- **RC** y **Certified v1.0** requieren FOV o waiver con fecha de re-validación obligatoria  
- El waiver **no** sustituye RC para pilot de producción real

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
edge cases y observación de campo [completa / waiver documentado],
el modelo se declara **Certified v1.0** como base permanente de YourMeal OS
hasta una nueva fase de validación mayor (v2.0).

Cualquier cambio futuro al modelo requiere VR → MC.

## Próximo gate

Implementar un modelo que ha sobrevivido a refutación deliberada:
diseño visual · UX · Capabilities · código — trazado a 17 certificado.
```

---

## Estado actual

| Elemento | Estado |
|----------|--------|
| Nivel de confianza | **Alpha** |
| Operational Model Certified v1.0 | ⏳ No certificado |
| FASE 5 | 🚧 En curso — siguiente: auditoría VS-001 |

---

## Metodología reutilizable

La secuencia Foundation → Blueprint → Discovery → Checks → Model → **Validation**  
es aplicable más allá de YourMeal OS (logística, retail, mantenimiento…).

El activo no es solo el modelo de comida preparada: es el **patrón de modelar operaciones complejas con disciplina de refutación**.

---

## Relacionado

- [README](./README.md)  
- [validation-coverage](./05-validation-reports/validation-coverage.md)  
- [audit-protocol](./02-validation-scenarios/audit-protocol.md)
