# Operational Representation Pattern

**DICT:** [DICT-072 · Operational Representation Pattern](../99-reference/PROJECT_DICTIONARY.md#operational-representation-pattern)  
**Estado:** Accepted (regla arquitectónica permanente)  
**Complementa:** [MODULE_CONVENTION](./MODULE_CONVENTION.md) · [Operational Visibility (DICT-071)](../20-evidence-framework/09-operational-visibility-principle.md) · No Artificiality (G-02.7)

---

## Principio

> Una misma realidad operacional puede representarse como:
>
> * **Service** → lógica de negocio y fuente de verdad.
> * **Report** → representación documental (lectura / impresión).
> * **Workspace** → representación interactiva (el equipo cambia estado).

No se crean dos modelos para la misma realidad.  
No se duplica lógica entre documento y pantalla de trabajo.

---

## Forma canónica

```text
                 Operational Source
                       │
                       ▼
                   XxxService
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
     Report                        Workspace
  (documento)                   (acciones vivas)
```

Ejemplo consolidado (EP-002B.1 / EP-002B.2):

```text
                 Kitchen Queue
                       │
                       ▼
          ProductionReportService
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
Production Sheet (Report)   Kitchen Execution (Workspace)
```

---

## Roles

| Capa | Pregunta que responde | Mutaciones |
|------|----------------------|------------|
| **Service** | ¿Cuál es la verdad operativa de este día / proceso? | Sí (vía capabilities + audit) |
| **Report** | ¿Qué documento necesita el equipo para operar / archivar? | No (solo lectura del Service) |
| **Workspace** | ¿Qué está ocurriendo ahora y qué avanzo? | Sí (transiciones del Service) |

La UI del Report y del Workspace **no** contiene reglas de negocio. Consume el Service.

---

## Agregados de ejecución

Cuando el trabajo real no es “un pedido” sino un **proceso de lote**, el estado vive en un agregado de ejecución (p. ej. `kitchen_production_batches` = plato × día), no se multiplica por línea de pedido.

```text
26 raciones de pechuga  →  1 lote  →  1 estado
```

Los pedidos dependen del lote; no al revés.

---

## Reutilización prevista

El mismo patrón se aplica a los siguientes workspaces operativos:

```text
PackagingService
        ├── Packaging Report
        └── Packaging Workspace

DeliveryService
        ├── Delivery Manifest (Report)
        └── Delivery Workspace
```

Cadena operativa EatClean:

```text
Pedidos → Kitchen Queue → Kitchen Execution
        → Packaging Workspace → Delivery Workspace → Entrega
```

Cada fase consume la salida de la anterior. Sin procesos paralelos inventados.

---

## Reglas

1. **Un Service, N representaciones** — no un segundo modelo “para la pantalla”.
2. **Report ⊆ Service** — el documento no inventa filas, totales ni estados.
3. **Workspace muta solo vía Service** — y deja traza en `audit_log`.
4. **Operational Visibility** — si una capacidad (temporizador, responsable, KPI) no está persistida, no se simula en el Workspace.
5. **Nombres** — preferir `*Report*` / `*Sheet*` / `*Manifest*` para documentos; `*Execution*` / workspace routes para acción.

---

## Relación con Module Convention

`MODULE_CONVENTION` organiza **código** (`domain` / `application` / `infrastructure`).  
Este patrón organiza **representaciones operativas** (cómo el equipo ve y actúa sobre la misma verdad).

Ambos son permanentes y se refuerzan:

```text
modules/*/application/*Service  →  Service
routes admin.*-sheet / print    →  Report
routes admin.*-execution        →  Workspace
```

---

## Definition of Done (para un nuevo proceso operativo)

- Existe un Service que alimenta Report y Workspace.
- El Report es imprimible / exportable sin lógica propia.
- El Workspace avanza estados reales con auditoría.
- No hay mocks ni CTAs muertos (DICT-071).
- El agregado de estado refleja cómo trabaja el equipo (lote, ruta, parada…), no un atajo técnico.

---

## Referencias

- [EP-002B.1 Production Report](../00-status/EP002B1_PRODUCTION_REPORT.md)
- [EP-002B.2 Kitchen Execution](../00-status/EP002B2_KITCHEN_EXECUTION.md)
- [EP-002B.3 Packaging](../00-status/EP002B3_PACKAGING.md) (siguiente)
- [ADR 0005 Services](../adr/0005-services-layer.md)
