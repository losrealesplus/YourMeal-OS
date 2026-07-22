# 03 · Field Operational Validation (FOV)

Parte del [Evidence Framework](./README.md).  
**Fase obligatoria** de FOPEBA — no anexo.

---

## Hipótesis A

> **El modelo representa correctamente la realidad.**

FOV responde:

> **¿El mundo real genera el mismo modelo que hemos construido en mesa?**

No es una prueba del software.  
Ni del usuario.  
Ni del MVP.

Es una prueba del **conocimiento**.

---

## Objetivo

Responder:

> ¿Las operaciones reales producen espontáneamente los Core Objects, Lifecycles, Dependencies, Checks e Invariants definidos en el modelo?

---

## Lo que NO debe hacerse

**No llevar el modelo al negocio** para «enseñárselo» o forzar el vocabulario.

Eso ya ocurrió (en parte) en Discovery / validación de mesa.

Ahora se hace lo **contrario**: observar la realidad y ver si **produce** el modelo.

---

## Método (etnográfico)

Durante varios días:

- observar;
- preguntar;
- registrar;
- **no intervenir**.

Después convertir cada observación en la cadena:

```text
Realidad
    ↓
Evento
    ↓
Objeto
    ↓
Lifecycle
    ↓
Checks
    ↓
Invariants
```

Y **comparar** con el Operational Model publicado.

Plantilla operativa de campo (legado FASE 5, compatible): [04-field-observation](../18-operational-validation/04-field-observation/README.md).

---

## Clasificación de cada observación

| Dictamen | Significado |
|----------|-------------|
| **Confirmed** | La realidad produjo exactamente el modelo |
| **Extended** | La realidad mostró un comportamiento nuevo |
| **Clarified** | El modelo era correcto; faltaba precisión |
| **Contradicted** | La realidad desmintió el modelo |

Misma familia de madurez que VR de mesa — distinta **procedencia** (campo).

---

## Productos (artefactos)

FOV **no** produce VR de mesa por defecto.

### 1. FOR — Field Observation Report

Una observación documentada:

```markdown
# FOR-xxx — [Momento / escena]

**Organización / fecha:** …
**Observador:** …
**ECL resultante (preliminar):** ECL-2 → ECL-4 si cerrado en FVR

## Realidad (sin opinión)

…

## Cadena

| Paso | Contenido |
|------|-----------|
| Evento | … |
| Objeto(s) | … |
| Lifecycle / transición | … |
| Checks | … |
| Invariants | INV-… |

## Comparación con el modelo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Existe en el modelo? | Sí / Parcial / No |
| Dictamen | Confirmed · Extended · Clarified · Contradicted |

## Notas

…
```

### 2. Field Validation Report (FVR)

Resumen de la campaña de campo:

```markdown
# Field Validation Report — [Org · período]

**FORs incluidos:** FOR-001…  
**Dictámenes:** Confirmed × · Extended × · Clarified × · Contradicted ×  
**Core Δ:** …  
**ECL:** afirmaciones elevadas a ECL-4  
**Seguimiento:** VR/MC si Contradicted o Extended estructural  
```

Índice vivo: [reports/](./reports/README.md).

---

## Gobierno

```text
FOR → (campaña) → Field Validation Report
        ↓
¿Contradicted / Extended estructural?
        ↓
VR → MC → Operational Model
        ↓
Actualizar KS + ECL (→ ECL-4)
```

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| FOV | ⏳ No ejecutado (EatClean ⏸) |
| FOR abiertos | — |
| Field Validation Report | — |

---

## Relacionado

- [04 Economic Confirmation](./04-economic-confirmation.md)  
- [02 ECL](./02-evidence-confidence-levels.md)  
- [Discovery](../16-operational-discovery/README.md) — no mezclar fases
