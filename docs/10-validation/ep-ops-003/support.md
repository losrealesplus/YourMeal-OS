# Support · Workspace Operational Journey

**Workspace:** Support  
**Landing:** `/admin/support`  
**Epic:** EP-OPS-003  
**Estado:** NOT STARTED  
**Gate:** —

---

## Objetivo operacional

Permitir a Atención al Cliente recibir, clasificar, seguir y resolver incidencias **sin cambiar de contexto** fuera del Support Workspace.

**Pregunta de certificación:**

> ¿Puede un agente gestionar una incidencia completa sin abandonar su Workspace?

---

## Actor principal

| Rol | Notas |
|-----|-------|
| `support` | Actor de jornada |
| `operations_manager` / `company_admin` | Escalado / supervisión |

---

## Entradas

- Incidencias / consultas de clientes
- Historial de pedidos del cliente
- Notas de soporte previas

---

## Proceso (jornada objetivo)

```text
Recepción de incidencia
        ↓
Clasificación
        ↓
Seguimiento
        ↓
Resolución
        ↓
Cierre
```

| Paso | Qué demostrar | Evidencia |
|------|---------------|-----------|
| Recepción | Localiza cliente / caso | □ |
| Clasificación | Tipifica / prioriza | □ |
| Seguimiento | Notas / estados / pedidos relacionados | □ |
| Resolución | Acción resolutiva registrada | □ |
| Cierre | Caso cerrado · trazable | □ |

---

## Salidas

- Incidencia resuelta / cerrada
- Notas y trazabilidad en directorio
- Escalados documentados (si aplica)

---

## Dependencias

- `CustomerDirectoryService` / datos de clientes y pedidos
- Cap `support.read` (+ write notes según producto)
- Entry CERTIFIED (`/admin/support`)

---

## Restricciones

- No producción / cocina operate
- No Platform SaaS
- No sustituir Accounting
- Admin settings solo con caps — no parte de la jornada Support

---

## Operational Journey (evidencia)

| # | Paso | Resultado | Notas |
|---|------|-----------|-------|
| 1 | Entrar Support Workspace | □ | |
| 2 | Recepción incidencia | □ | |
| 3 | Clasificación | □ | |
| 4 | Seguimiento | □ | |
| 5 | Resolución | □ | |
| 6 | Cierre | □ | |

---

## Workspace Validation

| Criterio | OK |
|----------|:--:|
| Recorrido completo en Workspace | □ |
| Operaciones críticas OK | □ |
| Sin bloqueos P0/P1 | □ |
| Límites claros | □ |
| Evidencia reproducible | □ |

---

## Negative Cases

| Caso | Esperado | Resultado |
|------|----------|-----------|
| Sin `support.read` | Denegado | □ |
| Customer intentando `/admin/support` | Redirect `/app` | □ |
| Cierre sin nota mínima (si regla existe) | Validación / OBS | □ |

---

## Observaciones

*(rellenar en pasada)*

---

## Riesgos

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Comunicaciones / campañas solo “planned” | OBS | No fingir integraciones |
| Solape visual con `/admin/customers` | Boundary | Misma base · vistas distintas |

---

## Evidence Gate · Support

```text
STATUS: NOT STARTED

Evidence
  □ Operational Journey completo
  □ Workspace Validation
  □ Negative Cases
  □ Observaciones / Riesgos clasificados

Gate: — | PASS | OBSERVATIONS | FAIL
```
