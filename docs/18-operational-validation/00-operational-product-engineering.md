# FOPEBA — Framework de generación y validación progresiva de conocimiento

**Antes:** Operational Product Engineering (OPE) — proceso de adquisición de conocimiento.  
**Ahora:** **FOPEBA** — el mismo núcleo, ampliado con evidencia de campo, confirmación económica y gate formal a implementación.

YourMeal OS es el **experimento controlado** que demuestra (o refuta) la promesa del framework.

---

## Dos promesas

| Promesa | Estado |
|---------|--------|
| *Si diseñamos primero el conocimiento operacional, podemos construir un modelo estable.* | ✅ Evidencia de mesa (Beta) |
| *Este proceso produce mejores productos.* | ⏳ Requiere FOV + EC + Gate G-01 |

Documento madre de evidencia: [20 · Evidence Framework](../20-evidence-framework/README.md).

---

## Cambio de criterio de verdad

| Antes (hasta FASE 4) | Desde FASE 5 |
|----------------------|--------------|
| *«¿Está bien diseñado?»* | *«¿Ha sobrevivido a suficientes intentos de demostrar que está mal?»* |

**Epistemología explícita:**

> El modelo **no** es inocente hasta que se demuestre lo contrario.  
> El modelo **es una hipótesis** que debe sobrevivir a intentos deliberados de refutarla.

Paralelos: ingeniería de seguridad · aeronáutica · ciencia experimental.

---

## Incertidumbre eliminada por fase

| Fase | Incertidumbre que elimina |
|------|---------------------------|
| **Foundation** | ¿Cómo trabajamos? |
| **Blueprint** | ¿Qué merece la pena construir? |
| **Discovery** | ¿Cómo funciona realmente la operación? |
| **Operational Checks** | ¿Qué decisiones necesita tomar la operación? |
| **Operational Model** | ¿Cuál es la estructura permanente del dominio? |
| **Operational Validation** | ¿Qué parte de esa estructura es realmente cierta? (mesa) |
| **IOV** | ¿El conocimiento es transferible, atacable e interpretable? |
| **FOV** | ¿La realidad produce el mismo modelo? |
| **EC (Economic Confirmation)** | ¿Hay valor suficiente para construir? |
| **Gate G-01** | ¿Abrimos Etapa 2? |
| **Implementation** | ¿Cómo traducimos esa verdad a software? |

```text
FOUNDATION     → incertidumbre de construcción
BLUEPRINT      → incertidumbre de propósito
DISCOVERY      → incertidumbre de la operación real
CHECKS         → incertidumbre de decisiones operativas
MODEL          → incertidumbre de estructura del dominio
VALIDATION     → incertidumbre de verdad del modelo (mesa)
IOV            → incertidumbre de transferibilidad
FOV            → incertidumbre de correspondencia con la realidad
EC             → incertidumbre de valor económico
G-01           → incertidumbre de readiness
IMPLEMENTATION → incertidumbre de traducción (no de dominio)
```

---

## Secuencia FOPEBA

```text
Foundation
    ↓
Blueprint
    ↓
Discovery
    ↓
Operational Checks
    ↓
Operational Model
    ↓
Operational Validation
    ↓
IOV
    ↓
FOV
    ↓
EC (Economic Confirmation)
    ↓
Gate G-01 · Operational Readiness
    ↓
Implementation
```

Forma compacta:

```text
FOUNDATION → BLUEPRINT → DISCOVERY → CHECKS → MODEL
    → VALIDATION → IOV → FOV → EC → G-01 → IMPLEMENTATION
```

**Implementation ya no depende solo de Operational Validation.**  
Depende de Validation + FOV + EC (y el gate formal).

---

## Evidence Framework (documento madre)

```text
08 · Evidence Framework
│
├── Knowledge States
├── Evidence Confidence Levels (ECL)
├── Field Operational Validation (FOV)
├── Economic Confirmation (EC)
└── Gate G-01 · Operational Readiness
```

→ [docs/20-evidence-framework](../20-evidence-framework/README.md)

### Knowledge Validation Pyramid

Seña de identidad del núcleo metodológico — capas hasta conocimiento operacional reproducible:

→ [Knowledge Validation Pyramid](../19-independent-operational-validation/00-knowledge-validation-pyramid.md)

### ECL (transversal)

| Nivel | Significado |
|-------|-------------|
| ECL-1 | Hipótesis (Discovery) |
| ECL-2 | Observada aislada |
| ECL-3 | Validada en mesa (VS/VR) |
| ECL-4 | Confirmada en operación real (FOV) |
| ECL-5 | Impacto económico medido (EC) |

---

## Implementación = traducción, no descubrimiento

Tras **Gate G-01** (y Certified cuando aplique), implementar es **traducir** conocimiento validado a código.

No se abre Etapa 2 solo con «Model Beta».

---

## Knowledge State

Medir el **estado del conocimiento**, no solo el del producto.

| Estado | Significado |
|--------|-------------|
| Hypothesized | Razonamiento; sin observación |
| Observed | Visto en operación real |
| Validated | El modelo lo explica (VR) |
| Refuted | El modelo no lo explicó → MC |
| Generalized | Confirmado en múltiples organizaciones |

Detalle: [knowledge-state.md](./knowledge-state.md) · puente ECL: [01 Knowledge States](../20-evidence-framework/01-knowledge-states.md).

---

## Regla de carga de la prueba (y su límite)

> Toda anomalía debe intentarse explicar **primero** con el modelo existente.  
> La carga de la prueba recae sobre el **cambio**.

**Equilibrio:**

> El modelo merece ser **defendido con rigor**, pero **nunca protegido de la evidencia**.

---

## Gobernanza del modelo

```text
Observación / Escenario / Edge case / FOR
        ↓
VR o Field Validation Report
        ↓
Model Change (MC) — si hace falta
        ↓
Operational Model (17) + KS + ECL
```

---

## Dónde vive cada etapa

| Etapa | Documentación |
|-------|----------------|
| Foundation | `FOUNDATION.md` · `docs/05-architecture/` |
| Blueprint | `docs/15-product/` |
| Discovery | `docs/16-operational-discovery/` |
| Checks | `docs/15-product/OPERATIONAL_CHECKS.md` |
| Model | `docs/17-operational-model/` |
| Validation | `docs/18-operational-validation/` |
| IOV | `docs/19-independent-operational-validation/` |
| **Evidence Framework · FOV · EC · G-01** | [`docs/20-evidence-framework/`](../20-evidence-framework/README.md) |
| Implementation | `docs/12` · `docs/14` · código |

---

## Niveles de confianza del modelo

Alpha → Beta → RC → **Certified v1.0** — [07-certification.md](./07-certification.md).  
Apertura Etapa 2: **[Gate G-01](../20-evidence-framework/05-gate-g01-operational-readiness.md)** (más exigente que Beta sola).

---

## Activo reutilizable

**FOPEBA** — framework para transformar conocimiento operativo en software verificable, con evidencia progresiva (ECL) y gate económico/campo.

Aplicable a logística, clínicas, talleres, hoteles… **sin cambiar la estructura de fases**.

YourMeal OS es el **caso de referencia**.

---

## Relacionado

- [Evidence Framework](../20-evidence-framework/README.md)  
- [IOV](../19-independent-operational-validation/README.md)  
- [README Validation](./README.md)  
- [Estado del proyecto](../00-status/README.md)
