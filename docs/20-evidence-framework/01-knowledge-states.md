# 01 · Knowledge States

Parte del [Evidence Framework](./README.md).

Los **Knowledge States** miden el estado del conocimiento que el modelo codifica.

Definición canónica: [knowledge-state.md](../18-operational-validation/knowledge-state.md) · [registry](../18-operational-validation/knowledge-state-registry.md).

---

## Los cinco estados

| Estado | Significado |
|--------|-------------|
| **Hypothesized** | Razonamiento; sin observación directa |
| **Observed** | Visto en operación real |
| **Validated** | El modelo lo explica (VR / IOV) |
| **Refuted** | No lo explicó → VR → MC |
| **Generalized** | Confirmado en múltiples organizaciones |

---

## Tres ejes (lectura completa)

| Eje | Pregunta | Doc |
|-----|----------|-----|
| **Knowledge State** | ¿En qué estado está? | este |
| **ECL** | ¿Con qué evidencia decidimos? | [02](./02-evidence-confidence-levels.md) |
| **Stability** | ¿Cuánto se mueve? | [03](./03-stability-index.md) |

```text
Knowledge State
        ↓
       ECL
        ↓
   Stability Index
```

Una Capability **Validated** (KS) puede seguir en **ECL-3** y **S1** hasta FOV / Knowledge Update / EC.

---

## Regla

No se abre Etapa 2 sobre afirmaciones críticas solo en ECL-1/2 o Stability S0.  
Ver [Gate G-01](./07-gate-g01-operational-readiness.md).

---

## Relacionado

- [02 ECL](./02-evidence-confidence-levels.md)  
- [03 Stability](./03-stability-index.md)  
- [04 FOV](./04-field-operational-validation.md)
