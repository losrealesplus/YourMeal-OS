# Knowledge Traceability

Seña de identidad de YourMeal OS en Etapa 2 / Carril B.

> Cada componente importante del software debe poder señalar el conocimiento que implementa.

El código **materializa** conocimiento. No lo crea.

---

## Cadena

```text
Component
    ↓
Knowledge Source
    ↓
Evidence Level
    ↓
Last Validated / Reference
```

---

## Ejemplo (hoy)

```text
OrderPlanningService

Knowledge Source:  Operational Model RC (Table-Validated)
Evidence Level:    Table-Validated
Reference:         docs/17-operational-model/… (sección / objeto)
Last Validated:    IOV-003 / RC tag operational-model-rc-v0.1
```

## Ejemplo (después de FOV)

```text
Evidence Level:    Field-Validated
Reference:         FER-008 · KUR-… (si aplica)
```

---

## Dónde vivirlo

| Sitio | Forma |
|-------|-------|
| Cabecera de use case / service | Bloque `Knowledge Traceability` (comentario o doc adyacente) |
| ADRs | Enlace al OM / Dynamics / Check |
| Matriz producto | pantalla → capability → objeto operacional ([Sprint 2.1](./SPRINT_2_1_PRODUCT_FOUNDATION.md)) |
| PR | «Justificado por: …» obligatorio si toca lógica de dominio (Fase C) |

---

## Plantilla corta

```markdown
## Knowledge Traceability
- **Component:** …
- **Knowledge Source:** Operational Model RC · …
- **Evidence Level:** Table-Validated | Field-Validated
- **Reference:** path o ID (OM / OD / INV / Check / Capability)
- **Last Validated:** IVR / FER / KUR / fecha
```

---

## Anti-patrones

- Servicio sin referencia al OM.  
- «Lo hicimos así porque es más limpio» sin cita.  
- Inventar regla en código y **después** documentarla en `17`.  
- Usar Fase C para colar lógica de Fase D (heurísticas de campo).

---

## Relacionado

- [etapa-2 README](./README.md) · [Operational Model](../../17-operational-model/README.md)
