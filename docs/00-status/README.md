# Estado del proyecto

**Última actualización:** 2026-07-22 · **Operational Model RC (Knowledge Certified)** 🟢  
**Mentalidad:** Etapa 1 ya no es «modelo en desarrollo» — está **certificado para prueba**  
**Siguiente familia de evidencia:** empírica (FOV)

```text
Operational Model Release Candidate
(Knowledge Certified)
```

> Certificado para ser puesto a prueba — no como verdad definitiva.

---

## Cadena de evidencia (hasta aquí = laboratorio)

```text
Observations → Discovery → Checks → Model
  → Operational Validation
  → IOV-001 (Transferability)
  → IOV-002 (Structural Resistance)
  → IOV-003 (Determinism)
  → Operational Model RC (Knowledge Certified)
        ↓
  FOV (evidencia empírica) ⏳
```

---

## Campaña de certificación

| Fase | Estado | Confianza |
|------|--------|----------:|
| Operational Validation | ✅ | Muy alto |
| IOV-001 | ✅ | Alto |
| IOV-002 | ✅ | Muy alto |
| IOV-003 | ✅ | Alto |
| **Operational Model RC** | ✅ | Knowledge Certified |
| **FOV** (campaña observacional) | ⏳ protocolo 🟢 | — |
| Field Evidence Review | 🔒 tras FO | — |
| Knowledge Update | 🔒 tras FER | — |
| Economic Confirmation | ⏳ | — |
| Gate G-01 | 🔒 | — |

Acta: [02](./02-operational-model-rc.md) · Límites: [03](./03-known-limitations-rc.md) · FOV: [fov/](../20-evidence-framework/fov/README.md)

---

## Lectura IOV (afirmaciones distintas)

| Nivel | Afirmación | Evidencia |
|-------|------------|-----------|
| **IOV-001** | Transferible | IVR-001 |
| **IOV-002** | Estructuralmente resistente | IVR-002 |
| **IOV-003** | Interpretable / determinista | IVR-003 · IF-A only |

---

## Carril B

UX / DS / arch / infra **sin** engines de espina — sigue permitido.

---

## Próximo

1. Ejecutar **FOV** EatClean — pregunta: *¿qué hace la operación cuando nadie le pide seguir el modelo?*  
2. Clasificar **FO-V / FO-E / FO-C / FO-U**  
3. **FER** (4 preguntas) → solo entonces KU  
4. EC → **Gate G-01**

| Índice | Ruta |
|--------|------|
| RC | [02](./02-operational-model-rc.md) |
| Known Limitations | [03](./03-known-limitations-rc.md) |
| Protocolo FOV | [fov/](../20-evidence-framework/fov/README.md) |
| Certificación | [01](./01-certification-campaign.md) |
