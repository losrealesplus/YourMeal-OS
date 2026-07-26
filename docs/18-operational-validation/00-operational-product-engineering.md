# FOPEBA — Framework para convertir observaciones operacionales en conocimiento operacional verificable antes de convertirlo en software

**Antes:** metodología para diseñar productos operacionales / OPE.  
**Ahora:** proceso que **reduce incertidumbre de forma medible**.

> **FOPEBA no es un framework para desarrollar software.**  
> Es un framework para **descubrir, certificar y gobernar conocimiento operacional**, y solo después utilizar ese conocimiento para desarrollar software.

El verdadero activo es la **cadena de evidencia**: observación → validación → nivel de confianza → estado del conocimiento → (solo entonces) software.

YourMeal OS es el **instrumento** (experimento controlado) con el que se demuestra que FOPEBA funciona — no el centro del framework.

| Rol | Qué es |
|-----|--------|
| **EatClean** | Laboratorio (operación real) |
| **FOPEBA** | Método v1.0 frozen |
| **YourMeal OS** | Primer producto tras Knowledge Field-Validated |

> **Operational Model RC (Table-Validated):** certificado en entorno controlado para prueba de campo — no Field-Validated aún.  
> Dual track: [DUAL_TRACK_ANTECAMARA](../00-status/DUAL_TRACK_ANTECAMARA.md).  
> Freeze: [04-methodology-frozen](../00-status/04-methodology-frozen.md) · FOV: [Mission Brief](../00-status/FOV_MISSION_BRIEF.md).

Principio post-freeze:

> Una vez congelada la metodología, el conocimiento solo puede evolucionar mediante evidencia observacional suficiente.

---

## Tres grandes etapas

```text
FASE A — Knowledge Discovery
Foundation · Blueprint · Discovery · Checks
        ↓
FASE B — Knowledge Certification
Operational Model · Operational Validation · IOV
FOV · Knowledge Update · Economic Confirmation · Gate G-01
        ↓
FASE C — Product Engineering
Architecture · Implementation · Verification · Release
```

| Fase | Estado YourMeal OS |
|------|-------------------|
| **A** Knowledge Discovery | ✅ |
| **B** Knowledge Certification | Metodología frozen ✅ · **Table-Validated** ✅ · Field ⏳ |
| **C** Product Engineering | 🔒 hasta G-01 |

```text
Knowledge Designed → Table-Validated → Field-Validated
```

> La Etapa 1 no produjo una aplicación; produjo un conocimiento operacional **table-validated** y un proceso reproducible para incrementarlo mediante evidencia.

---

## Dos promesas

| Promesa | Estado |
|---------|--------|
| *Si diseñamos primero el conocimiento operacional, podemos construir un modelo estable.* | ✅ **Table-Validated** (RC + IOV) |
| *Este proceso produce mejores productos.* | ⏳ Requiere Field-Validated (FOV…G-01) |

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
| **IOV** | ¿El conocimiento es transferible, resistente e interpretable? |
| **FOV** | ¿Qué hace la operación real cuando nadie pide seguir el modelo? (evidencia **empírica**) |
| **FER** | ¿Qué hipótesis de campo confirman / refutan / faltan / escalan a KU? |
| **Knowledge Update** | ¿Quedó consolidado el conocimiento post-FER? |
| **EC (Economic Confirmation)** | ¿Hay valor suficiente para construir? |
| **Gate G-02** | ¿El Journey mínimo es íntegro para un piloto controlado? (no certifica el producto) |
| **Gate G-01** | ¿Hay conocimiento suficiente para justificar código? (no aprueba código) |
| **Implementation** | ¿Cómo traducimos esa verdad a software? |

```text
FOUNDATION     → incertidumbre de construcción
BLUEPRINT      → incertidumbre de propósito
DISCOVERY      → incertidumbre de la operación real
CHECKS         → incertidumbre de decisiones operativas
MODEL          → incertidumbre de estructura del dominio
VALIDATION     → incertidumbre de verdad del modelo (mesa)
IOV            → incertidumbre de transferibilidad / resistencia / determinismo
G-02           → incertidumbre de integridad del Journey (¿listo para realidad?)
FOV            → incertidumbre empírica (correspondencia con la operación)
FER            → incertidumbre de qué evidencia de campo escala
KNOWLEDGE UPDATE → incertidumbre de consolidación post-campo
EC             → incertidumbre de valor económico
G-01           → incertidumbre de readiness (gobernanza)
IMPLEMENTATION → incertidumbre de traducción (no de dominio)
```

---

## Regla de diseño del framework

> **Cada nueva fase debe eliminar una incertidumbre que ninguna fase anterior pueda eliminar.**

