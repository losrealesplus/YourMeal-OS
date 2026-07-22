# 02 · Validation Scenarios

Casos operativos **completos** — narrativas de negocio reales, no pantallas.

Cada escenario intenta refutar el modelo. La pregunta guía:

> **¿Qué tendría que pasar para que este modelo dejara de ser válido?**

---

## Plantilla (copiar por escenario)

```markdown
# VS-xxx — [Título]

**Estado:** ⏳ pendiente · 🔄 en ejecución · ✅ cerrado  
**Validation Report:** VR-xxx (cuando exista)

## Pregunta de refutación

¿Qué tendría que pasar para que el modelo dejara de ser válido en este caso?

## Narrativa operativa

[Descripción del día / semana / evento]

## Cadena de comprobación

| Capa | ¿Qué participa? | ¿Coherente? |
|------|-----------------|-------------|
| Core Objects | … | ⏳ |
| Dependencies | … | ⏳ |
| Lifecycles / transiciones | … | ⏳ |
| Operational Checks | … | ⏳ |
| Invariants | INV-… | ⏳ |

## Hipótesis de rotura

[Qué grieta buscamos a propósito]

## Resultado preliminar

⏳ Pendiente de ejecución
```

---

## Índice de escenarios

| ID | Escenario | Foco de tensión | Estado |
|----|-----------|-----------------|--------|
| [VS-001](./VS-001-semana-normal.md) | Semana normal | Espina completa sin fricción | ⏳ |
| [VS-002](./VS-002-semana-festivo.md) | Semana con festivo | Weekly Menu · demanda irregular | ⏳ |
| [VS-003](./VS-003-pedido-masivo.md) | Pedido masivo | Plan · Batch · Stock | ⏳ |
| [VS-004](./VS-004-rotura-stock.md) | Rotura de stock | Checks · INV-034 · transiciones Batch | ⏳ |
| [VS-005](./VS-005-cambio-menu-ultima-hora.md) | Cambio de menú de última hora | Menu Draft/Published · Orders | ⏳ |
| [VS-006](./VS-006-cancelacion-cliente.md) | Consumer/Beneficiary cancela | Order Cancelled · Plan | ⏳ |
| [VS-007](./VS-007-repartidor-ausente.md) | Repartidor ausente | Route · Delivery · reasignación | ⏳ |

---

## Criterio de cierre de un escenario

1. Cadena de comprobación completa (las cinco capas).  
2. Validation Report con dictamen.  
3. Si ⚠ 🔁 🚨 → Model Change antes de marcar ✅.

---

## Relacionado

- [03 edge-cases](../03-edge-cases/README.md) — rotura puntual  
- [05 validation-reports](../05-validation-reports/README.md)
