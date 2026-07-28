# Accounting · Workspace Operational Journey

**Workspace:** Accounting  
**Landing:** `/admin/accounting`  
**Epic:** EP-OPS-003  
**Estado:** NOT STARTED  
**Gate:** —

---

## Objetivo operacional

Permitir al responsable financiero completar el ciclo de **facturación → cobros → conciliación → estado → cierre** desde el Accounting Workspace.

**Outcome certificado:** `Financial Records Complete`  
**Prerrequisito de orden:** último en la cadena (Kitchen → Delivery → Support → Accounting).  
**Pregunta:** ¿Puede Accounting cerrar el ciclo financiero operativo del alcance piloto sin salir de su Workspace?  
**No Artificiality:** sin operación previa real no hay PASS.

---

## Actor principal

| Rol | Notas |
|-----|-------|
| `accounting` | Actor de jornada |
| `company_admin` | Supervisión / configuración — no sustituye la jornada |

---

## Entradas

- Pedidos / entregas facturables
- Cobros / estados de pago
- Datos de cliente / empresa (Party)

---

## Proceso (jornada objetivo)

```text
Facturación
        ↓
Cobros
        ↓
Conciliación
        ↓
Estado financiero
        ↓
Cierre
```

| Paso | Qué demostrar | Evidencia |
|------|---------------|-----------|
| Facturación | Emite / lista facturas del periodo | □ |
| Cobros | Registra o ve cobros | □ |
| Conciliación | Cruza esperado vs cobrado | □ |
| Estado | Vista de estado financiero usable | □ |
| Cierre | Cierre de periodo / jornada contable | □ |

---

## Salidas

- Facturas / estados de cobro
- Conciliación documentada
- Cierre de periodo (o evidencia de limitación honesta)

**Outcome:** **Financial Records Complete** — Gate PASS solo si este outcome es demostrable sin datos fingidos.

---

## Dependencias

- Cap `accounting.operate`
- Datos comerciales / pedidos del tenant
- Entry CERTIFIED (`/admin/accounting`)
- **Flag / madurez del módulo** — si placeholder, Gate no puede ser PASS fingido (P13 · No Artificiality)

---

## Restricciones

- No cocina / delivery operate
- No Platform SaaS
- No inventar datos simulados para “pasar” certificación
- Si módulo no activado: documentar FAIL o fuera de alcance firmado — no PASS vacío

---

## Operational Journey (evidencia)

| # | Paso | Resultado | Notas |
|---|------|-----------|-------|
| 1 | Entrar Accounting Workspace | □ | |
| 2 | Facturación | □ | |
| 3 | Cobros | □ | |
| 4 | Conciliación | □ | |
| 5 | Estado financiero | □ | |
| 6 | Cierre | □ | |

---

## Workspace Validation

| Criterio | OK |
|----------|:--:|
| Recorrido completo en Workspace | □ |
| Operaciones críticas OK | □ |
| Sin bloqueos P0/P1 | □ |
| Límites claros | □ |
| Evidencia reproducible · sin artificialidad | □ |

---

## Negative Cases

| Caso | Esperado | Resultado |
|------|----------|-----------|
| Sin `accounting.operate` | Denegado | □ |
| Kitchen → Accounting deep link | Redirect | □ |
| Módulo OFF / placeholder | No PASS · OBS o FAIL documentado | □ |

---

## Observaciones

*(rellenar en pasada — probable madurez de módulo)*

---

## Riesgos

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Placeholder panel actual | Alto para PASS | Honestidad > teatro |
| Alcance piloto sin facturación real | Scope | Waiver explícito o FAIL |

---

## Evidence Gate · Accounting

```text
STATUS: NOT STARTED

Evidence
  □ Operational Journey completo
  □ Workspace Validation
  □ Negative Cases
  □ Observaciones / Riesgos clasificados
  □ No Artificiality respetado

Gate: — | PASS | OBSERVATIONS | FAIL
```
