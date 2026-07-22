# 02 · Evidence Confidence Levels (ECL)

Parte del [Evidence Framework](./README.md).

ECL no es solo un atributo de la validación.  
Es una **propiedad transversal** de todo elemento de conocimiento en FOPEBA.

> No solo documentamos **qué** sabemos.  
> Documentamos **con qué grado de evidencia** lo sabemos.

Puente entre [Knowledge States](./01-knowledge-states.md) y decisiones de producto.  
Complementa — no sustituye — el [Stability Index](./03-stability-index.md).

---

## Niveles

| Nivel | Significado | Origen típico |
|-------|-------------|----------------|
| **ECL-1** | Hipótesis | Solo Discovery / razonamiento |
| **ECL-2** | Observada en casos aislados | OF · FOR puntual · anécdota |
| **ECL-3** | Validada en mesa | VS / VR · Dynamics · MC · IOV |
| **ECL-4** | Confirmada en operación real | FOV · FOR · Field Validation Report |
| **ECL-5** | Confirmada con impacto económico medido | EC |

```text
ECL-1 ──► ECL-2 ──► ECL-3 ──► ECL-4 ──► ECL-5
hipótesis   aislada    mesa      campo      valor medido
```

---

## Propiedad transversal

Todo elemento canónico puede (y debería) llevar ECL:

| Elemento | Ejemplo ECL (ilustrativo) |
|----------|---------------------------|
| Core Object | Order · Batch → rumbo ECL-4/5 |
| Supporting Object | Lot · Location |
| Operational Check | ¿Puede iniciarse el Batch? |
| Invariant | INV-031 |
| Lifecycle / transición | Amend · Hold |
| Capability | Planning · Routes |
| Regla recién descubierta | ECL-1 hasta FOV/EC |

Ejemplo de lectura estratégica:

| Elemento | ECL |
|----------|-----|
| Core Object (espina) | 5 |
| Supporting Object | 4 |
| Operational Check | 3 |
| Capability | 2 |
| Regla recién descubierta | 1 |

---

## Preguntas estratégicas

ECL permite preguntar (y responder con datos):

> **¿Qué porcentaje del modelo está validado en campo?** (ECL ≥ 4)

> **¿Qué parte del producto sigue apoyándose en hipótesis?** (ECL ≤ 2)

> **¿Qué Capabilities críticas aún no tienen impacto medido?** (ECL &lt; 5 en priorizadas)

Eso es información de **gobernanza**, no de documentación.

---

## Métricas sugeridas (tablero de evidencia)

| Métrica | Definición |
|---------|------------|
| % Core Objects ECL≥4 | Cubertura de campo de la espina |
| % Capabilities ECL≤2 | Superficie aún hipotética |
| % roadmap ECL≥4 | Madurez de lo que se va a construir |
| Delta ECL post-FOV | Elevaciones en Knowledge Update |

Registro: puede vivir junto a [knowledge-state-registry](../18-operational-validation/knowledge-state-registry.md) o un futuro `evidence-scorecard.md`.

---

## Reglas de uso

1. **Todo elemento del modelo y Capability de roadmap** tiene ECL visible.  
2. **Subir** requiere artefacto (VR · FOR · ECR) — no opinión.  
3. **Bajar** si FOV Contradicted o SF Forced concession.  
4. ECL ≠ Stability — ver [03](./03-stability-index.md).  
5. Gate G-01 usa umbrales ECL en elementos críticos.

---

## Plantilla

```markdown
| Elemento | Tipo | KS | ECL | Stability | Evidencia | Fecha |
|----------|------|-----|-----|-----------|-----------|-------|
| Order | Core | Validated | 3 | S2 | VR-001…006 | … |
| Amend Order | Transición | Validated | 3 | S2 | MC-001 | … |
| Planning | Capability | — | 2 | S1 | Blueprint | … |
```

---

## Relacionado

- [01 Knowledge States](./01-knowledge-states.md)  
- [03 Stability Index](./03-stability-index.md)  
- [07 Gate G-01](./07-gate-g01-operational-readiness.md)
