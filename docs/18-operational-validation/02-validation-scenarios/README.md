# 02 · Validation Scenarios

> **Principio 15:** cada VS una dimensión distinta.  
> **Principio 16:** MC aparcados hasta análisis post VS-006.

Protocolo: [audit-protocol.md](./audit-protocol.md).

---

## Roadmap por dimensión

| VS | Escenario | Dimensión | Estado |
|----|-----------|-----------|--------|
| [VS-001](./VS-001-semana-normal.md) | Cambio operativo tardío | **Adaptabilidad** | ✅ Extended · VR-001 |
| [VS-002](./VS-002-interrupcion-horno.md) | Interrupción horno | **Continuidad** | ✅ Extended · VR-002 |
| [VS-003](./VS-003-seguridad-alimentaria.md) | Retirada lote | **Trazabilidad inversa** | ✅ Extended · VR-003 |
| [VS-004](./VS-004-error-humano-etiquetas.md) | Etiquetas cruzadas | **Error humano / recuperación** | ✅ Extended · VR-004 |
| [VS-005](./VS-005-escalabilidad.md) | Contrato +850 beneficiaries | **Escalabilidad** | ✅ **Clarified** · VR-005 |
| [VS-006](./VS-006-cancelacion-cliente.md) | → reescribir: reglas distintas | **Generalización** | ⏳ |

---

## Lectura provisional (5/6)

```text
Extended × 4 · Clarified × 1 · Contradicted × 0 · Core Δ × 0
```

VS-005 aporta evidencia de **generalidad del dominio** (estructura ≠ tamaño).  
VS-006 debe tensionar reglas de negocio distintas — no más volumen.

---

## Criterio de cierre

1. Auditoría · VR · KS  
2. MC aparcado  
3. Tras VS-006: análisis conjunto MC-001…005

---

## Relacionado

- [01 principles §15–16](../01-validation-principles.md)  
- [VR-005](../05-validation-reports/VR-005-escalabilidad-eatclean.md)
