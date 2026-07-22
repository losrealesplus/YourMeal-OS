# Operational Product Engineering (OPE)

## Proceso de adquisición de conocimiento

No es solo una metodología de documentación.  
Es un **proceso de adquisición de conocimiento**: cada fase elimina un tipo de incertidumbre **antes** de que la siguiente fase empiece a trabajar.

Ninguna fase intenta resolver el problema de la siguiente.  
Eso hace el proceso **acumulativo**, no iterativo por accidente.

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
| **Operational Validation** | ¿Qué parte de esa estructura es realmente cierta? |
| **Implementation** | ¿Cómo traducimos esa verdad a software? |

```text
FOUNDATION          → incertidumbre de construcción
BLUEPRINT           → incertidumbre de propósito
DISCOVERY           → incertidumbre de la operación real
CHECKS              → incertidumbre de decisiones operativas
MODEL               → incertidumbre de estructura del dominio
VALIDATION          → incertidumbre de verdad del modelo
IMPLEMENTATION      → incertidumbre de traducción (no de dominio)
```

---

## Secuencia de etapas

```text
FOUNDATION → BLUEPRINT → DISCOVERY → CHECKS → MODEL → VALIDATION → IMPLEMENTATION
```

### Implementación = traducción, no descubrimiento

Tras **Operational Model Certified v1.0**, implementar es **traducir** conocimiento validado a código.

El producto (YourMeal OS) es un **experimento controlado** para este proceso: de operación real → software fundamentado.

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

Detalle · registro · proveniencia: [knowledge-state.md](./knowledge-state.md).

**Regla de proveniencia:**

1. ¿Dónde se observó por primera vez?  
2. ¿Qué Validation Reports la respaldan?

---

## Regla de carga de la prueba (y su límite)

> Toda anomalía debe intentarse explicar **primero** con el modelo existente.  
> La carga de la prueba recae sobre el **cambio**.

**Equilibrio necesario** (evitar el sesgo inverso):

> El modelo merece ser **defendido con rigor**, pero **nunca protegido de la evidencia**.

Si un VR demuestra **Contradicted**, modificar el modelo no es derrota — es el resultado que el proceso estaba diseñado para encontrar.

Ver principio 14 en [01-validation-principles](./01-validation-principles.md).

---

## Gobernanza del modelo

```text
Observación / Escenario / Edge case
        ↓
Validation Report (VR)
        ↓
Model Change (MC) — si hace falta
        ↓
Operational Model (17) + actualización Knowledge State
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
| Implementation | `docs/12` · `docs/14` · código |

---

## Niveles de confianza del modelo

Alpha → Beta → RC → **Certified v1.0** — [07-certification.md](./07-certification.md).

---

## Activo reutilizable

**Operational Product Engineering (OPE)** — framework para transformar conocimiento operativo en software verificable.

Aplicable a logística, clínicas, talleres, hoteles… **sin cambiar la estructura de fases**.

YourMeal OS es el **caso de referencia** — el primer sistema que demuestra si OPE funciona.

No el centro del trabajo: el **experimento controlado** del proceso.

---

## Relacionado

- [README](./README.md)  
- [knowledge-state-registry](./knowledge-state-registry.md)  
- [Estado del proyecto](../00-status/README.md)
