# Structural Findings (SF)

Evidencia de **IOV-002 · Adversarial**.  
Origen: [IVR-002](../ivr/IVR-002-iov002-adversarial.md).

---

## Índice

| ID | Título | Objetivo forzado | Resultado | Estado |
|----|--------|------------------|-----------|--------|
| SF-001 | Finished meals without Batch | Core / INV-030 | **Extended** (docs) · Core **rechazado** | ✅ cerrado |
| SF-002 | Batch → two Plans | INV-011 | **Resisted** | ✅ |
| SF-003 | Canteen without vehicle Route | Lifecycle | **Clarified** | ✅ |
| SF-004 | Dual Company Account | INV-015 | **Extended** (docs) | ✅ |
| SF-005 | Clinical diet authority | Core | **Resisted** (Core) · Extended opcional Supporting | ✅ |
| SF-006 | Cook-chill multi-hop | Dependency | **Resisted** · Clarified docs | ✅ |

**Contradicted / Forced Core:** 0  
**Hallazgos abiertos:** 0  

---

## SF-001 — Finished meals enter without Production Batch

| Campo | Valor |
|-------|-------|
| Objetivo forzado | Core nuevo · INV-030/051 |
| Resultado | **Extended** (documentar receive-and-portion) · **Resisted** como Core de espina |
| Dominio | Hospital satellite / catering outsourced |

**Clasificación facilitador:** Multi-Kitchen misma Organization → ya narrable (Resisted). Cross-Organization → Batch/Stock de «receive and portion» + Lot · **no** Core `InboundFinishedGoods` (no es eslabón demanda→entrega). Backlog docs RC.

---

## SF-002 — One Batch, two Plans

| Resultado | **Resisted** |
| Steelman | Stock intermedio / un Plan / parallel Routes |

---

## SF-003 — Point-of-service canteen

| Resultado | **Clarified** |
| Steelman | Route = ventana de servicio · Delivery = handoff mostrador · Location |

Documentar rama servery en RC notes (sin nuevo Lifecycle Core).

---

## SF-004 — Dual Company Account

| Resultado | **Extended** (docs) |
| Steelman | Invoice/Payment split · o Order con Account pagador ≠ home Account |

No Core. Posible aclaración INV-015 / funding path en docs — no Contradicted abierto.

---

## SF-005 — Clinical diet authority

| Resultado | **Resisted** como Core |
| Steelman | Beneficiary + Order Item + Checks Confirm/Amend + Hold |

DietPrescription como Core de espina **rechazado** (autoridad clínica ≠ eslabón espina). Supporting/config opcional = Extended menor.

---

## SF-006 — Multi-hop regenerate

| Resultado | **Resisted** |
| Steelman | Delivery a Kitchen Location → Stock/Lot → segundo Plan/Batch → nuevo Packaging |

Clarified: patrón cook-chill en dos ciclos de espina.

---

## Relacionado

- [IVR-002](../ivr/IVR-002-iov002-adversarial.md)  
- [02 Adversarial](../02-adversarial-validation.md)
