# P12 · Evidence Freshness

**FOPEBA · Evidence Framework**  
**Estado:** Accepted · 2026-07-26  
**Complementa:** Evidence before Versioning / Evidence before modification  

---

## Regla

> **Ningún hallazgo procedente de una auditoría, revisión automática o análisis externo podrá convertirse en una tarea de ingeniería sin verificar previamente que sigue siendo reproducible sobre la revisión actual del código.**

Si el hallazgo ha sido resuelto por cambios posteriores, deberá clasificarse como:

```text
STALE
```

y **cerrarse sin modificaciones de código**.

---

## Por qué existe

La evidencia no solo debe **existir** — debe estar **vigente** antes de justificar trabajo de desarrollo.

Un análisis desactualizado (Lovable, revisor, auditor externo) que se convierte automáticamente en PR introduce riesgo de:

- regresiones por “arreglar” lo ya corregido  
- deuda por cambios innecesarios  
- ruido en el historial de ingeniería  

---

## PRE-CHECK (obligatorio)

Antes de implementar:

1. Verificar que el hallazgo sigue siendo **reproducible** sobre la rama actual (`main` / revisión objetivo).  
2. Comprobar si PRs o epics recientes lo resolvieron total o parcialmente.  
3. Si está desactualizado → clasificar **STALE** · no modificar código.  
4. Si solo una parte sigue válida → limitar la implementación a esa parte.

```text
Review / Finding
        ↓
PRE-CHECK (P12)
        ↓
¿Sigue siendo reproducible?
        │
   ┌────┴────┐
   │         │
  Sí        No
   │         │
Implementar  STALE → cerrar sin código
```

---

## Finding Status

| Status | Significado | Acción |
|--------|-------------|--------|
| **ACTIVE** | Reproducible en revisión actual | Puede justificar ingeniería |
| **PARTIAL** | Solo un subconjunto sigue válido | Implementar solo lo vigente |
| **STALE** | Resuelto por cambios posteriores | Cerrar · sin código |
| **INVALID** | Nunca fue cierto / mal diagnosticado | Cerrar · documentar |

Plantilla de cierre STALE: [FINDING_STALE_PO_NAV_LOVABLE](../10-validation/FINDING_STALE_PO_NAV_LOVABLE.md) (caso canónico).

---

## Relación con Identity Freeze

El PRE-CHECK en [IDENTITY_FREEZE_v1](../00-status/IDENTITY_FREEZE_v1.md) es la aplicación de **P12** al bloque Auth.

Auth Layer Frozen: no se abren PRs de identidad salvo bug nuevo, security o activación de providers — y solo tras PRE-CHECK.

---

## Anti-patrones

| Prohibido | Correcto |
|-----------|----------|
| Review → PR automático | Review → PRE-CHECK → decisión |
| Re-implementar fix ya mergeado | STALE + enlace a epic/PR |
| “Por si acaso tocamos otra vez” | Evidencia vigente o no hay trabajo |

---

## Referencias

- [Evidence Framework README](./README.md)  
- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)  
- [Validation Principles](../18-operational-validation/01-validation-principles.md) (carga de la prueba · no blindar el modelo)  
