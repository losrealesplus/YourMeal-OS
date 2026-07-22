# Independent Operational Validation (IOV)

> **Si un evaluador necesita preguntar al autor para completar correctamente un escenario, el conocimiento todavía reside parcialmente en las personas y no completamente en el modelo.**

**Pregunta de la fase:**

> **¿El conocimiento puede transferirse y sobrevivir a personas que no participaron en su construcción?**

Eso es **otra dimensión** de validación — distinta de [Operational Validation](../18-operational-validation/README.md).

| Fase | Pregunta |
|------|----------|
| Operational Validation | ¿El modelo **explica** la operación? |
| **Independent Operational Validation** | ¿El conocimiento es **transferible, atacable e interpretable**? |

No mezclar objetivos: validar el modelo ≠ validar su capacidad de transferencia.

Ningún IOV modifica directamente el [Operational Model](../17-operational-model/README.md).  
Todos producen **evidencia**. Los cambios al modelo siguen Classification → VR → MC (si aplica).

---

## Por qué existe

Tras VS-001…006, Dynamics v0.2 y el tren MC, el modelo alcanza **Beta** (mesa): explica la operación bajo refutación propia.

Eso **no** demuestra transferibilidad. IOV sí lo intenta — con [protocolo experimental](./05-experimental-protocol.md) reproducible.

Alimenta [Gate G-01](../20-evidence-framework/07-gate-g01-operational-readiness.md) junto con FOV y EC.

---

## Los tres niveles

| Nivel | Nombre | Pregunta | Evidencia |
|-------|--------|----------|-----------|
| [IOV-001](./01-comprehension-validation.md) | Comprehension Validation | ¿Se entiende? | DF (+ IFD) |
| [IOV-002](./02-adversarial-validation.md) | Adversarial Validation | ¿Resiste ataques? | SF |
| [IOV-003](./03-independent-implementation.md) | Independent Implementation | ¿Se implementa igual? | IF |

Arquitectura estable. Lo que se fortalece antes de ejecutar es el **protocolo**.

---

## Gobernanza de Findings

```text
Finding
    ↓
Classification
    ↓
    ├─ Navigation / docs-only     → reorganizar documentación (sin VR)
    ├─ Ambiguity / estructural    → VR → posible MC
    └─ Impossible Finding (IFD)   → VR (casi siempre)
```

Detalle: [04 Findings](./04-findings/README.md) · [05 Experimental Protocol](./05-experimental-protocol.md).

---

## Antes de ejecutar IOV-001

| Prioridad | Acción |
|-----------|--------|
| **P0** | Congelar [KCM](./kcm/README.md) |
| **P0** | Prohibición de conocimiento implícito (citas al corpus) |
| **P1** | Transferability Score + evidencia negativa |
| **P2** | Tiempos de localización + confianza 0–100% |
| **P3** | Categoría Impossible Finding |

**Recomendación:** piloto **IA ciego** (conversación nueva, solo corpus KCM) **antes** de un ingeniero humano — depurar protocolo, no el evaluador.

---

## Secuencia FOPEBA (IOV en contexto)

```text
… → Operational Validation → IOV → FOV → Knowledge Update → EC → G-01 → Implementation
```

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| Prerrequisito modelo | ✅ Beta (mesa) |
| Protocolo experimental | 🟢 Definido |
| [KCM-001](./kcm/KCM-001-iov001-pilot.md) | 🔒 Congelado `357833e` |
| Piloto IA / IVR-001 | 🚧 En ejecución |
| IOV-001 humano | ⏳ Tras piloto |
| FOV | ⏳ **Después** de campaña IOV completa |

---

## Índice

| Doc | Contenido |
|-----|-----------|
| [00 Pyramid](./00-knowledge-validation-pyramid.md) | Capas de validación de conocimiento |
| [01 Comprehension](./01-comprehension-validation.md) | IOV-001 |
| [02 Adversarial](./02-adversarial-validation.md) | IOV-002 |
| [03 Independent Implementation](./03-independent-implementation.md) | IOV-003 |
| [04 Findings](./04-findings/README.md) | DF · SF · IF · IFD · Classification |
| [05 Experimental Protocol](./05-experimental-protocol.md) | P0–P3 · piloto · scores |
| [06 Campaign Order](./06-campaign-order.md) | Ejecutar IOV antes de FOV |
| [kcm/](./kcm/README.md) | Knowledge Corpus Manifest |
| [ivr/](./ivr/README.md) | Independent Validation Reports |
| [scenarios/](./scenarios/SC-IOV-001-pedido-semana.md) | SC-IOV-001 |

---

## Relacionado

- [18 Operational Validation](../18-operational-validation/README.md)  
- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)  
- [Estado](../00-status/README.md)
