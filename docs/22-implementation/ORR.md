# Operational Readiness Review (ORR)

**Cuándo:** tras Hardening en `main` + migración + Smoke HP-001 ok.  
**Qué no es:** revisión de código (eso fue el Hardening Sprint) · validación de negocio (FOV).  
**Qué es:** una **puerta binaria** que autoriza observación en campo.

---

## Resultado (binario)

```text
PASSED
```

o

```text
BLOCKED
```

Sin estados intermedios («casi listo», «READY WITH GAPS», etc.).

| Veredicto | Significado |
|-----------|-------------|
| **PASSED** | HP-001 autorizado para cliente real → Phase 3 FOV |
| **BLOCKED** | Corregir; no FOV; documentar causa en `ORR_HP-001.md` |

---

## Qué significa ORR PASSED

**No significa:**

* que el producto esté terminado;  
* que el Operational Model sea definitivo;  
* que ya no existan mejoras posibles.

**Significa:**

> Existe evidencia suficiente para afirmar que HP-001 puede ejecutarse en operación real y que cualquier aprendizaje posterior provendrá de la **observación del sistema**, no de incertidumbres conocidas en su implementación.

---

## Después de ORR

| Antes (Engineering) | Después (FOV) |
|---------------------|---------------|
| ¿Está correctamente implementado? | ¿El conocimiento operacional refleja cómo trabaja el cliente? |
| Entregable: código · tests · docs · evidencias técnicas | Entregable: observaciones · evidencia de campo · hipótesis · propuestas KU |

> **La FOV produce evidencia. El Gate decide cambios.**

Evidencia en FOV; decisiones en el **Gate** — no durante la observación.

---

## Qué debe responder la ORR

La ORR **no** pregunta «¿el código está bien?». Solo:

1. ¿Existe **evidencia** de que HP-001 funciona extremo a extremo?  
2. ¿La implementación **coincide** con el Operational Model?  
3. ¿La instrumentación (auditoría, invalidación, persistencia) genera la **evidencia necesaria para FOV**?  
4. ¿Existe algún **bloqueo conocido** que invalide la observación en campo?

Si las cuatro son satisfactorias → **PASSED**. Si no → **BLOCKED**.

---

## Checklist de evidencias (pre-ORR)

| Área | Evidencia | Estado |
|------|-----------|:------:|
| Ingeniería | PR #23 fusionado en `main` | ☐ |
| Migraciones | RPC `program_draft_order` aplicada y verificada | ☐ |
| Tests | Suite verde | ☑ |
| TypeScript | `tsc` limpio | ☑ |
| Happy Path | [Smoke HP-001](../00-status/SMOKE_HP-001.md) exitoso | ☐ |
| Auditoría | `create` + `status_change` en `audit_log` | ☐ |
| Caché | Invalidación correcta post program/confirm | ☐ |
| Mocks | Ausentes en flujo live | ☑ (Hardening) |
| P1 | INC-01…07 cerrados | ☑ (Hardening) |

---

## Acta ORR — sección FOV Scope (obligatoria al cerrar PASSED)

Incluir en `docs/00-status/ORR_HP-001.md`:

```text
FOV Scope

Capability:
HP-001

Operational Scenario:
Programación de un pedido semanal por un cliente real.

Success Criteria:
El pedido se completa sin intervención manual y genera evidencia
suficiente para observación operacional.

Observation Targets:
- Comportamiento del usuario
- Fricciones del flujo
- Reglas operacionales no modeladas
- Incidencias
- Knowledge Leakage
```

La ORR **autoriza** la observación y deja explícito **qué se va a observar**.

---

## Tras PASSED

1. Declarar: HP-001 Operational · Ready for FOV  
2. Abrir / rellenar [FOV-001_HP-001](../30-field-validation/FOV-001_HP-001.md)  
3. Evidence se recoge en FOV; **decisiones** solo en el Gate (no durante FOV)

## Relacionado

- [SMOKE_HP-001](../00-status/SMOKE_HP-001.md) · [HAPPY_PATHS](./HAPPY_PATHS.md)  
- [Acta metodología](../00-status/ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md) · [FOV Mission Brief](../00-status/FOV_MISSION_BRIEF.md)
