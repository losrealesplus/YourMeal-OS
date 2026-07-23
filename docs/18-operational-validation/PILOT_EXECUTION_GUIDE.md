# Pilot Execution Guide — EatClean

> **Knowledge Lifetime:** Iteration *(guía de validación; se actualiza solo con hallazgos del piloto)*  
> **Estado:** Activa · Fase 2 Pilot Ready  
> **Prerrequisitos:** [ACT-001](../00-status/ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) ✅ · [ACT-002](../00-status/ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) ✅  
> **Milestone:** [EatClean Pilot Ready](../00-status/MILESTONE_EATCLEAN_PILOT_READY.md) · EP-001…EP-005  
> **No es:** ADR · Spec de producto · refactor de UI · permiso para pulir estética

---

## Objetivo

Demostrar que **EatClean puede operar durante una semana** utilizando **exclusivamente YourMeal OS**.

No se valida “si las pantallas se ven bien”.  
Se valida **si el negocio puede cerrar el ciclo operativo real** y si FOPEBA obtiene evidencia suficiente.

---

## Pregunta de éxito

> ¿Puede un negocio real operar durante una semana completa utilizando exclusivamente YourMeal OS y generar evidencia suficiente para que FOPEBA confirme, corrija o amplíe el conocimiento obtenido?

Si la respuesta es afirmativa tras el piloto, no solo se valida un producto: se valida el **primer caso de referencia completo de FOPEBA** aplicado a una operación real.

---

## Ciclo que se demuestra

```text
Cliente
Realiza pedido

↓

Sistema
Genera pedido

↓

Cocina
Produce

↓

Reparto
Entrega

↓

Cliente
Recibe

↓

FOPEBA
Recoge evidencia
```

Mapeo a entregables:

| Paso | EP | Cara |
|------|----|------|
| Cliente pide | EP-001 Weekly Experience | Customer App · CJ-001 |
| Sistema genera / cocina produce | EP-002 Kitchen Operations | Centro de Operaciones · OJ Cocina |
| Reparto entrega | EP-003 Delivery Operations | OJ Reparto |
| Cierre | EP-004 Operational Close | OJ cierre |
| Evidencia | EP-005 Evidence Collection | FOV / EC |

---

## Papel de FOPEBA durante el piloto

Hasta ahora FOPEBA ayudaba a **construir**.  
Durante el piloto FOPEBA **observa**.

```text
Construcción          ← cerrada (ACT-002)
        ↓
Validación            ← esta guía
        ↓
Observación           ← FOV / field evidence
        ↓
Aprendizaje           ← Knowledge Update
        ↓
Knowledge Update      ← Gate decide
```

| Hacer | No hacer |
|-------|----------|
| Registrar lo que ocurre en la operación real | Inventar fases o tipos de evidencia |
| Intentar refutar el modelo con hechos del piloto | “Mejorar” branding por preferencia |
| Trazar hallazgos a VR → MC → Gate | Cambiar Core / RBAC / Contract sin Gate |
| Confirmar, corregir o ampliar conocimiento | Tratar hipótesis (p. ej. Brand Journey) como Accepted |

---

## Condiciones de ejecución

1. **Solo YourMeal OS** — sin hojas paralelas, sin WhatsApp como sistema de registro, sin fork de marca.  
2. **Datos reales del Tenant** — menú, fotos, macros, clientes y entregas de la semana piloto.  
3. **Brand Continuity** — Customer App ↔ Entry ↔ Centro de Operaciones (ya Frozen; no reabrir).  
4. **Congelación estética** — ACT-001. Solo se toca UI si bloquea el piloto o hay evidencia FOV.  
5. **Evidencia primero** — cada día del piloto deja rastro usable para EP-005.

---

## Agenda mínima (una semana)

| Día | Foco | Evidencia mínima |
|-----|------|------------------|
| D0 | Kickoff · roles · menú publicado · checklist Brand Validation | Lista de participantes · menú live |
| D1–D2 | Pedidos reales (EP-001) | Pedidos confirmados · capturas / IDs |
| D2–D5 | Cocina + reparto (EP-002 / EP-003) | Listas de producción · rutas · incidencias |
| D5–D6 | Cierre de pedidos (EP-004) | Estados finales · excepciones |
| D7 | Empaque de evidencia (EP-005) | Paquete FOV / EC · VR preliminar |

Ajustar calendario operativo de EatClean sin cambiar el **criterio** de los EP.

---

## Definition of Done (piloto)

El piloto se considera **demostrado** cuando:

1. Al menos un ciclo completo **pedido → cocina → reparto → cierre** ocurre sin salir de YourMeal OS.  
2. Una persona nueva (o no entrenada en el producto) completa EP-001 sin ayuda estructural.  
3. El equipo operativo completa EP-002…EP-004 desde el Centro de Operaciones.  
4. EP-005 entrega un paquete de evidencia suficiente para FOV → Knowledge Update → Gate.  
5. No se ha reabierto Materialization / Experience Baseline por preferencia estética.

Detalle de EP: [MILESTONE_EATCLEAN_PILOT_READY](../00-status/MILESTONE_EATCLEAN_PILOT_READY.md).

---

## Relación con la línea operativa (Smoke / ORR)

Esta guía **no sustituye** Smoke → ORR → FOV.

```text
Línea operativa:   Migration → Smoke HP-001 → ORR → FOV
Línea de piloto:   EP-001 → … → EP-005  (esta guía)
```

Se alinean: el piloto produce la operación real que la línea operativa necesita observar.

---

## Artefactos de salida

| Artefacto | Dónde |
|-----------|--------|
| Evidencia de campo / FOV | [20 Evidence Framework](../20-evidence-framework/README.md) · [30 Field Validation](../30-field-validation/) |
| Validation Report | `docs/18-operational-validation/05-validation-reports/` |
| Model Change (solo si Gate) | `docs/18-operational-validation/06-model-changes/` |
| Cierre de milestone | Actualizar [MILESTONE_EATCLEAN_PILOT_READY](../00-status/MILESTONE_EATCLEAN_PILOT_READY.md) |

---

## Lectura previa (no reescribir)

- [FOUR_LAYERS](../05-architecture/FOUR_LAYERS.md)  
- [ACT-002](../00-status/ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md)  
- [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md)  
- [Knowledge Lifetime](./knowledge-lifetime.md)  
- [CURRENT_PHASE](../00-status/CURRENT_PHASE.md)  
