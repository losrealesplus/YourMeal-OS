# 04 · Field Operational Validation (FOV)

Parte del [Evidence Framework](./README.md).  
**Fase obligatoria** de FOPEBA — no anexo.

> **No es «otra validación».**  
> Es el comienzo de una **nueva familia de evidencia: evidencia empírica**.

Hasta IOV toda la evidencia fue de **laboratorio**.  
FOV abre el juicio de la **operación real**.

---

## Pregunta correcta

No:

> ¿Confirmamos lo que ya creemos?

Sí:

> **¿Qué hace realmente la operación cuando nadie le pide que siga el modelo?**

Esa diferencia evita el sesgo de confirmación.

---

## Naturaleza del RC que se pone a prueba

El [Operational Model RC (Knowledge Certified)](../00-status/02-operational-model-rc.md) está:

> **Certificado para ser puesto a prueba — no certificado como verdad definitiva.**

FOV intenta **refutar** hipótesis certificadas en campo, no celebrarlas.

---

## Tres campañas, tres tipos de evidencia

| Campaña | Tipo de evidencia | Pregunta |
|---------|-------------------|----------|
| Operational Validation | Conceptual (mesa) | ¿El modelo explica? |
| IOV | Transferencia · resistencia · determinismo | ¿Sobrevive sin el autor? |
| **FOV** | **Empírica** | ¿La operación real produce / tensiona el modelo? |

Continidad metodológica: cada campaña tiene reglas propias sobre cómo la evidencia puede influir —o no— en el conocimiento certificado.

---

## Campaña observacional (no «probar el modelo»)

- Observar EatClean.  
- **No** enseñar app · **no** vender · **no** proponer · **no** intervenir.  
- Registrar en lenguaje de cocina; mapear después.  
- Objetivos dirigidos = [Known Limitations RC](../00-status/03-known-limitations-rc.md).

Pregunta operativa de la campaña:

> ¿Cuáles de nuestras limitaciones conocidas siguen siendo ciertas y cuáles dejan de serlo?

---

## Productos (orden obligatorio)

```text
Field Observations (FO)
        ↓
Field Evidence Review (FER)
        ↓
Knowledge Update (solo si FER lo autoriza)
        ↓
EC → G-01
```

| Artefacto | Rol |
|-----------|-----|
| **FO-xxx** | Observación de campo clasificada (FO-V / FO-E / FO-C / FO-U) |
| **FER-xxx** | Revisión de evidencia empírica — filtro antes de KU |
| **KUR-xxx** | Solo después del FER ([05](./05-knowledge-update.md)) |

**No** se espera Model Change inmediato tras una observación.  
Primero evidencia; luego decisiones.

Detalle del protocolo: [fov/](./fov/README.md).

---

## Clasificación FO

| Código | Significado |
|--------|-------------|
| **FO-V** | Confirma el modelo |
| **FO-E** | Extiende el conocimiento **sin** romper el Core |
| **FO-C** | Contradice una hipótesis certificada |
| **FO-U** | Observación aún insuficiente para concluir |

Registro: [fov/03-field-observations.md](./fov/03-field-observations.md).

---

## Cuándo abrir

Solo tras IOV-001…003 + Operational Model RC + Known Limitations publicados.

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| Prerrequisito RC | ✅ Knowledge Certified |
| Protocolo FOV | 🟢 Definido |
| Campaña EatClean | ⏳ Pendiente de ejecución |
| FO / FER | — |

---

## Relacionado

- [fov/ protocolo](./fov/README.md)  
- [Known Limitations RC](../00-status/03-known-limitations-rc.md)  
- [05 Knowledge Update](./05-knowledge-update.md)  
- [IOV](../19-independent-operational-validation/README.md)
