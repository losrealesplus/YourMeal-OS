# 01 · Knowledge States

Parte del [Evidence Framework](./README.md).

Los **Knowledge States** miden el estado del conocimiento que el modelo codifica — no solo el estado del producto.

Definición canónica (FASE 5): [knowledge-state.md](../18-operational-validation/knowledge-state.md) · registro: [knowledge-state-registry.md](../18-operational-validation/knowledge-state-registry.md).

---

## Los cinco estados (recordatorio)

| Estado | Significado |
|--------|-------------|
| **Hypothesized** | Razonamiento; sin observación directa |
| **Observed** | Visto en operación real |
| **Validated** | El modelo lo explica (VR de mesa / IOV) |
| **Refuted** | El modelo no lo explicó → VR → MC |
| **Generalized** | Confirmado en múltiples organizaciones |

---

## Puente hacia ECL

Knowledge State responde: **¿en qué estado está esta afirmación?**  
[ECL](./02-evidence-confidence-levels.md) responde: **¿con qué grado de evidencia la tratamos para decidir?**

| Knowledge State (típico) | ECL mínimo asociado |
|--------------------------|---------------------|
| Hypothesized | ECL-1 |
| Observed (aislado) | ECL-2 |
| Validated (mesa · VS/VR) | ECL-3 |
| Observed/Validated en FOV | ECL-4 |
| + impacto económico medido (EC) | ECL-5 |
| Generalized | ECL-4+ en ≥2 orgs (meta) |

Una Capability puede estar **Validated** en mesa (KS) y aun así en **ECL-3** hasta que FOV/EC la elevan.

---

## Regla

No se abre Etapa 2 sobre afirmaciones críticas solo en ECL-1/2.  
Ver [Gate G-01](./05-gate-g01-operational-readiness.md).

---

## Relacionado

- [02 ECL](./02-evidence-confidence-levels.md)  
- [03 FOV](./03-field-operational-validation.md)
