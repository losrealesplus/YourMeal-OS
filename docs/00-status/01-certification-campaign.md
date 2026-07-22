# Carril A — Campaña de certificación (FASE B)

> FOPEBA no desarrolla software aquí.  
> **Certifica conocimiento** hasta Gate G-01; entonces abre FASE C.

```text
FASE A ✅ → FASE B 🚧 → FASE C 🔒
```

---

## Cadena

```text
RC ✅ → FOV (ejecutar) → FER → KU → EC → G-01 → FASE C
```

Sistemas ya construidos: [fov/](../20-evidence-framework/fov/README.md) · [ku/](../20-evidence-framework/ku/README.md) · [ec/](../20-evidence-framework/ec/README.md) · [g01/](../20-evidence-framework/g01/README.md).

---

## Pasos

| # | Paso | Pregunta | Estado |
|---|------|----------|--------|
| 1–3 | IOV-002 · 003 · RC | Laboratorio | ✅ |
| 4 | FOV | ¿Qué hace la operación sin que le pidan el modelo? | ⏳ ejecutar |
| 5 | FER | ¿Qué escala a KU? | 🔒 |
| 6 | KU | ¿Cómo cambia el conocimiento certificado? | 🟢 sistema · 🔒 ejecución |
| 7 | EC | ¿El conocimiento genera valor medible? | 🟢 sistema · 🔒 ejecución |
| 8 | G-01 | ¿Suficiente para Product Engineering? | 🟢 sistema · 🔒 ejecución |

---

## Checklist G-01 (vivo)

| Requisito | Estado |
|-----------|--------|
| Operational Validation · IOV-001…003 · RC | ✅ |
| FOV ejecutado + FER | ⏳ |
| KU (KUR / null) | 🔒 |
| EC (ECR) | 🔒 |
| Open Risks Critical = 0 | meta |
| Package G-01 | 🔒 |

Decisión: **APPROVED** · **APPROVED WITH CONDITIONS** · **REJECTED** — [g01/02](../20-evidence-framework/g01/02-decision.md).

---

Cuando G-01 pase: **«Implementar conocimiento operacional certificado.»**  
Etapa 1 **termina** en G-01 Approved (no en el RC).

Antes de Etapa 2 a pleno: [Post-Certification Review](./05-post-certification-review.md) — archivo candidatas FOPEBA v1.1; **no** evolucionar el método en caliente.

---

## Relacionado

- [Methodology Frozen](./04-methodology-frozen.md)  
- [Mission Brief](./FOV_MISSION_BRIEF.md)  
- [Dual Track](./DUAL_TRACK_ANTECAMARA.md)  
- [FOPEBA](../18-operational-validation/00-operational-product-engineering.md)  
- [Estado](./README.md)
