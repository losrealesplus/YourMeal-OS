# Delivery · Workspace Operational Journey

**Workspace:** Delivery  
**Landing:** `/admin/delivery`  
**Epic:** EP-OPS-003  
**Estado:** NOT STARTED  
**Gate:** —

---

## Objetivo operacional

Permitir al equipo de reparto tomar pedidos preparados, asignar, ejecutar ruta, confirmar entregas y cerrar la jornada **dentro del Delivery Workspace**.

**Outcome certificado:** `Orders Delivered`  
**Prerrequisito de orden:** Kitchen Gate PASS|OBSERVATIONS (cadena de valor).  
**Pregunta:** ¿Puede el equipo de Delivery completar una ruta de extremo a extremo desde su Workspace?

---

## Actor principal

| Rol | Notas |
|-----|-------|
| `delivery` / `logistics` | Actor de jornada en Ops |
| `driver` | Superficie `/driver` — anotar handoff si aplica |
| `operations_manager` / `company_admin` | Supervisión |

---

## Entradas

- Pedidos / lotes marcados preparados (salida Kitchen u origen equivalente)
- Asignaciones de ruta / stops
- Datos de cliente / dirección / ventana

---

## Proceso (jornada objetivo)

```text
Pedidos preparados
        ↓
Asignación
        ↓
Ruta
        ↓
Entrega
        ↓
Confirmación
        ↓
Cierre
```

| Paso | Qué demostrar | Evidencia |
|------|---------------|-----------|
| Preparados | Ve cola lista para repartir | □ |
| Asignación | Asigna conductor / ruta | □ |
| Ruta | Recorre / gestiona stops | □ |
| Entrega | Registra intento / entrega | □ |
| Confirmación | Confirma resultado | □ |
| Cierre | Cierra ruta / jornada | □ |

---

## Salidas

- Rutas cerradas
- Entregas confirmadas / incidencias de entrega
- Estado consumible por Support / Accounting (si aplica)

**Outcome:** **Orders Delivered** — Gate PASS solo si este outcome es demostrable con evidencia.

---

## Dependencias

- Señal “preparado” desde Kitchen (o equivalente)
- Caps `logistics.operate`
- Entry CERTIFIED (`/admin/delivery`)

---

## Restricciones

- No cocina / producción write
- No Platform SaaS
- No facturación como home Accounting
- Driver surface distinta — documentar límite Workspace vs `/driver`

---

## Operational Journey (evidencia)

| # | Paso | Resultado | Notas |
|---|------|-----------|-------|
| 1 | Entrar Delivery Workspace | □ | |
| 2 | Pedidos preparados | □ | |
| 3 | Asignación | □ | |
| 4 | Ruta | □ | |
| 5 | Entrega | □ | |
| 6 | Confirmación | □ | |
| 7 | Cierre | □ | |

---

## Workspace Validation

| Criterio | OK |
|----------|:--:|
| Recorrido completo en Workspace | □ |
| Operaciones críticas OK | □ |
| Sin bloqueos P0/P1 | □ |
| Límites claros (incl. Driver) | □ |
| Evidencia reproducible | □ |

---

## Negative Cases

| Caso | Esperado | Resultado |
|------|----------|-----------|
| Sin `logistics.operate` | Denegado | □ |
| Entrega sin stop asignado | Error controlado | □ |
| Acceso Kitchen write / SaaS | Bloqueado | □ |

---

## Observaciones

*(rellenar en pasada)*

---

## Riesgos

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Dependencia Kitchen handoff | Flow Gap | |
| Split Delivery Ops vs Driver app | Surface boundary | Documentar |

---

## Evidence Gate · Delivery

```text
STATUS: NOT STARTED

Evidence
  □ Operational Journey completo
  □ Workspace Validation
  □ Negative Cases
  □ Observaciones / Riesgos clasificados

Gate: — | PASS | OBSERVATIONS | FAIL
```
