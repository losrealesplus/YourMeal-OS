# 02 · Validation Scenarios

Casos operativos **completos** — auditorías hostiles al modelo.

Cada escenario intenta refutar. Pregunta guía:

> **¿Qué tendría que pasar para que este modelo dejara de ser válido?**

Protocolo: [audit-protocol.md](./audit-protocol.md).

---

## Estrategia de familias (batería)

Cubrir perspectivas **distintas** — no variantes del mismo estrés.

| ID | Familia | Estado |
|----|---------|--------|
| [VS-001](./VS-001-semana-normal.md) | **Comercial** — modificación tardía de Order | ✅ Extended · VR-001 |
| [VS-002](./VS-002-interrupcion-horno.md) | **Disrupción operacional** — mid-execution | ✅ Extended · VR-002 |
| [VS-003](./VS-003-pedido-masivo.md) → reorientar | **Seguridad alimentaria** — retirada ingrediente/lote | ⏳ reescribir |
| [VS-004](./VS-004-rotura-stock.md) → reorientar | **Error humano** — producción/entrega incorrecta | ⏳ reescribir |
| [VS-005](./VS-005-cambio-menu-ultima-hora.md) → reorientar | **Escalado extremo** — 2×–3× carga | ⏳ reescribir |
| [VS-006](./VS-006-cancelacion-cliente.md) → reorientar | **Reglas de negocio** — cliente con requisitos distintos | ⏳ reescribir |
| [VS-007](./VS-007-repartidor-ausente.md) | Logística (conductor) — mantener o fusionar | ⏳ |

Semana con festivo (calendario): candidato a escenario futuro aparte — no bloquea la batería anterior.

---

## Índice vivo

| ID | Escenario | Foco | Estado |
|----|-----------|------|--------|
| VS-001 | Modificación tardía EatClean | Amend · Plan · Stock · Route | ✅ VR-001 Extended |
| VS-002 | Interrupción horno EatClean | Pause Batch · Replan · Kitchen · Notification≠dominio | ✅ VR-002 Extended |
| VS-003…006 | Familias arriba | — | ⏳ |
| VS-007 | Repartidor ausente | Route · Delivery | ⏳ |

---

## Criterio de cierre

1. Cadena de comprobación completa.  
2. VR con clasificación + Knowledge State.  
3. MC si Extended/Contradicted.  
4. Tras VS-001: retrospectiva metodológica.  
5. Preferible aplicar/coordinar MC abiertos antes de saturar más Extended sobre el mismo Lifecycle.

---

## Relacionado

- [05 validation-reports](../05-validation-reports/README.md)  
- [08 methodological-retrospective](../08-methodological-retrospective.md)
