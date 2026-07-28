# Delivery · Workspace Operational Journey

**Workspace:** Delivery  
**Landing:** `/admin/delivery`  
**Epic:** EP-OPS-003  
**Estado:** NOT STARTED · **NEXT**  
**Gate:** —  
**Outcome esperado:** **Orders Delivered**  

**Continuidad (regla EP-OPS-003):**

```text
Kitchen Outcome: Production Ready
        ↓
Delivery Input:  Production Ready
        ↓
Delivery Outcome: Orders Delivered
```

**Prerrequisito:** Kitchen CERTIFIED (Gate PASS|OBSERVATIONS) ✅  
**Pack de evidencia (al abrir pasada):** [delivery/](./delivery/)

---

## Objetivo operacional

Tomar pedidos en estado **Production Ready** (`ready_for_delivery`), asignar, ejecutar ruta, confirmar entregas y cerrar la jornada **dentro del Delivery Workspace**.

**Pregunta maestra:**

> ¿Puede Delivery completar el reparto de principio a fin desde su Workspace, partiendo del Outcome Kitchen (Production Ready), y producir **Orders Delivered**?

---

## Actor principal

| Rol | Notas |
|-----|-------|
| `delivery` / `logistics` | Actor de jornada Ops |
| `driver` | Superficie `/driver` — límite Workspace vs Driver a documentar |
| `operations_manager` / `company_admin` | Supervisión |

---

## Entradas (contrato de continuidad)

| Input | Origen | Estado |
|-------|--------|--------|
| **Production Ready** | Kitchen Journey CERTIFIED | ✅ disponible como contrato |
| Pedidos `ready_for_delivery` | Espina operacional Kitchen handoff | A validar en pasada Delivery |
| Datos cliente / dirección / ventana | Tenant ops | A validar |

**No re-certificar** KJ-01…04. Delivery **consume** Production Ready.

---

## Proceso (jornada objetivo)

```text
Input: Production Ready
        ↓
DJ-01  Pedidos preparados (cola Delivery)
        ↓
DJ-02  Asignación
        ↓
DJ-03  Ruta
        ↓
DJ-04  Entrega
        ↓
DJ-05  Confirmación
        ↓
DJ-06  Cierre
        ↓
Outcome: Orders Delivered
```

---

## Salidas

**Outcome:** **Orders Delivered** — Gate solo si demostrable con evidencia reproducible.

Downstream (continuidad):

```text
Orders Delivered  →  Input Support
```

---

## Restricciones de la pasada Delivery

No modificar Identity · Auth · RBAC · Entry · Kitchen CERTIFIED · Support · Accounting.  
No inventar features solo para pasar el gate.  
No mezclar Flow Certification (Bloque G) — solo anotar Flow Gaps.

---

## Evidence Gate · Delivery (plantilla)

```text
STATUS: NOT STARTED

Evidence (al cerrar)
  □ DELIVERY_JOURNEY.md
  □ DELIVERY_VALIDATION.md
  □ DELIVERY_NEGATIVE_CASES.md
  □ DELIVERY_OBSERVATIONS.md

Gate: — | PASS | OBSERVATIONS | FAIL
Outcome: Orders Delivered
```
