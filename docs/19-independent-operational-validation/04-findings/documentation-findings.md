# Documentation Findings (DF) · Impossible Findings (IFD)

Evidencia de **IOV-001 · Comprehension Validation**.  
Miden fricción de uso del modelo documentado — no refutación estructural (salvo IFD → casi siempre VR).

Protocolo: [05 Experimental Protocol](../05-experimental-protocol.md).

---

## Plantilla DF

```markdown
## DF-xxx — [Título corto]

| Campo | Valor |
|-------|-------|
| Tipo | Navigation · Ambiguity · Missing cross-link · Overloaded term · False friend · Gap in example · Implicit assumption · Timing · Other |
| Severidad | Low · Medium · High |
| KCM | KCM-xxx |
| Escenario | … |
| Evaluador | piloto IA · humano |
| Fecha | YYYY-MM-DD |
| Tiempo relacionado | … s (si aplica) |

### Observación

[Dónde dudó / qué buscó / qué interpretó mal]

### Fuente citada del corpus

[Ruta · o «ninguna» → Implicit assumption]

### Impacto en uso

[¿Impide narrar? ¿Solo ralentiza?]

### Classification → seguimiento

- [ ] Docs only (Navigation / cross-link) — **sin VR**
- [ ] Valorar VR (Ambiguity / …)
- [ ] Ninguno — costo de aprendizaje aceptado
```

---

## Plantilla IFD (Impossible Finding)

```markdown
## IFD-xxx — [Qué no pudo resolverse]

| Campo | Valor |
|-------|-------|
| Severidad | Critical |
| KCM | KCM-xxx |
| Declaración del evaluador | «No puedo responder porque el modelo no contiene…» |
| Información buscada | … |
| ¿Existe en corpus y no la halló? | Sí (Navigation) / No (hueco real) |
| Fecha | YYYY-MM-DD |

### Classification

- [ ] Reclasificar como DF Navigation (estaba en corpus)
- [ ] Hueco real → **abrir VR**
```

---

## Evidencia negativa (registro de sesión)

Aciertos sin fricción — no son Findings; viven en la hoja de cierre del [protocolo](../05-experimental-protocol.md):

```text
✓ Amend Order · ✓ Packaging · …
```

---

## Índice DF / IFD

| ID | Título | Tipo | Severidad | Classification | Estado |
|----|--------|------|-----------|----------------|--------|
| — | *(vacío hasta IOV-001)* | | | | |

---

## Relacionado

- [IOV-001](../01-comprehension-validation.md)  
- [Findings README](./README.md)
