# Kitchen · Workspace Operational Journey

**Workspace:** Kitchen  
**Landing:** `/admin/kitchen`  
**Epic:** EP-OPS-003  
**Estado:** NOT STARTED  
**Gate:** —

---

## Objetivo operacional

Permitir al equipo de cocina recibir la demanda de producción, preparar, ejecutar y finalizar lotes, dejando el resultado **disponible para Delivery** sin salir del Kitchen Workspace.

**Outcome certificado:** `Production Ready`  
**Pregunta:** ¿Puede un cocinero completar la producción del alcance piloto sin salir de su Workspace?

---

## Actor principal

| Rol | Notas |
|-----|-------|
| `kitchen` / `production` | Actor de jornada |
| `operations_manager` / `company_admin` | Supervisión (no sustituye la jornada Kitchen) |

---

## Entradas

- Órdenes / demanda de producción del periodo
- Lista de preparación / hoja de producción
- Estado de platos / lotes pendientes

---

## Proceso (jornada objetivo)

```text
Recepción de producción
        ↓
Lista de preparación
        ↓
Producción
        ↓
Finalización
        ↓
Disponible para Delivery
```

| Paso | Qué demostrar | Evidencia |
|------|---------------|-----------|
| Recepción | Ve demanda / lotes entrantes | □ |
| Preparación | Lista accionable en workspace | □ |
| Producción | Cambia estados / ejecuta | □ |
| Finalización | Cierra lote / marca listo | □ |
| Handoff | Queda disponible para Delivery | □ (anotar Flow Gap si falla traspaso) |

---

## Salidas

- Lotes / producción finalizada
- Señal o estado consumible por Delivery
- Registro operacional de la jornada

**Outcome:** **Production Ready** — Gate PASS solo si este outcome es demostrable con evidencia.

---

## Dependencias

- Pedidos / intake ya materializados (no certifica Intake aquí)
- Datos de menú / platos del tenant
- Entry CERTIFIED (llega a `/admin/kitchen`)

---

## Restricciones (qué NO puede hacer)

- Gestión Platform (`/saas`)
- Facturación / conciliación Accounting
- Operar Delivery como home
- Configuración admin del negocio (salvo caps explícitas)

---

## Operational Journey (evidencia)

| # | Paso | Resultado | Notas / captura |
|---|------|-----------|-----------------|
| 1 | Entrar Kitchen Workspace | □ | |
| 2 | Recepción producción | □ | |
| 3 | Lista preparación | □ | |
| 4 | Producción | □ | |
| 5 | Finalización | □ | |
| 6 | Disponible Delivery | □ | |

---

## Workspace Validation

| Criterio | OK |
|----------|:--:|
| Recorrido operativo completo en Workspace | □ |
| Operaciones críticas funcionan | □ |
| Sin bloqueos operacionales P0/P1 | □ |
| Límites del Workspace claros | □ |
| Evidencia reproducible | □ |

---

## Negative Cases

| Caso | Esperado | Resultado |
|------|----------|-----------|
| Rol sin `kitchen.operate` → deep link Kitchen | Denegado / redirect | □ |
| Intento de cerrar lote sin datos | Error claro · sin estado corrupto | □ |
| Acceso a Accounting / SaaS desde sesión Kitchen | Bloqueado | □ |

---

## Observaciones

*(rellenar en pasada)*

---

## Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Handoff Kitchen→Delivery opaco | Flow Gap | Anotar ID · no bloquear Gate Kitchen si trabajo local OK |
| Módulo incompleto vs jornada | Surface Gap | FAIL o OBSERVATIONS según P13 |

---

## Evidence Gate · Kitchen

```text
STATUS: NOT STARTED

Evidence
  □ Operational Journey completo
  □ Workspace Validation
  □ Negative Cases
  □ Observaciones / Riesgos clasificados

Gate: — | PASS | OBSERVATIONS | FAIL
```
