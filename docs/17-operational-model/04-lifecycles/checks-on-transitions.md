# Checks en transiciones

> Los Operational Checks **validan transiciones**, no estados.

Ver [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md) · dependencias en [03](../03-relationships/checks-at-edges.md).  
**Resultados 2.0:** PASS · WARNING · BLOCKED · **MANUAL DECISION** — [Checks 2.0](../07-operational-dynamics/03-operational-checks-2.0.md) (INV-043: el Check no decide por sí solo la compra / excepción).

```text
Check → Result → Next Transition
```

---

## Formato de enunciado

```text
¿Puede [evento] [Objeto]?
```

| Estado (evitar) | Transición (usar) |
|-----------------|---------------------|
| Order Confirmed | ¿Puede **confirmarse** este Order? |
| Batch In Progress | ¿Puede **iniciarse** este Production Batch? |
| Delivery Delivered | ¿Puede **marcarse como entregada**? |
| Payment Settled | ¿Puede **liquidarse** este Payment? |
| Packaging Complete | ¿Puede **completarse** el Packaging? |
| Route Ready | ¿Puede **declararse lista** la Delivery Route? |

---

## Mapa espina → Checks de transición

| Objeto | Transición | Checks típicos | Resultados |
|--------|------------|----------------|------------|
| Weekly Menu | Publish | Repetición menú · oferta viable | PASS / WARNING |
| Order | Confirm | Completitud · plazo · Menu Published | PASS / BLOCKED / MANUAL |
| Order | **Amend** *(Operational)* | Plazo · Plan · Stock · Menu · alérgenos · Route | PASS / BLOCKED / MANUAL |
| Order | Cancel | Producción ya iniciada | PASS / BLOCKED / MANUAL |
| Production Plan | Finalize / Start | Stock · descongelación · demanda | PASS / BLOCKED / MANUAL |
| Production Plan | **Revise / Replan** | Batches Completed inmutables · Pause si In progress | PASS / BLOCKED / MANUAL |
| Production Batch | Start Production | Stock · **Lot** · capacidad Kitchen · recetas | PASS / BLOCKED / MANUAL |
| Production Batch | **Pause / Resume** | Capacidad · Stock · personal | PASS / BLOCKED / MANUAL |
| Production Batch | Complete | Cantidades vs Plan | PASS / WARNING / BLOCKED |
| Packaging | Complete | Label · alergias · destinatario | PASS / WARNING / BLOCKED / MANUAL |
| Packaging | **Hold / Release** | Retención · Label↔contenido / clearance | PASS / BLOCKED / MANUAL |
| Packaging | Hand to route | Asignación · **identidad verificada** · no desde Held | PASS / BLOCKED / MANUAL |
| Delivery Route | Ready / Depart | Viabilidad ventana · carga · Vehicle | PASS / BLOCKED / MANUAL |
| Delivery Route | **Revise** | Ventana · Vehicle · Packaging no Handed | PASS / BLOCKED / MANUAL |
| Delivery | Confirm Delivered | Destinatario · **Location** · cobro si aplica | PASS / BLOCKED / MANUAL |
| Delivery | Update destination / Stop for Safety | Destino válido · seguridad | PASS / BLOCKED / MANUAL |
| Payment | Settle | ¿Debo cobrar? · importe | PASS / BLOCKED / MANUAL |
| Label | Apply / Void / Reapply | Identidad · mismatch | PASS / BLOCKED / MANUAL |
| Stock / Lot | Receive / Consume | Lot requerido · vigencia | PASS / BLOCKED / MANUAL |
| Location | Active / usar en Delivery | Destino válido | PASS / BLOCKED / MANUAL |

---

## Conexión con Capabilities

La Capability **no** define el Check.

Implementa la lectura de precondiciones y la propuesta de acción cuando el Check de transición falla o pasa.

```text
Transición definida (04)
        ↓
Check en esa transición → Resultado 2.0
        ↓
Capability ejecuta / muestra / pide MANUAL DECISION
        ↓
Objetos existentes (02)
```

---

## Anti-patrones

- Check atado a un nombre de pantalla  
- Check que solo dice «estado = X» sin pregunta  
- Check sin acción sugerida post-transición (Next Transition)  
- Nuevo objeto Core porque una pantalla lo necesita (viola principio Capabilities)  
- Tratar MANUAL DECISION como bypass silencioso de INV-043
