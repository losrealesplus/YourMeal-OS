# ORR_HP-001 — acta (plantilla)

**Crear / completar solo al ejecutar la ORR.**  
Resultado único: **PASSED** \| **BLOCKED**.

---

```text
ORR HP-001

Fecha:
Versión (commit / tag):
Ejecutor:

Veredicto: PASSED | BLOCKED

Causa si BLOCKED:

```

## Respuestas (evidencia)

1. ¿Evidencia E2E HP-001?  
2. ¿Coincide con Operational Model?  
3. ¿Instrumentación lista para FOV (audit / invalidate / persist)?  
4. ¿Bloqueo conocido que invalide observación en campo?

## Checklist evidencias

(Ver [ORR.md](../22-implementation/ORR.md) — copiar estado ☑/☐ aquí.)

---

## FOV Scope

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

Tras **PASSED** → rellenar [FOV-001_HP-001](../30-field-validation/FOV-001_HP-001.md).
