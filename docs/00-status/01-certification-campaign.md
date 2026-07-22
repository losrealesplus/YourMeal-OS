# Carril A — Campaña de certificación (Etapa 1)

> Hasta hace poco: Operational Model **Beta** (en desarrollo).  
> Ahora: **Operational Model RC (Knowledge Certified)** — certificado **para ser puesto a prueba**, no como verdad definitiva.

| | Construir | Certificar (laboratorio) | Poner a prueba (campo) |
|--|-----------|--------------------------|-------------------------|
| Impulso | Añadir cosas | Demostrar que basta la evidencia de mesa | Intentar **refutar** el RC en operación real |
| Tentación | Seguir refinando | Parar demasiado tarde | Confirmar lo que ya creemos |
| Salida | Más docs | RC Knowledge Certified | FO → FER → (KU) → EC → **G-01** |

Esto **no** es un roadmap de producto.  
Es un **proceso de certificación** del conocimiento operacional.

---

## Cadena de certificación

```text
IOV-001 · 002 · 003 ✅
      ↓
Operational Model RC (Knowledge Certified) ✅
      ↓
FOV (evidencia empírica) ⏳
      ↓
Field Evidence Review (FER)
      ↓
Knowledge Update          ← solo si FER autoriza
      ↓
Economic Confirmation
      ↓
Gate G-01
      ↓
ETAPA 2
```

Cuando G-01 pase, no diremos «vamos a construir la aplicación».  
Diremos: **«Vamos a implementar conocimiento operacional certificado.»**

---

## Pasos

| # | Paso | Pregunta | Doc |
|---|------|----------|-----|
| 1 | IOV-002 | ¿Un tercero puede obligarnos a cambiar la estructura? | IVR-002 ✅ |
| 2 | IOV-003 | ¿El modelo restringe el diseño hacia equivalencia conceptual? | IVR-003 ✅ |
| 3 | Operational Model RC | ¿Congelamos para prueba de campo? | [02](./02-operational-model-rc.md) ✅ |
| 4 | [FOV](../20-evidence-framework/fov/README.md) | ¿Qué hace la operación cuando nadie pide seguir el modelo? | FO-V/E/C/U |
| 5 | [FER](../20-evidence-framework/fov/04-field-evidence-review.md) | ¿Qué hipótesis confirman / refutan / faltan / escalan? | FER-xxx |
| 6 | [Knowledge Update](../20-evidence-framework/05-knowledge-update.md) | ¿Qué cambia el conocimiento (con disciplina)? | KUR |
| 7 | [EC](../20-evidence-framework/06-economic-confirmation.md) | ¿Aporta valor operacional? | ECR |
| 8 | [Gate G-01](../20-evidence-framework/07-gate-g01-operational-readiness.md) | ¿Etapa 2 autorizada? | Acta |

---

## Checklist vivo G-01

| Requisito | Estado |
|-----------|--------|
| Operational Validation | ✅ | Muy alto |
| IOV-001 (Comprehension) | ✅ | Alto |
| IOV-002 (Adversarial) | ✅ | Muy alto |
| IOV-003 (Independent Implementation) | ✅ | Alto |
| **Operational Model RC (Knowledge Certified)** | ✅ | para prueba |
| FOV (protocolo + FO) | ⏳ protocolo 🟢 | |
| Field Evidence Review | 🔒 | |
| Knowledge Update | 🔒 tras FER | |
| Economic Confirmation | ⏳ | |
| Riesgos críticos abiertos | 0 (meta) | |

Sin excepciones. Si falta uno → Gate no abre.

---

## Relacionado

- [Dual Track](../00-status/DUAL_TRACK_ANTECAMARA.md)  
- [FOV campaña](../20-evidence-framework/fov/README.md)  
- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)
