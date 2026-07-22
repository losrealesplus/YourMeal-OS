# FOV Mission Brief — EatClean

**No forma parte de FOPEBA.**  
**Forma parte de la ejecución de la campaña.**

Una página. Llévala a campo.

---

## Objetivo

Observar la operación real **sin intervenir**.

> ¿Qué hace realmente la operación cuando nadie le pide que siga el modelo?

Mentalidad: **auditor**.

> ¿Qué evidencia nos obliga —o no— a cambiar el modelo?

Estado del conocimiento hoy: **Table-Validated** (no Field-Validated).

---

## Hipótesis activas

[H-01…H-22](../20-evidence-framework/fov/01-hypotheses-from-rc.md) · [Known Limitations](./03-known-limitations-rc.md).

Antes de cada sesión: 2–4 hipótesis del día.

---

## Prohibido

- Explicar el modelo · corregir operarios · sugerir mejoras  
- Enseñar pantallas · cambiar procesos  
- Editar `docs/17` / MC en caliente  

---

## Permitido

- Aclaraciones **operativas**  
- Registrar tiempos · decisiones · incidencias · excepciones  
- FO-xxx el mismo día (FO-V / FO-E / FO-C / FO-U)  
- Marcar **Knowledge Leakage** (ver abajo)

---

## Regla de oro

> Si aparece una idea de mejora, se registra como observación. **No se implementa** durante la campaña.

---

## Knowledge Leakage (indicador)

> Toda decisión operacional **correcta** que depende del conocimiento **implícito** de una persona y no del modelo.

Ejemplos: «siempre así porque Juan me enseñó» · «ese proveedor falla los martes» · «este cliente llama a última hora».

No son bugs. Son **fugas de conocimiento** — oro para Checks / heurísticas / automatizaciones futuras.  
Registrar en la FO (señal KL). No forzar Core nuevo.

---

## Éxito

> ¿La evidencia basta para decidir **sin opiniones**?

FO-V en cadena + No KU = el modelo predijo bien (victoria).

---

## Expectativa

No: Core / Invariants nuevos.  
Sí: **reglas tácitas**, excepciones, gap prescrito vs ejecutado.

---

## Tras el campo

```text
FO → FER → KU o Archive → EC → G-01
```

Freeze: [04](./04-methodology-frozen.md) · protocolo: [fov/](../20-evidence-framework/fov/README.md).
