# 02 · Validation Scenarios

Casos operativos **completos** — auditorías hostiles al modelo.

> **Principio 15:** cada VS rompe una **dimensión distinta**. Nunca repetir el mismo tipo de tensión.  
> **Principio 16:** no aplicar cambios a `17` hasta cerrar VS-001…006 y analizar brechas en conjunto.

Protocolo: [audit-protocol.md](./audit-protocol.md).

---

## Roadmap por dimensión

| VS | Escenario | Dimensión puesta a prueba | Estado |
|----|-----------|---------------------------|--------|
| [VS-001](./VS-001-semana-normal.md) | Cambio operativo tardío (Amend Order) | **Adaptabilidad** de la operación | ✅ Extended · VR-001 |
| [VS-002](./VS-002-interrupcion-horno.md) | Interrupción (horno) | **Continuidad** de la operación | ✅ Extended · VR-002 |
| [VS-003](./VS-003-seguridad-alimentaria.md) | Retirada lote contaminado | **Trazabilidad** / seguridad (recorrido **inverso**) | ✅ Extended · VR-003 |
| [VS-004](./VS-004-rotura-stock.md) | → reescribir: error humano | **Error humano** y recuperación | ⏳ |
| [VS-005](./VS-005-cambio-menu-ultima-hora.md) | → reescribir: carga 2×–3× | **Escalabilidad** extrema | ⏳ |
| [VS-006](./VS-006-cancelacion-cliente.md) | → reescribir: cliente reglas distintas | **Generalización** del dominio | ⏳ |
| VS-007 | Repartidor / logística (opcional) | Complemento · no sustituye familia | ⏳ |

Ninguno repite el anterior. Cada uno obliga a demostrar una capacidad diferente del modelo.

---

## Criterio de cierre de escenario

1. Auditoría completa (6 preguntas / paso).  
2. VR con clasificación + Knowledge State.  
3. MC **propuesto y aparcado** si Extended/Contradicted — **no** aplicado a 17.  
4. Tras VS-006: sesión de análisis conjunto → priorizar MC.

---

## Relacionado

- [01 validation-principles](../01-validation-principles.md) §15–16  
- [06 model-changes](../06-model-changes/README.md)  
- [05 validation-reports](../05-validation-reports/README.md)
