# ADR 0035 — YourMeal OS Runtime Suite

## Estado

**Accepted** — 2026-08-05  
**Detalle:** [RUNTIME_SUITE](../05-architecture/RUNTIME_SUITE.md)  
**Depende de:** [ADR 0034 — Secret Gateway](./0034-runtime-secret-gateway.md)

## Contexto

El Runtime Inspector resolvió observación en dispositivo. La siguiente necesidad no es “más tabs de debug”, sino un **instrumento permanente de plataforma** que:

1. Se abra sin UI de Developer (`YMOS Horus`).
2. Agrupe diagnóstico por dominio (Doctor, Assets, Network, …).
3. Evolucione hacia un **paquete de evidencia exportable** (FOPEBA).

## Decisión

Renombrar el producto de ingeniería a **YourMeal OS Runtime Suite**.

- Phase 1: shell + catálogo + bridge a probes existentes.
- Phases 2–5: Doctor, Performance, Export ZIP, envío consentido a soporte.
- El Inspector permanece como implementación/bridge, no como nombre de producto.

## Consecuencias

- Firma de plataforma: autodiagnóstico + evidencia, no opiniones.
- Extensible por módulo sin rediseñar la puerta secreta.
- Riesgo: scope creep — las fases están congeladas; no implementar Phase 4 en Phase 1.