Si no reduce un tipo nuevo de incertidumbre, pertenece a una fase existente.  
Mantiene FOPEBA compacto y elegante.

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
Operational Model RC (Knowledge Certified)
    ↓
Gate G-02 · Pilot Readiness     ← integridad del Journey (RI)
    ↓
Pilot · Evidence Collection
    ↓
FOV (FO-V/E/C/U) — evidencia empírica
    ↓
Field Evidence Review (FER)
    ↓
Knowledge Update          ← solo si FER autoriza
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
    → VALIDATION → IOV → RC → G-02 → Pilot → FOV → FER → KU → EC → G-01 → IMPLEMENTATION
```

**G-02 no certifica el producto** — autoriza el experimento controlado.  
**G-01 no aprueba código** — aprueba conocimiento suficiente para justificarlo.

### Patrón · reducir incertidumbre antes de ampliar alcance

> Antes de G-02: **cerrar o esconder huecos**, firmar ORR, **no abrir módulos nuevos**.  
> Ampliar alcance introduce incertidumbre evitable; FOPEBA exige reducirla primero.

**G-02 = Pilot Authorization ≠ Release.** Tras PASSED, el siguiente artefacto es **evidencia**, no un PR de arquitectura.  
Cambios en fase RI: Evidence PR · KU PR · Correction PR · Pilot Fix · Operational Finding.  
**No Artificiality (G-02.7):** ninguna intervención manual silenciosa (SQL, bypass, datos inventados) para completar un Journey — toda intervención es evidencia.

Ver: [Gate G-02](../20-evidence-framework/08-gate-g02-pilot-readiness.md) · [Pilot Integrity](../99-reference/PROJECT_DICTIONARY.md#pilot-integrity).

---

## Evidence Framework (documento madre)

```text
08 · Evidence Framework
│
├── Knowledge States · ECL · Stability
├── FOV + fov/
├── Knowledge Update + ku/     (KU-01 Policy · KU-02 Workflow · KU-03 KUR)
├── Economic Confirmation + ec/ (Framework · OVI · ECR)
├── Gate G-01 + g01/           (Package · Decision · Acta)
├── Gate G-02                  (Pilot Readiness · RI)
└── P12 Evidence Freshness     (PRE-CHECK · STALE antes de ingeniería)
```

→ [docs/20-evidence-framework](../20-evidence-framework/README.md)  
→ [P12 · Evidence Freshness](../20-evidence-framework/10-evidence-freshness-p12.md)  
→ [ku/](../20-evidence-framework/ku/README.md) · [ec/](../20-evidence-framework/ec/README.md) · [g01/](../20-evidence-framework/g01/README.md) · [g02](../20-evidence-framework/08-gate-g02-pilot-readiness.md) · [fov/](../20-evidence-framework/fov/README.md)

Dual track (antesala): [DUAL_TRACK_ANTECAMARA](../00-status/DUAL_TRACK_ANTECAMARA.md)

### Knowledge Validation Pyramid

→ [Knowledge Validation Pyramid](../19-independent-operational-validation/00-knowledge-validation-pyramid.md)

---

## Implementación = traducción, no descubrimiento

Tras **Gate G-01** (y Certified cuando aplique), implementar es **traducir** conocimiento validado a código.

No se abre Etapa 2 solo con «Model Beta» ni solo con RC de laboratorio.

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
Observación / Escenario / Edge case / FO
        ↓
Classification (mesa VR · campo FO-V/E/C/U)
        ↓
FER (campo) → Knowledge Update si aplica
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
| **Evidence Framework · FOV · FER · EC · G-01** | [`docs/20-evidence-framework/`](../20-evidence-framework/README.md) · [`fov/`](../20-evidence-framework/fov/README.md) |
| Implementation | `docs/12` · `docs/14` · código |

---

## Niveles de confianza del modelo

Alpha → Beta → **RC (Knowledge Certified)** → campo (FOV) → **Certified v1.0** — [07-certification.md](./07-certification.md).  
Apertura Etapa 2: **[Gate G-01](../20-evidence-framework/07-gate-g01-operational-readiness.md)** (más exigente que RC de laboratorio solo).

---

## Activo reutilizable

**FOPEBA** — descubrir · certificar · gobernar conocimiento operacional — luego Product Engineering.

El diferenciador de Etapa 1 / FASE B: la **trazabilidad de la cadena de evidencia**.

Aplicable a logística, clínicas, talleres, hoteles… **sin cambiar la estructura de fases**.

YourMeal OS es el **caso de referencia**.

---

## Relacionado

- [Evidence Framework](../20-evidence-framework/README.md)  
- [IOV](../19-independent-operational-validation/README.md)  
- [README Validation](./README.md)  
- [Estado del proyecto](../00-status/README.md)
