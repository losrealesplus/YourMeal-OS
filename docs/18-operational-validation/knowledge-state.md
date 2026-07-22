# Knowledge State — Estado del conocimiento

**Operational Product Engineering (OPE)** no solo mide el estado del **producto**.  
Mide el estado del **conocimiento** que el modelo codifica.

Cada afirmación importante del [Operational Model](../17-operational-model/) puede tener un **Knowledge State** trazable — no solo una definición.

---

## Los cinco estados

| Estado | Significado | Origen típico |
|--------|-------------|---------------|
| **Hypothesized** | Basado en razonamiento; sin observación directa | FASE 4 · diseño del modelo |
| **Observed** | Visto en operación real | Discovery (OF) · Field observation (FOV) |
| **Validated** | El modelo lo explica correctamente | VR **Confirmed** o **Clarified** |
| **Refuted** | El modelo no consiguió explicarlo | VR **Contradicted** → MC |
| **Generalized** | Confirmado en múltiples organizaciones | VR + FOV en ≥2 contextos |

```text
Hypothesized → Observed → Validated → Generalized
                    ↓
                 Refuted → (MC) → Hypothesized/Validated revisado
```

Un elemento **Refuted** no se borra del historial: queda la traza de por qué cambió.

---

## A qué se aplica

| Elemento del modelo | Ejemplo de afirmación |
|---------------------|------------------------|
| Core Object | «Production Batch pertenece a un Plan» |
| Dependency (verbo) | «Plan aggregates Orders Confirmed» |
| Lifecycle / transición | «Order Draft → Confirmed requiere Check» |
| Invariant | INV-011 |
| Operational Check | «¿Puede iniciarse el Batch?» |

No todo alias de Nivel 2/3 necesita estado propio. El canónico Nivel 1 sí.

---

## Regla de proveniencia (memoria del modelo)

> **Toda afirmación importante del modelo debe poder responder:**

| # | Pregunta | Referencia |
|---|----------|------------|
| 1 | **¿Dónde se observó por primera vez?** | OF-xxx · FOV-xxx · VS-xxx · «FASE 4 — razonamiento» |
| 2 | **¿Qué Validation Reports la respaldan?** | VR-xxx (lista) |
| 3 | **¿En qué versión del modelo quedó incorporada?** *(cuando madure el framework)* | ej. Operational Model v0.8 · commit · tag Certified |

Ejemplo:

```text
INV-014

Observed:     EatClean (FOV-002)
Validated:    VR-004, VR-007
Introduced:   Operational Model Alpha (pre-cert)
Revised:      MC-003 → Certified v1.0
```

Sin proveniencia completa, la afirmación permanece **Hypothesized** hasta documentarse.

El modelo no solo dice *qué* decidimos — reconstruye *por qué* y *cuándo* quedó fijado.

---

## Plantilla por elemento

```markdown
### [Nombre canónico] · ej. INV-011

| Campo | Valor |
|-------|-------|
| Knowledge State | Hypothesized \| Observed \| Validated \| Refuted \| Generalized |
| Primera observación | FASE 4 / OF-xxx / FOV-xxx / VS-xxx |
| VR de respaldo | VR-001, VR-003 |
| Versión del modelo | Alpha / MC-xxx → Certified v1.0 |
| MC asociados | MC-002 (si Refuted → corregido) |
| Notas | … |
```

---

## Registro vivo

Índice inicial: [knowledge-state-registry.md](./knowledge-state-registry.md)  
Actualizar al cerrar cada VR o FOV relevante.

---

## Relación con niveles de confianza del modelo

| Nivel del modelo | Knowledge State típico del conjunto |
|------------------|-------------------------------------|
| Alpha | Mayoría **Hypothesized** |
| Beta | Mezcla Hypothesized + **Validated** (mesa) |
| RC | **Observed** + Validated en campo |
| Certified v1.0 | Sin Refuted abiertos; Generalized donde aplique multi-org |

Detalle: [07-certification.md](./07-certification.md) · [validation-coverage](./05-validation-reports/validation-coverage.md).

---

## Relacionado

- [00 operational-product-engineering](./00-operational-product-engineering.md)  
- [05 validation-reports](./05-validation-reports/README.md)
