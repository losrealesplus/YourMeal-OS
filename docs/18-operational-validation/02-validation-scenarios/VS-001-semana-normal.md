# VS-001 — Semana normal

**Estado:** ⏳ pendiente  
**Validation Report:** —  
**Protocolo:** [audit-protocol.md](./audit-protocol.md) — **auditoría hostil al modelo** (intentar hacerlo fallar)

## Intención de la sesión

> No «pasar» VS-001. **Hacerlo fallar.**

Si termina sin grietas → evidencia fuerte.  
Si encuentra contradicción → éxito (error barato, antes del código).

## Pregunta de refutación

¿Puede la espina `Menu → Order → Plan → Batch → Packaging → Route → Delivery → Payment` narrarse **sin saltos, sin conceptos huérfanos y sin inventar vocabulario nuevo** en una semana estándar?

## Narrativa operativa

- Lunes: Weekly Menu publicado para la semana.  
- Martes–jueves: Consumers y Beneficiaries confirman Orders.  
- Viernes madrugada: Production Plan cerrado; Batches por Dish.  
- Viernes: Packaging y etiquetas; Route asignada.  
- Sábado: Deliveries en ventana; Payments liquidados.

---

## Auditoría por paso (espina)

Completar en sesión. Las seis preguntas por paso: Objects · Dependency · Transición · Check · Invariant · **¿Concepto nuevo?**

### Paso 1 — Publicar Weekly Menu

| Pregunta | Respuesta (sesión) | ¿Coherente? |
|----------|-------------------|-------------|
| Core Objects | Weekly Menu · Dish | ⏳ |
| Dependency | Menu `offers` Dish | ⏳ |
| Transición | Draft → Published | ⏳ |
| Check | ¿Puede publicarse el menú? | ⏳ |
| Invariant | INV-012 · menú Draft no compromete | ⏳ |
| ¿Concepto nuevo? | ⏳ | — |

### Paso 2 — Confirmar Orders

| Pregunta | Respuesta (sesión) | ¿Coherente? |
|----------|-------------------|-------------|
| Core Objects | Order · Consumer/Beneficiary · Weekly Menu | ⏳ |
| Dependency | Order `commits` demanda · Menu `applies to` | ⏳ |
| Transición | Draft → Confirmed | ⏳ |
| Check | ¿Puede confirmarse este Order? | ⏳ |
| Invariant | INV-004 · INV-032 | ⏳ |
| ¿Concepto nuevo? | ⏳ | — |

### Paso 3 — Cerrar Production Plan

| Pregunta | Respuesta (sesión) | ¿Coherente? |
|----------|-------------------|-------------|
| Core Objects | Production Plan · Order | ⏳ |
| Dependency | Plan `aggregates` Orders Confirmed | ⏳ |
| Transición | Open → Confirmed / Closed | ⏳ |
| Check | ¿Puede cerrarse el Plan? | ⏳ |
| Invariant | INV-023 · INV-050 | ⏳ |
| ¿Concepto nuevo? | ⏳ | — |

### Paso 4 — Producir (Production Batch)

| Pregunta | Respuesta (sesión) | ¿Coherente? |
|----------|-------------------|-------------|
| Core Objects | Production Batch · Plan · Dish · Recipe · Stock | ⏳ |
| Dependency | Plan `schedules` Batch · Batch `consumes` Stock | ⏳ |
| Transición | Pending → In progress → Complete | ⏳ |
| Check | ¿Puede iniciarse / completarse el Batch? | ⏳ |
| Invariant | INV-011 · INV-033 · INV-034 · INV-051 | ⏳ |
| ¿Concepto nuevo? | ⏳ | — |

### Paso 5 — Empaquetar (Packaging)

| Pregunta | Respuesta (sesión) | ¿Coherente? |
|----------|-------------------|-------------|
| Core Objects | Packaging · Label · Order · Batch | ⏳ |
| Dependency | Batch `packages into` Packaging · Packaging `fulfills` Order | ⏳ |
| Transición | Pending → Complete | ⏳ |
| Check | ¿Puede completarse el Packaging? (destinatario · etiqueta) | ⏳ |
| Invariant | INV-030 · INV-035 · INV-052 | ⏳ |
| ¿Concepto nuevo? | ⏳ | — |

### Paso 6 — Iniciar Delivery Route

| Pregunta | Respuesta (sesión) | ¿Coherente? |
|----------|-------------------|-------------|
| Core Objects | Delivery Route · Vehicle · Delivery | ⏳ |
| Dependency | Route `groups` Deliveries · Vehicle `assigned to` Route | ⏳ |
| Transición | Planned → Ready → Departed | ⏳ |
| Check | ¿Puede iniciarse la Route? (viabilidad · ventana) | ⏳ |
| Invariant | INV-042 · INV-053 | ⏳ |
| ¿Concepto nuevo? | ⏳ | — |

### Paso 7 — Entregar (Delivery)

| Pregunta | Respuesta (sesión) | ¿Coherente? |
|----------|-------------------|-------------|
| Core Objects | Delivery · Order · Consumer/Beneficiary | ⏳ |
| Dependency | Delivery `fulfills` Order | ⏳ |
| Transición | Pending → Delivered / Failed | ⏳ |
| Check | ¿Puede confirmarse la entrega? | ⏳ |
| Invariant | INV-022 · INV-041 · INV-014 | ⏳ |
| ¿Concepto nuevo? | ⏳ | — |

### Paso 8 — Liquidar Payment

| Pregunta | Respuesta (sesión) | ¿Coherente? |
|----------|-------------------|-------------|
| Core Objects | Payment · Order | ⏳ |
| Dependency | Payment `settles` Order | ⏳ |
| Transición | Pending → Settled | ⏳ |
| Check | ¿Puede liquidarse el cobro? | ⏳ |
| Invariant | INV-040 · INV-013 · INV-024 | ⏳ |
| ¿Concepto nuevo? | ⏳ | — |

---

## Resumen de auditoría

| Métrica | Valor |
|---------|-------|
| Pasos auditados | 0 / 8 |
| Pasos con «concepto nuevo» = Sí | — |
| Grietas detectadas | — |

Al cerrar → actualizar [validation-coverage](../05-validation-reports/validation-coverage.md) y emitir VR-001.

## Hipótesis de rotura (previas a la sesión)

- Objeto de la espina sin verbo dominante.  
- Transición sin Check donde la operación real exige uno.  
- Invariant que impide el flujo «obvio» sin excepción documentada.  
- Necesidad de vocabulario no previsto en Nivel 1.

## Resultado preliminar

⏳ Pendiente de **sesión de auditoría** (facilitador + contraste con docs/17 tras cada paso).
