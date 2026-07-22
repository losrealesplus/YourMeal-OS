# Ingeniería de productos operativos — Marco metodológico

**YourMeal OS** es la primera aplicación de este marco.  
El marco es **independiente del dominio** (comida preparada, logística, salud, mantenimiento, educación…).

---

## Cambio de criterio de verdad

| Antes (hasta FASE 4) | Desde FASE 5 |
|----------------------|--------------|
| *«¿Está bien diseñado?»* | *«¿Ha sobrevivido a suficientes intentos de demostrar que está mal?»* |

Una hipótesis gana confianza **no porque nadie la cuestione**, sino porque **resiste cuestionamientos sistemáticos**.

Paralelos: ingeniería de seguridad · aeronáutica · ciencia experimental.

---

## Secuencia de etapas

```text
FOUNDATION
        ↓
¿Cómo construimos?

PRODUCT BLUEPRINT
        ↓
¿Qué problema merece resolverse?

OPERATIONAL DISCOVERY
        ↓
¿Cómo funciona realmente la operación? (evidencia)

OPERATIONAL CHECKS
        ↓
¿Cuál es la unidad mínima de valor operativo?

OPERATIONAL MODEL
        ↓
¿Cuál es el lenguaje, la estructura y las leyes del dominio?

OPERATIONAL VALIDATION
        ↓
¿Podemos demostrar que ese modelo resiste la realidad?

IMPLEMENTATION
        ↓
¿Cómo traducimos el modelo certificado a software?
```

### Implementación = traducción, no descubrimiento

Tras **Operational Model Certified v1.0**, implementar deja de ser fase de descubrimiento del dominio.

Es **traducción**: modelo validado → código · UX · Capabilities.

Si la implementación «descubre» el dominio, algo falló en Validation o se saltó el gate.

---

## Dónde vive cada etapa

| Etapa | Documentación |
|-------|----------------|
| Foundation | `FOUNDATION.md` · `docs/05-architecture/` |
| Blueprint | `docs/15-product/` |
| Discovery | `docs/16-operational-discovery/` |
| Checks | `docs/15-product/OPERATIONAL_CHECKS.md` |
| Model | `docs/17-operational-model/` |
| Validation | `docs/18-operational-validation/` *(esta carpeta)* |
| Implementation | `docs/12` Domain · `docs/14` Application · código |

---

## Regla casi constitucional (carga de la prueba)

> **Toda anomalía debe intentar explicarse primero con el modelo existente.**  
> **Solo cuando esa explicación sea imposible se propone una modificación del modelo.**

La carga de la prueba recae sobre el **cambio**, no sobre el modelo.

Evita que el vocabulario crezca por comodidad («añadamos un objeto nuevo»).  
Ver [01 validation-principles](./01-validation-principles.md) · principio 13.

---

## Gobernanza del modelo

```text
Observación / Escenario / Edge case
        ↓
Validation Report (VR)
        ↓
Model Change (MC) — solo si hace falta
        ↓
Operational Model (17)
```

No existe el cambio directo.

---

## Niveles de confianza del modelo

Alpha → Beta → RC → **Certified v1.0**

Detalle: [07-certification.md](./07-certification.md).

---

## Activo reutilizable

Si en el futuro otra plataforma operativa sigue necesitando las mismas etapas, no habréis creado solo una app de comida preparada.

Habréis creado un **framework de ingeniería de productos operativos**.

YourMeal OS es el **caso de referencia**; Validation es el mecanismo que hace el marco transferible.

---

## Relacionado

- [README](./README.md)  
- [Estado del proyecto](../00-status/README.md)  
- [PRODUCT_PRINCIPLES](../15-product/PRODUCT_PRINCIPLES.md)
