# VR-003 — Seguridad alimentaria · retirada de lote

**Fecha:** 2026-07-22  
**Origen:** [VS-003](../02-validation-scenarios/VS-003-seguridad-alimentaria.md)  
**Dimensión:** Trazabilidad / recorrido inverso  
**Autor / sesión:** Auditoría de mesa

---

## Intención

¿Puede el modelo, **sin inventar Core Objects de espina**, identificar desde un lote de Ingredient contaminado todos los Batches, Orders, destinatarios, Packaging en cámara y Deliveries en curso — y representar la retirada y el impacto en Payment?

---

## Hallazgo

**Recorrido inverso:**

| Tramo | ¿Soportado? |
|-------|-------------|
| Lote proveedor → Stock/Batch | ✗ entrada — lot no canónico |
| Batch → Orders | ⚠ INV-031 demasiado laxo |
| Order → Consumer/Beneficiary | ✔ |
| Delivery en curso → stop | ⚠ Incident parcial |
| Packaging en cámara → quarantine | ⚠ |
| Retirada como hecho | ⚠ sin entidad Supporting/evento |
| Payment → crédito/devolución | ⚠ |

**Ningún Invariant impide** gestionar una retirada.  
**Ningún Core nuevo de espina** es necesario.  
Hace falta **ampliar** Supporting/Lifecycle/precisión de traza — no reescribir la Constitución.

---

## ¿Se explicó con el modelo existente?

| Intento | Resultado |
|---------|-----------|
| Ingredient → Recipe → Batch | Parcial (sin lot ID) |
| Batch → Plan → Orders | Parcial (granularidad Tenant) |
| Packaging → Order Item → Order | Mejor puente — no obligado hoy |
| Recall como Core | **Rechazado** (filtro 02) |
| Notification | Fuera de modelo (VR-002) |

---

## Clasificación de madurez

# **Extended**

## Severidad

# 🔁

## Justificación

No Contradicted: el modelo no afirma una traza lote→pedido falsa; simplemente **no la garantiza**.  
Extended: Lot (Supporting o atributo de Stock Receive), traza Batch↔Order Item obligatoria para seguridad, Quarantine Packaging, evento Incident/Recall Supporting, Credit Payment.

---

## Acción requerida

**MC-003** propuesto y **aparcado** (principio 16 — no aplicar hasta análisis post VS-006).

## Model Change

[MC-003](../06-model-changes/MC-003-lot-traceability-recall.md) ⏸

## Knowledge State

| Elemento | KS | Proveniencia |
|----------|-----|--------------|
| Ingredient / Stock (sin lot) | V parcial | VR-003 |
| INV-031 | V parcial — ambigüedad expuesta | VR-003 |
| Order → actores | V | VR-003 |
| Recall Core (rechazo) | V (decisión) | VR-003 |
| Payment Credit | H (propuesto MC-003) | VR-003 |

---

## Criterio de éxito

✔ Hallazgos trazables · dimensión distinta de VS-001/002 · grieta de traza inversa documentada.
