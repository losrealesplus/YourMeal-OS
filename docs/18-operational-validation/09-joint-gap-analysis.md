# 09 · Análisis conjunto de brechas (post batería VS-001…006)

**Estado:** 🚧 pendiente de sesión de equipo  
**Prerrequisito:** VS-001…006 cerrados con VR · MC aparcados  
**Principio 16:** **ningún** cambio a `17-operational-model` hasta completar este análisis

---

## Propósito

No tratar síntomas VS a VS.  
Identificar **causas estructurales** comunes y priorizar un paquete de Model Changes.

---

## Resultados de la campaña

| VS | Dimensión | Clasificación | MC |
|----|-----------|---------------|-----|
| 001 | Adaptabilidad | Extended | MC-001 Amend · Revise Ready |
| 002 | Continuidad | Extended | MC-002 Pause · Replan In execution |
| 003 | Trazabilidad inversa | Extended | MC-003 Lot · traza · retirada |
| 004 | Recuperación error | Extended | MC-004 Packaging Hold · relabel |
| 005 | Escalabilidad | **Clarified** | MC-005 Cardinalidad docs |
| 006 | Generalización | **Clarified** | MC-006 Location · Plan expedito |

```text
Extended × 4 · Clarified × 2 · Contradicted × 0 · Core Objects nuevos × 0
MC aplicados a 17 × 0
```

---

## Hipótesis estructurales (a validar en sesión)

| Tema | MC implicados | Hipótesis |
|------|---------------|-----------|
| Transiciones mid-cycle | 001 · 002 | Una familia «Revise/Amend/Pause» en Order · Plan · Batch · Route |
| Packaging retención | 003 · 004 | Hold / Quarantine unificados |
| Traza lote | 003 | Supporting Lot + INV-031 endurecido |
| Destino / Location | 006 | Activar Supporting reservado |
| Docs escala | 005 | Cardinalidad n · paralelismo |
| Constitución | — | 0 INV refutados · posibles precisiones |

---

## Agenda de sesión sugerida

1. Releer VR-001…006 (solo dictámenes + catálogos).  
2. Confirmar/refutar hipótesis de la tabla.  
3. Ordenar MC: P0 (coherencia temporal) · P1 (Packaging/Lot) · P2 (Location/docs).  
4. Decidir qué se aplica a `17` en un solo tren de cambios.  
5. Actualizar Knowledge State · Validation Coverage · nivel Alpha→Beta si procede.  
6. Acto hacia [07-certification](./07-certification.md) (criterios Beta).

---

## Regla de oro del análisis

> Preferir **un** cambio estructural que cierre varios VR  
> antes que seis parches locales.

---

## Relacionado

- [06 model-changes](./06-model-changes/README.md)  
- [validation-coverage](./05-validation-reports/validation-coverage.md)  
- [01 principles §16](./01-validation-principles.md)
