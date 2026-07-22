# 02 · Evidence Confidence Levels (ECL)

Parte del [Evidence Framework](./README.md).

Hasta ahora FOPEBA hablaba de **evidencia**, pero no de su **calidad**.  
ECL convierte cada hallazgo, decisión o Capability en un nivel explícito de confianza.

> No solo documentamos **qué** sabemos.  
> Documentamos **con qué grado de evidencia** lo sabemos.

Ese es el puente entre [Knowledge States](./01-knowledge-states.md) y la toma de decisiones de producto.

---

## Niveles

| Nivel | Significado | Origen típico |
|-------|-------------|----------------|
| **ECL-1** | Hipótesis | Solo Discovery / razonamiento |
| **ECL-2** | Observada en casos aislados | OF · FOV puntual · anécdota operativa |
| **ECL-3** | Validada en mesa | VS / VR · Dynamics · tren MC · IOV (parcial) |
| **ECL-4** | Confirmada en operación real | FOV · FOR · Field Validation Report |
| **ECL-5** | Confirmada con impacto económico medido | EC (Economic Confirmation) |

```text
ECL-1 ──► ECL-2 ──► ECL-3 ──► ECL-4 ──► ECL-5
hipótesis   aislada    mesa      campo      valor medido
```

---

## A qué se aplica

| Elemento | Ejemplo |
|----------|---------|
| Afirmación del modelo | «Amend Confirmed Order es transición canónica» |
| Invariant | INV-031 |
| Capability | Planning · Routes · Inventory |
| Decisión de roadmap | «Construir Packaging Hold primero» |
| Finding IOV | DF / SF / IF (suelen nacer en ECL-2/3) |

---

## Reglas de uso

1. **Toda Capability del roadmap** tiene ECL visible.  
2. **Subir de nivel** requiere artefacto: VR · FOR · matriz EC — no opinión.  
3. **Bajar de nivel** si un FOV Contradicted o un SF Forced concession abre duda.  
4. ECL **no sustituye** Knowledge State; lo complementa.  
5. Gate G-01 exige umbral mínimo en Capabilities críticas (ver [05](./05-gate-g01-operational-readiness.md)).

---

## Plantilla breve

```markdown
| Elemento | KS | ECL | Evidencia | Fecha |
|----------|-----|-----|-----------|-------|
| Amend Order | Validated | ECL-3 | VR-001 · MC-001 | 2026-07-22 |
| Packaging Hold | Validated | ECL-3 | VR-004 · MC-004 | 2026-07-22 |
| Planning (Capability) | Hypothesized* | ECL-1→3 | mesa; FOV/EC pendientes | … |
```

\*Capability de producto vs afirmación de modelo: distinguir.

---

## Relacionado

- [01 Knowledge States](./01-knowledge-states.md)  
- [04 Economic Confirmation](./04-economic-confirmation.md)  
- [05 Gate G-01](./05-gate-g01-operational-readiness.md)
